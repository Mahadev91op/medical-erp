"use client";
import React, { useState, useEffect } from "react";
import { 
  X, IndianRupee, TrendingUp, ShoppingCart, Percent, 
  Banknote, Smartphone, CreditCard, Search, ArrowRight,
  FileText, Calendar, Tag, Layers, CheckCircle2
} from "lucide-react";
import Link from "next/link";

export default function ReportDetailModal({ isOpen, onClose, modalType, data }) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchTerm("");
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
         1. TOTAL SALES REVENUE REPORT MODAL
      ------------------------------------------------------------- */
      case "totalSales": {
        const totalRevenue = data?.todayRevenue || 0;
        const transactions = data?.transactions || [];

        const filteredTxns = transactions.filter(t => {
          if (!searchTerm) return true;
          const s = searchTerm.toLowerCase();
          return (t.name?.toLowerCase().includes(s) || 
                  t.billNumber?.toLowerCase().includes(s) || 
                  t.paymentMethod?.toLowerCase().includes(s));
        });

        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-100">Total Sales Revenue</p>
                  <h2 className="text-3xl font-black mt-1">₹{totalRevenue.toLocaleString('en-IN')}</h2>
                  <p className="text-xs text-blue-200 mt-1 font-medium">{transactions.length} Total Sales Transactions</p>
                </div>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <IndianRupee className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            {/* Transactions Table */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Sales Transactions List</h3>
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search invoice/medicine..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {filteredTxns.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-2xl text-slate-400 border border-dashed border-slate-200">
                  <p className="text-xs font-semibold">No sales transactions found.</p>
                </div>
              ) : (
                <div className="max-h-[260px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                  {filteredTxns.map((t, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-center justify-between shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-800">{t.name}</span>
                          <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Bill #{t.billNumber}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                          Qty: {t.quantity} | Method: {t.paymentMethod} | {t.date ? new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-blue-600">₹{t.total}</p>
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
         2. GROSS PROFIT REPORT MODAL
      ------------------------------------------------------------- */
      case "grossProfit": {
        const totalRev = data?.todayRevenue || 0;
        const totalProfit = data?.todayProfit || 0;
        const cogs = data?.todayCogs || (totalRev - totalProfit);
        const margin = data?.profitMargin || 0;

        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-100">Estimated Gross Profit</p>
                  <h2 className="text-3xl font-black mt-1">₹{totalProfit.toLocaleString('en-IN')}</h2>
                  <p className="text-xs text-emerald-200 mt-1 font-medium">{margin.toFixed(1)}% Overall Profit Margin</p>
                </div>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <p className="text-xs font-bold text-slate-500 uppercase">Cost of Goods Sold (COGS)</p>
                <p className="text-2xl font-black text-slate-800 mt-1">₹{cogs.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-400 font-semibold mt-1">Total wholesale cost of items sold</p>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                <p className="text-xs font-bold text-emerald-700 uppercase">Net Profit Margin</p>
                <p className="text-2xl font-black text-emerald-900 mt-1">{margin.toFixed(1)}%</p>
                <p className="text-[11px] text-emerald-600 font-semibold mt-1">Profit percentage relative to total sales</p>
              </div>
            </div>
          </div>
        );
      }

      /* -------------------------------------------------------------
         3. TOTAL ITEMS SOLD REPORT MODAL
      ------------------------------------------------------------- */
      case "itemsSold": {
        const totalItems = data?.todayItemsSold || 0;
        const transactions = data?.transactions || [];

        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-purple-100">Total Units Sold</p>
                  <h2 className="text-3xl font-black mt-1">{totalItems.toLocaleString('en-IN')} Units</h2>
                  <p className="text-xs text-purple-200 mt-1 font-medium">Across all completed customer bills</p>
                </div>
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <ShoppingCart className="w-8 h-8 text-white" />
                </div>
              </div>
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
        className="bg-white w-full max-w-xl rounded-[28px] shadow-2xl border border-slate-100 p-6 relative max-h-[90vh] overflow-y-auto custom-scrollbar animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 rounded-full flex items-center justify-center transition-colors focus:outline-none z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {renderContent()}
      </div>
    </div>
  );
}
