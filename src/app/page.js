"use client";
import { useEffect, useState } from "react";
import { RefreshCw, Loader2, Database, AlertOctagon } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCards from "@/components/dashboard/StatCards";
import ExpiryAlerts from "@/components/dashboard/ExpiryAlerts";
import SalesChart from "@/components/dashboard/SalesChart";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      fetchDashboardData(true);
    }, 30000); 
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData(true);
    setTimeout(() => setIsRefreshing(false), 500); 
  };

  // 📦 BACKUP LENE KA FUNCTION
  const handleBackup = async () => {
    const toastId = toast.loading("⏳ Saving database backup...");
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message, { id: toastId, duration: 5000 });
        console.log("✅ Backup Logs:", data.debug); 
      } else {
        toast.error("❌ Backup failed! Press F12 to check console.", { id: toastId, duration: 6000 });
        alert(`BACKUP FAILED!\n\nReason:\n${data.stderr || data.details}`);
      }
    } catch (error) {
      toast.error("Network or Server error occurred!", { id: toastId });
    }
  };

  // ⚠️ DATA WAPAS LAANE (RESTORE) KA FUNCTION
  const handleRestore = async () => {
    // 🚀 ENGLISH TRANSLATION: Popup text is now in English
    const isConfirm = window.confirm(
      "⚠️ WARNING (DANGER) ⚠️\n\n" +
      "Are you sure you want to RESTORE the backup?\n\n" +
      "This action will DELETE all your current data and replace it with the backup saved in your D Drive!\n\n" +
      "Please click OK only if you really want to restore the previous data."
    );

    if (!isConfirm) return; // Agar user Cancel kar de toh ruk jao

    const toastId = toast.loading("⏳ Restoring old data. Please wait...");
    try {
      const res = await fetch("/api/restore");
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message, { id: toastId, duration: 6000 });
        // Restore hone ke baad website ko naye data ke sath refresh karo
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error("❌ Restore failed! Check backup in D drive.", { id: toastId, duration: 6000 });
        alert(`RESTORE FAILED!\n\nReason:\n${data.stderr || data.error}`);
      }
    } catch (error) {
      toast.error("Network or Server error occurred!", { id: toastId });
    }
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-8 max-w-7xl mx-auto relative">
      
      <div className="flex justify-end gap-3 flex-wrap">
        
        {/* ⚠️ RESTORE BUTTON */}
        <button 
          onClick={handleRestore}
          className="flex items-center text-xs md:text-sm font-bold bg-rose-600 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl shadow-sm hover:bg-rose-700 transition-all focus:outline-none z-10"
        >
          <AlertOctagon className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
          Restore Backup
        </button>

        {/* 📦 BACKUP BUTTON */}
        <button 
          onClick={handleBackup}
          className="flex items-center text-xs md:text-sm font-bold bg-slate-800 text-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl shadow-sm hover:bg-slate-700 transition-all focus:outline-none z-10"
        >
          <Database className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" />
          Save Backup
        </button>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <SalesChart data={dashboardData?.salesData} />
        <ExpiryAlerts alerts={dashboardData?.expiringMedicines} />
      </div>
    </div>
  );
}