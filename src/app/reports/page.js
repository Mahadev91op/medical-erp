"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, TrendingDown, Truck, Loader2, CalendarClock } from "lucide-react";

export default function Reports() {
  const [data, setData] = useState({ expiringSoon: [], lowStock: [], distributorStock: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="font-medium">Loading Smart Reports...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Profit-Saving Reports</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">Apna nuksan bachayein aur stock maintain rakhein.</p>
      </div>

      {/* Distributor Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.distributorStock.map((dist) => (
          <div key={dist._id} className="bg-white p-6 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center group">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mr-5 group-hover:scale-110 transition-transform">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Distributor {dist._id}</p>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-2xl font-extrabold text-slate-700">{dist.totalQuantity} <span className="text-sm font-medium text-slate-400">Items</span></span>
                <span className="text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg text-xs font-bold">{dist.totalItems} Brands</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Urgent Expiry Report (Laal List) */}
        <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-rose-100 overflow-hidden">
          <div className="bg-rose-50/50 p-6 border-b border-rose-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-rose-700 flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" /> 60 Days Expiry Alert
            </h2>
            <span className="bg-rose-200 text-rose-800 text-xs font-bold px-3 py-1 rounded-full">
              {data.expiringSoon.length} Items
            </span>
          </div>
          
          <div className="p-2 max-h-[400px] overflow-y-auto">
            {data.expiringSoon.length === 0 ? (
              <p className="text-center text-slate-400 py-8 font-medium">Koi bhi dawai jaldi expire nahi ho rahi! 🎉</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4 font-bold">Medicine</th>
                    <th className="p-4 font-bold">Batch</th>
                    <th className="p-4 font-bold">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.expiringSoon.map((med) => (
                    <tr key={med._id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-700">{med.name}</p>
                        <p className="text-xs text-slate-400">Qty: <span className="font-bold text-rose-500">{med.quantity}</span></p>
                      </td>
                      <td className="p-4 text-sm font-medium text-slate-600">{med.batch}</td>
                      <td className="p-4">
                        <div className="flex items-center text-sm font-bold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl w-fit">
                          <CalendarClock className="w-4 h-4 mr-1.5" />
                          {new Date(med.expiryDate).toLocaleDateString('en-GB')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Report */}
        <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-amber-100 overflow-hidden">
          <div className="bg-amber-50/50 p-6 border-b border-amber-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-amber-700 flex items-center">
              <TrendingDown className="w-5 h-5 mr-2" /> Low Stock Alert
            </h2>
            <span className="bg-amber-200 text-amber-800 text-xs font-bold px-3 py-1 rounded-full">
              {data.lowStock.length} Items
            </span>
          </div>
          
          <div className="p-2 max-h-[400px] overflow-y-auto">
            {data.lowStock.length === 0 ? (
              <p className="text-center text-slate-400 py-8 font-medium">Stock ekdum full hai! 📦</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="p-4 font-bold">Medicine</th>
                    <th className="p-4 font-bold">Distributor</th>
                    <th className="p-4 font-bold text-right">Left Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.lowStock.map((med) => (
                    <tr key={med._id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-4">
                        <p className="font-bold text-slate-700">{med.name}</p>
                        <p className="text-xs text-slate-400">Batch: {med.batch}</p>
                      </td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2.5 py-1 rounded-lg">
                          Dist {med.distributor}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-lg font-extrabold text-amber-500 bg-amber-50 px-3 py-1.5 rounded-xl">
                          {med.quantity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}