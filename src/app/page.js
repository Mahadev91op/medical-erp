"use client";
import { useState, useEffect } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCards from "@/components/dashboard/StatCards";
import ExpiryAlerts from "@/components/dashboard/ExpiryAlerts";
import SalesChart from "@/components/dashboard/SalesChart";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        if (json.success) {
          setData(json);
        }
      } catch (error) {
        console.error("Dashboard data fetch error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="font-medium">Dashboard Prepare Ho Raha Hai...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Header Section */}
      <DashboardHeader />

      {/* 2. Top Stats Cards (Live Data pass kiya) */}
      <StatCards stats={data?.stats} />

      {/* 3. Graph aur Alerts ek sath grid mein */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Graph */}
        <SalesChart data={data?.salesData} />

        {/* Expiry Alerts */}
        <ExpiryAlerts alerts={data?.expiringMedicines} />
      </div>
    </div>
  );
}