"use client";
import { useState, useRef, useEffect } from "react";
import Barcode from "react-barcode";
import {
  PackagePlus, Printer, CheckCircle2, Loader2, Upload,
  FileSpreadsheet, Database, AlertTriangle, RefreshCw, X, ArrowRight, ClipboardCheck
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { formatDate, formatExpiryDate } from "@/lib/formatDate";
import { useReactToPrint } from "react-to-print";
import * as XLSX from "xlsx";

const getTodayInputString = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = String(today.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const formatPurchaseDateInput = (value) => {
  let clean = value.replace(/\D/g, "");
  if (clean.length > 6) clean = clean.slice(0, 6);

  if (clean.length <= 2) {
    return clean;
  }
  if (clean.length <= 4) {
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  }
  return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4)}`;
};

const formatExpiryDateInput = (value) => {
  let clean = value.replace(/\D/g, "");
  if (clean.length > 4) clean = clean.slice(0, 4);

  if (clean.length <= 2) {
    return clean;
  }
  return `${clean.slice(0, 2)}/${clean.slice(2)}`;
};

const getOneYearLaterExpiryInput = () => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = String(today.getFullYear() + 1).slice(-2);
  return `${month}/${year}`;
};

const getTodayDateString = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getOneYearLaterDateString = () => {
  const today = new Date();
  const year = today.getFullYear() + 1;
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function PurchaseEntry() {
  // Mode toggle
  const [importMode, setImportMode] = useState("manual"); // 'manual' or 'bulk'

  // Manual Form States
  const [formData, setFormData] = useState({
    name: "", batch: "", expiryDate: "", quantity: "", distributor: "", mrp: "", purchasePrice: "", billNumber: "", purchaseDate: ""
  });
  const [purchaseDateInput, setPurchaseDateInput] = useState(getTodayInputString());
  const [expiryDateInput, setExpiryDateInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedMed, setSavedMed] = useState(null);

  // 📦 Solution B: Loose Medicine State Management
  const [isLoose, setIsLoose] = useState(false);
  const [tabletsPerStrip, setTabletsPerStrip] = useState("");
  const [stripMrp, setStripMrp] = useState("");

  const [formConfig, setFormConfig] = useState({
    name: true, batch: true, quantity: true, distributor: true, mrp: true, billNumber: true, purchaseDate: true, expiryDate: true
  });
  const [barcodeConfig, setBarcodeConfig] = useState({
    showName: true, showPrice: true, showExpiry: true, showBatch: true, showBillNo: true, showPurchaseDate: true, showBarcodeText: true
  });

  // Bulk Import States
  const [dragOver, setDragOver] = useState(false);
  const [sheetHeaders, setSheetHeaders] = useState([]);
  const [sheetData, setSheetData] = useState([]);
  const [fileName, setFileName] = useState("");
  const [columnMapping, setColumnMapping] = useState({
    name: "", batch: "", expiryDate: "", quantity: "", mrp: "", purchasePrice: "", billNumber: "", distributor: "", purchaseDate: ""
  });

  // Global overrides for items that may not be in spreadsheet
  const [globalDistributor, setGlobalDistributor] = useState("");
  const [globalBillNumber, setGlobalBillNumber] = useState("");
  const [globalPurchaseDate, setGlobalPurchaseDate] = useState(getTodayDateString());

  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  useEffect(() => {
    const savedForm = localStorage.getItem("super_purchase_form_config");
    let activeFormConfig = { name: true, batch: true, quantity: true, distributor: true, mrp: true, billNumber: true, purchaseDate: true, expiryDate: true };
    if (savedForm) {
      try {
        activeFormConfig = JSON.parse(savedForm);
        setTimeout(() => {
          setFormConfig(activeFormConfig);
        }, 0);
      } catch (e) { }
    }

    if (!activeFormConfig.expiryDate) {
      setTimeout(() => {
        setExpiryDateInput(getOneYearLaterExpiryInput());
      }, 0);
    }

    const savedBarcode = localStorage.getItem("super_barcode_config");
    if (savedBarcode) {
      try {
        setTimeout(() => {
          setBarcodeConfig(JSON.parse(savedBarcode));
        }, 0);
      } catch (e) { }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const reorderName = params.get("reorderName");
      const reorderDistributor = params.get("reorderDistributor");
      const reorderBatch = params.get("reorderBatch");
      const reorderMrp = params.get("reorderMrp");

      if (reorderName) {
        setFormData(prev => ({
          ...prev,
          name: reorderName,
          distributor: reorderDistributor || "",
          batch: reorderBatch || "",
          mrp: reorderMrp || "",
          quantity: ""
        }));
      }
    }
  }, []);

  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Barcode_Label",
  });

  const [distributors, setDistributors] = useState([]);
  const nameInputRef = useRef(null);

  useEffect(() => {
    const fetchDistributors = async () => {
      try {
        const res = await fetch("/api/medicine?getDistributors=true");
        const data = await res.json();
        if (data.success) {
          setDistributors(data.distributors);
        }
      } catch (error) {
        console.error("Error fetching distributors:", error);
      }
    };
    fetchDistributors();
  }, []);

  // ---------------------------------------------------------------------------
  // DATA PARSING UTILITIES FOR BULK IMPORT
  // ---------------------------------------------------------------------------

  // Clean text and extract numbers (e.g. "Rs 50" -> 50, "100 units" -> 100)
  const parseNumber = (val) => {
    if (val === undefined || val === null) return 0;
    const str = String(val).trim();
    const cleaned = str.replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : Math.abs(num);
  };

  // Parse various date strings into standard YYYY-MM-DD format
  const parseExpiryDate = (val) => {
    if (!val) return null;
    const str = String(val).trim();

    // Excel Serial Number detection (e.g. 45398)
    if (/^\d{5}$/.test(str)) {
      const serial = Number(str);
      const date = new Date((serial - 25569) * 86400 * 1000);
      return date.toISOString().slice(0, 10);
    }

    // Standard ISO format YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      return str;
    }

    // Clean brackets and spaces
    let clean = str.replace(/[^\w\/\-]/g, "");

    // DD/MM/YYYY or DD-MM-YYYY
    let match = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (match) {
      let day = Number(match[1]);
      let month = Number(match[2]);
      let year = Number(match[3]);
      if (year < 100) year += 2000;
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    // MM/YYYY or MM-YYYY
    match = clean.match(/^(\d{1,2})[\/\-](\d{4})$/);
    if (match) {
      let month = Number(match[1]);
      let year = Number(match[2]);
      if (month >= 1 && month <= 12) {
        const lastDay = new Date(year, month, 0).getDate();
        return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      }
    }

    // MM/YY or MM-YY (Standard pharma layout)
    match = clean.match(/^(\d{1,2})[\/\-](\d{2})$/);
    if (match) {
      let month = Number(match[1]);
      let year = Number(match[2]) + 2000;
      if (month >= 1 && month <= 12) {
        const lastDay = new Date(year, month, 0).getDate();
        return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      }
    }

    // YYYY/MM or YYYY-MM
    match = clean.match(/^(\d{4})[\/\-](\d{1,2})$/);
    if (match) {
      let year = Number(match[1]);
      let month = Number(match[2]);
      if (month >= 1 && month <= 12) {
        const lastDay = new Date(year, month, 0).getDate();
        return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      }
    }

    // Native JS Parser fallback
    const parsed = Date.parse(str);
    if (!isNaN(parsed)) {
      return new Date(parsed).toISOString().slice(0, 10);
    }

    return null;
  };

  // Process rows using mapped configurations
  const getProcessedImportData = () => {
    if (!sheetData || sheetData.length === 0) return { list: [], skipped: [] };

    const list = [];
    const skipped = [];

    sheetData.forEach((row, idx) => {
      const rowNum = idx + 2; // Row offset: 1-based, plus header row

      const getValue = (field) => {
        const colName = columnMapping[field];
        if (!colName) return "";
        const colIdx = sheetHeaders.indexOf(colName);
        if (colIdx === -1) return "";
        const val = row[colIdx];
        return (val !== undefined && val !== null) ? String(val).trim() : "";
      };

      const name = getValue("name");
      const batch = getValue("batch");
      const distributor = getValue("distributor") || globalDistributor;
      const billNumber = getValue("billNumber") || globalBillNumber;

      // Guard: Skip and log row if key elements are empty
      if (!name || !batch || !distributor || !billNumber) {
        const missing = [];
        if (!name) missing.push("Medicine Name");
        if (!batch) missing.push("Batch Number");
        if (!distributor) missing.push("Distributor Name");
        if (!billNumber) missing.push("Bill Number");
        skipped.push({
          row: rowNum,
          name: name || "N/A",
          reason: `Skipped: ${missing.join(", ")} is empty`
        });
        return;
      }

      const mrpValue = getValue("mrp");
      const purchasePriceValue = getValue("purchasePrice");
      const quantityValue = getValue("quantity");
      const expiryDateValue = getValue("expiryDate");

      const mrp = parseNumber(mrpValue);
      const purchasePrice = purchasePriceValue ? parseNumber(purchasePriceValue) : mrp;
      const quantity = parseNumber(quantityValue) || 1;

      const parsedExpiry = parseExpiryDate(expiryDateValue);
      const purchaseDateValue = getValue("purchaseDate");
      const parsedPurchase = parseExpiryDate(purchaseDateValue) || globalPurchaseDate || getTodayDateString();

      const rowWarnings = [];
      if (!parsedExpiry) {
        rowWarnings.push("No valid expiry date (set to +1 Year)");
      }
      if (mrp <= 0) {
        rowWarnings.push("MRP is zero or negative");
      }

      list.push({
        name,
        batch,
        quantity,
        mrp,
        purchasePrice,
        distributor,
        billNumber,
        purchaseDate: parsedPurchase,
        expiryDate: parsedExpiry || getOneYearLaterDateString(),
        rowNum,
        warnings: rowWarnings
      });
    });

    return { list, skipped };
  };

  // ---------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------

  const handleFileLoad = (file) => {
    if (!file) return;
    setFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target.result;
        const workbook = XLSX.read(bstr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (json.length === 0) {
          toast.error("The uploaded file is empty!");
          return;
        }

        const rawHeaders = json[0] || [];
        const headers = rawHeaders.map(h => (h !== undefined && h !== null) ? String(h).trim() : "");
        const rows = json.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== ""));

        setSheetHeaders(headers);
        setSheetData(rows);

        // Smart Mapping heuristic guesses (supports Marg ERP, Tally, Busy, PharmSoft, etc.)
        const mapping = { name: "", batch: "", expiryDate: "", quantity: "", mrp: "", purchasePrice: "", billNumber: "", distributor: "", purchaseDate: "" };
        headers.forEach((h) => {
          const lower = h.toLowerCase();
          if (lower.includes("name") || lower.includes("med") || lower.includes("product") || lower.includes("description") || lower.includes("particular") || lower === "item" || lower === "item_name") {
            if (!mapping.name) mapping.name = h;
          } else if (lower.includes("batch") || lower.includes("b.no") || lower.includes("b_no") || lower.includes("bno") || lower === "b") {
            if (!mapping.batch) mapping.batch = h;
          } else if (lower.includes("exp") || lower.includes("valid") || lower.includes("expiry") || lower.includes("exp_date")) {
            if (!mapping.expiryDate) mapping.expiryDate = h;
          } else if (lower.includes("qty") || lower.includes("quantity") || lower.includes("stock") || lower.includes("bal") || lower.includes("closing") || lower === "units" || lower === "pcs") {
            if (!mapping.quantity) mapping.quantity = h;
          } else if (lower.includes("mrp") || lower.includes("m.r.p") || lower.includes("retail") || lower.includes("s.rate") || lower.includes("s_rate") || lower.includes("selling") || lower === "price" || lower === "rate") {
            if (lower.includes("purchase") || lower.includes("cost") || lower.includes("cp") || lower.includes("buying") || lower.includes("p.rate") || lower.includes("p_rate") || lower.includes("pur")) {
              if (!mapping.purchasePrice) mapping.purchasePrice = h;
            } else {
              if (!mapping.mrp) mapping.mrp = h;
            }
          } else if (lower.includes("bill") || lower.includes("invoice") || lower.includes("inv") || lower.includes("billno")) {
            if (!mapping.billNumber) mapping.billNumber = h;
          } else if (lower.includes("distributor") || lower.includes("agency") || lower.includes("supplier") || lower.includes("party") || lower.includes("vendor") || lower.includes("mfg")) {
            if (!mapping.distributor) mapping.distributor = h;
          } else if (lower.includes("purchase date") || lower.includes("pur date") || lower === "date" || lower.includes("billing date")) {
            if (!mapping.purchaseDate) mapping.purchaseDate = h;
          }
        });

        setColumnMapping(mapping);
        toast.success("Spreadsheet loaded! Map your columns to verify records.");
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse file. Make sure it is a valid Excel or CSV sheet.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragOver(true);
    } else if (e.type === "dragleave") {
      setDragOver(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileLoad(e.dataTransfer.files[0]);
    }
  };

  const executeBulkImport = async () => {
    const { list, skipped } = getProcessedImportData();
    if (list.length === 0) {
      toast.error("No valid records found to import!");
      return;
    }

    setImporting(true);
    const toastId = toast.loading(`Uploading ${list.length} stock items to database...`);

    try {
      const res = await fetch("/api/medicine", {
        method: "POST",
        body: JSON.stringify(list),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Successfully imported ${data.count} items!`, { id: toastId, duration: 6000 });
        setImportResult({
          successCount: data.count,
          skipped: skipped
        });
        // Clear spreadsheet state on success
        setSheetData([]);
        setSheetHeaders([]);
        setFileName("");
      } else {
        toast.error(`Import failed: ${data.error}`, { id: toastId });
      }
    } catch (err) {
      toast.error("Connection or server error during bulk import.", { id: toastId });
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formConfig.distributor && !formData.distributor.trim()) {
      toast.error("Please enter Distributor / Agency name!");
      return;
    }

    if (formConfig.billNumber && !formData.billNumber.trim()) {
      toast.error("Please enter Distributor Bill Number!");
      return;
    }

    const purchaseParts = purchaseDateInput.split("/");
    if (purchaseParts.length !== 3 || purchaseDateInput.length !== 8) {
      toast.error("Please enter a valid Purchase Date in DD/MM/YY format!");
      return;
    }
    const [pDay, pMonth, pYear] = purchaseParts.map(Number);
    const fullPYear = 2000 + pYear;
    const parsedPurchaseDate = `${fullPYear}-${String(pMonth).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;
    const pDateObj = new Date(parsedPurchaseDate);
    if (isNaN(pDateObj.getTime()) || pMonth < 1 || pMonth > 12 || pDay < 1 || pDay > 31) {
      toast.error("Invalid Purchase Date!");
      return;
    }

    const expiryParts = expiryDateInput.split("/");
    if (expiryParts.length !== 2 || expiryDateInput.length !== 5) {
      toast.error("Please enter a valid Expiry Date in MM/YY format!");
      return;
    }
    const [eMonth, eYear] = expiryParts.map(Number);
    const fullEYear = 2000 + eYear;
    const lastDay = new Date(fullEYear, eMonth, 0).getDate();
    const parsedExpiryDate = `${fullEYear}-${String(eMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const eDateObj = new Date(parsedExpiryDate);
    if (isNaN(eDateObj.getTime()) || eMonth < 1 || eMonth > 12) {
      toast.error("Invalid Expiry Date!");
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (eDateObj <= today) {
      toast.error("Expiry date cannot be today or in the past!");
      return;
    }

    if (isLoose) {
      if (!tabletsPerStrip || Number(tabletsPerStrip) <= 1) {
        toast.error("Please enter valid Tablets/Units per strip (must be greater than 1)!");
        return;
      }
      if (!stripMrp || Number(stripMrp) <= 0) {
        toast.error("Please enter a valid Strip MRP Price!");
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        name: formConfig.name ? formData.name : (formData.name || "Unnamed Medicine"),
        batch: formConfig.batch ? formData.batch : (formData.batch || "B-GEN"),
        quantity: formConfig.quantity ? Number(formData.quantity) : 1,
        distributor: formConfig.distributor ? formData.distributor : (formData.distributor || "Generic Distributor"),
        mrp: isLoose ? 0 : (formConfig.mrp ? Number(formData.mrp) : 0),
        purchasePrice: Number(formData.purchasePrice || formData.mrp || 0),
        billNumber: formConfig.billNumber ? formData.billNumber : (formData.billNumber || "BILL-GEN"),
        purchaseDate: formConfig.purchaseDate ? parsedPurchaseDate : getTodayDateString(),
        expiryDate: formConfig.expiryDate ? parsedExpiryDate : getOneYearLaterDateString(),
        isLoose,
        tabletsPerStrip: isLoose ? Number(tabletsPerStrip) : 1,
        stripMrp: isLoose ? Number(stripMrp) : 0
      };

      const res = await fetch("/api/medicine", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();
      if (data.success) {
        setSavedMed(data.medicine);
        toast.success(`${data.medicine.name} saved to database successfully!`);

        if (formData.distributor && !distributors.includes(formData.distributor)) {
          setDistributors([...distributors, formData.distributor]);
        }

        setFormData(prev => ({
          name: "",
          batch: "",
          expiryDate: "",
          quantity: "",
          distributor: "",
          mrp: "",
          purchasePrice: "",
          billNumber: prev.billNumber,
          purchaseDate: ""
        }));
        setExpiryDateInput("");
        setIsLoose(false);
        setTabletsPerStrip("");
        setStripMrp("");
        nameInputRef.current?.focus();
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (error) {
      toast.error("Something went wrong! Please check your network.");
    }
    setLoading(false);
  };

  const { list: processedList, skipped: skippedRows } = getProcessedImportData();
  const previewRows = processedList.slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
      <Toaster position="top-center" reverseOrder={false} />

      {/* Header with Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 md:mr-4 border border-blue-100 shrink-0 shadow-sm">
            <PackagePlus className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">Stock Purchase Intake</h1>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium mt-0.5">Add new medicine stock to your inventory ledger.</p>
          </div>
        </div>

        {/* Tab Toggle Switch */}
        <div className="flex bg-slate-100/80 backdrop-blur-sm p-1 rounded-2xl border border-slate-200/40 self-start sm:self-center select-none shadow-inner">
          <button
            onClick={() => setImportMode("manual")}
            className={`px-4 py-2 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${importMode === 'manual'
                ? 'bg-white text-blue-600 shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Manual Entry
          </button>
          <button
            onClick={() => setImportMode("bulk")}
            className={`px-4 py-2 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${importMode === 'bulk'
                ? 'bg-white text-blue-600 shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel/CSV Import
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          TAB 1: MANUAL ENTRY LAYOUT
          ----------------------------------------------------------------------- */}
      {importMode === "manual" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 animate-in fade-in duration-300">

          <div className="bg-white p-4 md:p-6 lg:p-8 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">

              {formConfig.name && (
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Medicine Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 500mg"
                    ref={nameInputRef}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm md:text-base font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              )}

              {/* Loose Medicine Support Checkbox */}
              <div className="bg-blue-50/50 border border-blue-100 p-3.5 rounded-2xl flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isLooseCheckbox"
                  checked={isLoose}
                  onChange={(e) => setIsLoose(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <label htmlFor="isLooseCheckbox" className="text-xs font-bold text-slate-700 cursor-pointer select-none flex-1">
                  Enable Loose Piece/Tablet Sales Support (Strips/Loose conversion)
                </label>
              </div>

              {isLoose && (
                <div className="space-y-3 bg-amber-50/40 border border-amber-200/80 p-4 rounded-2xl animate-in slide-in-from-top-1 duration-200">
                  <div className="grid grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <label className="block text-[10px] md:text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5">Tablets / Units per Strip</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 10"
                        min="2"
                        className="w-full bg-white border border-amber-200 text-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50/50 transition-all text-xs md:text-sm font-medium"
                        value={tabletsPerStrip}
                        onChange={(e) => setTabletsPerStrip(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] md:text-xs font-bold text-amber-800 uppercase tracking-wider mb-1.5">Total Strip MRP ₹</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 120"
                        min="0.1"
                        step="0.01"
                        className="w-full bg-white border border-amber-200 text-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-400 focus:ring-4 focus:ring-amber-50/50 transition-all text-xs md:text-sm font-medium"
                        value={stripMrp}
                        onChange={(e) => setStripMrp(e.target.value)}
                      />
                    </div>
                  </div>

                  {Number(tabletsPerStrip) > 1 && Number(stripMrp) > 0 && (
                    <div className="bg-white/80 border border-amber-200 p-3 rounded-xl text-[11px] md:text-xs text-amber-900 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-600">Total Tablets Added to Stock:</span>
                        <span className="font-black text-blue-700">{Number(formData.quantity || 1) * Number(tabletsPerStrip)} Tablets ({formData.quantity || 1} Strips)</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-600">Calculated Selling Rate per Tablet:</span>
                        <span className="font-black text-emerald-700">₹{(Number(stripMrp) / Number(tabletsPerStrip)).toFixed(2)} / tablet</span>
                      </div>
                      {Number(formData.purchasePrice) > 0 && (
                        <div className="flex justify-between items-center pt-1 border-t border-amber-100 text-slate-500">
                          <span>Calculated Cost Price per Tablet:</span>
                          <span className="font-bold text-slate-700">₹{(Number(formData.purchasePrice) / Number(tabletsPerStrip)).toFixed(2)} / tablet</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 md:gap-5">
                {formConfig.batch && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Batch No.</label>
                    <input type="text" required placeholder="e.g. B-1029"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm md:text-base font-medium"
                      value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })} />
                  </div>
                )}
                {formConfig.quantity && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">
                      {isLoose ? "Quantity (No. of Strips)" : "Quantity"}
                    </label>
                    <input type="number" required placeholder="0" min="1"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm md:text-base font-medium"
                      value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-5">
                {formConfig.billNumber && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Dist. Bill Number</label>
                    <input type="text" required placeholder="e.g. INV-1002"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm md:text-base font-medium"
                      value={formData.billNumber} onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })} />
                  </div>
                )}
                {formConfig.purchaseDate && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Purchase Date (DD/MM/YY)</label>
                    <input type="text" required placeholder="DD/MM/YY"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm md:text-base font-medium"
                      value={purchaseDateInput} onChange={(e) => setPurchaseDateInput(formatPurchaseDateInput(e.target.value))} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {!isLoose && formConfig.mrp && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">MRP Price ₹</label>
                    <input type="number" required placeholder="0.00" min="0" step="0.01"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-2 md:px-3 py-2.5 md:py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-xs md:text-sm font-medium"
                      value={formData.mrp} onChange={(e) => setFormData({ ...formData, mrp: e.target.value })} />
                  </div>
                )}
                <div className={isLoose ? "col-span-2" : ""}>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">
                    {isLoose ? "Total Strip Cost Price ₹" : "Cost Price ₹"}
                  </label>
                  <input type="number" required placeholder="0.00" min="0" step="0.01"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-2 md:px-3 py-2.5 md:py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-xs md:text-sm font-medium"
                    value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })} />
                </div>
                {formConfig.expiryDate && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Expiry (MM/YY)</label>
                    <input type="text" required placeholder="MM/YY"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-2 md:px-3 py-2.5 md:py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-xs md:text-sm font-medium"
                      value={expiryDateInput} onChange={(e) => setExpiryDateInput(formatExpiryDateInput(e.target.value))} />
                  </div>
                )}
              </div>

              {formConfig.distributor && (
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Distributor / Agency</label>
                  <input
                    type="text" required placeholder="e.g. Cipla / SunPharma"
                    list="distributor-suggestions"
                    autoComplete="off"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm md:text-base font-medium"
                    value={formData.distributor}
                    onChange={(e) => setFormData({ ...formData, distributor: e.target.value })}
                  />
                  <datalist id="distributor-suggestions">
                    {distributors.map((dist, index) => (
                      <option key={index} value={dist} />
                    ))}
                  </datalist>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm px-4 py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-2 md:mt-4">
                {loading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : "Save Entry & Generate Barcode"}
              </button>
            </form>
          </div>

          <div className="bg-slate-100/50 p-6 md:p-8 rounded-[24px] md:rounded-3xl border border-slate-100 flex flex-col items-center justify-center min-h-[250px] md:min-h-[400px]">
            {!savedMed ? (
              <div className="text-center text-slate-400">
                <Printer className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-30" />
                <p className="font-medium text-xs md:text-base">Submit the form to view the barcode.</p>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="flex items-center text-blue-600 font-bold mb-4 md:mb-6 bg-blue-50 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-blue-100 text-[10px] md:text-sm">
                  <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                  Entry Saved Successfully!
                </div>

                <div className="bg-white shadow-xl shadow-slate-200 rounded-lg md:rounded-xl p-3 md:p-4 mb-4 md:mb-6 scale-[0.85] md:scale-100 origin-center">
                  <div className="bg-white flex flex-col items-center justify-center overflow-hidden" style={{ width: '50mm', height: '25mm', padding: '1.5mm 2mm' }}>
                    <Barcode
                      value={savedMed.barcodeId}
                      width={1.2}
                      height={30}
                      fontSize={8}
                      margin={0}
                      background="#ffffff"
                      lineColor="#000000"
                      displayValue={barcodeConfig.showBarcodeText}
                    />

                    <div className="w-full text-center mt-1 space-y-0.5 leading-none">
                      {barcodeConfig.showName && (
                        <p className="text-[9px] font-black text-black uppercase tracking-tight leading-none truncate max-w-full">
                          {savedMed.name}
                        </p>
                      )}
                      <p className="text-[7px] font-bold text-black uppercase tracking-tight leading-none">
                        {[
                          barcodeConfig.showBatch && `B: ${savedMed.batch}`,
                          barcodeConfig.showExpiry && `E: ${formatExpiryDate(savedMed.expiryDate)}`
                        ].filter(Boolean).join(" | ")}
                      </p>
                      <p className="text-[7px] font-bold text-black uppercase tracking-tight leading-none">
                        {[
                          barcodeConfig.showPrice && `₹${savedMed.mrp}`,
                          barcodeConfig.showBillNo && `BILL: ${savedMed.billNumber}`,
                          barcodeConfig.showPurchaseDate && `PUR: ${formatDate(savedMed.purchaseDate)}`
                        ].filter(Boolean).join(" | ")}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePrint}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs md:text-sm px-5 py-3 rounded-xl md:rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] w-full max-w-[200px]"
                >
                  <Printer className="w-4 h-4 text-blue-400" /> Print Label
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------------
          TAB 2: EXCEL/CSV BULK IMPORT LAYOUT
          ----------------------------------------------------------------------- */}
      {importMode === "bulk" && (
        <div className="space-y-6 animate-in fade-in duration-300">

          {/* Top Info Banner */}
          <div className="bg-blue-50/70 border border-blue-100 rounded-3xl p-4 md:p-5 flex gap-3 text-blue-900 text-xs md:text-sm leading-relaxed shadow-sm">
            <ClipboardCheck className="w-5 h-5 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <p className="font-extrabold uppercase text-[10px] md:text-xs tracking-wider mb-1 text-blue-700">
                1-Click Migration Engine (Marg ERP, Tally, Busy & Custom Excel)
              </p>
              <p className="font-medium text-slate-600">
                Marg ERP ya kisi purane software se export kiya gaya Excel/CSV yahan Upload karein.
                Smart AI engine <strong className="text-slate-800">Item Name, Batch (B.No), Expiry (Exp), MRP (M.R.P.), Purchase Rate (P.Rate), Stock Qty, aur Supplier</strong> auto-detect kar lega!
              </p>
            </div>
          </div>

          {/* Import Result Feedback Alert */}
          {importResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 space-y-3 animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm md:text-base">Stock Import Successful!</h3>
              </div>
              <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                🎉 Total **{importResult.successCount}** stock items successfully parsed, saved to inventory database, and barcodes assigned!
              </p>

              {importResult.skipped.length > 0 && (
                <div className="pt-2 border-t border-emerald-200/50">
                  <p className="text-xs text-rose-700 font-bold flex items-center gap-1 mb-2">
                    <AlertTriangle className="w-4 h-4" /> Skipped Rows ({importResult.skipped.length})
                  </p>
                  <div className="max-h-[150px] overflow-y-auto bg-white/70 border border-rose-100 rounded-2xl p-3 text-[10px] md:text-xs font-semibold text-slate-500 divide-y divide-slate-100">
                    {importResult.skipped.map((s, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between gap-4">
                        <span>Row {s.row}: Medicine: <strong>{s.name}</strong></span>
                        <span className="text-rose-600">{s.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column: Drag & Drop zone and Mapping settings */}
            <div className="lg:col-span-1 space-y-6">

              {/* Uploader Box */}
              <div
                className={`bg-white rounded-3xl p-6 border-2 border-dashed text-center cursor-pointer transition-all ${dragOver
                    ? "border-blue-500 bg-blue-50/30 scale-[0.99]"
                    : fileName
                      ? "border-emerald-300 bg-emerald-50/10"
                      : "border-slate-200 hover:border-slate-350"
                  }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-loader-input").click()}
              >
                <input
                  id="file-loader-input"
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileLoad(e.target.files[0]);
                    }
                  }}
                />

                {fileName ? (
                  <div className="space-y-2">
                    <FileSpreadsheet className="w-12 h-12 text-emerald-500 mx-auto" />
                    <p className="font-extrabold text-sm text-slate-700 truncate max-w-full px-4">{fileName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">File Loaded Successfully</p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFileName("");
                        setSheetData([]);
                        setSheetHeaders([]);
                      }}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 px-3 py-1 rounded-lg border border-rose-100 transition-colors mt-2"
                    >
                      Clear File
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-12 h-12 text-slate-300 mx-auto" />
                    <p className="font-bold text-sm text-slate-700">Choose Excel or CSV</p>
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">Drag & drop your stock sheet here, or click to browse device</p>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase pt-2">Supports .xlsx, .xls, .csv formats</p>
                  </div>
                )}
              </div>

              {/* Global values overrides (Distributor Invoice context) */}
              {sheetData.length > 0 && (
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] space-y-4">
                  <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Global Invoice Settings</h3>
                  <p className="text-[10px] text-slate-400 font-medium">Excel columns me agar inki detail na ho, toh in settings se dynamic auto-fill ho jayegi.</p>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Distributor Agency</label>
                      <input
                        type="text"
                        placeholder="e.g. Cipla Labs"
                        value={globalDistributor}
                        onChange={(e) => setGlobalDistributor(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Distributor Bill Number</label>
                      <input
                        type="text"
                        placeholder="e.g. BILL-9901"
                        value={globalBillNumber}
                        onChange={(e) => setGlobalBillNumber(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none text-xs font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Purchase Date</label>
                      <input
                        type="date"
                        value={globalPurchaseDate}
                        onChange={(e) => setGlobalPurchaseDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none text-xs font-semibold"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Middle & Right Column: Field column mapping & Preview table */}
            <div className="lg:col-span-2 space-y-6">

              {sheetData.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-16 text-center text-slate-400 h-full min-h-[300px] flex flex-col justify-center items-center">
                  <Database className="w-12 h-12 text-slate-350 mb-3 opacity-50" />
                  <h3 className="font-bold text-slate-700 text-sm">No Stock File Loaded</h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">Left side me spreadsheet select karein. Column settings aur 100% verification preview yaha active ho jayega.</p>
                </div>
              ) : (
                <div className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] space-y-6">

                  {/* Dynamic Column Mapping */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-50 pb-3">
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-800">Match Excel Columns</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">Milaayein ki aapke sheet ki kaunsi heading database ke kis field se matches karti hai.</p>
                      </div>
                      <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md">
                        {sheetHeaders.length} Columns Detected
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

                      {/* Name */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Medicine Name <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={columnMapping.name}
                          onChange={(e) => setColumnMapping({ ...columnMapping, name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-blue-400 cursor-pointer"
                        >
                          <option value="">-- Skip/None --</option>
                          {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      {/* Batch */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Batch Number <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={columnMapping.batch}
                          onChange={(e) => setColumnMapping({ ...columnMapping, batch: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-blue-400 cursor-pointer"
                        >
                          <option value="">-- Skip/None --</option>
                          {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      {/* Quantity */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Quantity <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={columnMapping.quantity}
                          onChange={(e) => setColumnMapping({ ...columnMapping, quantity: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-blue-400 cursor-pointer"
                        >
                          <option value="">-- Skip/None --</option>
                          {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      {/* Expiry */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Expiry Date <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={columnMapping.expiryDate}
                          onChange={(e) => setColumnMapping({ ...columnMapping, expiryDate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-blue-400 cursor-pointer"
                        >
                          <option value="">-- Skip/None --</option>
                          {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      {/* MRP */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                          MRP Price ₹ <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={columnMapping.mrp}
                          onChange={(e) => setColumnMapping({ ...columnMapping, mrp: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-blue-400 cursor-pointer"
                        >
                          <option value="">-- Skip/None --</option>
                          {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      {/* Purchase Cost */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Cost Price ₹</label>
                        <select
                          value={columnMapping.purchasePrice}
                          onChange={(e) => setColumnMapping({ ...columnMapping, purchasePrice: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-blue-400 cursor-pointer"
                        >
                          <option value="">-- Use MRP as Cost --</option>
                          {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      {/* Optional Distributor Column */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Distributor Column</label>
                        <select
                          value={columnMapping.distributor}
                          onChange={(e) => setColumnMapping({ ...columnMapping, distributor: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-blue-400 cursor-pointer"
                        >
                          <option value="">-- Use Global Setting --</option>
                          {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      {/* Optional Bill No Column */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Bill Number Column</label>
                        <select
                          value={columnMapping.billNumber}
                          onChange={(e) => setColumnMapping({ ...columnMapping, billNumber: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-blue-400 cursor-pointer"
                        >
                          <option value="">-- Use Global Setting --</option>
                          {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                      {/* Optional Purchase Date Column */}
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Pur. Date Column</label>
                        <select
                          value={columnMapping.purchaseDate}
                          onChange={(e) => setColumnMapping({ ...columnMapping, purchaseDate: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold focus:outline-none focus:border-blue-400 cursor-pointer"
                        >
                          <option value="">-- Use Global Setting --</option>
                          {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>

                    </div>
                  </div>

                  {/* Verification Preview Table */}
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-xs text-slate-400 uppercase tracking-widest">Verification Preview (First 5 Rows)</h3>
                      {processedList.length > 0 && (
                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          {processedList.length} Rows will import ({skippedRows.length} will skip)
                        </span>
                      )}
                    </div>

                    <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                      <table className="w-full border-collapse text-left text-xs font-semibold text-slate-500">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-150">
                            <th className="p-3">Row</th>
                            <th className="p-3">Medicine Name</th>
                            <th className="p-3">Batch</th>
                            <th className="p-3">Expiry</th>
                            <th className="p-3 text-center">Qty</th>
                            <th className="p-3 text-right">MRP</th>
                            <th className="p-3 text-right">Cost</th>
                            <th className="p-3">Warnings</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {previewRows.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="p-8 text-center text-slate-400 font-medium">
                                Map key columns (Name, Batch, Expiry, Qty, MRP) to render preview.
                              </td>
                            </tr>
                          ) : (
                            previewRows.map((r, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/55 transition-colors">
                                <td className="p-3 font-bold text-slate-400">{r.rowNum}</td>
                                <td className="p-3 font-black text-slate-800 max-w-[120px] truncate">{r.name}</td>
                                <td className="p-3 text-slate-600 font-bold">{r.batch}</td>
                                <td className="p-3">
                                  <span className={r.expiryDate === getOneYearLaterDateString() ? "text-amber-600" : ""}>
                                    {new Date(r.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' })}
                                  </span>
                                </td>
                                <td className="p-3 text-center font-extrabold text-blue-600">{r.quantity}</td>
                                <td className="p-3 text-right font-bold">₹{r.mrp.toFixed(2)}</td>
                                <td className="p-3 text-right font-bold">₹{r.purchasePrice.toFixed(2)}</td>
                                <td className="p-3 max-w-[150px]">
                                  {r.warnings.length > 0 ? (
                                    <div className="space-y-0.5">
                                      {r.warnings.map((w, wIdx) => (
                                        <p key={wIdx} className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5">
                                          <AlertTriangle className="w-2.5 h-2.5" /> {w}
                                        </p>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-[9px] text-emerald-600 font-bold">✓ Ready</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>

                    {processedList.length > 5 && (
                      <p className="text-[10px] text-slate-400 text-center font-medium italic">Showing first 5 rows. There are {processedList.length - 5} additional items in this sheet...</p>
                    )}
                  </div>

                  {/* Empty Skip Rows Report */}
                  {skippedRows.length > 0 && (
                    <div className="p-4 bg-rose-50/30 border border-rose-100 rounded-2xl space-y-2">
                      <p className="text-xs text-rose-700 font-extrabold flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Skipped Rows Alert ({skippedRows.length} Rows)
                      </p>
                      <p className="text-[10px] text-slate-500 font-medium">In rows me Medicine Name ya Batch code nahi mila. Database safety ke liye inhe skip kiya jayega:</p>
                      <div className="max-h-[80px] overflow-y-auto divide-y divide-rose-100/50 text-[10px] font-semibold text-rose-600">
                        {skippedRows.map((sr, idx) => (
                          <div key={idx} className="py-1">Row {sr.row}: {sr.reason}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trigger Import Button */}
                  <div className="pt-2 border-t border-slate-50">
                    <button
                      onClick={executeBulkImport}
                      disabled={importing || processedList.length === 0}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider py-4 rounded-2xl transition-all shadow-lg shadow-blue-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Importing Stock...
                        </>
                      ) : (
                        <>
                          <Database className="w-4 h-4 text-blue-200" />
                          Import {processedList.length} Items to Inventory
                        </>
                      )}
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Hidden printable container for barcode label */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', overflow: 'hidden' }}>
        <div ref={printRef}>
          <style type="text/css" media="print">
            {`
              @page { 
                size: 50mm 25mm; 
                margin: 0mm !important; 
              }
              body { 
                margin: 0mm !important; 
                padding: 0mm !important; 
              }
              .thermal-label {
                width: 50mm !important; 
                height: 25mm !important; 
                page-break-after: always; 
                page-break-inside: avoid;
                display: flex;
                flex-direction: column; 
                justify-content: center; 
                align-items: center;
                box-sizing: border-box; 
                background-color: white;
                overflow: hidden !important; 
                padding: 1mm 3mm; 
              }
              
              .barcode-wrapper {
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              
              .barcode-wrapper svg {
                max-width: 100% !important; 
                max-height: 20mm !important; 
                object-fit: contain;
              }

              .text-wrapper {
                width: 100%;
                text-align: center;
                margin-top: 1px; 
              }

              .thermal-label:last-child { 
                page-break-after: auto; 
              }
            `}
          </style>

          {savedMed && (
            <div className="thermal-label">
              <div className="barcode-wrapper">
                <Barcode
                  value={savedMed.barcodeId}
                  format="CODE128"
                  renderer="svg"
                  width={1.5}
                  height={35}
                  fontSize={8}
                  margin={0}
                  textMargin={1}
                  background="#ffffff"
                  lineColor="#000000"
                  displayValue={barcodeConfig.showBarcodeText}
                />
              </div>

              <div className="text-wrapper flex flex-col items-center leading-none mt-1 space-y-0.5 w-full text-center">
                {barcodeConfig.showName && (
                  <p className="text-[9px] font-black text-black uppercase tracking-tight leading-none truncate max-w-full" style={{ fontFamily: 'sans-serif', margin: 0 }}>
                    {savedMed.name}
                  </p>
                )}
                <p className="text-[7px] font-bold text-black uppercase tracking-tight leading-none" style={{ fontFamily: 'sans-serif', margin: 0 }}>
                  {[
                    barcodeConfig.showBatch && `B: ${savedMed.batch}`,
                    barcodeConfig.showExpiry && `E: ${formatExpiryDate(savedMed.expiryDate)}`
                  ].filter(Boolean).join(" | ")}
                </p>
                <p className="text-[7px] font-bold text-black uppercase tracking-tight leading-none" style={{ fontFamily: 'sans-serif', margin: 0 }}>
                  {[
                    barcodeConfig.showPrice && `₹${savedMed.mrp}`,
                    barcodeConfig.showBillNo && `BILL: ${savedMed.billNumber}`,
                    barcodeConfig.showPurchaseDate && `PUR: ${formatDate(savedMed.purchaseDate)}`
                  ].filter(Boolean).join(" | ")}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}