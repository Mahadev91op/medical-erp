"use client";
import { useState, useEffect } from "react";
import { AlertTriangle, TrendingDown, Truck, Loader2, CalendarClock, RefreshCw, Search, X, IndianRupee, ShoppingCart, PackageOpen, Award, Package, Receipt, TrendingUp } from "lucide-react";

export default function Reports() {
  // `todayOverview` state me add kar diya
  const [data, setData] = useState({ expiringSoon: [], lowStock: [], distributorStock: [], todayOverview: {} });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAllDistributors, setShowAllDistributors] = useState(false);
  const [distributorSearch, setDistributorSearch] = useState("");

  useEffect(() => {
    fetchReports();
    const interval = setInterval(() => {
      fetchReports(true);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch("/api/reports", { cache: "no-store" });
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    }
    if (!isSilent) setLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReports(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredDistributors = data.distributorStock?.filter((dist) =>
    dist._id?.toLowerCase().includes(distributorSearch.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin text-emerald-500 mb-3 md:mb-4" />
        <p className="font-medium text-sm md:text-base">Loading Smart Reports...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">Profit & Insights Reports</h1>
          <p className="text-slate-500 text-[10px] md:text-sm font-medium mt-0.5 md:mt-1">Track distributor performance, prevent losses, and manage stock.</p>
        </div>
        
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center text-xs md:text-sm font-bold bg-white border border-slate-200 text-slate-600 px-3 py-2 md:px-4 md:py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200 transition-all focus:outline-none w-full md:w-auto shrink-0"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {/* NEW: Today's Flash Report (Daily Insights) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
        {/* Revenue */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 md:p-5 rounded-[20px] md:rounded-2xl shadow-lg text-white flex items-center hover:shadow-emerald-500/30 transition-shadow">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4 shrink-0">
                <IndianRupee className="w-6 h-6 text-white" />
            </div>
            <div>
                <p className="text-emerald-100 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Today's Profit / Revenue</p>
                <p className="text-xl md:text-2xl font-extrabold flex items-center">
                    ₹ {(data.todayOverview?.revenue || 0).toLocaleString('en-IN')}
                </p>
            </div>
        </div>
        
        {/* Items Sold */}
        <div className="bg-white p-4 md:p-5 rounded-[20px] md:rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mr-4 shrink-0">
                <Package className="w-6 h-6 text-indigo-500" />
            </div>
            <div>
                <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Items Sold Today</p>
                <p className="text-xl md:text-2xl font-extrabold text-slate-700">
                    {data.todayOverview?.itemsSold || 0}
                </p>
            </div>
        </div>

        {/* Bills Generated */}
        <div className="bg-white p-4 md:p-5 rounded-[20px] md:rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center">
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center mr-4 shrink-0">
                <Receipt className="w-6 h-6 text-amber-500" />
            </div>
            <div>
                <p className="text-slate-400 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Total Bills Generated</p>
                <p className="text-xl md:text-2xl font-extrabold text-slate-700">
                    {data.todayOverview?.billsGenerated || 0}
                </p>
            </div>
        </div>
      </div>

      {/* Top Performing Distributors Section */}
      <div className="space-y-3 md:space-y-4 pt-2">
        <h2 className="text-sm md:text-lg font-bold text-slate-700">Top Performing Distributors</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-5">
          {data.distributorStock?.slice(0, 2).map((dist, index) => (
            <div key={dist._id} className="relative bg-white p-4 md:p-5 rounded-[20px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col group hover:border-indigo-100 transition-all">
              
              {index === 0 && (dist?.revenueGenerated || 0) > 0 && (
                <div className="absolute -top-3 -right-2 md:-right-4 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] md:text-xs font-bold px-3 py-1 md:py-1.5 rounded-full shadow-lg flex items-center z-10 animate-bounce">
                  <Award className="w-3 h-3 md:w-4 md:h-4 mr-1" /> Top Earner
                </div>
              )}

              <div className="flex items-center mb-4 border-b border-slate-50 pb-4">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 md:mr-4 shrink-0 transition-transform group-hover:scale-105 ${index === 0 ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                  <Truck className="w-6 h-6 md:w-7 md:h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider truncate">Distributor</p>
                  <p className="text-lg md:text-xl font-extrabold text-slate-800 leading-none truncate mt-0.5">{dist._id}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Revenue</p>
                  <p className="text-base md:text-xl font-extrabold text-emerald-600 flex items-center justify-end">
                    <IndianRupee className="w-3 h-3 md:w-4 md:h-4 mr-0.5" />
                    {(dist?.revenueGenerated || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 md:gap-4 bg-slate-50/50 p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-slate-50/80">
                <div className="flex flex-col p-1.5 md:p-2 bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-100">
                  <span className="flex items-center text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mb-1">
                    <ShoppingCart className="w-3 h-3 mr-1 text-indigo-400" /> Items Sold
                  </span>
                  <span className="text-sm md:text-base font-extrabold text-slate-700">{dist?.soldQuantity || 0}</span>
                </div>
                <div className="flex flex-col p-1.5 md:p-2 bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-100">
                  <span className="flex items-center text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mb-1">
                    <PackageOpen className="w-3 h-3 mr-1 text-amber-500" /> Left in Stock
                  </span>
                  <span className="text-sm md:text-base font-extrabold text-slate-700">{dist.totalQuantity || 0} <span className="text-[9px] md:text-[10px] font-medium text-slate-400">({dist.totalItems || 0} Brands)</span></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {data.distributorStock?.length > 2 && (
          <div className="flex justify-end mt-2 md:mt-0">
            <button
              onClick={() => setShowAllDistributors(true)}
              className="text-xs md:text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 md:px-5 md:py-2.5 rounded-xl transition-colors flex items-center shadow-sm"
            >
              View All Distributors ({data.distributorStock.length})
            </button>
          </div>
        )}
      </div>

      {/* Alerts Grid (Ab isme 3 columns hain bade screen par jisse aapka Aaj ka Items list achhe se set ho) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        
        {/* NEW: Today's Sold Items List */}
        <div className="bg-white rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-emerald-100 overflow-hidden flex flex-col">
          <div className="bg-emerald-50/50 p-4 md:p-5 border-b border-emerald-100 flex items-center justify-between">
            <h2 className="text-sm md:text-lg font-bold text-emerald-700 flex items-center">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2 shrink-0" /> <span className="truncate">Today's Sold Items</span>
            </h2>
            <span className="bg-emerald-200 text-emerald-800 text-[9px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full shrink-0 ml-2">
              {data.todayOverview?.soldItems?.length || 0} Items
            </span>
          </div>
          
          <div className="p-1 md:p-2 max-h-[300px] md:max-h-[350px] overflow-y-auto custom-scrollbar">
            {(!data.todayOverview?.soldItems || data.todayOverview.soldItems.length === 0) ? (
              <p className="text-center text-slate-400 py-6 md:py-8 text-xs md:text-base font-medium">No sales yet today! 😴</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] md:text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="p-2.5 md:p-3 font-bold">Medicine</th>
                    <th className="p-2.5 md:p-3 font-bold text-center">Qty</th>
                    <th className="p-2.5 md:p-3 font-bold text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.todayOverview.soldItems.map((item, index) => (
                    <tr key={index} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="p-2.5 md:p-3 max-w-[120px]">
                        <p className="font-bold text-slate-700 text-xs md:text-sm leading-tight truncate" title={item.name}>{item.name}</p>
                      </td>
                      <td className="p-2.5 md:p-3 text-center">
                        <span className="text-[10px] md:text-sm font-extrabold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg inline-block">
                          {item.quantity}
                        </span>
                      </td>
                      <td className="p-2.5 md:p-3 flex justify-end">
                        <div className="flex items-center text-[10px] md:text-sm font-bold text-slate-700">
                          <IndianRupee className="w-3 h-3 mr-0.5 text-slate-400" />
                          {item.total.toLocaleString('en-IN')}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Urgent Expiry Report (Existing) */}
        <div className="bg-white rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-rose-100 overflow-hidden flex flex-col">
          <div className="bg-rose-50/50 p-4 md:p-5 border-b border-rose-100 flex items-center justify-between">
            <h2 className="text-sm md:text-lg font-bold text-rose-700 flex items-center">
              <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2 shrink-0" /> <span className="truncate">60 Days Expiry</span>
            </h2>
            <span className="bg-rose-200 text-rose-800 text-[9px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full shrink-0 ml-2">
              {data.expiringSoon?.length || 0}
            </span>
          </div>
          
          <div className="p-1 md:p-2 max-h-[300px] md:max-h-[350px] overflow-y-auto custom-scrollbar">
            {data.expiringSoon?.length === 0 ? (
              <p className="text-center text-slate-400 py-6 md:py-8 text-xs md:text-base font-medium">No medicines are expiring soon! 🎉</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] md:text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="p-2.5 md:p-3 font-bold">Medicine</th>
                    <th className="p-2.5 md:p-3 font-bold text-right md:text-left">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.expiringSoon?.map((med) => (
                    <tr key={med._id} className="hover:bg-rose-50/30 transition-colors">
                      <td className="p-2.5 md:p-3 max-w-[120px] md:max-w-none">
                        <p className="font-bold text-slate-700 text-xs md:text-sm leading-tight md:leading-normal truncate" title={med.name}>{med.name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Qty: <span className="font-bold text-rose-500">{med.quantity}</span> | {med.batch}</p>
                      </td>
                      <td className="p-2.5 md:p-3 flex justify-end md:justify-start">
                        <div className="flex items-center text-[9px] md:text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1.5 rounded-lg w-fit whitespace-nowrap">
                          <CalendarClock className="w-3 h-3 mr-1 shrink-0" />
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

        {/* Low Stock Report (Existing) */}
        <div className="bg-white rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-amber-100 overflow-hidden flex flex-col mt-4 md:mt-0 lg:mt-0">
          <div className="bg-amber-50/50 p-4 md:p-5 border-b border-amber-100 flex items-center justify-between">
            <h2 className="text-sm md:text-lg font-bold text-amber-700 flex items-center">
              <TrendingDown className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2 shrink-0" /> <span className="truncate">Low Stock</span>
            </h2>
            <span className="bg-amber-200 text-amber-800 text-[9px] md:text-xs font-bold px-2 py-1 md:px-3 md:py-1 rounded-full shrink-0 ml-2">
              {data.lowStock?.length || 0}
            </span>
          </div>
          
          <div className="p-1 md:p-2 max-h-[300px] md:max-h-[350px] overflow-y-auto custom-scrollbar">
            {data.lowStock?.length === 0 ? (
              <p className="text-center text-slate-400 py-6 md:py-8 text-xs md:text-base font-medium">All stock levels are optimal! 📦</p>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[9px] md:text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="p-2.5 md:p-3 font-bold">Medicine</th>
                    <th className="p-2.5 md:p-3 font-bold text-right">Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.lowStock?.map((med) => (
                    <tr key={med._id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="p-2.5 md:p-3 max-w-[120px] md:max-w-none">
                        <p className="font-bold text-slate-700 text-xs md:text-sm leading-tight md:leading-normal truncate" title={med.name}>{med.name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5 truncate">Dist: {med.distributor}</p>
                      </td>
                      <td className="p-2.5 md:p-3 text-right">
                        <span className="text-sm md:text-base font-extrabold text-amber-500 bg-amber-50 px-2 py-1.5 rounded-xl inline-block">
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

      {/* Pop Up Modal (View All Distributors - Unchanged Logic) */}
      {showAllDistributors && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] md:rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-indigo-500" />
                Distributor Performance Board
              </h2>
              <button 
                onClick={() => setShowAllDistributors(false)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            <div className="p-4 md:p-6 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search distributor by name..."
                  value={distributorSearch}
                  onChange={(e) => setDistributorSearch(e.target.value)}
                  className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium text-slate-700"
                />
              </div>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50/30">
              {filteredDistributors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Search className="w-10 h-10 mb-3 text-slate-300" />
                  <p className="text-sm md:text-base font-medium">No distributors found matching "{distributorSearch}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDistributors.map((dist, index) => (
                    <div key={dist._id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col hover:shadow-md transition-all relative">
                      {index === 0 && (dist?.revenueGenerated || 0) > 0 && distributorSearch === "" && (
                        <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-400 to-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md z-10 flex items-center">
                          <Award className="w-3 h-3 mr-0.5" /> #1 Earner
                        </div>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3 truncate">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${index === 0 ? 'bg-amber-50 text-amber-500' : 'bg-indigo-50 text-indigo-500'}`}>
                            <Truck className="w-5 h-5" />
                          </div>
                          <span className="font-bold text-slate-700 text-sm truncate" title={dist._id}>{dist._id}</span>
                        </div>
                      </div>
                      <div className="space-y-2 mt-auto">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 flex items-center"><ShoppingCart className="w-3 h-3 mr-1 text-slate-400"/> Sold Units</span>
                          <span className="font-bold text-slate-700">{dist?.soldQuantity || 0}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 flex items-center"><PackageOpen className="w-3 h-3 mr-1 text-slate-400"/> Left Stock</span>
                          <span className="font-bold text-slate-700">{dist?.totalQuantity || 0}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex justify-between items-center mt-1">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue</span>
                          <span className="text-sm font-extrabold text-emerald-600 flex items-center">
                            <IndianRupee className="w-3 h-3 mr-0.5" />
                            {(dist?.revenueGenerated || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}