"use client";
import React, { useState, useEffect } from "react";
import { 
  X, IndianRupee, Database, Package, AlertCircle, AlertOctagon, 
  PackageX, ShoppingCart, Calendar, Search, ArrowRight, TrendingUp,
  CreditCard, Smartphone, Banknote, ShieldAlert, Tag, CheckCircle2,
  ExternalLink, Layers, Award, FileText
} from "lucide-react";
import Link from "next/link";
import { formatExpiryDate } from "@/lib/formatDate";

export default function DashboardDetailModal({ isOpen, onClose, modalType, data, stats, onClearExpired }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchTerm("");
      setActiveTab("all");
    }
  }, [modalType, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !modalType) return null;

  const renderContent = () => {
    switch (modalType) {

      /* -------------------------------------------------------------
         1. TODAY'S REVENUE DRILLDOWN MODAL
      ------------------------------------------------------------- */
      case "todayRevenue": {
        const paymentBreakdown = stats?.todayPaymentBreakdown || { Cash: 0, UPI: 0, Card: 0 };
        const totalRev = stats?.todayRevenue || 0;
        const salesList = data?.todaysSalesRaw || data?.todaysSales || [];
        const topSelling = data?.topSellingToday || [];

        const filteredSales = salesList.filter(s => {
          if (!searchTerm) return true;
          const searchLower = searchTerm.toLowerCase();
          const pMethod = (s.paymentMethod || "Cash").toLowerCase();
          const itemsStr = (s.items || []).map(i => i.name).join(" ").toLowerCase();
          const billId = s._id ? s._id.toString().toLowerCase() : "";
          return pMethod.includes(searchLower) || itemsStr.includes(searchLower) || billId.includes(searchLower);
        });

        return (
          <div className="space-y-6">
            {/* Header Badge & Title */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Today&apos;s Total Sales Revenue</p>
                  <h2 className="text-3xl font-black mt-1">₹{totalRev.toLocaleString('en-IN')}</h2>
                  <p className="text-xs text-blue-200 mt-1 font-medium">{salesList.length} Total Sales Transactions Completed Today</p>
                </div>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <IndianRupee className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Payment Method Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center text-emerald-700 text-xs font-bold gap-1.5">
                  <Banknote className="w-4 h-4" />
                  <span>Cash Payment</span>
                </div>
                <p className="text-xl font-extrabold text-emerald-900 mt-2">₹{(paymentBreakdown.Cash || 0).toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                  {totalRev > 0 ? Math.round(((paymentBreakdown.Cash || 0) / totalRev) * 100) : 0}% of Total
                </p>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center text-indigo-700 text-xs font-bold gap-1.5">
                  <Smartphone className="w-4 h-4" />
                  <span>UPI / QR</span>
                </div>
                <p className="text-xl font-extrabold text-indigo-900 mt-2">₹{(paymentBreakdown.UPI || 0).toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">
                  {totalRev > 0 ? Math.round(((paymentBreakdown.UPI || 0) / totalRev) * 100) : 0}% of Total
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-100 p-3.5 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center text-purple-700 text-xs font-bold gap-1.5">
                  <CreditCard className="w-4 h-4" />
                  <span>Card Payment</span>
                </div>
                <p className="text-xl font-extrabold text-purple-900 mt-2">₹{(paymentBreakdown.Card || 0).toLocaleString('en-IN')}</p>
                <p className="text-[10px] text-purple-600 font-semibold mt-0.5">
                  {totalRev > 0 ? Math.round(((paymentBreakdown.Card || 0) / totalRev) * 100) : 0}% of Total
                </p>
              </div>
            </div>

            {/* Top Selling Items Today */}
            {topSelling.length > 0 && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
                <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Top Selling Medicines Today</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {topSelling.map((item, idx) => (
                    <div key={idx} className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 text-xs flex items-center gap-2 shadow-sm">
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="bg-blue-100 text-blue-700 font-extrabold px-2 py-0.5 rounded-md text-[10px]">
                        {item.quantity} Qty (₹{item.revenue})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Transactions List */}
            <div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-3">
                <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <span>Today&apos;s Invoice Transactions ({filteredSales.length})</span>
                </h3>

                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search invoice..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {filteredSales.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
                  <p className="text-xs font-semibold">No transactions found matching search filter.</p>
                </div>
              ) : (
                <div className="max-h-[240px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                  {filteredSales.map((sale, idx) => (
                    <div key={sale._id || idx} className="bg-white p-3 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-all flex items-center justify-between shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-800">Bill #{sale._id ? sale._id.toString().slice(-6).toUpperCase() : `INV-${idx+1}`}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            sale.paymentMethod === 'Card' ? 'bg-purple-100 text-purple-700' :
                            sale.paymentMethod === 'UPI' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {sale.paymentMethod || "Cash"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                          {(sale.items || []).map(i => `${i.name} (${i.quantity})`).join(", ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-blue-600">₹{(sale.totalAmount || 0).toLocaleString('en-IN')}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{sale.items?.length || 0} Items</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }

      /* -------------------------------------------------------------
         2. STOCK VALUE (MRP) DRILLDOWN MODAL
      ------------------------------------------------------------- */
      case "stockValue": {
        const totalVal = stats?.totalStockValue || 0;
        const totalActiveMeds = stats?.totalMedicines || 0;
        const totalUnits = stats?.totalUnits || 0;
        
        // Cost estimation assuming average purchase price margin (~25%)
        const estCostValue = Math.round(totalVal * 0.75);
        const estProfitPotential = Math.round(totalVal * 0.25);

        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-800 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-200">Total Inventory Stock Valuation (MRP)</p>
                  <h2 className="text-3xl font-black mt-1">₹{totalVal.toLocaleString('en-IN')}</h2>
                  <p className="text-xs text-blue-200 mt-1 font-medium">{totalActiveMeds} Distinct Medicines | {totalUnits.toLocaleString('en-IN')} Total Stock Units</p>
                </div>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Database className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Inventory Cost & Profit Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <div className="flex items-center text-slate-600 text-xs font-bold gap-1.5">
                  <Tag className="w-4 h-4 text-blue-500" />
                  <span>Estimated Inventory Cost Value</span>
                </div>
                <p className="text-2xl font-black text-slate-800 mt-2">₹{estCostValue.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-500 font-semibold mt-1">Estimated wholesale investment cost</p>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <div className="flex items-center text-emerald-700 text-xs font-bold gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>Gross Profit Potential</span>
                </div>
                <p className="text-2xl font-black text-emerald-900 mt-2">₹{estProfitPotential.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-emerald-700 font-semibold mt-1">Expected return on 100% stock liquidation</p>
              </div>
            </div>

            <div className="bg-blue-50/70 border border-blue-200/80 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-extrabold text-blue-900">Manage Full Stock Inventory</h4>
                <p className="text-[11px] text-blue-700 font-semibold">View, filter, update prices, or export complete stock CSV</p>
              </div>
              <Link href="/inventory" onClick={onClose}>
                <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-md flex items-center gap-1.5">
                  Go to Inventory <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </Link>
            </div>
          </div>
        );
      }

      /* -------------------------------------------------------------
         3. TOTAL UNITS STOCK DRILLDOWN MODAL
      ------------------------------------------------------------- */
      case "totalUnits": {
        const totalUnits = stats?.totalUnits || 0;
        const totalMeds = stats?.totalMedicines || 0;

        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-indigo-100">Total Stock Unit Count</p>
                  <h2 className="text-3xl font-black mt-1">{totalUnits.toLocaleString('en-IN')} Units</h2>
                  <p className="text-xs text-indigo-200 mt-1 font-medium">{totalMeds} Active Stock Medicines Available</p>
                </div>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <Package className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-extrabold text-indigo-900">Need to Add New Stock Batches?</h4>
                <p className="text-[11px] text-indigo-700 font-semibold">Add new purchases or update stock quantities in Inventory</p>
              </div>
              <div className="flex gap-2">
                <Link href="/purchase" onClick={onClose}>
                  <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold px-3 py-2 rounded-xl transition-all shadow-md">
                    + Purchase Stock
                  </button>
                </Link>
                <Link href="/inventory" onClick={onClose}>
                  <button className="bg-white border border-indigo-200 text-indigo-700 text-xs font-extrabold px-3 py-2 rounded-xl transition-all shadow-sm hover:bg-indigo-50">
                    Inventory
                  </button>
                </Link>
              </div>
            </div>
          </div>
        );
      }

      /* -------------------------------------------------------------
         4. EXPIRING MEDICINES DRILLDOWN MODAL
      ------------------------------------------------------------- */
      case "expiring": {
        const expiringList = data?.expiringMedicines || [];

        const calculateDays = (expDate) => {
          const diff = new Date(expDate) - new Date();
          return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
        };

        const filteredExpiring = expiringList.filter(item => {
          const days = calculateDays(item.expiryDate);
          if (activeTab === "30") return days <= 30;
          if (activeTab === "60") return days <= 60;
          return true; // "all"
        }).filter(item => {
          if (!searchTerm) return true;
          const s = searchTerm.toLowerCase();
          return item.name?.toLowerCase().includes(s) || item.batch?.toLowerCase().includes(s) || item.distributor?.toLowerCase().includes(s);
        });

        return (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-100">Expiring Stock Alert (Next 90 Days)</p>
                  <h2 className="text-3xl font-black mt-1">{stats?.expiringCount || expiringList.length} Medicines</h2>
                  <p className="text-xs text-rose-200 mt-1 font-medium">Clear or offer discounts to reduce expiry loss</p>
                </div>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <AlertCircle className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="flex bg-slate-100 p-1 rounded-xl overflow-x-auto custom-scrollbar">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "all" ? "bg-white text-rose-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  All (90 Days)
                </button>
                <button
                  onClick={() => setActiveTab("60")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "60" ? "bg-white text-rose-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Within 60 Days
                </button>
                <button
                  onClick={() => setActiveTab("30")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === "30" ? "bg-white text-rose-600 shadow-sm" : "text-slate-600 hover:text-slate-900"}`}
                >
                  Urgent (&lt;30 Days)
                </button>
              </div>

              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search medicine/batch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Expiring List Table */}
            {filteredExpiring.length === 0 ? (
              <div className="text-center py-10 bg-rose-50/30 rounded-2xl border border-dashed border-rose-200 text-rose-400">
                <p className="text-xs font-bold">No medicines matching selected filter! 🎉</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {filteredExpiring.map((med, idx) => {
                  const days = calculateDays(med.expiryDate);
                  return (
                    <div key={med._id || idx} className="bg-white p-3.5 rounded-xl border border-rose-100 hover:border-rose-300 transition-all flex items-center justify-between shadow-sm">
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-slate-800 truncate">{med.name}</h4>
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${days <= 30 ? 'bg-rose-500 text-white animate-pulse' : 'bg-rose-100 text-rose-700'}`}>
                            {days} Days Left
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                          Batch: <span className="font-bold text-slate-700">{med.batch}</span> | Qty Left: <span className="font-bold text-slate-700">{med.quantity}</span> | MRP: ₹{med.mrp}
                        </p>
                        {med.distributor && (
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Distributor: {med.distributor}</p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-rose-600">{formatExpiryDate(med.expiryDate)}</p>
                        <Link href="/inventory" onClick={onClose}>
                          <button className="mt-1 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold px-2.5 py-1 rounded-lg transition-colors border border-rose-200">
                            Action / Discount
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      /* -------------------------------------------------------------
         5. ALREADY EXPIRED DRILLDOWN MODAL
      ------------------------------------------------------------- */
      case "expired": {
        const expiredCount = stats?.expiredCount || 0;

        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-red-600 to-rose-800 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-200">Expired Inventory Alert</p>
                  <h2 className="text-3xl font-black mt-1">{expiredCount} Expired Stock Items</h2>
                  <p className="text-xs text-rose-200 mt-1 font-medium">Clear these items to avoid accidental sale</p>
                </div>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <AlertOctagon className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-extrabold text-rose-900">Remove Expired Stock Items</h4>
                <p className="text-[11px] text-rose-700 font-semibold">Clear expired batches directly from Inventory section</p>
              </div>
              <button 
                onClick={() => onClearExpired && onClearExpired()}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold px-4 py-2 rounded-xl transition-all shadow-md cursor-pointer"
              >
                Clear Stock Now
              </button>
            </div>
          </div>
        );
      }

      /* -------------------------------------------------------------
         6. OUT OF STOCK DRILLDOWN MODAL
      ------------------------------------------------------------- */
      case "outOfStock": {
        const reorderList = data?.reorderList || [];
        const outOfStockCount = stats?.outOfStockCount || reorderList.length;

        const filteredReorder = reorderList.filter(item => {
          if (!searchTerm) return true;
          const s = searchTerm.toLowerCase();
          return item.name?.toLowerCase().includes(s) || item.distributor?.toLowerCase().includes(s);
        });

        return (
          <div className="space-y-5">
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-100">Out of Stock Reorder Alert</p>
                  <h2 className="text-3xl font-black mt-1">{outOfStockCount} Out of Stock Medicines</h2>
                  <p className="text-xs text-amber-200 mt-1 font-medium">Reorder items to prevent missing sales</p>
                </div>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <PackageX className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Zero Stock Items List</h3>
              <div className="relative w-full sm:w-48">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            {filteredReorder.length === 0 ? (
              <div className="text-center py-8 bg-amber-50/40 rounded-2xl border border-dashed border-amber-200 text-amber-600">
                <p className="text-xs font-bold">No out of stock items found!</p>
              </div>
            ) : (
              <div className="max-h-[260px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {filteredReorder.map((item, idx) => (
                  <div key={item._id || idx} className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between hover:border-amber-300 transition-all shadow-sm">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800">{item.name}</h4>
                      <p className="text-[11px] text-amber-600 font-bold mt-0.5">0 Units in Stock</p>
                      {item.distributor && (
                        <p className="text-[10px] text-slate-400 font-semibold">Vendor: {item.distributor}</p>
                      )}
                    </div>
                    <Link href={`/purchase?reorderName=${encodeURIComponent(item.name)}&reorderDistributor=${encodeURIComponent(item.distributor || "")}&reorderBatch=${encodeURIComponent(item.batch || "")}&reorderMrp=${item.mrp || ""}`} onClick={onClose}>
                      <button className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer">
                        + Reorder Stock
                      </button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      /* -------------------------------------------------------------
         7. MORNING INVENTORY ALERT SUMMARY MODAL
      ------------------------------------------------------------- */
      case "morningAlerts": {
        const outOfStockCount = stats?.outOfStockCount || 0;
        const lowStockCount = stats?.lowStockCount || 0;
        const expiringCount = stats?.expiringCount || 0;
        const reorderList = data?.reorderList || [];
        const expiringList = data?.expiringMedicines || [];

        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-100">🌅 Morning Inventory Alert Summary</p>
                  <h2 className="text-2xl font-black mt-1">Store Daily Health Overview</h2>
                  <p className="text-xs text-amber-100 mt-1 font-medium">Review pending inventory alerts for today</p>
                </div>
                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <ShieldAlert className="w-7 h-7 text-white animate-pulse" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-bold uppercase text-amber-600">Out of Stock</p>
                <p className="text-2xl font-black text-amber-900 mt-1">{outOfStockCount}</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-bold uppercase text-orange-600">Low Stock</p>
                <p className="text-2xl font-black text-orange-900 mt-1">{lowStockCount}</p>
              </div>

              <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl text-center">
                <p className="text-[10px] font-bold uppercase text-rose-600">Expiring Soon</p>
                <p className="text-2xl font-black text-rose-900 mt-1">{expiringCount}</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Link href="/inventory" onClick={onClose}>
                <button className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-md">
                  Open Inventory Manager
                </button>
              </Link>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-[28px] shadow-2xl border border-slate-100 p-4 sm:p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-5 sm:right-5 w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full flex items-center justify-center transition-colors focus:outline-none z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {renderContent()}
      </div>
    </div>
  );
}
