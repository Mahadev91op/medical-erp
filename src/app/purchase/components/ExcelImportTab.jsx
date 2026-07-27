"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  UploadCloud,
  Database,
  Loader2,
  AlertTriangle,
  ClipboardCheck,
  Printer,
  ShieldAlert
} from "lucide-react";
import BillReconciliationCard from "./BillReconciliationCard";

// Helper: Calculate months between today and MM/YY expiry
function getMonthsToExpiry(expiryStr) {
  if (!expiryStr || !/^\d{2}\/\d{2}$/.test(String(expiryStr).trim())) return null;
  const [expMonth, expYear] = String(expiryStr).trim().split("/").map(Number);
  const fullYear = 2000 + expYear;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  return (fullYear - currentYear) * 12 + (expMonth - currentMonth);
}

// Helper: Calculate Margin %
function calculateMargin(purchasePrice, mrp, qty = 1, freeQty = 0) {
  const costNum = Number(purchasePrice) || 0;
  const mrpNum = Number(mrp) || 0;
  const qtyNum = Number(qty) || 1;
  const freeNum = Number(freeQty) || 0;

  if (mrpNum <= 0) return 0;
  const totalPacks = qtyNum + freeNum;
  const effectiveCost = totalPacks > 0 ? (qtyNum * costNum) / totalPacks : costNum;
  return ((mrpNum - effectiveCost) / mrpNum) * 100;
}

