"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Loader2,
  Store,
  Calendar,
  FileText,
  CheckCircle,
  Users,
  DollarSign,
  Layers,
  CreditCard,
  Search,
  BookOpen,
  MapPin,
  Phone,
  AlertTriangle,
  User,
  Info,
  Clock
} from "lucide-react";

export default function ExportPrintPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeTab, setActiveTab] = useState("overview");
  const [printMode, setPrintMode] = useState("current"); // 'current' or 'all'

  // On-screen filter states
  const [medSearch, setMedSearch] = useState("");
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [creditSearch, setCreditSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/user/profile/export-raw");
        const resData = await res.json();
        if (resData.success) {
          setData(resData);
        } else {
          setError(resData.error || "Failed to load store data.");
        }
      } catch (err) {
        setError("Network or server connection failed.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handlePrint = (mode) => {
    setPrintMode(mode);
    // Give the browser 300ms to render the full DOM if we are printing all tabs
    const delay = mode === "all" ? 300 : 100;
    setTimeout(() => {
      window.print();
      setPrintMode("current");
    }, delay);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-500">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-4" />
        <p className="font-bold text-base text-slate-800">Assembling Compliance Ledger Book...</p>
        <p className="text-xs text-slate-500 mt-2 text-center max-w-xs">Consolidating medicines, billing sales, wholesalers, and credit accounts.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-rose-50 border border-rose-200 rounded-3xl flex items-center justify-center text-rose-600 mb-4">
          <ArrowLeft className="w-8 h-8" />
        </div>
        <h1 className="text-lg font-bold text-slate-800">Export Ledger Generation Failed</h1>
        <p className="text-slate-500 text-xs mt-1 max-w-sm">{error}</p>
        <Link
          href="/profile"
          className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-md"
        >
          Return to Profile Settings
        </Link>
      </div>
    );
  }

  const { user, medicines = [], sales = [], customers = [], distributors = [] } = data;

  // Consolidate Wholesalers / Distributors list
  const consolidatedDistributors = [...(distributors || [])];
  const uniqueMedDists = Array.from(new Set(medicines.map((m) => m.distributor?.trim()).filter(Boolean)));
  
  uniqueMedDists.forEach((name) => {
    const exists = consolidatedDistributors.some((d) => d.name.toLowerCase() === name.toLowerCase());
    if (!exists) {
      consolidatedDistributors.push({
        name,
        phone: "N/A",
        address: "N/A",
      });
    }
  });

  // Attach active items counts
  consolidatedDistributors.forEach((d) => {
    d.itemsCount = medicines.filter((m) => m.distributor?.trim().toLowerCase() === d.name.toLowerCase()).length;
  });

  // Sort by item count desc
  consolidatedDistributors.sort((a, b) => b.itemsCount - a.itemsCount || a.name.localeCompare(b.name));

  // Compute metrics
  const totalStockItems = medicines.reduce((acc, curr) => acc + (curr.quantity || 0), 0);
  const totalSalesVolume = sales.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
  const totalOutstandingUdhar = customers.reduce((acc, curr) => acc + (curr.balance || 0), 0);
  const activeDebtors = customers.filter((c) => (c.balance || 0) > 0).length;

  // Search filtering logic
  const filteredMedicines = medicines.filter(
    (m) =>
      m.name?.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.batch?.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.barcodeId?.toLowerCase().includes(medSearch.toLowerCase()) ||
      m.distributor?.toLowerCase().includes(medSearch.toLowerCase())
  );

  const filteredSales = sales.filter(
    (s) =>
      s.billNumber?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      s._id?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      s.customerName?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
      s.customerPhone?.toLowerCase().includes(invoiceSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(creditSearch.toLowerCase()) ||
      c.phone?.toLowerCase().includes(creditSearch.toLowerCase())
  );

  // Split large data sets into smaller chunks to prevent browser layout engine crashes
  const chunkArray = (arr, size) => {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const medicineChunks = chunkArray(filteredMedicines, 100);
  const salesChunks = chunkArray(filteredSales, 50);
  const distributorChunks = chunkArray(consolidatedDistributors, 100);

  // Selective rendering check for rendering optimization
  const shouldRenderSection = (sectionName) => {
    return printMode === "all" || activeTab === sectionName;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* 1. Header Navigation Bar (Hidden during printing) */}
      <div className="print:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/profile"
            className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl transition-all flex items-center justify-center shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-extrabold text-slate-900 leading-tight flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-600" />
              <span>{user?.shopName || "MedERP"} Compliance Ledger Book</span>
            </h1>
            <p className="text-[10px] text-indigo-650 font-bold uppercase tracking-wider mt-0.5">DPDP Data Portability Console</p>
          </div>
        </div>

        {/* Action Group */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePrint("current")}
            className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-500/10 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-indigo-200" /> Print Current Tab
          </button>
          <button
            onClick={() => handlePrint("all")}
            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 active:scale-98 text-slate-100 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-slate-300" /> Print Full Booklet
          </button>
        </div>
      </div>

      {/* 2. Interactive Screen Tab Selector (Hidden during printing) */}
      <div className="print:hidden pt-24 pb-4 max-w-5xl mx-auto px-4">
        <div className="bg-slate-200/80 p-1.5 rounded-2xl border border-slate-300/60 flex flex-wrap gap-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-1 justify-center cursor-pointer ${
              activeTab === "overview"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-650 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Info className="w-4 h-4" /> Overview
          </button>
          <button
            onClick={() => setActiveTab("medicines")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-1 justify-center cursor-pointer ${
              activeTab === "medicines"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-650 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" /> Medicines ({medicines.length})
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-1 justify-center cursor-pointer ${
              activeTab === "invoices"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-650 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FileText className="w-4 h-4" /> Invoices ({sales.length})
          </button>
          <button
            onClick={() => setActiveTab("distributors")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-1 justify-center cursor-pointer ${
              activeTab === "distributors"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-650 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" /> Wholesalers ({consolidatedDistributors.length})
          </button>
          <button
            onClick={() => setActiveTab("credit")}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-1 justify-center cursor-pointer ${
              activeTab === "credit"
                ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/10"
                : "text-slate-650 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <CreditCard className="w-4 h-4" /> Credit Accounts ({customers.length})
          </button>
        </div>

        {/* Search Bars for Active Tab (Screen view only) */}
        <div className="mt-4">
          {activeTab === "medicines" && (
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-450" />
              <input
                type="text"
                placeholder="Search stock by medicine name, batch number, distributor, or barcode..."
                value={medSearch}
                onChange={(e) => setMedSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-455 focus:outline-none focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          )}
          {activeTab === "invoices" && (
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-450" />
              <input
                type="text"
                placeholder="Search bills by invoice number, ID, customer name, or phone number..."
                value={invoiceSearch}
                onChange={(e) => setInvoiceSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-455 focus:outline-none focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          )}
          {activeTab === "credit" && (
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-450" />
              <input
                type="text"
                placeholder="Search ledger debtors by customer name or phone number..."
                value={creditSearch}
                onChange={(e) => setCreditSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-455 focus:outline-none focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          )}
        </div>
      </div>

      {/* 3. Main Printable Wrapper */}
      <div className={`print-container max-w-5xl mx-auto px-4 pb-12 pt-4 screen-show-${activeTab} print-mode-${printMode} print-show-${activeTab}`}>
        
        {/* ============================================================== */}
        {/* SECTION A: BOOKLET COVER / OVERVIEW */}
        {/* ============================================================== */}
        {shouldRenderSection("overview") && (
          <div className="print-section print-section-overview bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm print:bg-white print:border-none print:shadow-none print:p-0 print:border-b-2 print:border-slate-800 print:rounded-none page-break-inside-avoid">
            {/* Shop Header */}
            <div className="flex justify-between items-start flex-wrap gap-4 border-b border-slate-200 pb-6">
              <div>
                <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl print:bg-black print:text-white shrink-0">
                  M
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-4 tracking-tight">
                  {user?.shopName || "MedERP"} Ledger Book
                </h2>
                <p className="text-xs text-indigo-600 print:text-slate-500 font-bold uppercase tracking-wider mt-1">
                  Store Compliance Data Portability Record
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 space-y-1">
                <p className="font-bold text-slate-700">Export Date: {new Date().toLocaleDateString("en-IN")}</p>
                <p>Consent: Accepted (v1.0)</p>
                {user?.consentTimestamp && (
                  <p className="text-[10px] text-slate-500">Log Date: {new Date(user.consentTimestamp).toLocaleString("en-IN")}</p>
                )}
              </div>
            </div>

            {/* Shop Credentials & Owner Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 print:text-slate-455 uppercase tracking-widest">Pharmacy Info</h3>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="font-black text-slate-800 text-sm">{user?.shopName || "N/A"}</p>
                  <p className="font-semibold">{user?.name || "N/A"} (Registered Pharmacist/Owner)</p>
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {user?.address || "N/A"}</p>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 print:text-slate-455 uppercase tracking-widest">Registered Contacts</h3>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Phone: {user?.phoneNumber || "N/A"}</p>
                  <p className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Email: {user?.email || "N/A"}</p>
                  <p className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Status: India DPDP Compliant Data Export</p>
                </div>
              </div>
            </div>

            {/* Warning notice */}
            <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl text-[11px] text-slate-700 leading-relaxed font-medium print:bg-slate-55 print:border-slate-200 print:text-slate-600">
              <strong>⚠️ Legal Portability Archival Notice:</strong> This offline booklet represents the complete structural database record of your store inventory, billing records, wholesale suppliers list, and credit balances. Store this securely for auditing compliance, business transfer validation, or offline business continuity.
            </div>

            {/* Metrics summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl print:border print:border-slate-200 print:bg-white text-center shadow-sm">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Medicines Stock</p>
                <h4 className="text-xl font-extrabold text-slate-800 mt-1">{totalStockItems} pcs</h4>
                <p className="text-[9px] text-slate-555 font-medium mt-0.5">{medicines.length} Batch Codes</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl print:border print:border-slate-200 print:bg-white text-center shadow-sm">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sales Recorded</p>
                <h4 className="text-xl font-extrabold text-slate-800 mt-1">₹{totalSalesVolume.toLocaleString("en-IN")}</h4>
                <p className="text-[9px] text-slate-555 font-medium mt-0.5">{sales.length} Bills Issued</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl print:border print:border-slate-200 print:bg-white text-center shadow-sm">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Credit Outstanding</p>
                <h4 className="text-xl font-extrabold text-amber-600 mt-1">₹{totalOutstandingUdhar.toLocaleString("en-IN")}</h4>
                <p className="text-[9px] text-slate-555 font-medium mt-0.5">{activeDebtors} Active Accounts</p>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-2xl print:border print:border-slate-200 print:bg-white text-center shadow-sm">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Wholesalers</p>
                <h4 className="text-xl font-extrabold text-slate-800 mt-1">{consolidatedDistributors.length}</h4>
                <p className="text-[9px] text-slate-555 font-medium mt-0.5">Supplier Directory</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION B: MEDICINE STOCK AND BARCODES */}
        {/* ============================================================== */}
        {shouldRenderSection("medicines") && (
          <div className="print-section print-section-medicines space-y-6 pt-4">
            {/* Header */}
            <div className="border-b border-slate-200 pb-3 flex justify-between items-end">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 print:text-black uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600 print:hidden" />
                  <span>Section 1: Medicine Stock & Barcode Registry</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                  Total Matches: {filteredMedicines.length} of {medicines.length} batches
                </p>
              </div>
              <div className="text-right print:hidden">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Tabbed PDF Mode ready</span>
              </div>
            </div>

            {filteredMedicines.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 print:border-slate-100 shadow-sm">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No matching medicines found in inventory data.</p>
              </div>
            ) : (
              medicineChunks.map((chunk, chunkIdx) => (
                <div key={chunkIdx} className="bg-white rounded-2xl border border-slate-200 p-4 print:bg-white print:border-none print:p-0 chunked-table page-break-inside-avoid shadow-sm">
                  {medicineChunks.length > 1 && (
                    <p className="print:hidden text-[9px] text-slate-500 font-bold uppercase mb-2">
                      Batch Part {chunkIdx + 1} of {medicineChunks.length}
                    </p>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase text-[9px] font-extrabold tracking-wider">
                          <th className="p-2.5 border border-slate-200">Name</th>
                          <th className="p-2.5 border border-slate-200 text-center">Batch No</th>
                          <th className="p-2.5 border border-slate-200 text-center font-bold">Qty (Units)</th>
                          <th className="p-2.5 border border-slate-200 text-right">MRP (₹)</th>
                          <th className="p-2.5 border border-slate-200 text-right">P.Price (₹)</th>
                          <th className="p-2.5 border border-slate-200 text-center">Expiry</th>
                          <th className="p-2.5 border border-slate-200">Distributor</th>
                          <th className="p-2.5 border border-slate-200 text-center">Barcode ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {chunk.map((med, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                            <td className="p-2.5 border border-slate-100 font-extrabold text-slate-900 truncate max-w-[150px]">{med.name}</td>
                            <td className="p-2.5 border border-slate-100 text-center font-mono text-[10px] text-slate-600">{med.batch}</td>
                            <td className={`p-2.5 border border-slate-100 text-center font-extrabold ${med.quantity <= 10 ? 'text-rose-600' : 'text-slate-800'}`}>
                              {med.quantity}
                            </td>
                            <td className="p-2.5 border border-slate-100 text-right">₹{med.mrp || "0"}</td>
                            <td className="p-2.5 border border-slate-100 text-right text-slate-600">₹{med.purchasePrice || "0"}</td>
                            <td className="p-2.5 border border-slate-100 text-center font-mono">
                              {med.expiryDate ? new Date(med.expiryDate).toLocaleDateString("en-GB", { month: "2-digit", year: "2-digit" }) : "N/A"}
                            </td>
                            <td className="p-2.5 border border-slate-100 text-slate-600 truncate max-w-[130px]">{med.distributor || "N/A"}</td>
                            <td className="p-2.5 border border-slate-100 text-center font-mono text-[9px] select-all">{med.barcodeId || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION C: INVOICES AND BILLING HISTORY */}
        {/* ============================================================== */}
        {shouldRenderSection("invoices") && (
          <div className="print-section print-section-invoices space-y-6 pt-4">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-end">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 print:text-black uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600 print:hidden" />
                  <span>Section 2: Bill Invoices & Sales Ledger</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                  Total Matches: {filteredSales.length} of {sales.length} transactions
                </p>
              </div>
            </div>

            {filteredSales.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 print:border-slate-100 shadow-sm">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No sales transactions match your current search.</p>
              </div>
            ) : (
              salesChunks.map((chunk, chunkIdx) => (
                <div key={chunkIdx} className="bg-white rounded-2xl border border-slate-200 p-4 print:bg-white print:border-none print:p-0 chunked-table page-break-inside-avoid shadow-sm">
                  {salesChunks.length > 1 && (
                    <p className="print:hidden text-[9px] text-slate-500 font-bold uppercase mb-2">
                      Bills Part {chunkIdx + 1} of {salesChunks.length}
                    </p>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase text-[9px] font-extrabold tracking-wider">
                          <th className="p-2.5 border border-slate-200">Date & Time</th>
                          <th className="p-2.5 border border-slate-200 text-center">Invoice No</th>
                          <th className="p-2.5 border border-slate-200 text-center">Method</th>
                          <th className="p-2.5 border border-slate-200">Customer Details</th>
                          <th className="p-2.5 border border-slate-200">Purchased Items</th>
                          <th className="p-2.5 border border-slate-200 text-right">Invoice Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {chunk.map((sale, idx) => (
                          <tr key={idx} className="hover:bg-slate-55/50 print:hover:bg-transparent">
                            <td className="p-2.5 border border-slate-100 text-slate-650 font-mono text-[10px]">
                              {new Date(sale.date || sale.createdAt).toLocaleString("en-IN", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false
                              })}
                            </td>
                            <td className="p-2.5 border border-slate-100 text-center font-mono font-bold text-slate-900">
                              {sale.billNumber || (sale._id ? sale._id.slice(-8).toUpperCase() : "N/A")}
                            </td>
                            <td className="p-2.5 border border-slate-100 text-center">
                              <span className="bg-slate-100 text-slate-700 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] font-extrabold print:border-none print:bg-transparent print:p-0 print:text-slate-900">
                                {sale.paymentMethod || "Cash"}
                              </span>
                            </td>
                            <td className="p-2.5 border border-slate-100 truncate max-w-[150px]">
                              {sale.customerName ? (
                                <div>
                                  <p className="font-extrabold text-slate-800">{sale.customerName}</p>
                                  {sale.customerPhone && <p className="text-[9px] text-slate-500 font-semibold">{sale.customerPhone}</p>}
                                </div>
                              ) : (
                                <span className="text-slate-500 italic font-normal">Walk-in Customer</span>
                              )}
                            </td>
                            <td className="p-2.5 border border-slate-100 text-[10px] max-w-[280px]">
                              <ul className="list-disc list-inside space-y-0.5 text-slate-655 leading-normal">
                                {sale.items?.map((item, itemIdx) => (
                                  <li key={itemIdx} className="truncate">
                                    <span className="font-bold text-slate-800">{item.name}</span> x{item.quantity} (@₹{item.mrp || 0})
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="p-2.5 border border-slate-100 text-right font-black text-slate-900 text-sm">
                              ₹{sale.totalAmount?.toLocaleString("en-IN") || "0"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION D: WHOLESALERS DIRECTORY */}
        {/* ============================================================== */}
        {shouldRenderSection("distributors") && (
          <div className="print-section print-section-distributors space-y-6 pt-4">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-end">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 print:text-black uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600 print:hidden" />
                  <span>Section 3: Wholesalers & Suppliers Directory</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                  Total Wholesalers: {consolidatedDistributors.length} companies
                </p>
              </div>
            </div>

            {consolidatedDistributors.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 print:border-slate-100 shadow-sm">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No registered wholesale suppliers listed in database.</p>
              </div>
            ) : (
              distributorChunks.map((chunk, chunkIdx) => (
                <div key={chunkIdx} className="bg-white rounded-2xl border border-slate-200 p-4 print:bg-white print:border-none print:p-0 chunked-table page-break-inside-avoid shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase text-[9px] font-extrabold tracking-wider">
                          <th className="p-3 border border-slate-200 w-12 text-center">S.No</th>
                          <th className="p-3 border border-slate-200 font-bold">Wholesale Supplier / Agency Name</th>
                          <th className="p-3 border border-slate-200">Contact Number</th>
                          <th className="p-3 border border-slate-200">Office Address</th>
                          <th className="p-3 border border-slate-200 text-center font-bold">Products Linked</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {chunk.map((dist, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                            <td className="p-3 border border-slate-100 text-center font-mono text-slate-500">{chunkIdx * 100 + idx + 1}</td>
                            <td className="p-3 border border-slate-100 font-extrabold text-slate-900">{dist.name}</td>
                            <td className="p-3 border border-slate-100 font-mono text-slate-600">{dist.phone || "N/A"}</td>
                            <td className="p-3 border border-slate-100 text-slate-600 truncate max-w-[200px]" title={dist.address}>{dist.address || "N/A"}</td>
                            <td className="p-3 border border-slate-100 text-center font-extrabold text-indigo-600 print:text-black">
                              {dist.itemsCount || 0} items
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* SECTION E: CREDIT ACCOUNTS (KHATA / UDHAR) */}
        {/* ============================================================== */}
        {shouldRenderSection("credit") && (
          <div className="print-section print-section-credit space-y-8 pt-4">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-end">
              <div>
                <h3 className="text-lg font-extrabold text-slate-800 print:text-black uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600 print:hidden" />
                  <span>Section 4: Credit Customer Accounts Ledger (Khata Udhar)</span>
                </h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">
                  Total Accounts: {customers.length} debtor entries (Outstanding: ₹{totalOutstandingUdhar.toLocaleString("en-IN")})
                </p>
              </div>
            </div>

            {/* Sub-tab introduction metrics */}
            <div className="print:hidden grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Outstanding Udhar</p>
                  <p className="text-lg font-extrabold text-slate-900">₹{totalOutstandingUdhar.toLocaleString("en-IN")}</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Debtors</p>
                  <p className="text-lg font-extrabold text-slate-900">{activeDebtors} / {customers.length} Customers</p>
                </div>
              </div>
              <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Unsettled accounts</p>
                  <p className="text-lg font-extrabold text-slate-900">
                    {customers.filter(c => c.balance > 0).length} Overdue/Active
                  </p>
                </div>
              </div>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl text-center border border-slate-200 print:border-slate-100 shadow-sm">
                <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No customer ledger accounts match your current query.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Credit customers overview table */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 print:bg-white print:border-none print:p-0 page-break-inside-avoid shadow-sm">
                  <h4 className="text-xs font-bold text-slate-500 print:text-slate-800 uppercase tracking-widest mb-3">Customer Balance Sheet Overview</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase text-[9px] font-extrabold tracking-wider">
                          <th className="p-2.5 border border-slate-200">Name</th>
                          <th className="p-2.5 border border-slate-200">Phone</th>
                          <th className="p-2.5 border border-slate-200 text-right">Credit Limit (₹)</th>
                          <th className="p-2.5 border border-slate-200 text-right">Outstanding (₹)</th>
                          <th className="p-2.5 border border-slate-200 text-center">Promise Date</th>
                          <th className="p-2.5 border border-slate-200 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        {filteredCustomers.map((cust, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                            <td className="p-2.5 border border-slate-100 font-extrabold text-slate-900">{cust.name}</td>
                            <td className="p-2.5 border border-slate-100 font-mono text-[10px] text-slate-600">{cust.phone}</td>
                            <td className="p-2.5 border border-slate-100 text-right">₹{(cust.creditLimit || 10000).toLocaleString("en-IN")}</td>
                            <td className={`p-2.5 border border-slate-100 text-right font-black ${cust.balance > 0 ? 'text-amber-600 print:text-amber-700' : 'text-slate-500'}`}>
                              ₹{(cust.balance || 0).toLocaleString("en-IN")}
                            </td>
                            <td className="p-2.5 border border-slate-100 text-center font-mono text-[10px]">
                              {cust.promiseDate ? new Date(cust.promiseDate).toLocaleDateString("en-IN") : "N/A"}
                            </td>
                            <td className="p-2.5 border border-slate-100 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider font-extrabold ${cust.balance > 0 ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                {cust.balance > 0 ? 'Due' : 'Clear'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Comprehensive individual ledger sheets (Page-break optimization included) */}
                <div className="space-y-6">
                  <h4 className="text-xs font-bold text-slate-500 print:text-slate-800 uppercase tracking-widest mb-1 print:border-b-2 print:border-slate-800 print:pb-1">
                    Individual Ledger Transactions Statement
                  </h4>
                  
                  {filteredCustomers.map((cust, idx) => {
                    const txList = cust.transactions || [];
                    return (
                      <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-6 print:bg-white print:border print:border-slate-350 print:rounded-none page-break-inside-avoid shadow-sm space-y-4">
                        
                        {/* Customer Title Card Header */}
                        <div className="flex justify-between items-start border-b border-slate-150 pb-3">
                          <div>
                            <h5 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                              <User className="w-4 h-4 text-indigo-600 shrink-0 print:hidden" />
                              <span>{cust.name}</span>
                            </h5>
                            <p className="text-[11px] text-slate-600 font-semibold mt-0.5">Phone: {cust.phone}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-[8px] tracking-wider uppercase font-extrabold px-2 py-0.5 rounded-full border ${cust.balance > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                              {cust.balance > 0 ? 'Active Debt Ledger' : 'Fully Settled'}
                            </span>
                            <p className="text-base font-black text-slate-900 mt-1">₹{(cust.balance || 0).toLocaleString("en-IN")}</p>
                          </div>
                        </div>

                        {/* Detail values */}
                        <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                          <div>
                            <p className="text-slate-500 text-[9px] uppercase tracking-widest">Credit limit & usage</p>
                            <p className="text-slate-800 mt-0.5">₹{(cust.creditLimit || 10000).toLocaleString("en-IN")}</p>
                            
                            {/* Credit visual usage bar */}
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${cust.balance / (cust.creditLimit || 10000) > 0.85 ? 'bg-rose-500' : 'bg-indigo-600'}`}
                                style={{ width: `${Math.min(100, ((cust.balance || 0) / (cust.creditLimit || 10000)) * 100)}%` }}
                              />
                            </div>
                          </div>
                          <div>
                            <p className="text-slate-500 text-[9px] uppercase tracking-widest">Promise date</p>
                            <p className={`mt-0.5 font-bold ${cust.promiseDate && new Date(cust.promiseDate) < new Date() ? 'text-rose-600 font-extrabold' : 'text-slate-700'}`}>
                              {cust.promiseDate ? new Date(cust.promiseDate).toLocaleDateString("en-IN") : "No payment promise logged"}
                            </p>
                          </div>
                        </div>

                        {/* Transactions table */}
                        <div className="pt-2">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Chronological Account Statement</p>
                          {txList.length === 0 ? (
                            <p className="text-[11px] text-slate-500 italic mt-1">No transaction history exists for this client account.</p>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-650 uppercase text-[8px] tracking-wider font-extrabold">
                                    <th className="p-2 border border-slate-200">Transaction Date</th>
                                    <th className="p-2 border border-slate-200 text-center font-bold">Type</th>
                                    <th className="p-2 border border-slate-200 text-right">Debit/Credit Value</th>
                                    <th className="p-2 border border-slate-200">Ledger Entry Note</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                                  {txList.map((tx, txIdx) => (
                                    <tr key={txIdx} className="hover:bg-slate-55/50 print:hover:bg-transparent">
                                      <td className="p-2 border border-slate-100 font-mono text-[9.5px]">
                                        {new Date(tx.date).toLocaleDateString("en-IN")} {new Date(tx.date).toLocaleTimeString("en-IN", {hour: "2-digit", minute:"2-digit"})}
                                      </td>
                                      <td className="p-2 border border-slate-100 text-center font-bold">
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold ${
                                          tx.type === 'Sale' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                          tx.type === 'Payment' ? 'bg-green-50 text-green-700 border border-green-100' :
                                          'bg-amber-50 text-amber-700 border border-amber-200'
                                        }`}>
                                          {tx.type}
                                        </span>
                                      </td>
                                      <td className={`p-2 border border-slate-100 text-right font-black ${tx.type === 'Payment' ? 'text-green-600' : 'text-slate-850'}`}>
                                        {tx.type === 'Payment' ? '-' : '+'}₹{tx.amount.toLocaleString("en-IN")}
                                      </td>
                                      <td className="p-2 border border-slate-100 text-slate-600 text-[10px] leading-relaxed">
                                        {tx.note || "N/A"} {tx.saleId ? `(Bill Reference: #${tx.saleId.slice(-6).toUpperCase()})` : ""}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* GLOBAL PRINT COMPLIANCE FOOTER */}
        {/* ============================================================== */}
        <div className="hidden print:block text-[9.5px] text-slate-500 border-t border-slate-300 pt-5 text-center leading-relaxed font-semibold mt-10 page-break-inside-avoid">
          <p>This certified offline book registry is compiled instantly under standard DPDP Data Portability rights.</p>
          <p className="mt-0.5">DevSamp MedERP © {new Date().getFullYear()} | Secure Offline Archive Booklet v1.0</p>
        </div>

      </div>

      {/* 4. Complete Print stylesheets to manage page breaks and isolated tabs */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        
        /* 1. Normal screen display: hide print-sections that aren't active */
        @media screen {
          .print-section {
            display: none !important;
          }
          .screen-show-overview .print-section-overview {
            display: block !important;
          }
          .screen-show-medicines .print-section-medicines {
            display: block !important;
          }
          .screen-show-invoices .print-section-invoices {
            display: block !important;
          }
          .screen-show-distributors .print-section-distributors {
            display: block !important;
          }
          .screen-show-credit .print-section-credit {
            display: block !important;
          }
        }

        /* 2. Page breaking and table sizing print settings */
        @media print {
          body, html, #__next {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: 'Plus Jakarta Sans', 'Outfit', sans-serif !important;
            font-size: 10px !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Hide all screen components */
          .print\\:hidden, header, nav, footer, button, input, .lucide {
            display: none !important;
          }

          /* Force wrapper to zero margins */
          .print-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          /* Default print-hiding for tab segregation */
          .print-mode-current .print-section {
            display: none !important;
          }

          /* Show only the active print tab in current print mode */
          .print-mode-current.print-show-overview .print-section-overview {
            display: block !important;
          }
          .print-mode-current.print-show-medicines .print-section-medicines {
            display: block !important;
          }
          .print-mode-current.print-show-invoices .print-section-invoices {
            display: block !important;
          }
          .print-mode-current.print-show-distributors .print-section-distributors {
            display: block !important;
          }
          .print-mode-current.print-show-credit .print-section-credit {
            display: block !important;
          }

          /* Show all sections in 'all' booklet print mode */
          .print-mode-all .print-section {
            display: block !important;
            margin-bottom: 30px !important;
            page-break-after: always !important;
          }
          .print-mode-all .print-section:last-child {
            page-break-after: avoid !important;
            margin-bottom: 0 !important;
          }

          /* Clean layout structures, NO flex grid in print view to prevent chromium crashes */
          .page-break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          .chunked-table {
            margin-bottom: 15px !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: 1px solid #cbd5e1 !important;
            border-radius: 0px !important;
          }

          table {
            page-break-inside: auto !important;
            width: 100% !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
          th, td {
            border: 1px solid #cbd5e1 !important;
            padding: 6px !important;
            color: #000000 !important;
            font-size: 9px !important;
            word-wrap: break-word !important;
          }
          
          /* Force colors output */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}
