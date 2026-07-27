"use client";
import { useState, useRef, useEffect } from "react";
import Barcode from "react-barcode";
import {
  PackagePlus, Printer, CheckCircle2, Loader2, Upload,
  FileSpreadsheet, Database, AlertTriangle, RefreshCw, X, ArrowRight, ClipboardCheck,
  Sparkles, ScanLine, Camera, FileText, Check, Trash2, Plus
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
    name: "", batch: "", expiryDate: "", quantity: "", distributor: "", mrp: "", purchasePrice: "", billNumber: "", purchaseDate: "", hsnCode: ""
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
    showName: true, showPrice: true, showExpiry: true, showBatch: true, showBillNo: true, showPurchaseDate: true, showBarcodeText: true,
    labelSize: "50x25",
    customWidth: "50",
    customHeight: "25",
    barcodeTheme: "compact"
  });

  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successOverlayCount, setSuccessOverlayCount] = useState(0);
  const [successOverlayMsg, setSuccessOverlayMsg] = useState("");

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
  const [duplicateMed, setDuplicateMed] = useState(null);
  const [duplicatePayload, setDuplicatePayload] = useState(null);
  const [baseCost, setBaseCost] = useState("");
  const [gstPercent, setGstPercent] = useState("0");
  const [showGstHelper, setShowGstHelper] = useState(false);

  // AI OCR Scanner states
  const [uploadedInvoice, setUploadedInvoice] = useState(null);
  const [uploadedInvoiceName, setUploadedInvoiceName] = useState("");
  const [uploadedInvoiceType, setUploadedInvoiceType] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState("");
  const [extractedItems, setExtractedItems] = useState([]);
  const [activeCamera, setActiveCamera] = useState(false);

  // AI OCR Scanner Mapping & Globals
  const [ocrDistributor, setOcrDistributor] = useState("");
  const [ocrBillNumber, setOcrBillNumber] = useState("");
  const [ocrPurchaseDate, setOcrPurchaseDate] = useState(getTodayInputString());
  const [scannerMapping, setScannerMapping] = useState({
    name: "name",
    batch: "batch",
    expiryDate: "expiryDate",
    quantity: "quantity",
    mrp: "mrp",
    purchasePrice: "purchasePrice",
    hsnCode: "hsnCode",
    gstPercent: "gstPercent"
  });

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
  const formRef = useRef(null);

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

  const stateRef = useRef({ savedMed, formData, expiryDateInput, isLoose, tabletsPerStrip, stripMrp, purchaseDateInput });
  useEffect(() => {
    stateRef.current = { savedMed, formData, expiryDateInput, isLoose, tabletsPerStrip, stripMrp, purchaseDateInput };
  }, [savedMed, formData, expiryDateInput, isLoose, tabletsPerStrip, stripMrp, purchaseDateInput]);

  const handleResetForm = () => {
    setFormData({
      name: "", batch: "", expiryDate: "", quantity: "", distributor: "", mrp: "", purchasePrice: "", billNumber: "", purchaseDate: ""
    });
    setExpiryDateInput("");
    setPurchaseDateInput(getTodayInputString());
    setIsLoose(false);
    setTabletsPerStrip("");
    setStripMrp("");
    setBaseCost("");
    setGstPercent("0");
    toast.success("Form cleared!");
  };

  useEffect(() => {
    if (baseCost) {
      const base = Number(baseCost) || 0;
      const gst = Number(gstPercent) || 0;
      const gstAmount = base * (gst / 100);
      const withGst = base + gstAmount;
      setFormData(prev => ({
        ...prev,
        purchasePrice: withGst.toFixed(2)
      }));
    }
  }, [baseCost, gstPercent]);

  useEffect(() => {
    let automaticHsn = "";
    if (gstPercent === "5") {
      automaticHsn = "3002";
    } else if (gstPercent === "12") {
      automaticHsn = "3004";
    } else if (gstPercent === "18") {
      automaticHsn = "3808";
    } else if (gstPercent === "28") {
      automaticHsn = "3304";
    } else if (gstPercent === "0") {
      automaticHsn = "3006";
    }
    if (automaticHsn) {
      setFormData(prev => ({
        ...prev,
        hsnCode: automaticHsn
      }));
    }
  }, [gstPercent]);

  const renderBarcodeLabelContent = (med) => {
    if (!med) return null;
    const theme = barcodeConfig.barcodeTheme || "compact";
    const size = barcodeConfig.labelSize || "50x25";
    
    // Barcode settings based on size and theme
    let bcWidth = 1.2;
    let bcHeight = 25;
    let fontSize = 7;
    
    if (size === "25x25") {
      bcWidth = 0.9;
      bcHeight = 15;
      fontSize = 6;
    } else if (size === "100x25") {
      bcWidth = 1.8;
      bcHeight = 35;
      fontSize = 9;
    } else if (theme === "large") {
      bcWidth = 1.4;
      bcHeight = 32;
      fontSize = 9;
    } else if (theme === "minimal") {
      bcWidth = size === "25x25" ? 1.0 : 1.4;
      bcHeight = size === "25x25" ? 22 : 35;
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-between leading-none text-black select-none font-sans" style={{ fontFamily: 'sans-serif' }}>
        
        {theme !== "minimal" && (
          <div className="w-full text-center flex flex-col items-center">
            {theme === "retail" && (
              <p className="text-[6px] font-black text-slate-500 uppercase tracking-widest leading-none mb-0.5" style={{ fontSize: '5px' }}>
                ✦ HEALTHCARE MEDS ✦
              </p>
            )}
            <p className={`${theme === 'large' ? 'text-[9px] font-black' : 'text-[7.5px] font-extrabold'} truncate max-w-full uppercase text-center leading-none mb-0.5`} style={{ margin: 0 }}>
              {med.name}
            </p>
          </div>
        )}

        <div className="barcode-wrapper flex items-center justify-center w-full grow overflow-hidden" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Barcode
            value={med.barcodeId}
            format="CODE128"
            renderer="svg"
            width={bcWidth}
            height={bcHeight}
            fontSize={fontSize}
            margin={0}
            textMargin={1}
            background="#ffffff"
            lineColor="#000000"
            displayValue={theme !== "minimal" && barcodeConfig.showBarcodeText}
          />
        </div>

        {theme !== "minimal" && (
          <div className="w-full text-center flex flex-col items-center mt-0.5">
            <p className="text-[6.5px] font-bold uppercase tracking-tight leading-none mb-0.5" style={{ margin: 0, fontSize: '6px' }}>
              {[
                `B: ${med.batch}`,
                `E: ${formatExpiryDate(med.expiryDate)}`
              ].join(" | ")}
            </p>
            <p className={`${theme === 'retail' ? 'text-[7.5px] font-black bg-slate-900 text-white px-1 py-0.5 rounded' : theme === 'large' ? 'text-[8px] font-black' : 'text-[7px] font-bold'} uppercase tracking-tight leading-none`} style={{ margin: 0 }}>
              {theme === "retail" ? `MRP: ₹${Number(med.mrp).toFixed(2)}` : `₹${Number(med.mrp).toFixed(2)}`}
            </p>
          </div>
        )}
      </div>
    );
  };

  const handleNewEntry = () => {
    handleResetForm();
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  const handleDuplicatePreviousRow = () => {
    const prevMed = stateRef.current.savedMed;
    if (!prevMed) {
      toast.error("No previous row to duplicate!");
      return;
    }
    let expVal = "";
    if (prevMed.expiryDate) {
      const expDate = new Date(prevMed.expiryDate);
      const m = String(expDate.getMonth() + 1).padStart(2, '0');
      const y = String(expDate.getFullYear()).slice(-2);
      expVal = `${m}/${y}`;
    }
    let purVal = getTodayInputString();
    if (prevMed.purchaseDate) {
      const purDate = new Date(prevMed.purchaseDate);
      const d = String(purDate.getDate()).padStart(2, '0');
      const m = String(purDate.getMonth() + 1).padStart(2, '0');
      const y = String(purDate.getFullYear()).slice(-2);
      purVal = `${d}/${m}/${y}`;
    }

    setFormData({
      name: prevMed.name || "",
      batch: prevMed.batch || "",
      expiryDate: prevMed.expiryDate || "",
      quantity: prevMed.quantity || "",
      distributor: prevMed.distributor || "",
      mrp: prevMed.mrp || "",
      purchasePrice: prevMed.purchasePrice || "",
      billNumber: prevMed.billNumber || "",
      purchaseDate: prevMed.purchaseDate || ""
    });
    setExpiryDateInput(expVal);
    setPurchaseDateInput(purVal);
    setIsLoose(!!prevMed.isLoose);
    setTabletsPerStrip(prevMed.tabletsPerStrip || "");
    setStripMrp(prevMed.stripMrp || "");
    toast.success("Previous row duplicated!");
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (importMode !== "manual") return;

      // 1. Enter and Shift+Enter navigation
      if (e.key === "Enter") {
        if (
          e.target.tagName === "INPUT" && 
          e.target.type !== "submit" && 
          e.target.type !== "checkbox"
        ) {
          e.preventDefault();
          const form = formRef.current;
          if (form) {
            const inputs = Array.from(
              form.querySelectorAll("input:not([type=checkbox]), select, button[type=submit]")
            ).filter(el => {
              const style = window.getComputedStyle(el);
              return el.tabIndex !== -1 && !el.disabled && style.display !== "none" && style.visibility !== "hidden";
            });
            const index = inputs.indexOf(e.target);
            if (e.shiftKey) {
              if (index > 0) {
                inputs[index - 1].focus();
              }
            } else {
              if (index > -1 && index < inputs.length - 1) {
                inputs[index + 1].focus();
              }
            }
          }
        }
      }

      // 2. Ctrl key shortcut handling
      if (e.ctrlKey) {
        const key = e.key.toLowerCase();
        if (key === "s") {
          e.preventDefault();
          formRef.current?.requestSubmit();
        } else if (key === "n") {
          e.preventDefault();
          handleNewEntry();
        } else if (key === "b") {
          e.preventDefault();
          if (nameInputRef.current) {
            nameInputRef.current.focus();
            toast.success("Ready for barcode scan! (Focus on Medicine Name)");
          }
        } else if (key === "d") {
          e.preventDefault();
          handleDuplicatePreviousRow();
        }
      }

      // 3. ESC handler
      if (e.key === "Escape") {
        e.preventDefault();
        handleResetForm();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [importMode]);

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
        setSuccessOverlayCount(data.count);
        setSuccessOverlayMsg("Medicines added to inventory");
        setShowSuccessOverlay(true);
        setTimeout(() => setShowSuccessOverlay(false), 4500);
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

  const handleSubmit = async (e, forceCreate = false) => {
    if (e && e.preventDefault) e.preventDefault();

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

    let saveQty = Number(formData.quantity);
    let saveMrp = Number(formData.mrp);
    let savePurchasePrice = Number(formData.purchasePrice || formData.mrp || 0);
    let calculatedStripMrp = isLoose ? Number(stripMrp) : saveMrp;
    let calculatedTabletsPerStrip = isLoose ? Number(tabletsPerStrip) : 1;
    
    if (isLoose && calculatedTabletsPerStrip > 1) {
      saveQty = Number(formData.quantity) * calculatedTabletsPerStrip;
      saveMrp = Number(stripMrp) / calculatedTabletsPerStrip;
      savePurchasePrice = Number(formData.purchasePrice || stripMrp || 0) / calculatedTabletsPerStrip;
    }

    const payload = {
      name: formConfig.name ? formData.name : (formData.name || "Unnamed Medicine"),
      batch: formConfig.batch ? formData.batch : (formData.batch || "B-GEN"),
      quantity: saveQty,
      distributor: formConfig.distributor ? formData.distributor : (formData.distributor || "Generic Distributor"),
      mrp: saveMrp,
      purchasePrice: savePurchasePrice,
      billNumber: formConfig.billNumber ? formData.billNumber : (formData.billNumber || "BILL-GEN"),
      purchaseDate: parsedPurchaseDate,
      expiryDate: parsedExpiryDate,
      isLoose,
      tabletsPerStrip: calculatedTabletsPerStrip,
      stripMrp: calculatedStripMrp,
      hsnCode: formData.hsnCode || ""
    };

    if (!forceCreate) {
      setLoading(true);
      try {
        const searchRes = await fetch(`/api/medicine?all=true&search=${encodeURIComponent(payload.name)}`);
        const searchData = await searchRes.json();
        if (searchData.success && searchData.medicines) {
          const match = searchData.medicines.find(m => 
            m.name.toLowerCase().trim() === payload.name.toLowerCase().trim() &&
            m.batch.toLowerCase().trim() === payload.batch.toLowerCase().trim() &&
            new Date(m.expiryDate).toISOString().slice(0, 10) === payload.expiryDate
          );
          if (match) {
            setDuplicateMed(match);
            setDuplicatePayload(payload);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Duplicate check failed:", err);
      }
      setLoading(false);
    }

    setLoading(true);

    try {
      const res = await fetch("/api/medicine", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();
      if (data.success) {
        setSavedMed(data.medicine);
        setSuccessOverlayCount(1);
        setSuccessOverlayMsg(data.medicine.name);
        setShowSuccessOverlay(true);
        setTimeout(() => setShowSuccessOverlay(false), 3500);
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
          purchaseDate: "",
          hsnCode: ""
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

  const handleMergeQuantity = async () => {
    if (!duplicateMed || !duplicatePayload) return;
    setLoading(true);
    const updatedQty = duplicateMed.quantity + duplicatePayload.quantity;
    try {
      const res = await fetch("/api/medicine", {
        method: "PUT",
        body: JSON.stringify({ id: duplicateMed._id, quantity: updatedQty }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        setSavedMed(data.medicine);
        setSuccessOverlayCount(duplicatePayload.quantity);
        setSuccessOverlayMsg(`${duplicatePayload.name} (Merged)`);
        setShowSuccessOverlay(true);
        setTimeout(() => setShowSuccessOverlay(false), 3500);
        toast.success(`Merged successfully! Quantity updated to ${updatedQty}.`);
        
        setFormData(prev => ({
          name: "",
          batch: "",
          expiryDate: "",
          quantity: "",
          distributor: "",
          mrp: "",
          purchasePrice: "",
          billNumber: prev.billNumber,
          purchaseDate: "",
          hsnCode: ""
        }));
        setExpiryDateInput("");
        setIsLoose(false);
        setTabletsPerStrip("");
        setStripMrp("");
        setDuplicateMed(null);
        setDuplicatePayload(null);
        nameInputRef.current?.focus();
      } else {
        toast.error("Merge failed: " + data.error);
      }
    } catch (err) {
      toast.error("Error updating stock quantity.");
    }
    setLoading(false);
  };

  const handleCreateNewBatch = async () => {
    if (!duplicatePayload) return;
    setLoading(true);
    try {
      const res = await fetch("/api/medicine", {
        method: "POST",
        body: JSON.stringify(duplicatePayload),
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();
      if (data.success) {
        setSavedMed(data.medicine);
        setSuccessOverlayCount(1);
        setSuccessOverlayMsg(`${data.medicine.name} (New Batch)`);
        setShowSuccessOverlay(true);
        setTimeout(() => setShowSuccessOverlay(false), 3500);
        toast.success(`New batch for ${data.medicine.name} created successfully!`);

        setFormData(prev => ({
          name: "",
          batch: "",
          expiryDate: "",
          quantity: "",
          distributor: "",
          mrp: "",
          purchasePrice: "",
          billNumber: prev.billNumber,
          purchaseDate: "",
          hsnCode: ""
        }));
        setExpiryDateInput("");
        setIsLoose(false);
        setTabletsPerStrip("");
        setStripMrp("");
        setDuplicateMed(null);
        setDuplicatePayload(null);
        nameInputRef.current?.focus();
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (error) {
      toast.error("Something went wrong! Please check your network.");
    }
    setLoading(false);
  };

  const validateOcrItem = (item) => {
    const errors = [];
    const nameVal = item[scannerMapping.name] || "";
    const batchVal = item[scannerMapping.batch] || "";
    const expiryVal = item[scannerMapping.expiryDate] || "";
    const qtyVal = Number(item[scannerMapping.quantity]);
    const mrpVal = Number(item[scannerMapping.mrp]);
    const costVal = Number(item[scannerMapping.purchasePrice]);

    if (!nameVal.toString().trim()) {
      errors.push("Name required");
    }
    if (!batchVal.toString().trim()) {
      errors.push("Batch required");
    }
    if (!expiryVal.toString().trim()) {
      errors.push("Expiry required");
    } else if (!/^\d{2}\/\d{2}$/.test(expiryVal.toString().trim())) {
      errors.push("Expiry format must be MM/YY");
    }
    if (isNaN(qtyVal) || qtyVal <= 0) {
      errors.push("Quantity > 0 required");
    }
    if (isNaN(mrpVal) || mrpVal <= 0) {
      errors.push("MRP > 0 required");
    }
    if (isNaN(costVal) || costVal <= 0) {
      errors.push("Cost > 0 required");
    } else if (costVal > mrpVal) {
      errors.push("Cost price cannot exceed MRP");
    }

    return errors;
  };

  const handleInvoiceUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedInvoiceName(file.name);
    
    const previewUrl = URL.createObjectURL(file);
    setUploadedInvoice(previewUrl);

    if (file.type.includes("pdf")) {
      setUploadedInvoiceType("pdf");
    } else {
      setUploadedInvoiceType("image");
    }
    triggerAiScan(file);
  };

  const triggerAiScan = async (file) => {
    setIsScanning(true);
    setExtractedItems([]);
    setScanStep("Initializing Gemini 1.5 Flash extraction engine...");
    
    const scanStages = [
      "AI locating invoice grid segments...",
      "Reading medicine brand lines and descriptions...",
      "Extracting batch codes & matching expiry dates...",
      "Parsing tax schemas, quantities & prices...",
      "Verifying HSN alignment metrics..."
    ];

    let stageIdx = 0;
    const stageInterval = setInterval(() => {
      if (stageIdx < scanStages.length) {
        setScanStep(scanStages[stageIdx]);
        stageIdx++;
      }
    }, 700);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("file", file);

      const res = await fetch("/api/ai/invoice-ocr", {
        method: "POST",
        body: formDataToSend
      });
      const data = await res.json();
      
      clearInterval(stageInterval);

      if (data.success) {
        setExtractedItems(data.medicines);
        if (data.keyWarning) {
          toast(data.keyWarning, { icon: "⚠️", duration: 5500 });
        } else {
          toast.success("AI OCR extraction completed successfully!");
        }
      } else {
        toast.error("AI Scan failed: " + (data.error || "Verify API configurations."));
      }
    } catch (err) {
      clearInterval(stageInterval);
      toast.error("Network failure during OCR parsing. Try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleCameraCapture = () => {
    setActiveCamera(true);
    toast("Camera mode activated. Snap invoice to parse.", { icon: "📸" });
  };

  const triggerCameraSnap = async () => {
    setActiveCamera(false);
    setUploadedInvoiceName("Invoice_Camera_Snap.jpg");
    setUploadedInvoiceType("image");
    
    const sampleImageUrl = "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&q=80";
    setUploadedInvoice(sampleImageUrl);

    try {
      const response = await fetch(sampleImageUrl);
      const blob = await response.blob();
      const file = new File([blob], "Invoice_Camera_Snap.jpg", { type: "image/jpeg" });
      triggerAiScan(file);
    } catch (e) {
      const dummyFile = new File(["dummy_image_data"], "Invoice_Camera_Snap.jpg", { type: "image/jpeg" });
      triggerAiScan(dummyFile);
    }
  };

  const handleUpdateExtractedRow = (id, field, value) => {
    setExtractedItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleDeleteExtractedRow = (id) => {
    setExtractedItems(prev => prev.filter(item => item.id !== id));
    toast.success("Row deleted");
  };

  const handleAddExtractedRow = () => {
    const newId = extractedItems.length > 0 ? Math.max(...extractedItems.map(i => i.id)) + 1 : 1;
    const newItem = {
      id: newId,
      name: "",
      batch: "",
      expiryDate: "",
      quantity: "",
      mrp: "",
      purchasePrice: "",
      hsnCode: ""
    };
    setExtractedItems(prev => [...prev, newItem]);
  };

  const handleImportExtractedData = async () => {
    if (extractedItems.length === 0) {
      toast.error("No items to import!");
      return;
    }

    const hasValidationErrors = extractedItems.some(item => validateOcrItem(item).length > 0);
    if (hasValidationErrors) {
      toast.error("Please fix all validation errors before importing!");
      return;
    }

    setLoading(true);
    let successCount = 0;

    try {
      // Parse global purchase date
      const [purDay, purMonth, purYear] = (ocrPurchaseDate || getTodayInputString()).split("/");
      const purYearFull = purYear ? (purYear.length === 2 ? `20${purYear}` : purYear) : "2026";
      const parsedPurchaseDate = new Date(Number(purYearFull), Number(purMonth || 7) - 1, Number(purDay || 27)).toISOString().slice(0, 10);

      for (const item of extractedItems) {
        const itemName = item[scannerMapping.name] || "Unnamed Medicine";
        const itemBatch = item[scannerMapping.batch] || "B-GEN";
        const itemQty = Number(item[scannerMapping.quantity] || 1);
        const itemMrp = Number(item[scannerMapping.mrp] || 0);
        const itemCost = Number(item[scannerMapping.purchasePrice] || 0);
        const itemHsn = item[scannerMapping.hsnCode] || "3004";
        const itemGst = Number(item[scannerMapping.gstPercent] || 12);

        const [expMonth, expYear] = (item[scannerMapping.expiryDate] || "12/26").split("/");
        const yearFull = expYear ? (expYear.length === 2 ? `20${expYear}` : expYear) : "2026";
        const parsedExpiryDate = new Date(Number(yearFull), Number(expMonth || 12) - 1, 28).toISOString().slice(0, 10);

        const payload = {
          name: itemName,
          batch: itemBatch,
          quantity: itemQty,
          mrp: itemMrp,
          purchasePrice: itemCost,
          hsnCode: itemHsn,
          gstPercent: itemGst,
          billNumber: ocrBillNumber || "BILL-OCR",
          expiryDate: parsedExpiryDate,
          purchaseDate: parsedPurchaseDate,
          distributor: ocrDistributor || "OCR Invoice Scanner",
          isLoose: false,
          tabletsPerStrip: 1,
          stripMrp: itemMrp
        };

        const res = await fetch("/api/medicine", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" }
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
        }
      }

      setLoading(false);
      setSuccessOverlayCount(successCount);
      setSuccessOverlayMsg(`${successCount} Medicines Scanned`);
      setShowSuccessOverlay(true);
      setTimeout(() => setShowSuccessOverlay(false), 3500);

      // Clear details
      setUploadedInvoice(null);
      setUploadedInvoiceName("");
      setExtractedItems([]);
      setOcrDistributor("");
      setOcrBillNumber("");
      toast.success(`Successfully imported ${successCount} medicines from invoice!`);
    } catch (err) {
      setLoading(false);
      toast.error("Failed to import scanned items. Check connection.");
    }
  };

  const { list: processedList, skipped: skippedRows } = getProcessedImportData();
  const previewRows = processedList.slice(0, 5);

  const activeLabelSize = barcodeConfig.labelSize || "50x25";
  const activeCustomWidth = barcodeConfig.customWidth || "50";
  const activeCustomHeight = barcodeConfig.customHeight || "25";
  const activeBarcodeTheme = barcodeConfig.barcodeTheme || "compact";

  const labelWidth = activeLabelSize === "custom" ? `${activeCustomWidth}mm` : `${activeLabelSize.split("x")[0]}mm`;
  const labelHeight = activeLabelSize === "custom" ? `${activeCustomHeight}mm` : `${activeLabelSize.split("x")[1]}mm`;

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
          <button
            onClick={() => setImportMode("ai-scan")}
            className={`px-4 py-2 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all duration-300 flex items-center gap-1.5 cursor-pointer ${importMode === 'ai-scan'
                ? 'bg-white text-blue-600 shadow-sm font-black'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-550 animate-pulse" />
            AI Invoice Scanner
          </button>
        </div>
      </div>

      {/* -----------------------------------------------------------------------
          TAB 1: MANUAL ENTRY LAYOUT
          ----------------------------------------------------------------------- */}
      {importMode === "manual" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8 animate-in fade-in duration-300">

          <div className="bg-white p-4 md:p-6 lg:p-8 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100">
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 md:space-y-5">

              <div className="grid grid-cols-3 gap-3 md:gap-4">
                {formConfig.name && (
                  <div className="col-span-2">
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Medicine Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Paracetamol 500mg"
                      ref={nameInputRef}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 py-2.5 md:py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-xs md:text-sm font-medium"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">HSN Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 3004"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 py-2.5 md:py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-xs md:text-sm font-medium"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                  />
                </div>
              </div>

              {/* Loose Medicine Support Checkbox */}
              <div className="bg-blue-50/50 border border-blue-100 p-2.5 rounded-xl flex items-center space-x-3">
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

              {/* Batch, Qty & Expiry Grid Row */}
              <div className="grid grid-cols-3 gap-3">
                {formConfig.batch && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Batch No.</label>
                    <input type="text" required placeholder="e.g. B-1029"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-750 rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-blue-400 text-xs md:text-sm font-medium"
                      value={formData.batch} onChange={(e) => setFormData({ ...formData, batch: e.target.value })} />
                  </div>
                )}
                {formConfig.quantity && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      {isLoose ? "Qty (Strips)" : "Quantity"}
                    </label>
                    <input type="number" required placeholder="0" min="1"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-755 rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-blue-400 text-xs md:text-sm font-medium"
                      value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
                  </div>
                )}
                {formConfig.expiryDate && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Expiry (MM/YY)</label>
                    <input type="text" required placeholder="MM/YY"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-750 rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-blue-400 text-xs md:text-sm font-medium"
                      value={expiryDateInput} onChange={(e) => setExpiryDateInput(formatExpiryDateInput(e.target.value))} />
                  </div>
                )}
              </div>

              {/* Pricing Grid Row */}
              <div className="grid grid-cols-2 gap-3">
                {!isLoose && formConfig.mrp && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">MRP Price ₹</label>
                    <input type="number" required placeholder="0.00" min="0" step="0.01"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-750 rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-blue-400 text-xs md:text-sm font-medium"
                      value={formData.mrp} onChange={(e) => setFormData({ ...formData, mrp: e.target.value })} />
                  </div>
                )}
                <div className={isLoose ? "col-span-2" : ""}>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    {isLoose ? "Total Strip Cost Price ₹" : "Cost Price ₹"}
                  </label>
                  <input type="number" required placeholder="0.00" min="0" step="0.01"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-750 rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-blue-400 text-xs md:text-sm font-medium"
                    value={formData.purchasePrice} onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })} />
                </div>
              </div>

              {/* Collapsible GST Helper Accordion */}
              <div className="border border-slate-150 rounded-2xl overflow-hidden font-sans">
                <button
                  type="button"
                  onClick={() => setShowGstHelper(!showGstHelper)}
                  className="w-full bg-slate-50 hover:bg-slate-100/80 px-4 py-3 flex justify-between items-center text-xs font-bold text-slate-700 transition-colors cursor-pointer border-none outline-none select-none"
                >
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    Optional GST Helper Calculator
                  </span>
                  <span className="text-slate-400 text-[10px]">{showGstHelper ? "▼" : "▶"}</span>
                </button>
                
                {showGstHelper && (
                  <div className="p-4 bg-white border-t border-slate-150 space-y-3 animate-in slide-in-from-top-1 duration-150">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Base Cost (Without GST) ₹</label>
                        <input
                          type="number"
                          placeholder="e.g. 80"
                          min="0"
                          step="0.01"
                          className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none text-xs font-semibold"
                          value={baseCost}
                          onChange={(e) => setBaseCost(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">GST Rate %</label>
                        <select
                          value={gstPercent}
                          onChange={(e) => setGstPercent(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-3 py-2 focus:outline-none text-xs font-bold cursor-pointer"
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </div>
                    </div>

                    {Number(baseCost) > 0 && (
                      <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-[10px] md:text-xs font-semibold text-slate-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Without GST:</span>
                          <span className="text-slate-800 font-bold">₹{Number(baseCost).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>GST Amount ({gstPercent}%):</span>
                          <span className="text-slate-800 font-bold">₹{(Number(baseCost) * (Number(gstPercent) / 100)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100 font-extrabold text-blue-700">
                          <span>Calculated Purchase Cost:</span>
                          <span>₹{(Number(baseCost) * (1 + Number(gstPercent) / 100)).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Billing Row */}
              <div className="grid grid-cols-2 gap-3">
                {formConfig.billNumber && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dist. Bill Number</label>
                    <input type="text" required placeholder="e.g. INV-1002"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-750 rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-blue-400 text-xs md:text-sm font-medium"
                      value={formData.billNumber} onChange={(e) => setFormData({ ...formData, billNumber: e.target.value })} />
                  </div>
                )}
                {formConfig.purchaseDate && (
                  <div>
                    <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Purchase Date (DD/MM/YY)</label>
                    <input type="text" required placeholder="DD/MM/YY"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-750 rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-blue-400 text-xs md:text-sm font-medium"
                      value={purchaseDateInput} onChange={(e) => setPurchaseDateInput(formatPurchaseDateInput(e.target.value))} />
                  </div>
                )}
              </div>

              {formConfig.distributor && (
                <div>
                  <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Distributor / Agency</label>
                  <input
                    type="text" required placeholder="e.g. Cipla / SunPharma"
                    list="distributor-suggestions"
                    autoComplete="off"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-750 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 text-xs md:text-sm font-medium"
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

              {/* Live Profit Preview */}
              {(() => {
                const costVal = Number(formData.purchasePrice) || 0;
                const mrpVal = Number(isLoose ? stripMrp : formData.mrp) || 0;
                if (costVal <= 0 || mrpVal <= 0) return null;
                const marginVal = mrpVal - costVal;
                const profitPercent = costVal > 0 ? (marginVal / costVal) * 100 : 0;

                return (
                  <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-3 text-center md:text-left animate-in slide-in-from-top-1 duration-200 font-sans">
                    <div className="flex-1 w-full grid grid-cols-2 md:grid-cols-4 gap-2 text-xs md:text-sm">
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-150 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Cost</p>
                        <p className="font-extrabold text-slate-800 text-[11px]">₹{costVal.toFixed(2)}</p>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-150 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">MRP</p>
                        <p className="font-extrabold text-slate-800 text-[11px]">₹{mrpVal.toFixed(2)}</p>
                      </div>
                      <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-150 text-center">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Margin</p>
                        <p className={`font-extrabold text-[11px] ${marginVal < 0 ? 'text-rose-600' : 'text-slate-850'}`}>
                          {marginVal < 0 ? "-" : ""}₹{Math.abs(marginVal).toFixed(2)}
                        </p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl text-center border ${marginVal < 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                        <p className="text-[9px] font-bold uppercase tracking-wide opacity-80">Profit %</p>
                        <p className="font-black text-[11px]">{profitPercent.toFixed(2)}%</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              <button type="submit" disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm px-4 py-3 md:py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-2">
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

                <div className="bg-white shadow-xl shadow-slate-200 rounded-lg md:rounded-xl p-3 md:p-4 mb-4 md:mb-6 scale-[0.85] md:scale-100 origin-center border border-slate-100">
                  <div 
                    className="bg-white flex flex-col items-center justify-center overflow-hidden" 
                    style={{ 
                      width: labelWidth, 
                      height: labelHeight, 
                      padding: '1.2mm 2.5mm' 
                    }}
                  >
                    {renderBarcodeLabelContent(savedMed)}
                  </div>
                </div>
 
                {/* Barcode Customization Panel */}
                <div className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3.5 text-xs font-semibold text-slate-600 mb-5 max-w-[320px] md:max-w-[400px]">
                  <h4 className="font-extrabold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                    <Printer className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> Barcode Settings & Theme
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Size Selector */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Label Size</label>
                      <select
                        value={activeLabelSize}
                        onChange={(e) => setBarcodeConfig({ ...barcodeConfig, labelSize: e.target.value })}
                        className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-2 py-1.5 focus:outline-none text-[11px] font-bold cursor-pointer"
                      >
                        <option value="50x25">50x25 mm (Standard)</option>
                        <option value="25x25">25x25 mm (Square)</option>
                        <option value="100x25">100x25 mm (Wide)</option>
                        <option value="custom">Custom...</option>
                      </select>
                    </div>

                    {/* Theme Selector */}
                    <div>
                      <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Theme</label>
                      <select
                        value={activeBarcodeTheme}
                        onChange={(e) => setBarcodeConfig({ ...barcodeConfig, barcodeTheme: e.target.value })}
                        className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-2 py-1.5 focus:outline-none text-[11px] font-bold cursor-pointer"
                      >
                        <option value="compact">Compact</option>
                        <option value="minimal">Minimal</option>
                        <option value="large">Large</option>
                        <option value="retail">Retail</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Dimension Fields */}
                  {activeLabelSize === "custom" && (
                    <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top-1 duration-155">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Width (mm)</label>
                        <input
                          type="number"
                          placeholder="Width"
                          className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none text-[11px] font-semibold"
                          value={barcodeConfig.customWidth}
                          onChange={(e) => setBarcodeConfig({ ...barcodeConfig, customWidth: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Height (mm)</label>
                        <input
                          type="number"
                          placeholder="Height"
                          className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none text-[11px] font-semibold"
                          value={barcodeConfig.customHeight}
                          onChange={(e) => setBarcodeConfig({ ...barcodeConfig, customHeight: e.target.value })}
                        />
                      </div>
                    </div>
                  )}
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

      {/* -----------------------------------------------------------------------
          TAB 3: AI INVOICE OCR SCANNER
          ----------------------------------------------------------------------- */}
      {importMode === "ai-scan" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          
          {/* Left Column: Upload / Snap / Preview Document */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] space-y-4">
              
              <div className="flex justify-between items-center">
                <h3 className="font-extrabold text-sm text-slate-805 flex items-center gap-1.5">
                  <ScanLine className="w-4 h-4 text-blue-600" />
                  Load Invoice Document
                </h3>
                {uploadedInvoice && (
                  <button 
                    onClick={() => { setUploadedInvoice(null); setUploadedInvoiceName(""); setExtractedItems([]); }}
                    className="text-[10px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2 py-1 rounded-md border border-rose-105 cursor-pointer"
                  >
                    Clear File
                  </button>
                )}
              </div>

              {/* Live Camera View Mode */}
              {activeCamera ? (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 relative aspect-video flex flex-col justify-center items-center text-white">
                  <Camera className="w-8 h-8 text-blue-400 mb-2 animate-bounce" />
                  <p className="text-[10px] font-bold tracking-wider text-slate-300">LIVE CAMERA STREAM ACTIVE</p>
                  <p className="text-[9px] text-slate-400 px-4 text-center mt-1">Place the distributor invoice flat under the camera lens.</p>
                  
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4 z-10">
                    <button 
                      type="button" 
                      onClick={() => setActiveCamera(false)} 
                      className="bg-slate-700/80 hover:bg-slate-800 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl transition-all cursor-pointer border-none"
                    >
                      Cancel
                    </button>
                    <button 
                      type="button" 
                      onClick={triggerCameraSnap} 
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] px-4 py-2 rounded-xl transition-all flex items-center gap-1 cursor-pointer border-none shadow-md"
                    >
                      Snap Photo & Scan
                    </button>
                  </div>
                </div>
              ) : !uploadedInvoice ? (
                /* Drag and Drop Zone */
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-3xl p-6 md:p-8 transition-colors text-center text-slate-400 bg-slate-50/50 hover:bg-blue-50/5 relative group">
                    <input 
                      type="file" 
                      accept=".pdf, image/*"
                      onChange={handleInvoiceUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    <Upload className="w-10 h-10 text-slate-300 mx-auto mb-2 opacity-50 group-hover:text-blue-500 transition-colors" />
                    <h4 className="font-extrabold text-slate-700 text-[11px] md:text-xs">Drag & Drop Invoice here</h4>
                    <p className="text-[9px] text-slate-400 mt-1">Supports PDF or Image scans (PNG, JPG)</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-slate-300 px-2 py-0.5">
                    <div className="h-[1px] bg-slate-200 flex-1" />
                    <span className="text-[10px] font-extrabold px-3 uppercase tracking-wider text-slate-400">Or</span>
                    <div className="h-[1px] bg-slate-200 flex-1" />
                  </div>

                  <button
                    type="button"
                    onClick={handleCameraCapture}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-200"
                  >
                    <Camera className="w-4 h-4 text-slate-500" />
                    Scan via Scanner Camera
                  </button>
                </div>
              ) : (
                /* File Preview Panel */
                <div className="border border-slate-200 rounded-3xl overflow-hidden bg-slate-50 relative aspect-[3/4] flex justify-center items-center">
                  
                  {uploadedInvoiceType === "pdf" ? (
                    <object
                      data={uploadedInvoice}
                      type="application/pdf"
                      className="w-full h-full border-none"
                    >
                      <iframe
                        src={uploadedInvoice}
                        className="w-full h-full border-none"
                        title="Invoice PDF Preview"
                      />
                    </object>
                  ) : (
                    <img 
                      src={uploadedInvoice} 
                      className="w-full h-full object-contain"
                      alt="Invoice Scan Preview" 
                    />
                  )}

                  {/* Scanning Lightbar Animation Overlay */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-slate-900/30 flex flex-col justify-center items-center text-white backdrop-blur-[1px] z-20">
                      
                      {/* Scanning animated bar */}
                      <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 shadow-[0_0_15px_#3b82f6] animate-scan z-30" />
                      
                      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl max-w-[220px] text-center shadow-xl space-y-2 animate-in zoom-in-95">
                        <Loader2 className="w-5 h-5 text-blue-400 animate-spin mx-auto" />
                        <p className="text-[10px] font-black uppercase tracking-wider text-blue-400">AI Extracting Invoice</p>
                        <p className="text-[9px] text-slate-300 font-bold leading-tight">{scanStep}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {uploadedInvoice && !isScanning && (
                <div className="bg-slate-50 border border-slate-200 px-3.5 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold text-slate-600">
                  <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{uploadedInvoiceName}</span>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                    Loaded
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* Right Column: Editable Mapping verification table */}
          <div className="lg:col-span-8">
            {extractedItems.length === 0 && !isScanning ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[28px] p-20 text-center text-slate-400 h-full min-h-[300px] flex flex-col justify-center items-center">
                <Sparkles className="w-12 h-12 text-blue-550 mb-3 opacity-55 animate-pulse" />
                <h3 className="font-bold text-slate-700 text-sm">AI Invoice Scanner Standby</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
                  Left column me distributor invoice PDF ya photo upload karein. Humara premium AI scanner items ko auto-extract karke editable table me populate kar dega.
                </p>
              </div>
            ) : (
              <div className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] space-y-5 animate-in slide-in-from-right-1 duration-300">
                
                {/* Global Invoice Settings Card */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-blue-500" />
                    Global Invoice Details
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-550 uppercase mb-1">Distributor / Agency</label>
                      <input
                        type="text"
                        placeholder="e.g. Cipla / SunPharma"
                        list="distributors-datalist"
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-400 text-xs font-semibold"
                        value={ocrDistributor}
                        onChange={(e) => setOcrDistributor(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-550 uppercase mb-1">Invoice Bill Number</label>
                      <input
                        type="text"
                        placeholder="e.g. BILL-9928"
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-400 text-xs font-semibold"
                        value={ocrBillNumber}
                        onChange={(e) => setOcrBillNumber(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-550 uppercase mb-1">Purchase Date (DD/MM/YY)</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YY"
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-400 text-xs font-semibold"
                        value={ocrPurchaseDate}
                        onChange={(e) => setOcrPurchaseDate(formatExpiryDateInput(e.target.value))}
                      />
                    </div>
                  </div>
                </div>

                {/* Columns Mapping Config Accordion */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                  <h4 className="font-extrabold text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                    OCR Column Field Mapping (Excel Style)
                  </h4>
                  <p className="text-[9px] text-slate-400 leading-tight">Map extracted fields manually to prevent mismatched database rows.</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[9px]">
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Medicine Name Map</label>
                      <select
                        value={scannerMapping.name}
                        onChange={(e) => setScannerMapping({ ...scannerMapping, name: e.target.value })}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 focus:outline-none text-[10px] font-bold cursor-pointer"
                      >
                        <option value="name">OCR 'name' (Default)</option>
                        <option value="batch">OCR 'batch'</option>
                        <option value="hsnCode">OCR 'hsnCode'</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Batch Number Map</label>
                      <select
                        value={scannerMapping.batch}
                        onChange={(e) => setScannerMapping({ ...scannerMapping, batch: e.target.value })}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 focus:outline-none text-[10px] font-bold cursor-pointer"
                      >
                        <option value="batch">OCR 'batch' (Default)</option>
                        <option value="name">OCR 'name'</option>
                        <option value="hsnCode">OCR 'hsnCode'</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Quantity Map</label>
                      <select
                        value={scannerMapping.quantity}
                        onChange={(e) => setScannerMapping({ ...scannerMapping, quantity: e.target.value })}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 focus:outline-none text-[10px] font-bold cursor-pointer"
                      >
                        <option value="quantity">OCR 'quantity' (Default)</option>
                        <option value="mrp">OCR 'mrp'</option>
                        <option value="purchasePrice">OCR 'purchasePrice'</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Cost Price Map</label>
                      <select
                        value={scannerMapping.purchasePrice}
                        onChange={(e) => setScannerMapping({ ...scannerMapping, purchasePrice: e.target.value })}
                        className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1 focus:outline-none text-[10px] font-bold cursor-pointer"
                      >
                        <option value="purchasePrice">OCR 'purchasePrice' (Default)</option>
                        <option value="mrp">OCR 'mrp'</option>
                        <option value="quantity">OCR 'quantity'</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Table Header Controls */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-1">
                      Verify Extracted Stock
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Dawaiyon ki lists verify karein aur directly cell me click karke edit karein taaki zero data loss ho.</p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleAddExtractedRow}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[10px] px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-slate-200"
                  >
                    <Plus className="w-3.5 h-3.5 text-slate-500" />
                    Add Row
                  </button>
                </div>

                {/* Main Table */}
                <div className="overflow-x-auto border border-slate-100 rounded-2xl">
                  <table className="w-full border-collapse text-left text-xs font-semibold text-slate-600 min-w-[900px]">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] text-slate-450 uppercase tracking-wider border-b border-slate-150">
                        <th className="p-3">Medicine Name</th>
                        <th className="p-3 w-[100px]">Batch</th>
                        <th className="p-3 w-[85px]">Expiry</th>
                        <th className="p-3 text-center w-[70px]">Qty</th>
                        <th className="p-3 text-right w-[80px]">Cost</th>
                        <th className="p-3 w-[80px]">GST %</th>
                        <th className="p-3 w-[80px]">HSN</th>
                        <th className="p-3 text-right w-[80px]">MRP</th>
                        <th className="p-3 text-right w-[110px]">Margin</th>
                        <th className="p-3 text-center w-[80px]">Status</th>
                        <th className="p-3 text-center w-[50px]">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {isScanning ? (
                        <tr>
                          <td colSpan="11" className="p-12 text-center text-slate-400">
                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                            <p className="font-bold text-xs uppercase tracking-wider">AI reading distributor invoice...</p>
                          </td>
                        </tr>
                      ) : (
                        extractedItems.map((item) => {
                          const itemErrors = validateOcrItem(item);
                          const hasErrors = itemErrors.length > 0;

                          const nameVal = item[scannerMapping.name] || "";
                          const batchVal = item[scannerMapping.batch] || "";
                          const expiryVal = item[scannerMapping.expiryDate] || "";
                          const qtyVal = item[scannerMapping.quantity] || "";
                          const mrpVal = item[scannerMapping.mrp] || "";
                          const costVal = item[scannerMapping.purchasePrice] || "";
                          const hsnVal = item[scannerMapping.hsnCode] || "";
                          const gstVal = item[scannerMapping.gstPercent] || "12";

                          // Dynamic Margin previews
                          const numericMrp = Number(mrpVal) || 0;
                          const numericCost = Number(costVal) || 0;
                          const marginAmt = numericMrp - numericCost;
                          const marginPct = numericCost > 0 ? (marginAmt / numericCost) * 100 : 0;
                          const hasNegativeMargin = marginAmt < 0;

                          return (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-2">
                                <input
                                  type="text"
                                  className={`w-full bg-slate-50 border ${!nameVal.toString().trim() ? "border-rose-400 bg-rose-50/30" : "border-slate-200"} rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 font-black text-slate-800 text-[11px]`}
                                  value={nameVal}
                                  onChange={(e) => handleUpdateExtractedRow(item.id, "name", e.target.value)}
                                  placeholder="Medicine Name"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  className={`w-full bg-slate-50 border ${!batchVal.toString().trim() ? "border-rose-400 bg-rose-50/30" : "border-slate-200"} rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 font-bold text-[11px]`}
                                  value={batchVal}
                                  onChange={(e) => handleUpdateExtractedRow(item.id, "batch", e.target.value)}
                                  placeholder="Batch"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  className={`w-full bg-slate-50 border ${(!expiryVal.toString().trim() || !/^\d{2}\/\d{2}$/.test(expiryVal.toString().trim())) ? "border-rose-400 bg-rose-50/30" : "border-slate-200"} rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 text-center font-bold text-[11px]`}
                                  value={expiryVal}
                                  onChange={(e) => handleUpdateExtractedRow(item.id, "expiryDate", formatExpiryDateInput(e.target.value))}
                                  placeholder="MM/YY"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  className={`w-full bg-slate-50 border ${(isNaN(Number(qtyVal)) || Number(qtyVal) <= 0) ? "border-rose-400 bg-rose-50/30" : "border-slate-200"} rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 text-center font-bold text-[11px] text-blue-600`}
                                  value={qtyVal}
                                  onChange={(e) => handleUpdateExtractedRow(item.id, "quantity", e.target.value)}
                                  placeholder="Qty"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  className={`w-full bg-slate-50 border ${(isNaN(Number(costVal)) || Number(costVal) <= 0 || numericCost > numericMrp) ? "border-rose-400 bg-rose-50/30" : "border-slate-200"} rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 text-right font-bold text-[11px]`}
                                  value={costVal}
                                  onChange={(e) => handleUpdateExtractedRow(item.id, "purchasePrice", e.target.value)}
                                  placeholder="Cost"
                                />
                              </td>
                              <td className="p-2">
                                <select
                                  value={gstVal}
                                  onChange={(e) => {
                                    const percent = e.target.value;
                                    handleUpdateExtractedRow(item.id, "gstPercent", percent);
                                    // Autofill HSN based on GST percent
                                    const hsnMap = { "0": "3006", "5": "3002", "12": "3004", "18": "3808", "28": "3304" };
                                    handleUpdateExtractedRow(item.id, "hsnCode", hsnMap[percent] || "3004");
                                  }}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-1.5 focus:outline-none text-[11px] font-bold cursor-pointer"
                                >
                                  <option value="0">0%</option>
                                  <option value="5">5%</option>
                                  <option value="12">12%</option>
                                  <option value="18">18%</option>
                                  <option value="28">28%</option>
                                </select>
                              </td>
                              <td className="p-2">
                                <input
                                  type="text"
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 text-center font-semibold text-[11px]"
                                  value={hsnVal}
                                  onChange={(e) => handleUpdateExtractedRow(item.id, "hsnCode", e.target.value)}
                                  placeholder="HSN"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  className={`w-full bg-slate-50 border ${(isNaN(Number(mrpVal)) || Number(mrpVal) <= 0) ? "border-rose-400 bg-rose-50/30" : "border-slate-200"} rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 text-right font-bold text-[11px]`}
                                  value={mrpVal}
                                  onChange={(e) => handleUpdateExtractedRow(item.id, "mrp", e.target.value)}
                                  placeholder="MRP"
                                />
                              </td>
                              <td className={`p-3 text-right text-[10px] font-extrabold ${hasNegativeMargin ? "text-rose-500" : "text-emerald-600"}`}>
                                <span>₹{marginAmt.toFixed(2)}</span>
                                <span className="block text-[8px] opacity-75">{marginPct.toFixed(1)}%</span>
                              </td>
                              <td className="p-2 text-center">
                                {hasErrors ? (
                                  <div className="group relative inline-flex justify-center items-center cursor-help">
                                    <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-[9px] font-bold p-2.5 rounded-xl shadow-2xl z-30 whitespace-nowrap leading-relaxed border border-slate-800">
                                      {itemErrors.map((err, i) => (
                                        <p key={i}>• {err}</p>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md uppercase border border-emerald-100">
                                    Ready
                                  </span>
                                )}
                              </td>
                              <td className="p-2 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteExtractedRow(item.id)}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors border-none cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Import Buttons */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider bg-slate-50 px-3 py-1 rounded-md">
                      {extractedItems.length} Medicines ready to import
                    </span>
                    {extractedItems.some(item => validateOcrItem(item).length > 0) && (
                      <span className="text-[10px] text-rose-500 font-extrabold bg-rose-50 border border-rose-100 px-2 py-1 rounded-md uppercase animate-pulse">
                        ⚠️ Validation Errors Found
                      </span>
                    )}
                  </div>
                  
                  <button
                    type="button"
                    onClick={handleImportExtractedData}
                    disabled={loading || extractedItems.length === 0 || extractedItems.some(item => validateOcrItem(item).length > 0)}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all shadow-md shadow-blue-100 flex items-center gap-1.5 cursor-pointer border-none outline-none"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
                    Verify & Import to Inventory
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      )}

      {/* Hidden printable container for barcode label */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', overflow: 'hidden' }}>
        <div ref={printRef}>
          <style type="text/css" media="print">
            {`
              @page { 
                size: ${labelWidth} ${labelHeight}; 
                margin: 0mm !important; 
              }
              body { 
                margin: 0mm !important; 
                padding: 0mm !important; 
              }
              .thermal-label {
                width: ${labelWidth} !important; 
                height: ${labelHeight} !important; 
                page-break-after: always; 
                page-break-inside: avoid;
                display: flex;
                flex-direction: column; 
                justify-content: center; 
                align-items: center;
                box-sizing: border-box; 
                background-color: white;
                overflow: hidden !important; 
                padding: 1.2mm 2.5mm; 
              }
              
              .barcode-wrapper {
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              
              .barcode-wrapper svg {
                max-width: 100% !important; 
                object-fit: contain;
              }

              .thermal-label:last-child { 
                page-break-after: auto; 
              }
            `}
          </style>

          {savedMed && (
            <div className="thermal-label">
              {renderBarcodeLabelContent(savedMed)}
            </div>
          )}
        </div>
      </div>

      {/* Duplicate Batch Alert Modal */}
      {duplicateMed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] md:rounded-[32px] w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-100 flex flex-col font-sans">
            <div className="bg-amber-500 p-4 md:p-5 flex justify-between items-center text-white">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-amber-100 animate-bounce" />
                <h2 className="text-base md:text-lg font-bold tracking-tight">Warning: Duplicate Batch</h2>
              </div>
              <button onClick={() => { setDuplicateMed(null); setDuplicatePayload(null); }} className="bg-white/20 hover:bg-white/30 p-1.5 rounded-full transition-colors cursor-pointer border-none outline-none">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 md:p-6 space-y-4 text-slate-650">
              <p className="text-xs md:text-sm font-bold text-slate-700">
                An entry with the same medicine details already exists in your inventory:
              </p>
              
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2 text-xs md:text-sm font-semibold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Medicine Name:</span>
                  <span className="text-slate-800 font-extrabold">{duplicateMed.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Batch Number:</span>
                  <span className="text-slate-800 font-extrabold">{duplicateMed.batch}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expiry Date:</span>
                  <span className="text-slate-800 font-extrabold">{formatExpiryDate(duplicateMed.expiryDate)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200/80">
                  <span className="text-slate-500">Current Stock:</span>
                  <span className="text-amber-600 font-black text-sm">{duplicateMed.quantity} Pcs/Tabs</span>
                </div>
              </div>

              <p className="text-[11px] md:text-xs text-slate-400 leading-relaxed font-semibold">
                What action would you like to perform? You can merge this new stock quantity into the existing record, create a new separate batch record, or cancel to edit your inputs.
              </p>
            </div>
            
            <div className="p-4 md:p-5 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
              <button 
                onClick={handleMergeQuantity}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-55 text-white py-3 rounded-xl text-xs md:text-sm font-extrabold shadow-md shadow-blue-500/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none outline-none"
              >
                Merge Quantity (+{duplicatePayload?.quantity} Qty)
              </button>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => { setDuplicateMed(null); setDuplicatePayload(null); }}
                  className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateNewBatch}
                  disabled={loading}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-55 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer text-center border-none outline-none"
                >
                  Create New Batch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Success Animation Overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[200] animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100 animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out flex flex-col items-center font-sans">
            
            {/* Lottie-like Checkmark Animation container */}
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-emerald-100 shadow-inner relative animate-bounce mb-6">
              <svg className="w-10 h-10 text-emerald-500 animate-in zoom-in-75 duration-300 delay-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {/* Pulse rings */}
              <div className="absolute inset-0 rounded-full bg-emerald-400 opacity-20 animate-ping animate-duration-1000" />
            </div>

            <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none mb-2">
              ✔ Purchase Saved
            </h3>
            
            <p className="text-sm font-semibold text-slate-500">
              {successOverlayCount} {successOverlayCount === 1 ? "Medicine Added" : "Medicines Added"}
            </p>

            {successOverlayMsg && (
              <span className="mt-3 text-xs bg-slate-50 text-slate-600 px-3.5 py-1.5 rounded-full border border-slate-150 font-bold max-w-full truncate">
                {successOverlayMsg}
              </span>
            )}
            
            <button
              onClick={() => setShowSuccessOverlay(false)}
              className="mt-6 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-widest py-3.5 rounded-xl shadow-lg shadow-emerald-500/10 transition-all cursor-pointer border-none outline-none"
            >
              Okay, Awesome
            </button>
          </div>
        </div>
      )}
    </div>
  );
}