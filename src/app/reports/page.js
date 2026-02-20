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
        <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-emerald-500 mb-3 md:mb-4" />
        <p className="font-medium text-sm md:text-base">Loading Smart Reports...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">Profit-Saving Reports</h1>
        <p className="text-slate-500 text-[10px] md:text-sm font-medium mt-0.5 md:mt-1">Apna nuksan bachayein aur stock maintain rakhein.</p>
      </div>

      {/* Distributor Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
        {data.distributorStock.map((dist) => (
          <div key={dist._id} className="bg-white p-4 md:p-6 rounded-[20px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center group">
            <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-50 text-indigo-500 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 md:mr-5 group-hover:scale-110 transition-transform shrink-0">
              <Truck className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Distributor {dist._id}</p>
              <div className="flex items-center space-x-2 md:space-x-4 mt-0.5 md:mt-1">
                <span className="text-lg md:text-2xl font-extrabold text-slate-700 leading-none">
                  {dist.totalQuantity} <span className="text-[9px] md:text-sm font-medium text-slate-400">Items</span>
                </span>
                <span className="text-indigo-600 bg-indigo-50 px-1.5 md:px-2 py-0.5 md:py-1 rounded-md md:rounded-lg text-[9px] md:text-xs font-bold whitespace-nowrap">
                  {dist.totalItems} Brands
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        
        {/* Urgent Expiry Report (Laal List) */}
        <div className="bg-white rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-rose-100 overflow-hidden flex flex-col">
          <div className="bg-rose-50/50 p-4 md:p-6 border-b border-rose-100 flex items-center justify-between">
            <h2 className="text-sm md:text-lg font-bold text-rose-700 flex items-center">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2 shrink-0" /> <span className="truncate">60 Days Expiry Alert</span>
            </h2>
            <span className="bg-rose-200 text-rose-800 text-[9px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full shrink-0 ml-2">
              {data.expiringSoon.length} Items
            </span>
          </div>
          
          <div className="p-1 md:p-2 max-h-[300px] md:max-h-[400px] overflow-y-auto">
            {data.expiringSoon.length === 0 ? (
              <p className="text-center text-slate-400 py-6 md:py-8 text-xs md:text-base font-medium">Koi bhi dawai jaldi expire nahi ho rahi! 🎉</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] md:text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="p-2.5 md:p-4 font-bold">Medicine</th>
                    <th className="p-2.5 md:p-4 font-bold">Batch</th>
                    <th className="p-2.5 md:p-4 font-bold text-right md:text-left">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.expiringSoon.map((med) => (
                    <tr key={med._id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="p-2.5 md:p-4 max-w-[120px] md:max-w-none">
                        <p className="font-bold text-slate-700 text-xs md:text-base leading-tight md:leading-normal truncate">{med.name}</p>
                        <p className="text-[9px] md:text-xs text-slate-400 mt-0.5 md:mt-0">Qty: <span className="font-bold text-rose-500">{med.quantity}</span></p>
                      </td>
                      <td className="p-2.5 md:p-4 text-[10px] md:text-sm font-medium text-slate-600 truncate max-w-[60px] md:max-w-none">{med.batch}</td>
                      <td className="p-2.5 md:p-4 flex justify-end md:justify-start">
                        <div className="flex items-center text-[9px] md:text-sm font-bold text-rose-600 bg-rose-50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl w-fit whitespace-nowrap">
                          <CalendarClock className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-1.5 shrink-0" />
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
        <div className="bg-white rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-amber-100 overflow-hidden flex flex-col mt-4 md:mt-0">
          <div className="bg-amber-50/50 p-4 md:p-6 border-b border-amber-100 flex items-center justify-between">
            <h2 className="text-sm md:text-lg font-bold text-amber-700 flex items-center">
              <TrendingDown className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2 shrink-0" /> <span className="truncate">Low Stock Alert</span>
            </h2>
            <span className="bg-amber-200 text-amber-800 text-[9px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full shrink-0 ml-2">
              {data.lowStock.length} Items
            </span>
          </div>
          
          <div className="p-1 md:p-2 max-h-[300px] md:max-h-[400px] overflow-y-auto">
            {data.lowStock.length === 0 ? (
              <p className="text-center text-slate-400 py-6 md:py-8 text-xs md:text-base font-medium">Stock ekdum full hai! 📦</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] md:text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="p-2.5 md:p-4 font-bold">Medicine</th>
                    <th className="p-2.5 md:p-4 font-bold">Distributor</th>
                    <th className="p-2.5 md:p-4 font-bold text-right">Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.lowStock.map((med) => (
                    <tr key={med._id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-2.5 md:p-4 max-w-[120px] md:max-w-none">
                        <p className="font-bold text-slate-700 text-xs md:text-base leading-tight md:leading-normal truncate">{med.name}</p>
                        <p className="text-[9px] md:text-xs text-slate-400 mt-0.5 md:mt-0 truncate">Batch: {med.batch}</p>
                      </td>
                      <td className="p-2.5 md:p-4">
                        <span className="bg-slate-100 text-slate-600 text-[9px] md:text-xs font-bold px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-md md:rounded-lg inline-block truncate max-w-[70px] md:max-w-[120px]">
                          Dist {med.distributor}
                        </span>
                      </td>
                      <td className="p-2.5 md:p-4 text-right">
                        <span className="text-sm md:text-lg font-extrabold text-amber-500 bg-amber-50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl">
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