export default function ExcelImportTab({
  distributors = [],
  toast,
  setSuccessOverlayCount = () => {},
  setSuccessOverlayMsg = () => {},
  setShowSuccessOverlay = () => {},
  getTodayDateString = () => "27 Jul 2026",
}) {
  const [dragOver, setDragOver] = useState(false);
  const [sheetHeaders, setSheetHeaders] = useState([]);
  const [sheetData, setSheetData] = useState([]);
  const [fileName, setFileName] = useState("");

  const [columnMapping, setColumnMapping] = useState({
    name: "",
    batch: "",
    expiryDate: "",
    quantity: "",
    mrp: "",
    purchasePrice: "",
    billNumber: "",
    distributor: "",
    purchaseDate: "",
    hsnCode: "",
    freeQty: "",
    rackNumber: "",
    isScheduleH1: "",
  });

  const [globalDistributor, setGlobalDistributor] = useState("");
  const [globalBillNumber, setGlobalBillNumber] = useState("");
  const [globalPurchaseDate, setGlobalPurchaseDate] = useState(getTodayDateString());
  const [importing, setImporting] = useState(false);
  const [paperBillTotalInput, setPaperBillTotalInput] = useState("");

  const handleFileUpload = async (file) => {
    if (!file) return;
    setFileName(file.name);

    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];

      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      if (jsonData.length < 2) {
        toast.error("Spreadsheet is empty or lacks header rows!");
        return;
      }

      const headers = jsonData[0].map((h) => String(h).trim());
      const rows = jsonData.slice(1);

      setSheetHeaders(headers);
      setSheetData(rows);

      const autoMap = { ...columnMapping };
      headers.forEach((h) => {
        const lower = h.toLowerCase();
        if (lower.includes("name") || lower.includes("item") || lower.includes("medicine")) {
          autoMap.name = h;
        } else if (lower.includes("batch")) {
          autoMap.batch = h;
        } else if (lower.includes("exp") || lower.includes("valid") || lower.includes("date")) {
          autoMap.expiryDate = h;
        } else if (lower.includes("qty") || lower.includes("pack") || lower.includes("stock")) {
          autoMap.quantity = h;
        } else if (lower.includes("mrp") || lower.includes("sell")) {
          autoMap.mrp = h;
        } else if (lower.includes("cost") || fontIncludes(lower, "buy") || lower.includes("purchase") || lower.includes("rate")) {
          autoMap.purchasePrice = h;
        } else if (lower.includes("bill") || lower.includes("inv") || lower.includes("voucher")) {
          autoMap.billNumber = h;
        } else if (lower.includes("distributor") || lower.includes("party") || lower.includes("vendor") || lower.includes("supplier")) {
          autoMap.distributor = h;
        } else if (lower.includes("hsn")) {
          autoMap.hsnCode = h;
        } else if (lower.includes("free") || lower.includes("scheme")) {
          autoMap.freeQty = h;
        } else if (lower.includes("rack") || lower.includes("shelf") || lower.includes("drawer")) {
          autoMap.rackNumber = h;
        } else if (lower.includes("schedule") || lower.includes("h1") || lower.includes("narcotic")) {
          autoMap.isScheduleH1 = h;
        }
      });

      setColumnMapping(autoMap);
      toast.success(`Parsed ${rows.length} items from ${file.name} successfully!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse file. Make sure it's a valid Excel/CSV file!");
    }
  };

  function fontIncludes(str, search) {
    return str.includes(search);
  }

  const getProcessedItems = () => {
    if (!sheetHeaders.length || !sheetData.length)
      return { processedList: [], skippedRows: [] };

    const nameIdx = sheetHeaders.indexOf(columnMapping.name);
    const batchIdx = sheetHeaders.indexOf(columnMapping.batch);
    const expIdx = sheetHeaders.indexOf(columnMapping.expiryDate);
    const qtyIdx = sheetHeaders.indexOf(columnMapping.quantity);
    const mrpIdx = sheetHeaders.indexOf(columnMapping.mrp);
    const costIdx = sheetHeaders.indexOf(columnMapping.purchasePrice);
    const billIdx = sheetHeaders.indexOf(columnMapping.billNumber);
    const distIdx = sheetHeaders.indexOf(columnMapping.distributor);
    const hsnIdx = sheetHeaders.indexOf(columnMapping.hsnCode);
    const freeIdx = sheetHeaders.indexOf(columnMapping.freeQty);
    const rackIdx = sheetHeaders.indexOf(columnMapping.rackNumber);
    const h1Idx = sheetHeaders.indexOf(columnMapping.isScheduleH1);

    const processedList = [];
    const skippedRows = [];

    sheetData.forEach((row, idx) => {
      const rawName = nameIdx !== -1 ? row[nameIdx] : "";
      const rawBatch = batchIdx !== -1 ? row[batchIdx] : "";

      if (!rawName || !rawBatch) {
        skippedRows.push({
          row: idx + 2,
          reason: "Missing Medicine Name or Batch Number",
        });
        return;
      }

      const qty = qtyIdx !== -1 ? Number(row[qtyIdx]) || 1 : 1;
      const freeQty = freeIdx !== -1 ? Number(row[freeIdx]) || 0 : 0;
      const mrp = mrpIdx !== -1 ? Number(row[mrpIdx]) || 0 : 0;
      const cost = costIdx !== -1 ? Number(row[costIdx]) || mrp : mrp;
      const rawH1 = h1Idx !== -1 ? String(row[h1Idx]).toLowerCase() : "";

      processedList.push({
        id: idx,
        name: String(rawName).trim(),
        batch: String(rawBatch).trim(),
        expiryDate: expIdx !== -1 ? String(row[expIdx] || "12/26").trim() : "12/26",
        quantity: qty + freeQty,
        freeQty,
        mrp,
        purchasePrice: cost,
        billNumber: billIdx !== -1 ? String(row[billIdx] || globalBillNumber).trim() : globalBillNumber || "BILL-GEN",
        distributor: distIdx !== -1 ? String(row[distIdx] || globalDistributor).trim() : globalDistributor || "Generic Distributor",
        hsnCode: hsnIdx !== -1 ? String(row[hsnIdx] || "3004").trim() : "3004",
        rackNumber: rackIdx !== -1 ? String(row[rackIdx] || "").trim() : "",
        isScheduleH1: rawH1.includes("yes") || rawH1.includes("true") || rawH1.includes("h1"),
      });
    });

    return { processedList, skippedRows };
  };

  const { processedList, skippedRows } = getProcessedItems();

  const executeBulkImport = async () => {
    if (processedList.length === 0) {
      toast.error("No valid items to import!");
      return;
    }

    setImporting(true);

    try {
      const res = await fetch("/api/medicine", {
        method: "POST",
        body: JSON.stringify(processedList),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        const count = data.count || processedList.length;
        setImporting(false);
        setSuccessOverlayCount(count);
        setSuccessOverlayMsg(`${count} Medicines Migrated`);
        setShowSuccessOverlay(true);
        setTimeout(() => setShowSuccessOverlay(false), 3500);

        setSheetData([]);
        setSheetHeaders([]);
        setFileName("");
        toast.success(`Successfully imported ${count} items to inventory!`);
      } else {
        setImporting(false);
        toast.error("Import failed: " + (data.error || "Server error"));
      }
    } catch (err) {
      setImporting(false);
      toast.error("Import failed. Check network connection.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Info Banner */}
      <div className="bg-blue-50/70 border border-blue-100 rounded-3xl p-4 md:p-5 flex gap-3 text-blue-900 text-xs md:text-sm leading-relaxed shadow-sm">
        <ClipboardCheck className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
        <div>
          <p className="font-extrabold uppercase text-[10px] md:text-xs tracking-wider mb-1 text-blue-700">
            1-Click Excel Migration Engine (Marg ERP, Tally, Vyapar, MyBillBook)
          </p>
          <p className="text-slate-600 text-xs">
            Apni purani billing software ki Excel/CSV bill export file yahan drop karein.
            System Intelligent Retail Margin %, Scheme Free Strips (10+2), Rack Location, aur Schedule H1 auto-detect kar ke import kar dega.
          </p>
        </div>
      </div>

      {/* Drag & Drop Box */}
      {sheetHeaders.length === 0 && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.[0]) handleFileUpload(e.dataTransfer.files[0]);
          }}
          className={`border-3 border-dashed rounded-3xl p-8 md:p-12 text-center transition-all cursor-pointer ${
            dragOver
              ? "border-blue-500 bg-blue-50/50 scale-[1.01]"
              : "border-slate-200 bg-white hover:border-blue-400 hover:bg-slate-50/50"
          }`}
        >
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            id="excelFileInput"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
          <label htmlFor="excelFileInput" className="cursor-pointer block space-y-3">
            <div className="w-16 h-16 bg-blue-100/60 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 text-base md:text-lg">
                Drag & Drop Excel / CSV Bill File Here
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Supports .xlsx, .xls, and .csv files from Marg ERP, Vyapar, Tally & Busy
              </p>
            </div>
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition-all shadow-md shadow-blue-200 border-none outline-none cursor-pointer"
            >
              Browse Computer Files
            </button>
          </label>
        </div>
      )}

      {/* Column Mapping & Preview Section */}
      {sheetHeaders.length > 0 && (
        <div className="bg-white p-5 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base md:text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                Sheet File: {fileName}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {sheetData.length} Raw rows detected in file
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSheetHeaders([]);
                setSheetData([]);
                setFileName("");
              }}
              className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3.5 py-2 rounded-xl border border-rose-200 cursor-pointer"
            >
              Choose Different File
            </button>
          </div>

          {/* Column Mapping Selectors */}
          <div className="space-y-3">
            <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
              Verify Spreadsheet Column Mapping
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
              {Object.keys(columnMapping).map((key) => (
                <div key={key} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    {key}
                  </label>
                  <select
                    value={columnMapping[key]}
                    onChange={(e) =>
                      setColumnMapping({ ...columnMapping, [key]: e.target.value })
                    }
                    className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 focus:outline-none font-bold text-xs cursor-pointer"
                  >
                    <option value="">-- Ignore / Default --</option>
                    {sheetHeaders.map((h, i) => (
                      <option key={i} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Table */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider">
                Parsed Stock Preview ({processedList.length} Valid Items)
              </h4>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs font-semibold text-slate-700 border-collapse">
                <thead className="bg-slate-100 border-b border-slate-200 uppercase text-[10px] font-black text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Batch</th>
                    <th className="p-2.5">Expiry</th>
                    <th className="p-2.5 text-center">Qty + Free</th>
                    <th className="p-2.5 text-right">Cost ₹</th>
                    <th className="p-2.5 text-right">MRP ₹</th>
                    <th className="p-2.5 text-center">Margin %</th>
                    <th className="p-2.5">Rack</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {processedList.slice(0, 10).map((item, i) => {
                    const margin = calculateMargin(item.purchasePrice, item.mrp, item.quantity, item.freeQty);
                    const monthsExp = getMonthsToExpiry(item.expiryDate);

                    return (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-900">
                          {item.name}
                          {item.isScheduleH1 && (
                            <span className="text-[9px] bg-rose-100 text-rose-800 font-black px-1.5 py-0.5 rounded ml-1 uppercase">
                              H1
                            </span>
                          )}
                        </td>
                        <td className="p-2 font-mono text-slate-700">{item.batch}</td>
                        <td className="p-2">
                          <span className={monthsExp !== null && monthsExp < 6 ? "text-rose-700 font-extrabold" : ""}>
                            {item.expiryDate}
                          </span>
                        </td>
                        <td className="p-2 text-center font-bold text-blue-600">
                          {item.quantity} {item.freeQty > 0 && `(${item.freeQty} Free)`}
                        </td>
                        <td className="p-2 text-right">₹{item.purchasePrice.toFixed(2)}</td>
                        <td className="p-2 text-right font-bold">₹{item.mrp.toFixed(2)}</td>
                        <td className="p-2 text-center">
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                              margin >= 15
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : margin >= 10
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-rose-100 text-rose-800 border-rose-300"
                            }`}
                          >
                            {margin.toFixed(0)}%
                          </span>
                        </td>
                        <td className="p-2 text-slate-500">{item.rackNumber || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tally Card */}
          <BillReconciliationCard
            items={processedList}
            paperBillTotalInput={paperBillTotalInput}
            setPaperBillTotalInput={setPaperBillTotalInput}
            distributorName={globalDistributor}
            billNumber={globalBillNumber}
          />

          {/* Execute Import */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-5 py-3.5 rounded-xl border border-slate-300 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              🏷️ Print Barcode Stickers
            </button>

            <button
              type="button"
              onClick={executeBulkImport}
              disabled={importing || processedList.length === 0}
              className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs md:text-sm uppercase tracking-wider py-4 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer border-none outline-none"
            >
              {importing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Database className="w-5 h-5" />
              )}
              Import {processedList.length} Items to Inventory
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
