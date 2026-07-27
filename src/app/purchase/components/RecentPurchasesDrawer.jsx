"use client";

import React, { useState, useEffect } from "react";
import {
  History,
  X,
  Copy,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  PackageCheck
} from "lucide-react";

export default function RecentPurchasesDrawer({
  isOpen,
  onToggle,
  onDuplicateItem,
  toast
}) {
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRecentItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/medicine?limit=10&page=1&all=true");
      const data = await res.json();
      if (data.success && Array.isArray(data.medicines)) {
        setRecentItems(data.medicines);
      }
    } catch (err) {
      console.error("Failed to load recent purchases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRecentItems();
    }
  }, [isOpen]);

  const handleDeleteRecentItem = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name} from inventory?`)) return;

    try {
      const res = await fetch(`/api/medicine/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Deleted ${name} from inventory`);
        setRecentItems(prev => prev.filter(item => item._id !== id));
      } else {
        toast.error(data.error || "Failed to delete item");
      }
    } catch (err) {
      toast.error("Network error deleting item");
    }
  };

  return (
    <>
      {/* Toggle Button on Screen Margin */}
      <button
        type="button"
        onClick={onToggle}
        className="fixed right-0 top-32 z-40 bg-slate-900 text-white font-bold text-xs py-3 px-2 rounded-l-2xl shadow-2xl flex flex-col items-center gap-1 hover:bg-blue-600 transition-all border-none cursor-pointer"
        title="Today's Recent Intake Log"
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        <History className="w-4 h-4 text-amber-400" />
        <span className="text-[9px] uppercase tracking-wider font-extrabold rotate-180 [writing-mode:vertical-lr]">
          Recent Intake Log
        </span>
      </button>

      {/* Slide-over Drawer Panel */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-80 md:w-96 bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 font-sans">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-sm md:text-base">Today's Intake Log</h3>
            </div>
            <button
              type="button"
              onClick={onToggle}
              className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-xl border-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List Content */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider">
                Last 10 Saved Items
              </span>
              <button
                type="button"
                onClick={fetchRecentItems}
                className="text-[10px] text-blue-600 font-bold hover:underline bg-none border-none cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                <p className="text-xs font-bold">Loading Recent Entries...</p>
              </div>
            ) : recentItems.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <PackageCheck className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No Recent Intake Entries</p>
                <p className="text-[11px]">Saved medicines will appear here for 1-click duplicate or deletion.</p>
              </div>
            ) : (
              recentItems.map((item) => (
                <div
                  key={item._id}
                  className="bg-slate-50 hover:bg-blue-50/40 p-3 rounded-2xl border border-slate-200 space-y-2 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-xs md:text-sm text-slate-900 leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Distributor: {item.distributor || "N/A"}
                      </p>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md">
                      Qty {item.quantity}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-600 font-semibold border-t border-slate-200/60 pt-2">
                    <div>
                      <span>Batch: <strong className="text-slate-800">{item.batch}</strong></span>
                      <span className="ml-2">Exp: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' }) : "N/A"}</span>
                    </div>
                    <div className="text-right font-bold text-slate-900">
                      Cost ₹{item.purchasePrice?.toFixed(2)} | MRP ₹{item.mrp?.toFixed(2)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => onDuplicateItem(item)}
                      className="bg-white hover:bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer"
                      title="Duplicate item into current staging list"
                    >
                      <Copy className="w-3 h-3 text-blue-600" /> Duplicate
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRecentItem(item._id, item.name)}
                      className="bg-white hover:bg-rose-100 text-rose-600 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer"
                      title="Delete from inventory"
                    >
                      <Trash2 className="w-3 h-3 text-rose-500" /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  );
}
