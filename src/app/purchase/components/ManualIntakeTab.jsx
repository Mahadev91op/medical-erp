"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  PackagePlus,
  Database,
  Plus,
  Trash2,
  AlertTriangle,
  Loader2,
  Printer,
  ShieldAlert,
  MapPin,
  Gift
} from "lucide-react";
import BillReconciliationCard from "./BillReconciliationCard";
import BarcodePrintModal from "./BarcodePrintModal";

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

export default function ManualIntakeTab({
  distributors = [],
  setDistributors = () => {},
  manualStagedItems = [],
  setManualStagedItems = () => {},
  setSuccessOverlayCount = () => {},
  setSuccessOverlayMsg = () => {},
  setShowSuccessOverlay = () => {},
  formatExpiryDateInput = (val) => val,
  formatPurchaseDateInput = (val) => val,
  getTodayInputString = () => "27/07/26",
  toast,
}) {
  const [formData, setFormData] = useState({
    name: "",
    batch: "",
    expiryDate: "",
    quantity: "",
    freeQty: "",
    distributor: "",
    mrp: "",
    purchasePrice: "",
    billNumber: "",
    purchaseDate: "",
    hsnCode: "",
    rackNumber: "",
    isScheduleH1: false,
  });

  const [purchaseDateInput, setPurchaseDateInput] = useState(getTodayInputString());
  const [expiryDateInput, setExpiryDateInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [gstPercent, setGstPercent] = useState("12");
  const [paperBillTotalInput, setPaperBillTotalInput] = useState("");
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);

  // Autocomplete Suggestions State
  const [medSuggestions, setMedSuggestions] = useState([]);
  const [showMedSuggestions, setShowMedSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Field Refs
  const distInputRef = useRef(null);
  const billNumInputRef = useRef(null);
  const purDateInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const hsnInputRef = useRef(null);
  const rackInputRef = useRef(null);
  const batchInputRef = useRef(null);
  const qtyInputRef = useRef(null);
  const freeQtyInputRef = useRef(null);
  const expiryInputRef = useRef(null);
  const costInputRef = useRef(null);
  const mrpInputRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowMedSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autocomplete search when typing Medicine Name
  const handleNameChange = async (val) => {
    setFormData((prev) => ({ ...prev, name: val }));
    if (val.trim().length >= 2) {
      try {
        const res = await fetch(
          `/api/medicine?all=true&search=${encodeURIComponent(val.trim())}`
        );
        const data = await res.json();
        if (data.success && Array.isArray(data.medicines)) {
          const unique = [];
          const map = new Set();
          data.medicines.forEach((m) => {
            const key = m.name.toLowerCase().trim();
            if (!map.has(key)) {
              map.add(key);
              unique.push(m);
            }
          });
          setMedSuggestions(unique.slice(0, 8));
          setShowMedSuggestions(true);
        }
      } catch (err) {
        console.error("Autocomplete search error:", err);
      }
    } else {
      setMedSuggestions([]);
      setShowMedSuggestions(false);
    }
  };

  const [selectedExistingStock, setSelectedExistingStock] = useState(null);

  const selectSuggestedMedicine = (med) => {
    setSelectedExistingStock(med);
    setFormData((prev) => ({
      ...prev,
      name: med.name,
      hsnCode: med.hsnCode || prev.hsnCode || "3004",
      mrp: med.mrp ? String(med.mrp) : prev.mrp,
      purchasePrice: med.purchasePrice
        ? String(med.purchasePrice)
        : prev.purchasePrice,
      rackNumber: med.rackNumber || prev.rackNumber || "",
      isScheduleH1: med.isScheduleH1 || false,
    }));
    if (med.gstPercent !== undefined) {
      setGstPercent(String(med.gstPercent));
    }
    setShowMedSuggestions(false);
    toast.success(`Auto-filled rates & location for ${med.name}!`);
    setTimeout(() => {
      batchInputRef.current?.focus();
    }, 50);
  };

  // Add Item to Staging List
  const handleAddToManualList = (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!formData.distributor.trim()) {
      toast.error("Please enter Distributor / Agency name!");
      return;
    }
    if (!formData.billNumber.trim()) {
      toast.error("Please enter Distributor Bill Number!");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Medicine Name is required!");
      return;
    }
    if (!formData.batch.trim()) {
      toast.error("Batch Number is required!");
      return;
    }
    if (!expiryDateInput || !/^\d{2}\/\d{2}$/.test(expiryDateInput.trim())) {
      toast.error("Valid Expiry Date (MM/YY) is required!");
      return;
    }
    if (!formData.quantity || Number(formData.quantity) <= 0) {
      toast.error("Quantity must be greater than 0!");
      return;
    }
    if (!formData.mrp || Number(formData.mrp) <= 0) {
      toast.error("MRP must be greater than 0!");
      return;
    }
    if (!formData.purchasePrice || Number(formData.purchasePrice) <= 0) {
      toast.error("Cost Price must be greater than 0!");
      return;
    }

    const monthsToExp = getMonthsToExpiry(expiryDateInput);

    const newItem = {
      id: Date.now() + Math.random(),
      name: formData.name.trim(),
      batch: formData.batch.trim(),
      expiryDate: expiryDateInput.trim(),
      quantity: Number(formData.quantity),
      freeQty: Number(formData.freeQty) || 0,
      mrp: Number(formData.mrp),
      purchasePrice: Number(formData.purchasePrice),
      hsnCode: formData.hsnCode.trim() || "3004",
      gstPercent: Number(gstPercent) || 12,
      rackNumber: formData.rackNumber.trim() || "",
      isScheduleH1: formData.isScheduleH1,
      distributor: formData.distributor.trim(),
      billNumber: formData.billNumber.trim(),
      purchaseDate: purchaseDateInput,
    };

    setManualStagedItems((prev) => [...prev, newItem]);

    if (monthsToExp !== null && monthsToExp < 6) {
      toast(
        `⚠️ Short Expiry Warning: ${newItem.name} expires in ${monthsToExp} month(s)!`,
        { icon: "⚠️", duration: 5000 }
      );
    } else {
      toast.success(`Added ${newItem.name} to bill list!`);
    }

    // Auto-retain Distributor, Bill No & Date
    setFormData((prev) => ({
      ...prev,
      name: "",
      batch: "",
      quantity: "",
      freeQty: "",
      mrp: "",
      purchasePrice: "",
      hsnCode: "",
      rackNumber: "",
      isScheduleH1: false,
    }));
    setExpiryDateInput("");
    setShowMedSuggestions(false);

    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  const validateStagedItem = (item) => {
    const errors = [];
    if (!item.name.trim()) errors.push("Name required");
    if (!item.batch.trim()) errors.push("Batch required");
    if (!item.expiryDate || !/^\d{2}\/\d{2}$/.test(item.expiryDate.trim())) {
      errors.push("Expiry MM/YY required");
    }
    const qtyVal = Number(item.quantity);
    const mrpVal = Number(item.mrp);
    const costVal = Number(item.purchasePrice);

    if (isNaN(qtyVal) || qtyVal <= 0) errors.push("Qty > 0 required");
    if (isNaN(mrpVal) || mrpVal <= 0) errors.push("MRP > 0 required");
    if (isNaN(costVal) || costVal <= 0) errors.push("Cost > 0 required");
    else if (costVal > mrpVal) errors.push("Cost cannot exceed MRP");

    return errors;
  };

  const handleUpdateManualStagedItem = (id, field, value) => {
    setManualStagedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteManualStagedItem = (id) => {
    setManualStagedItems((prev) => prev.filter((item) => item.id !== id));
    toast.success("Item deleted from bill list");
  };

  const handleSaveManualBillToInventory = async () => {
    if (manualStagedItems.length === 0) {
      toast.error("No items staged in bill!");
      return;
    }

    const hasErrors = manualStagedItems.some(
      (item) => validateStagedItem(item).length > 0
    );
    if (hasErrors) {
      toast.error("Please fix all validation errors before saving!");
      return;
    }

    setLoading(true);

    try {
      const bulkPayload = manualStagedItems.map((item) => {
        const [expMonth, expYear] = (item.expiryDate || "12/26").split("/");
        const yearFull = expYear ? (expYear.length === 2 ? `20${expYear}` : expYear) : "2026";
        const parsedExpiryDate = new Date(
          Number(yearFull),
          Number(expMonth || 12) - 1,
          28
        ).toISOString().slice(0, 10);

        const [purDay, purMonth, purYear] = (
          item.purchaseDate || getTodayInputString()
        ).split("/");
        const purYearFull = purYear ? (purYear.length === 2 ? `20${purYear}` : purYear) : "2026";
        const parsedPurchaseDate = new Date(
          Number(purYearFull),
          Number(purMonth || 7) - 1,
          Number(purDay || 27)
        ).toISOString().slice(0, 10);

        const totalQty =
          (Number(item.quantity) || 1) + (Number(item.freeQty) || 0);

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
          billNumber: item.billNumber || formData.billNumber || "BILL-GEN",
          expiryDate: parsedExpiryDate,
          purchaseDate: parsedPurchaseDate,
          distributor:
            item.distributor || formData.distributor || "Generic Distributor",
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
        setLoading(false);
        setSuccessOverlayCount(count);
        setSuccessOverlayMsg(`${count} Medicines Saved to Inventory`);
        setShowSuccessOverlay(true);
        setTimeout(() => setShowSuccessOverlay(false), 3500);

        if (formData.distributor && !distributors.includes(formData.distributor)) {
          setDistributors([...distributors, formData.distributor]);
        }

        setManualStagedItems([]);
        toast.success(`Successfully saved ${count} medicines to inventory!`);
      } else {
        setLoading(false);
        toast.error("Save failed: " + (data.error || "Unable to save items"));
      }
    } catch (err) {
      setLoading(false);
      toast.error("Failed to save bill. Check connection.");
    }
  };

  // Live calculation for current form item
  const currentMargin = calculateMargin(
    formData.purchasePrice,
    formData.mrp,
    formData.quantity,
    formData.freeQty
  );

  const currentMonthsToExpiry = getMonthsToExpiry(expiryDateInput);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6 animate-in fade-in duration-300">
      {/* Thermal Barcode Sticker Print Modal */}
      <BarcodePrintModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        items={manualStagedItems}
      />

      {/* Left Column: Advance Manual Form */}
      <div
        className={`${
          manualStagedItems.length > 0 ? "lg:col-span-5" : "lg:col-span-5"
        } space-y-4 transition-all duration-300`}
      >
        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-sm md:text-base text-slate-800 flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-blue-600" />
              Manual Bill Purchase Intake
            </h3>
            {manualStagedItems.length > 0 && (
              <span className="bg-blue-50 text-blue-700 text-xs font-black px-2.5 py-1 rounded-lg border border-blue-100">
                {manualStagedItems.length} Staged
              </span>
            )}
          </div>

          <form onSubmit={handleAddToManualList} className="space-y-3.5">
            {/* Distributor & Bill Header Row */}
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2.5">
              <div className="flex justify-between items-center">
                <p className="text-xs font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  Distributor & Bill Header
                </p>
                <span className="text-[10px] font-bold text-slate-400">
                  Auto-Retained
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Distributor / Agency
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cipla / SunPharma"
                  list="distributor-suggestions"
                  autoComplete="off"
                  ref={distInputRef}
                  className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 text-xs md:text-sm font-bold"
                  value={formData.distributor}
                  onChange={(e) =>
                    setFormData({ ...formData, distributor: e.target.value })
                  }
                />
                <datalist id="distributor-suggestions">
                  {distributors.map((dist, index) => (
                    <option key={index} value={dist} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Bill Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. INV-1002"
                    ref={billNumInputRef}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-xs md:text-sm font-bold"
                    value={formData.billNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, billNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Purchase Date
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DD/MM/YY"
                    ref={purDateInputRef}
                    className="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-blue-500 text-xs md:text-sm font-bold"
                    value={purchaseDateInput}
                    onChange={(e) =>
                      setPurchaseDateInput(
                        formatPurchaseDateInput(e.target.value)
                      )
                    }
                  />
                </div>
              </div>
            </div>

            {/* Medicine Specs with Clean Autocomplete */}
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2 relative" ref={suggestionsRef}>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center justify-between">
                    <span>Medicine Name</span>
                    {medSuggestions.length > 0 && (
                      <span className="text-[10px] text-blue-600 font-bold">
                        {medSuggestions.length} Matches Found
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Paracetamol 500mg"
                    ref={nameInputRef}
                    autoComplete="off"
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 text-xs md:text-sm font-bold"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    onFocus={() => {
                      if (medSuggestions.length > 0)
                        setShowMedSuggestions(true);
                    }}
                  />

                  {/* Autocomplete Suggestions Popup */}
                  {showMedSuggestions && medSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 font-sans">
                      {medSuggestions.map((med, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectSuggestedMedicine(med)}
                          className="p-2.5 hover:bg-blue-50 cursor-pointer transition-colors flex justify-between items-center text-xs"
                        >
                          <div>
                            <p className="font-extrabold text-slate-900">
                              {med.name}
                            </p>
                            <p className="text-[10px] text-slate-400 flex items-center gap-2">
                              <span>Rack: {med.rackNumber || "N/A"}</span>
                              {med.isScheduleH1 && (
                                <span className="text-rose-600 font-bold">
                                  [H1 DRUG]
                                </span>
                              )}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-emerald-600">
                              MRP ₹{med.mrp}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Cost ₹{med.purchasePrice}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 3004"
                    ref={hsnInputRef}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-2.5 py-2 focus:outline-none focus:border-blue-500 text-xs md:text-sm font-semibold"
                    value={formData.hsnCode}
                    onChange={(e) =>
                      setFormData({ ...formData, hsnCode: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Dukan Rack / Drawer Location */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    Rack / Shelf Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rack A-2 / Drawer 3"
                    ref={rackInputRef}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 text-xs md:text-sm font-semibold"
                    value={formData.rackNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, rackNumber: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Batch Number
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B-1029"
                    ref={batchInputRef}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-2.5 py-2 focus:outline-none focus:border-blue-500 text-xs md:text-sm font-bold"
                    value={formData.batch}
                    onChange={(e) =>
                      setFormData({ ...formData, batch: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Billed Qty + Distributor Scheme Free Strips (10+2) */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Billed Qty
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="10"
                    min="1"
                    ref={qtyInputRef}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-2.5 py-2 focus:outline-none focus:border-blue-500 text-xs md:text-sm font-bold text-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                    <Gift className="w-3.5 h-3.5 text-emerald-600" />
                    Free Scheme
                  </label>
                  <input
                    type="number"
                    placeholder="2 (Free)"
                    min="0"
                    ref={freeQtyInputRef}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-2.5 py-2 focus:outline-none focus:border-blue-500 text-xs md:text-sm font-bold text-emerald-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={formData.freeQty}
                    onChange={(e) =>
                      setFormData({ ...formData, freeQty: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Expiry (MM/YY)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="MM/YY"
                    ref={expiryInputRef}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-2.5 py-2 focus:outline-none focus:border-blue-500 text-center text-xs md:text-sm font-bold"
                    value={expiryDateInput}
                    onChange={(e) =>
                      setExpiryDateInput(
                        formatExpiryDateInput(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              {/* 📦 Feature 2: Existing Stock in Shop Comparison Banner */}
              {selectedExistingStock && (
                <div className="bg-emerald-50/90 border border-emerald-200 p-2.5 rounded-xl flex items-center justify-between text-xs text-emerald-900 font-bold">
                  <div className="flex items-center gap-1.5">
                    <span>📦 Existing Shop Stock:</span>
                    <span className="font-extrabold">{selectedExistingStock.quantity || 0} Packs</span>
                    <span className="text-emerald-700">(Batch: {selectedExistingStock.batch || "N/A"})</span>
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    MRP ₹{selectedExistingStock.mrp} | Cost ₹{selectedExistingStock.purchasePrice}
                  </div>
                </div>
              )}

              {/* 🔥 Feature 3: High Profit Margin Alert (> 30% Margin) */}
              {currentMargin >= 30 && (
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-2.5 rounded-xl flex items-center gap-2 text-xs font-black shadow-sm animate-pulse">
                  <span>🔥 High Profit Margin Product ({currentMargin.toFixed(1)}% Profit)! Recommended to push at counter sales.</span>
                </div>
              )}

              {/* Short Expiry Refusal Alert Banner (< 6 Months) */}
              {currentMonthsToExpiry !== null && currentMonthsToExpiry < 6 && (
                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-extrabold animate-pulse">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    ⚠️ Short Expiry Alert! Expires in {currentMonthsToExpiry} month(s). Verify before accepting from distributor.
                  </span>
                </div>
              )}

              {/* Cost, MRP & Retail Profit Margin % Badge */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Cost Price ₹
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    ref={costInputRef}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 text-right text-xs md:text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={formData.purchasePrice}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchasePrice: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      MRP Price ₹
                    </label>
                    {formData.mrp && formData.purchasePrice && (
                      <span
                        className={`text-[10px] font-black px-1.5 py-0.5 rounded-md border ${
                          currentMargin >= 15
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : currentMargin >= 10
                            ? "bg-amber-100 text-amber-800 border-amber-300"
                            : "bg-rose-100 text-rose-800 border-rose-300"
                        }`}
                      >
                        {currentMargin.toFixed(1)}% Margin
                      </span>
                    )}
                  </div>
                  <input
                    type="number"
                    required
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    ref={mrpInputRef}
                    className="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500 text-right text-xs md:text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={formData.mrp}
                    onChange={(e) =>
                      setFormData({ ...formData, mrp: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Schedule H1 / Narcotic Drug Flagging Checkbox */}
              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl flex items-center justify-between text-xs font-bold text-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    checked={formData.isScheduleH1}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isScheduleH1: e.target.checked,
                      })
                    }
                  />
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Schedule H1 / Narcotic Prescription Drug
                  </span>
                </label>
                {formData.isScheduleH1 && (
                  <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-md">
                    Doc Reg. Required on POS
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs md:text-sm px-4 py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border-none mt-2"
            >
              <Plus className="w-4 h-4 text-blue-400" />
              Add Medicine to Bill List
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Staged Verification Table */}
      <div
        className={`${
          manualStagedItems.length > 0 ? "lg:col-span-7" : "lg:col-span-7"
        } transition-all duration-300`}
      >
        {manualStagedItems.length === 0 ? (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400 h-full min-h-[350px] flex flex-col justify-center items-center">
            <PackagePlus className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="font-extrabold text-slate-700 text-base">
              Manual Bill Staging Table Standby
            </h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
              Left form me medicine details fill karke **&quot;+ Add Medicine to Bill List&quot;** par click karein.
              Aapke saare medicines bill list me add hotey rahenge aur 1-click me saare items ek sath save honge.
            </p>
          </div>
        ) : (
          <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm space-y-4 md:space-y-5 animate-in slide-in-from-right-1 duration-300">
            {/* Table Header Controls */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-extrabold text-base md:text-lg text-slate-800 flex items-center gap-2">
                  Staged Bill Items ({manualStagedItems.length} Medicines)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distributor:{" "}
                  <span className="font-bold text-slate-800">
                    {formData.distributor || "N/A"}
                  </span>{" "}
                  | Bill No:{" "}
                  <span className="font-bold text-slate-800">
                    {formData.billNumber || "N/A"}
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setManualStagedItems([])}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 cursor-pointer"
              >
                Clear Bill List
              </button>
            </div>

            {/* Main Staging Table */}
            <div className="border border-slate-200 rounded-2xl overflow-x-auto bg-white shadow-sm">
              <table className="w-full border-collapse text-left text-xs md:text-sm font-semibold text-slate-700">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 text-[11px] md:text-xs font-black uppercase tracking-wider border-b border-slate-200">
                    <th className="p-2.5 min-w-[140px]">Medicine Name</th>
                    <th className="p-2.5 min-w-[80px]">Batch</th>
                    <th className="p-2.5 min-w-[70px] text-center">Expiry</th>
                    <th className="p-2.5 min-w-[50px] text-center">Qty</th>
                    <th className="p-2.5 min-w-[50px] text-center">Free</th>
                    <th className="p-2.5 min-w-[80px] text-right">Cost ₹</th>
                    <th className="p-2.5 min-w-[80px] text-right">MRP ₹</th>
                    <th className="p-2.5 min-w-[70px] text-center">Margin %</th>
                    <th className="p-2.5 min-w-[70px] text-center">Rack</th>
                    <th className="p-2.5 min-w-[40px] text-center">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {manualStagedItems.map((item) => {
                    const itemErrors = validateStagedItem(item);
                    const hasErrors = itemErrors.length > 0;

                    const itemMargin = calculateMargin(
                      item.purchasePrice,
                      item.mrp,
                      item.quantity,
                      item.freeQty
                    );

                    const monthsExp = getMonthsToExpiry(item.expiryDate);

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/20 transition-colors"
                      >
                        <td className="p-1.5">
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              className={`w-full bg-slate-50 border ${
                                !item.name.trim()
                                  ? "border-rose-500 bg-rose-50"
                                  : "border-slate-300"
                              } rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500 font-extrabold text-slate-900 text-xs md:text-sm`}
                              value={item.name}
                              onChange={(e) =>
                                handleUpdateManualStagedItem(
                                  item.id,
                                  "name",
                                  e.target.value
                                )
                              }
                              placeholder="Medicine Name"
                            />
                            {item.isScheduleH1 && (
                              <span className="text-[9px] bg-rose-100 text-rose-800 font-black px-1 py-0.5 rounded uppercase shrink-0">
                                H1
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-1.5">
                          <input
                            type="text"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-1.5 py-1.5 focus:outline-none focus:border-blue-500 font-bold text-slate-800 text-xs md:text-sm"
                            value={item.batch}
                            onChange={(e) =>
                              handleUpdateManualStagedItem(
                                item.id,
                                "batch",
                                e.target.value
                              )
                            }
                            placeholder="Batch"
                          />
                        </td>

                        <td className="p-1.5">
                          <input
                            type="text"
                            className={`w-full bg-slate-50 border ${
                              monthsExp !== null && monthsExp < 6
                                ? "border-rose-500 bg-rose-50 text-rose-800 font-black"
                                : "border-slate-300 text-slate-800"
                            } rounded-lg px-1 py-1.5 focus:outline-none text-center font-bold text-xs md:text-sm`}
                            value={item.expiryDate}
                            onChange={(e) =>
                              handleUpdateManualStagedItem(
                                item.id,
                                "expiryDate",
                                formatExpiryDateInput(e.target.value)
                              )
                            }
                            placeholder="MM/YY"
                          />
                        </td>

                        <td className="p-1.5">
                          <input
                            type="number"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-1 py-1.5 focus:outline-none text-center font-black text-blue-700 text-xs md:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateManualStagedItem(
                                item.id,
                                "quantity",
                                e.target.value
                              )
                            }
                            placeholder="Qty"
                          />
                        </td>

                        <td className="p-1.5">
                          <input
                            type="number"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-1 py-1.5 focus:outline-none text-center font-extrabold text-emerald-600 text-xs md:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={item.freeQty}
                            onChange={(e) =>
                              handleUpdateManualStagedItem(
                                item.id,
                                "freeQty",
                                e.target.value
                              )
                            }
                            placeholder="Free"
                          />
                        </td>

                        <td className="p-1.5">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-1.5 py-1.5 focus:outline-none text-right font-bold text-slate-900 text-xs md:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={item.purchasePrice}
                            onChange={(e) =>
                              handleUpdateManualStagedItem(
                                item.id,
                                "purchasePrice",
                                e.target.value
                              )
                            }
                            placeholder="Cost"
                          />
                        </td>

                        <td className="p-1.5">
                          <input
                            type="number"
                            step="0.01"
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-1.5 py-1.5 focus:outline-none text-right font-bold text-slate-900 text-xs md:text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={item.mrp}
                            onChange={(e) =>
                              handleUpdateManualStagedItem(
                                item.id,
                                "mrp",
                                e.target.value
                              )
                            }
                            placeholder="MRP"
                          />
                        </td>

                        {/* Retail Margin Badge */}
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
                            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-1 py-1.5 focus:outline-none text-center font-semibold text-slate-800 text-xs"
                            value={item.rackNumber}
                            onChange={(e) =>
                              handleUpdateManualStagedItem(
                                item.id,
                                "rackNumber",
                                e.target.value
                              )
                            }
                            placeholder="Rack"
                          />
                        </td>

                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteManualStagedItem(item.id)}
                            className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors border-none cursor-pointer"
                            title="Delete item"
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

            {/* Bill Total Tally & Retail Profit Card */}
            <BillReconciliationCard
              items={manualStagedItems}
              paperBillTotalInput={paperBillTotalInput}
              setPaperBillTotalInput={setPaperBillTotalInput}
              distributorName={formData.distributor}
              billNumber={formData.billNumber}
            />

            {/* Save & 🏷️ Print Thermal Barcode Sticker Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-extrabold text-slate-700 uppercase tracking-wider bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200">
                  {manualStagedItems.length} Medicines Staged
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBarcodeModalOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs px-4 py-3.5 rounded-xl border border-slate-300 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-slate-700" />
                  🏷️ Print Barcode Stickers
                </button>

                <button
                  type="button"
                  onClick={handleSaveManualBillToInventory}
                  disabled={loading || manualStagedItems.length === 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs md:text-sm uppercase tracking-wider px-6 py-3.5 rounded-xl transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2 cursor-pointer border-none outline-none"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Database className="w-4 h-4" />
                  )}
                  Verify & Save Bill ({manualStagedItems.length} Items)
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
