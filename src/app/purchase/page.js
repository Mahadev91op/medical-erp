"use client";

import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import {
  PackagePlus,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  Command,
  HelpCircle
} from "lucide-react";

import ManualIntakeTab from "./components/ManualIntakeTab";
import ExcelImportTab from "./components/ExcelImportTab";
import AiOcrScannerTab from "./components/AiOcrScannerTab";
import RecentPurchasesDrawer from "./components/RecentPurchasesDrawer";

function getTodayDateString() {
  const d = new Date();
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getTodayInputString() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

function formatExpiryDateInput(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

function formatPurchaseDateInput(value) {
  const digits = value.replace(/\D/g, "");
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 6)}`;
}

export default function PurchaseEntry() {
  const [importMode, setImportMode] = useState("manual"); // 'manual', 'bulk', 'ai-scan'
  const [distributors, setDistributors] = useState([]);

  // Persistent States Across Tab Switches
  const [manualStagedItems, setManualStagedItems] = useState([]);
  const [uploadedInvoice, setUploadedInvoice] = useState(null);
  const [uploadedInvoiceName, setUploadedInvoiceName] = useState("");
  const [extractedItems, setExtractedItems] = useState([]);
  const [ocrDistributor, setOcrDistributor] = useState("");
  const [ocrBillNumber, setOcrBillNumber] = useState("");
  const [ocrPurchaseDate, setOcrPurchaseDate] = useState(getTodayInputString());
  
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [successOverlayCount, setSuccessOverlayCount] = useState(0);
  const [successOverlayMsg, setSuccessOverlayMsg] = useState("");

  // Side Panel State
  const [isRecentDrawerOpen, setIsRecentDrawerOpen] = useState(false);

  useEffect(() => {
    async function fetchDistributors() {
      try {
        const res = await fetch("/api/distributor");
        if (!res.ok) return;
        const data = await res.json();
        if (data.success) {
          const list = data.contacts || data.distributors || [];
          setDistributors(list.map(d => d.name || d.distributorName || d));
        }
      } catch (err) {
        console.error("Failed to load distributors:", err);
      }
    }
    fetchDistributors();
  }, []);

  // Global Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl + S (Save / Add)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        toast("Keyboard Shortcut [Ctrl+S] Triggered", { icon: "⌨️" });
      }
      // Ctrl + N (New Entry / Focus Medicine Name)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        setImportMode("manual");
        toast("Keyboard Shortcut [Ctrl+N] Manual Entry Focus", { icon: "⌨️" });
      }
      // Esc (Reset / Clear)
      if (e.key === "Escape") {
        toast("Keyboard Shortcut [ESC] Reset", { icon: "⌨️" });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Handle Duplicate Item from Recent Log
  const handleDuplicateRecentItem = (item) => {
    const duplicated = {
      id: Date.now() + Math.random(),
      name: item.name,
      batch: `${item.batch}-COPY`,
      expiryDate: item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' }) : "12/26",
      quantity: item.quantity || 1,
      freeQty: 0,
      mrp: item.mrp || 0,
      purchasePrice: item.purchasePrice || 0,
      hsnCode: item.hsnCode || "3004",
      gstPercent: item.gstPercent || 12,
      rackNumber: item.rackNumber || "",
      distributor: item.distributor || "Generic Distributor",
      billNumber: item.billNumber || "BILL-GEN",
      purchaseDate: getTodayInputString()
    };

    setManualStagedItems(prev => [...prev, duplicated]);
    setImportMode("manual");
    toast.success(`Duplicated ${item.name} into Manual Staging Table!`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16">
      <Toaster position="top-right" />

      {/* 🚀 Success Overlay Modal */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-xl">Stock Saved Successfully!</h3>
              <p className="text-sm font-bold text-emerald-600 mt-1">{successOverlayMsg}</p>
              <p className="text-xs text-slate-400 mt-0.5">{successOverlayCount} Items added to inventory</p>
            </div>
          </div>
        </div>
      )}

      {/* Today's Intake Log Side Panel Drawer */}
      <RecentPurchasesDrawer
        isOpen={isRecentDrawerOpen}
        onToggle={() => setIsRecentDrawerOpen(!isRecentDrawerOpen)}
        onDuplicateItem={handleDuplicateRecentItem}
        toast={toast}
      />

      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Navigation Tabs Header */}
        <div className="bg-white p-2.5 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap sm:flex-nowrap gap-2">
          <button
            type="button"
            onClick={() => setImportMode("manual")}
            className={`flex-1 py-3.5 px-4 rounded-2xl font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border-none outline-none ${
              importMode === "manual"
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <PackagePlus className="w-4 h-4" />
            1. Manual Bill Staging Entry
            {manualStagedItems.length > 0 && (
              <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
                {manualStagedItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setImportMode("bulk")}
            className={`flex-1 py-3.5 px-4 rounded-2xl font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border-none outline-none ${
              importMode === "bulk"
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            2. Excel / CSV Migration
          </button>

          <button
            type="button"
            onClick={() => setImportMode("ai-scan")}
            className={`flex-1 py-3.5 px-4 rounded-2xl font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border-none outline-none ${
              importMode === "ai-scan"
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-200"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
            3. AI Invoice OCR Scanner
            {extractedItems.length > 0 && (
              <span className="bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-full ml-1">
                {extractedItems.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Views with Persistent State */}
        {importMode === "manual" && (
          <ManualIntakeTab
            distributors={distributors}
            setDistributors={setDistributors}
            manualStagedItems={manualStagedItems}
            setManualStagedItems={setManualStagedItems}
            setSuccessOverlayCount={setSuccessOverlayCount}
            setSuccessOverlayMsg={setSuccessOverlayMsg}
            setShowSuccessOverlay={setShowSuccessOverlay}
            formatExpiryDateInput={formatExpiryDateInput}
            formatPurchaseDateInput={formatPurchaseDateInput}
            getTodayInputString={getTodayInputString}
            toast={toast}
          />
        )}

        {importMode === "bulk" && (
          <ExcelImportTab
            distributors={distributors}
            toast={toast}
            setSuccessOverlayCount={setSuccessOverlayCount}
            setSuccessOverlayMsg={setSuccessOverlayMsg}
            setShowSuccessOverlay={setShowSuccessOverlay}
            getTodayDateString={getTodayDateString}
          />
        )}

        {importMode === "ai-scan" && (
          <AiOcrScannerTab
            distributors={distributors}
            setDistributors={setDistributors}
            uploadedInvoice={uploadedInvoice}
            setUploadedInvoice={setUploadedInvoice}
            uploadedInvoiceName={uploadedInvoiceName}
            setUploadedInvoiceName={setUploadedInvoiceName}
            extractedItems={extractedItems}
            setExtractedItems={setExtractedItems}
            ocrDistributor={ocrDistributor}
            setOcrDistributor={setOcrDistributor}
            ocrBillNumber={ocrBillNumber}
            setOcrBillNumber={setOcrBillNumber}
            ocrPurchaseDate={ocrPurchaseDate}
            setOcrPurchaseDate={setOcrPurchaseDate}
            setSuccessOverlayCount={setSuccessOverlayCount}
            setSuccessOverlayMsg={setSuccessOverlayMsg}
            setShowSuccessOverlay={setShowSuccessOverlay}
            getTodayInputString={getTodayInputString}
            formatExpiryDateInput={formatExpiryDateInput}
            formatPurchaseDateInput={formatPurchaseDateInput}
            toast={toast}
          />
        )}
      </div>
    </div>
  );
}