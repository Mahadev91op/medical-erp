"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Camera,
  Upload,
  Loader2,
  Trash2,
  AlertTriangle,
  ClipboardCheck,
  Zap,
  Eye,
  FileText,
  Printer,
  ShieldAlert,
  MapPin,
  Gift
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

export default function AiOcrScannerTab({
  distributors = [],
  setDistributors = () => {},
  uploadedInvoice,
  setUploadedInvoice = () => {},
  uploadedInvoiceName,
  setUploadedInvoiceName = () => {},
  extractedItems = [],
  setExtractedItems = () => {},
  ocrDistributor,
  setOcrDistributor = () => {},
  ocrBillNumber,
  setOcrBillNumber = () => {},
  ocrPurchaseDate,
  setOcrPurchaseDate = () => {},
  setSuccessOverlayCount = () => {},
  setSuccessOverlayMsg = () => {},
  setShowSuccessOverlay = () => {},
  getTodayInputString = () => "27/07/26",
  formatExpiryDateInput = (val) => val,
  formatPurchaseDateInput = (val) => val,
  toast,
}) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [activeCamera, setActiveCamera] = useState(false);
  const [paperBillTotalInput, setPaperBillTotalInput] = useState("");
  const [filePreviewUrl, setFilePreviewUrl] = useState("");
  const [showDocumentViewer, setShowDocumentViewer] = useState(true);

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  // Generate object URL for PDF or Image viewer
  useEffect(() => {
    if (uploadedInvoice) {
      const url = URL.createObjectURL(uploadedInvoice);
      setFilePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setFilePreviewUrl("");
    }
  }, [uploadedInvoice]);

  const handleInvoiceFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
        toast.error("Please upload an image (JPG, PNG) or PDF bill file!");
        return;
      }
      setUploadedInvoice(file);
      setUploadedInvoiceName(file.name);
      toast.success(`Loaded ${file.name} ready for AI scan!`);
    }
  };

  const startCamera = async () => {
    try {
      setActiveCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      toast.error("Camera access denied or unavailable!");
      setActiveCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((t) => t.stop());
    }
    setActiveCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const capturedFile = new File([blob], `bill_capture_${Date.now()}.jpg`, {
          type: "image/jpeg",
        });
        setUploadedInvoice(capturedFile);
        setUploadedInvoiceName(capturedFile.name);
        stopCamera();
        toast.success("Bill photo captured successfully!");
      }
    }, "image/jpeg");
  };

  const handleStartAiScan = async () => {
    if (!uploadedInvoice) {
      toast.error("Please upload or capture a bill photo first!");
      return;
    }

    setIsScanning(true);
    setScanStep("Reading Invoice File via In-House Local Engine...");

    try {
      const formData = new FormData();
      formData.append("file", uploadedInvoice);

      const res = await fetch("/api/ai/invoice-ocr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.medicines)) {
        if (data.distributorName) setOcrDistributor(data.distributorName);
        if (data.billNumber) setOcrBillNumber(data.billNumber);

        const itemsWithId = data.medicines.map((m, idx) => ({
          id: idx + Date.now(),
          name: m.name || "",
          batch: m.batch || "",
          expiryDate: m.expiryDate || "12/26",
          quantity: m.quantity || 1,
          freeQty: m.freeQty || 0,
          purchasePrice: m.purchasePrice || 0,
          gstPercent: m.gstPercent || 12,
          hsnCode: m.hsnCode || "3004",
          mrp: m.mrp || 0,
          rackNumber: m.rackNumber || "",
          isScheduleH1: m.isScheduleH1 || false,
        }));

        setExtractedItems(itemsWithId);
        setIsScanning(false);
        setScanStep("");
        toast.success(
          `Extracted ${itemsWithId.length} Medicines from Bill!`
        );
      } else {
        setIsScanning(false);
        setScanStep("");
        toast.error(data.error || "Failed to parse bill. Try a clearer image.");
      }
    } catch (err) {
      setIsScanning(false);
      setScanStep("");
      toast.error("Network error during document scan. Check server.");
    }
  };

  const validateOcrItem = (item) => {
    const errors = [];
    if (!item.name?.toString().trim()) errors.push("Name required");
    if (!item.batch?.toString().trim()) errors.push("Batch required");
    if (
      !item.expiryDate?.toString().trim() ||
      !/^\d{2}\/\d{2}$/.test(item.expiryDate.toString().trim())
    ) {
      errors.push("Expiry MM/YY required");
    }
    const qty = Number(item.quantity);
    const mrp = Number(item.mrp);
    const cost = Number(item.purchasePrice);

    if (isNaN(qty) || qty <= 0) errors.push("Qty > 0 required");
    if (isNaN(mrp) || mrp <= 0) errors.push("MRP > 0 required");
    if (isNaN(cost) || cost <= 0) errors.push("Cost > 0 required");
    else if (cost > mrp) errors.push("Cost cannot exceed MRP");

    return errors;
  };

  const handleUpdateExtractedRow = (id, field, value) => {
    setExtractedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteExtractedRow = (id) => {
    setExtractedItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Row deleted from extracted list");
  };

  const handleImportExtractedData = async () => {
    if (extractedItems.length === 0) {
      toast.error("No items to import!");
      return;
    }

    const hasErrors = extractedItems.some(
      (item) => validateOcrItem(item).length > 0
    );
    if (hasErrors) {
      toast.error("Please fix validation errors before importing!");
      return;
    }

    try {
      const bulkPayload = extractedItems.map((item) => {
        const [expMonth, expYear] = (item.expiryDate || "12/26").split("/");
        const yearFull = expYear ? (expYear.length === 2 ? `20${expYear}` : expYear) : "2026";
        const parsedExpiryDate = new Date(
          Number(yearFull),
          Number(expMonth || 12) - 1,
          28
        ).toISOString().slice(0, 10);

        const [purDay, purMonth, purYear] = ocrPurchaseDate.split("/");
        const purYearFull = purYear ? (purYear.length === 2 ? `20${purYear}` : purYear) : "2026";
        const parsedPurchaseDate = new Date(
          Number(purYearFull),
          Number(purMonth || 7) - 1,
          Number(purDay || 27)
        ).toISOString().slice(0, 10);

        const totalQty = (Number(item.quantity) || 1) + (Number(item.freeQty) || 0);

        return {
          name: item.name,
          batch: item.batch,
          quantity: totalQty,
          mrp: Number(item.mrp) || 0,
          purchasePrice: Number(item.purchasePrice) || 0,
          hsnCode: item.hsnCode || "3004",
          gstPercent: Number(item.gstPercent) || 12,
          rackNumber: item.rackNumber || "",
          isScheduleH1: item.isScheduleH1 || false,
          billNumber: ocrBillNumber || "OCR-BILL",
          expiryDate: parsedExpiryDate,
          purchaseDate: parsedPurchaseDate,
          distributor: ocrDistributor || "OCR Distributor",
        };
      });

      const res = await fetch("/api/medicine", {
        method: "POST",
        body: JSON.stringify(bulkPayload),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success) {
        const count = data.count || bulkPayload.length;
        setSuccessOverlayCount(count);
        setSuccessOverlayMsg(`${count} Medicines Imported`);
        setShowSuccessOverlay(true);
        setTimeout(() => setShowSuccessOverlay(false), 3500);

        if (ocrDistributor && !distributors.includes(ocrDistributor)) {
          setDistributors([...distributors, ocrDistributor]);
        }

        setExtractedItems([]);
        setUploadedInvoice(null);
        setUploadedInvoiceName("");
        toast.success(`Imported ${count} medicines to inventory!`);
      } else {
        toast.error("Import failed: " + (data.error || "Server error"));
      }
    } catch (err) {
      toast.error("Import failed. Check network.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-5 md:p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
            <h3 className="font-extrabold text-base md:text-xl text-white">
              Local In-House Bill OCR Purchase Entry
            </h3>
          </div>
          <p className="text-xs text-blue-200">
            Paper bill ki photo kheenchein ya PDF upload karein. Local In-house Engine 100% real text extract karke Retail Margin %, Scheme Free Strips aur Short Expiry Warning detect karega.
          </p>
        </div>
      </div>

      {/* Upload Controls & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
            <Camera className="w-4 h-4 text-blue-600" />
            Bill Photo / PDF Input
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="file"
              accept="image/*,application/pdf"
              ref={fileInputRef}
              className="hidden"
              onChange={handleInvoiceFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs py-3 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
            >
              <Upload className="w-4 h-4 text-blue-600" /> Upload File
            </button>

            {!activeCamera ? (
              <button
                type="button"
                onClick={startCamera}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs py-3 px-3 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
              >
                <Camera className="w-4 h-4 text-blue-600" /> Open Camera
              </button>
            ) : (
              <button
                type="button"
                onClick={stopCamera}
                className="bg-rose-50 text-rose-700 font-extrabold text-xs py-3 px-3 rounded-2xl border border-rose-200 cursor-pointer"
              >
                Close Camera
              </button>
            )}
          </div>

          {activeCamera && (
            <div className="relative bg-slate-950 rounded-2xl overflow-hidden aspect-video border border-slate-800">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={capturePhoto}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-full shadow-lg border-none cursor-pointer"
              >
                📸 Capture Photo
              </button>
            </div>
          )}

          {uploadedInvoiceName && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl flex items-center justify-between text-xs text-emerald-800 font-bold">
              <span className="truncate pr-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                {uploadedInvoiceName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDocumentViewer(!showDocumentViewer)}
                  className="text-blue-600 hover:text-blue-800 text-[10px] font-extrabold bg-blue-100 px-2 py-1 rounded-lg border-none cursor-pointer flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" />
                  {showDocumentViewer ? "Hide View" : "Show View"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUploadedInvoice(null);
                    setUploadedInvoiceName("");
                  }}
                  className="text-rose-600 hover:text-rose-800 bg-none border-none cursor-pointer text-sm font-black"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleStartAiScan}
            disabled={isScanning || !uploadedInvoice}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs md:text-sm py-3.5 rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                Extracting Document...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                Extract Bill Data (100% In-House)
              </>
            )}
          </button>
        </div>

        {/* Extracted Header Details */}
        <div className="lg:col-span-8 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-emerald-600" />
            Distributor Invoice Header
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Distributor Agency
              </label>
              <input
                type="text"
                placeholder="e.g. SunPharma Agency"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                value={ocrDistributor}
                onChange={(e) => setOcrDistributor(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Bill / Invoice No
              </label>
              <input
                type="text"
                placeholder="e.g. INV-8891"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                value={ocrBillNumber}
                onChange={(e) => setOcrBillNumber(e.target.value)}
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase mb-1">
                Purchase Date
              </label>
              <input
                type="text"
                placeholder="DD/MM/YY"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                value={ocrPurchaseDate}
                onChange={(e) =>
                  setOcrPurchaseDate(formatPurchaseDateInput(e.target.value))
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* PDF / Image Document Viewer Panel */}
      {uploadedInvoice && filePreviewUrl && showDocumentViewer && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3 shadow-xl animate-in fade-in duration-200">
          <div className="flex justify-between items-center text-xs font-bold text-slate-200 border-b border-slate-800 pb-2">
            <span className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              Live Bill Document Viewer ({uploadedInvoiceName})
            </span>
            <span className="text-[10px] text-slate-400 uppercase bg-slate-800 px-2 py-0.5 rounded-md">
              {uploadedInvoice.type}
            </span>
          </div>

          {uploadedInvoice.type === "application/pdf" ? (
            <iframe
              src={filePreviewUrl}
              className="w-full h-[500px] md:h-[600px] rounded-2xl border border-slate-800 bg-white"
              title="PDF Bill Document Viewer"
            />
          ) : (
            <div className="max-h-[500px] md:max-h-[600px] overflow-auto flex justify-center bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <img
                src={filePreviewUrl}
                alt="Uploaded Bill Document"
                className="max-w-full h-auto object-contain rounded-xl shadow-2xl"
              />
            </div>
          )}
        </div>
      )}

      {/* Extracted Medicines Verification Table */}
      {extractedItems.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-5 animate-in slide-in-from-bottom-2 duration-300">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base md:text-lg text-slate-800 flex items-center gap-2">
              Extracted Medicines ({extractedItems.length} Items)
            </h3>

            <button
              type="button"
              onClick={() => setExtractedItems([])}
              className="text-xs font-bold text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 cursor-pointer"
            >
              Clear Extracted List
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
            <table className="w-full border-collapse text-left text-xs md:text-sm font-semibold text-slate-700 table-fixed">
              <thead>
                <tr className="bg-slate-100/90 text-slate-700 text-xs font-black uppercase tracking-wider border-b border-slate-200">
                  <th className="p-2.5 w-[24%]">Medicine Name</th>
                  <th className="p-2.5 w-[10%]">Batch</th>
                  <th className="p-2.5 w-[9%] text-center">Expiry</th>
                  <th className="p-2.5 w-[7%] text-center">Qty</th>
                  <th className="p-2.5 w-[7%] text-center">Free</th>
                  <th className="p-2.5 w-[9%] text-right">Cost ₹</th>
                  <th className="p-2.5 w-[9%] text-right">MRP ₹</th>
                  <th className="p-2.5 w-[10%] text-center">Margin %</th>
                  <th className="p-2.5 w-[10%] text-center">Rack</th>
                  <th className="p-2.5 w-[5%] text-center">Del</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {extractedItems.map((item) => {
                  const itemErrors = validateOcrItem(item);
                  const hasErrors = itemErrors.length > 0;
                  const itemMargin = calculateMargin(item.purchasePrice, item.mrp, item.quantity, item.freeQty);
                  const monthsExp = getMonthsToExpiry(item.expiryDate);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-blue-50/20 transition-colors"
                    >
                      <td className="p-1.5">
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none font-extrabold text-slate-900 text-xs md:text-sm"
                          value={item.name}
                          onChange={(e) =>
                            handleUpdateExtractedRow(item.id, "name", e.target.value)
                          }
                        />
                      </td>

                      <td className="p-1.5">
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none font-bold text-slate-800 text-xs md:text-sm"
                          value={item.batch}
                          onChange={(e) =>
                            handleUpdateExtractedRow(item.id, "batch", e.target.value)
                          }
                        />
                      </td>

                      <td className="p-1.5">
                        <input
                          type="text"
                          className={`w-full bg-slate-50 border ${
                            monthsExp !== null && monthsExp < 6
                              ? "border-rose-500 bg-rose-50 text-rose-800 font-black"
                              : "border-slate-300"
                          } rounded-lg px-1 py-1.5 text-center font-bold text-xs md:text-sm`}
                          value={item.expiryDate}
                          onChange={(e) =>
                            handleUpdateExtractedRow(
                              item.id,
                              "expiryDate",
                              formatExpiryDateInput(e.target.value)
                            )
                          }
                        />
                      </td>

                      <td className="p-1.5">
                        <input
                          type="number"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-1 py-1.5 text-center font-black text-blue-700 text-xs md:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateExtractedRow(item.id, "quantity", e.target.value)
                          }
                        />
                      </td>

                      <td className="p-1.5">
                        <input
                          type="number"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-1 py-1.5 text-center font-extrabold text-emerald-600 text-xs md:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={item.freeQty || 0}
                          onChange={(e) =>
                            handleUpdateExtractedRow(item.id, "freeQty", e.target.value)
                          }
                        />
                      </td>

                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-right font-bold text-slate-900 text-xs md:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={item.purchasePrice}
                          onChange={(e) =>
                            handleUpdateExtractedRow(item.id, "purchasePrice", e.target.value)
                          }
                        />
                      </td>

                      <td className="p-1.5">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 text-right font-bold text-slate-900 text-xs md:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          value={item.mrp}
                          onChange={(e) =>
                            handleUpdateExtractedRow(item.id, "mrp", e.target.value)
                          }
                        />
                      </td>

                      {/* Margin % Badge */}
                      <td className="p-1.5 text-center">
                        <span
                          className={`text-[10px] font-black px-1.5 py-0.5 rounded border inline-block ${
                            itemMargin >= 15
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                              : itemMargin >= 10
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-rose-100 text-rose-800 border-rose-300"
                          }`}
                        >
                          {itemMargin.toFixed(0)}%
                        </span>
                      </td>

                      <td className="p-1.5">
                        <input
                          type="text"
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg px-1 py-1.5 text-center font-semibold text-xs"
                          value={item.rackNumber || ""}
                          onChange={(e) =>
                            handleUpdateExtractedRow(item.id, "rackNumber", e.target.value)
                          }
                          placeholder="Rack"
                        />
                      </td>

                      <td className="p-1.5 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteExtractedRow(item.id)}
                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg border-none cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tally Reconciliation Card */}
          <BillReconciliationCard
            items={extractedItems}
            paperBillTotalInput={paperBillTotalInput}
            setPaperBillTotalInput={setPaperBillTotalInput}
            distributorName={ocrDistributor}
            billNumber={ocrBillNumber}
          />

          {/* Import Action */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-extrabold text-slate-700 uppercase tracking-wider bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200">
                {extractedItems.length} Medicines ready to import
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-4 py-3.5 rounded-xl border border-slate-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-700" />
                🏷️ Print Barcode Stickers
              </button>

              <button
                type="button"
                onClick={handleImportExtractedData}
                disabled={extractedItems.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs md:text-sm uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer border-none outline-none"
              >
                <ClipboardCheck className="w-4 h-4" />
                Verify & Import to Inventory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
