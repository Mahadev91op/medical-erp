"use client";
import { useEffect, useState } from "react";
import { 
  RefreshCw, Loader2, Database, AlertOctagon, 
  Search, ShoppingCart, PackagePlus, FileText, 
  LayoutGrid, Package, AlertTriangle, Banknote, 
  Smartphone, CreditCard, Award 
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCards from "@/components/dashboard/StatCards";
import ExpiryAlerts from "@/components/dashboard/ExpiryAlerts";
import SalesChart from "@/components/dashboard/SalesChart";
import toast, { Toaster } from "react-hot-toast";
import { useSession } from "next-auth/react";
import SuperAdmin from "./superadmin/page";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Instant search states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setDashboardData(data);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error) {
      toast.error("Network or Server error occurred!");
    }
    if (!silent) setLoading(false);
  };

  const handleSearch = async (val) => {
    setSearchTerm(val);
    if (!val.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/medicine?search=${encodeURIComponent(val)}&limit=5`);
      const resData = await res.json();
      if (resData.success) {
        setSearchResults(resData.medicines);
      }
    } catch (err) {
      console.error(err);
    }
    setSearching(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData(true);
    if (searchTerm.trim()) {
      await handleSearch(searchTerm);
    }
    setTimeout(() => setIsRefreshing(false), 500); 
  };

  useEffect(() => {
    if (session?.user?.role === "superadmin") return;
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000); 
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  // 📦 BACKUP LENE KA FUNCTION
  const handleBackup = async () => {
    const toastId = toast.loading("⏳ Saving database backup...");
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      
      if (data.success) {
        const blob = new Blob([JSON.stringify(data.backupData, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || `backup_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast.success("🎉 Backup saved to device successfully!", { id: toastId, duration: 5000 });
      } else {
        toast.error("❌ Backup failed!", { id: toastId, duration: 6000 });
        alert(`BACKUP FAILED!\n\nReason:\n${data.error || data.details}`);
      }
    } catch (error) {
      toast.error("Network or Server error occurred!", { id: toastId });
    }
  };

  // ⚠️ DATA WAPAS LAANE (RESTORE) KA FUNCTION
  const handleRestore = async () => {
    const isConfirm = window.confirm(
      "⚠️ WARNING (DANGER) ⚠️\n\n" +
      "Are you sure you want to RESTORE the backup?\n\n" +
      "This action will DELETE all your current data and replace it with the backup saved in your D Drive!\n\n" +
      "Please click OK only if you really want to restore the previous data."
    );

    if (!isConfirm) return;

    const toastId = toast.loading("⏳ Restoring old data. Please wait...");
    try {
      const res = await fetch("/api/restore");
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message, { id: toastId, duration: 6000 });
        alert(`✅ RESTORE SUCCESSFUL!\n\n${data.message}`);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error("❌ Restore failed! Check backup in D drive.", { id: toastId, duration: 6000 });
        alert(`RESTORE FAILED!\n\nReason:\n${data.stderr || data.error}`);
      }
    } catch (error) {
      toast.error("Network or Server error occurred!", { id: toastId });
    }
  };

  if (status === "loading") {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="font-medium">Loading session...</p>
      </div>
    );
  }

  if (session?.user?.role === "superadmin") {
    return <SuperAdmin />;
  }

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto relative">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="flex justify-end gap-3 flex-wrap">
        {/* 🔄 REFRESH BUTTON */}
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center text-xs md:text-sm font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl shadow-sm hover:bg-slate-50 hover:text-emerald-600 hover:border-emerald-200 transition-all focus:outline-none z-10"
        >
          <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 ${isRefreshing ? 'animate-spin text-emerald-500' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className="mt-[-1rem] md:mt-[-2rem]">
        <DashboardHeader />
      </div>

      <StatCards stats={dashboardData?.stats} />

      {/* Cockpit Actions and Instant Stock Search */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Quick Actions Grid */}
        <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 space-y-4">
          <h2 className="text-sm md:text-base font-bold text-slate-700 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-500" />
            <span>Store Command Center</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <a href="/sell" className="flex items-center gap-3 p-3 md:p-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl transition-all shadow-sm border border-emerald-100/50 hover:scale-[1.02] duration-200">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
              <div>
                <p className="font-extrabold text-xs md:text-sm">Fast Billing</p>
                <p className="text-[9px] md:text-[10px] text-emerald-600/80 font-medium">Scan & Sell</p>
              </div>
            </a>
            <a href="/purchase" className="flex items-center gap-3 p-3 md:p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl transition-all shadow-sm border border-indigo-100/50 hover:scale-[1.02] duration-200">
              <PackagePlus className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
              <div>
                <p className="font-extrabold text-xs md:text-sm">New Purchase</p>
                <p className="text-[9px] md:text-[10px] text-indigo-600/80 font-medium">Add stock</p>
              </div>
            </a>
            <a href="/inventory" className="flex items-center gap-3 p-3 md:p-4 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-2xl transition-all shadow-sm border border-amber-100/50 hover:scale-[1.02] duration-200">
              <Package className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
              <div>
                <p className="font-extrabold text-xs md:text-sm">Inventory</p>
                <p className="text-[9px] md:text-[10px] text-amber-600/80 font-medium">Manage stock</p>
              </div>
            </a>
            <a href="/reports" className="flex items-center gap-3 p-3 md:p-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-2xl transition-all shadow-sm border border-rose-100/50 hover:scale-[1.02] duration-200">
              <FileText className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
              <div>
                <p className="font-extrabold text-xs md:text-sm">Reports</p>
                <p className="text-[9px] md:text-[10px] text-rose-600/80 font-medium">Store analysis</p>
              </div>
            </a>
          </div>
        </div>

        {/* Instant Medicine Locator */}
        <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 space-y-3.5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm md:text-base font-bold text-slate-700 flex items-center gap-2">
              <Search className="w-5 h-5 text-emerald-500" />
              <span>Instant Stock Finder</span>
            </h2>
            <div className="relative mt-2">
              <input 
                type="text" 
                placeholder="Search medicine name, barcode, batch..." 
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl pl-10 pr-4 py-2.5 md:py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-xs md:text-sm font-semibold"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              {searching && <Loader2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-3.5 animate-spin" />}
            </div>
          </div>
          
          <div className="flex-1 mt-3">
            {searchTerm.trim() === "" ? (
              <p className="text-[10px] md:text-xs text-slate-400 font-medium text-center py-6">Type medicine name above to search instantly.</p>
            ) : searchResults.length === 0 ? (
              <p className="text-[10px] md:text-xs text-rose-500 font-medium text-center py-6">No medicine found matching &quot;{searchTerm}&quot;</p>
            ) : (
              <div className="space-y-2 max-h-[120px] overflow-y-auto">
                {searchResults.map((med) => (
                  <div key={med._id} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] md:text-xs hover:border-emerald-200 transition-colors">
                    <div>
                      <p className="font-bold text-slate-800">{med.name}</p>
                      <p className="text-[9px] text-slate-400 mt-0.5">Batch: {med.batch} | Exp: {new Date(med.expiryDate).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' })}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-0.5 font-extrabold rounded-md ${med.quantity <= 0 ? 'bg-rose-100 text-rose-700' : med.quantity < 10 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {med.quantity} in stock
                      </span>
                      {med.rackNumber && <p className="text-[9px] text-slate-505 font-medium mt-0.5">Rack: {med.rackNumber}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sales Trend Chart & Expiry Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <SalesChart data={dashboardData?.salesData} />
        <ExpiryAlerts alerts={dashboardData?.expiringMedicines} />
      </div>

      {/* Today's Sales Cockpit & Reorder Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Today's Sales Performance & Payment modes */}
        <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
            <h2 className="text-sm md:text-base font-bold text-slate-700">Today&apos;s Sales Dashboard</h2>
            <span className="text-[9px] md:text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold">Live Data</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50/50 p-2.5 rounded-xl text-center border border-slate-100">
              <Banknote className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
              <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase">Cash Sales</p>
              <p className="text-xs md:text-sm font-extrabold text-slate-750 mt-0.5">₹{(dashboardData?.stats?.todayPaymentBreakdown?.Cash || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-50/50 p-2.5 rounded-xl text-center border border-slate-100">
              <Smartphone className="w-5 h-5 mx-auto text-indigo-500 mb-1" />
              <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase">UPI Sales</p>
              <p className="text-xs md:text-sm font-extrabold text-slate-750 mt-0.5">₹{(dashboardData?.stats?.todayPaymentBreakdown?.UPI || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-50/50 p-2.5 rounded-xl text-center border border-slate-100">
              <CreditCard className="w-5 h-5 mx-auto text-amber-500 mb-1" />
              <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase">Card Sales</p>
              <p className="text-xs md:text-sm font-extrabold text-slate-750 mt-0.5">₹{(dashboardData?.stats?.todayPaymentBreakdown?.Card || 0).toLocaleString('en-IN')}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Top Selling Products Today</p>
            {(!dashboardData?.topSellingToday || dashboardData.topSellingToday.length === 0) ? (
              <p className="text-[10px] md:text-xs text-slate-400 text-center py-4 font-medium">No sales recorded yet today.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {dashboardData.topSellingToday.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 text-xs font-medium">
                    <div className="truncate pr-3 max-w-[150px]">
                      <p className="text-slate-800 font-bold truncate text-[11px] md:text-xs">{item.name}</p>
                    </div>
                    <div className="flex gap-2.5 items-center shrink-0">
                      <span className="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-extrabold">{item.quantity} pcs</span>
                      <span className="text-slate-750 font-extrabold text-[11px] md:text-xs">₹{item.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Reorder Board (Out of Stock alert list) */}
        <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h2 className="text-sm md:text-base font-bold text-slate-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                <span>Out of Stock / Reorder Alert</span>
              </h2>
              <span className="text-[9px] md:text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                {dashboardData?.stats?.outOfStockCount || 0} Products
              </span>
            </div>

            <div className="mt-3">
              {(!dashboardData?.reorderList || dashboardData.reorderList.length === 0) ? (
                <div className="text-center py-12 text-slate-450">
                  <p className="font-semibold text-emerald-600 bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100 inline-block text-xs md:text-sm">
                    Perfect! No out-of-stock items. 📦
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {dashboardData.reorderList.map((med) => (
                    <div key={med._id} className="flex justify-between items-center p-3 bg-rose-50/50 border border-rose-100/50 rounded-2xl hover:bg-rose-50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800 text-xs md:text-sm">{med.name}</p>
                        <p className="text-[9px] md:text-[10px] text-slate-450 mt-0.5">Distributor: <span className="font-bold text-slate-605">{med.distributor}</span></p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] md:text-xs font-bold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg">
                          Out of stock
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {dashboardData?.stats?.outOfStockCount > 5 && (
            <a href="/reports" className="block text-center text-xs font-bold text-indigo-655 hover:text-indigo-755 hover:underline pt-2 border-t border-slate-100 mt-2">
              View all {dashboardData.stats.outOfStockCount} out of stock products in reports
            </a>
          )}
        </div>

        {/* Live Active Logged-in Devices Tracker */}
        <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h2 className="text-sm md:text-base font-bold text-slate-700 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-500 animate-pulse" />
                <span>Logged-in Devices ({dashboardData?.activeSessions?.length || 1})</span>
              </h2>
              <span className="text-[9px] md:text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Active Sessions</span>
            </div>

            <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto">
              {dashboardData?.activeSessions?.map((sess) => {
                const isThisDevice = typeof window !== 'undefined' && localStorage.getItem('device_session_id') === sess.deviceSessionId;
                return (
                  <div key={sess.deviceSessionId} className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${isThisDevice ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${sess.isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-[11px] md:text-xs flex items-center gap-1.5 truncate">
                          <span className="truncate">{sess.os} ({sess.browser})</span>
                          {isThisDevice && <span className="bg-emerald-200 text-emerald-805 text-[8px] font-extrabold px-1.5 py-0.5 rounded-sm shrink-0">THIS DEVICE</span>}
                        </p>
                        <p className="text-[9px] text-slate-450 mt-0.5 truncate">IP: {sess.ipAddress} | {sess.isOnline ? '🟢 Live' : '⚫ Offline'}</p>
                      </div>
                    </div>
                    {sess.isOnline ? (
                      <span className="bg-emerald-100 text-emerald-700 border border-emerald-100 text-[8px] font-bold px-1.5 py-0.5 rounded-md shrink-0">ONLINE</span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[8px] font-bold px-1.5 py-0.5 rounded-md shrink-0">OFFLINE</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="pt-2.5 border-t border-slate-100 mt-2 flex items-center justify-between flex-wrap gap-2 text-[10px] md:text-xs">
            <span className="font-bold text-slate-500 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span>My Storage Space:</span>
            </span>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] md:text-xs font-extrabold px-2.5 py-0.5 rounded-lg shadow-sm">
              {dashboardData?.stats?.dataSizeFormatted || "0 Bytes"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
