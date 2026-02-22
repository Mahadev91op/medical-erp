"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCards from "@/components/dashboard/StatCards";
import ExpiryAlerts from "@/components/dashboard/ExpiryAlerts";
import SalesChart from "@/components/dashboard/SalesChart";

export default function Dashboard() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Manual Refresh Logic
  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh(); // Next.js ke server se fresh data fetch karta hai
    setTimeout(() => setIsRefreshing(false), 1000); // 1 sec spin animation ke liye
  };

  // Auto Refresh Logic (Har 30 seconds me background me data update hoga)
  useEffect(() => {
    const interval = setInterval(() => {
      router.refresh();
    }, 30000); // 30000 ms = 30 seconds
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="space-y-4 md:space-y-8 max-w-7xl mx-auto relative">
      
      {/* 🔥 Manual Refresh Button (Top Right) 🔥 */}
      <div className="flex justify-end">
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
        {/* 1. Header Section */}
        <DashboardHeader />
      </div>

      {/* 2. Top Stats Cards */}
      <StatCards />

      {/* 3. Graph and Alerts Section (Responsive Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Sales Graph (Left side on PC, Top on Mobile) */}
        <SalesChart />

        {/* Expiry Alerts (Right side on PC, Bottom on Mobile) */}
        <ExpiryAlerts />
      </div>
    </div>
  );
}