"use client";
import React from "react";
import Link from "next/link";
import { 
  RefreshCw, Loader2, Database,
  Search, ShoppingCart, PackagePlus, FileText, 
  LayoutGrid, Package, AlertTriangle, Banknote, 
  Smartphone, CreditCard, ShieldCheck 
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import StatCards from "@/components/dashboard/StatCards";
import ExpiryAlerts from "@/components/dashboard/ExpiryAlerts";
import SalesChart from "@/components/dashboard/SalesChart";
import DashboardDetailModal from "@/components/dashboard/DashboardDetailModal";
import { Toaster } from "react-hot-toast";
import SuperAdmin from "./superadmin/page";
import useDashboard from "@/hooks/useDashboard";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";

export default function Dashboard() {
  const {
    session,
    status,
    isRefreshing,
    dashboardData,
    loading,
    showTermsModal,
    termsLoading,
    activeModalType,
    localSearchTerm,
    searchResults,
    searching,
    shopInfo,
    setLocalSearchTerm,
    setActiveModalType,
    handleRefresh,
    handleAcceptTermsUpdate,
    handleClearExpired,
    handleShareMorningAlert
  } = useDashboard();

  if (status === "loading") {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="font-medium">Loading session...</p>
      </div>
    );
  }

  if (session?.user?.role === "superadmin") {
    return <SuperAdmin />;
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto relative">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="flex justify-end gap-3 flex-wrap">
        {/* 🔄 REFRESH BUTTON */}
        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center text-xs md:text-sm font-bold bg-white border border-slate-200 text-slate-600 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl shadow-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all focus:outline-none z-10"
        >
          <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      <div className="mt-[-1rem] md:mt-[-2rem]">
        <DashboardHeader />
      </div>

      {dashboardData && (
        ((dashboardData.stats?.lowStockCount || 0) > 0 || 
         (dashboardData.stats?.expiringCount || 0) > 0 ||
         (dashboardData.stats?.outOfStockCount || 0) > 0 ||
         (dashboardData.stats?.expiredCount || 0) > 0)
      ) && (
        <div 
          onClick={() => setActiveModalType("morningAlerts")}
          className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/20 rounded-2xl md:rounded-3xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top duration-300 cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-500 text-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
              <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm md:text-base leading-tight flex items-center gap-2">
                <span>Morning Inventory Alert</span>
                <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">Click for summary →</span>
              </h3>
              <p className="text-slate-600 text-xs mt-1 font-semibold leading-relaxed">
                You have {dashboardData.stats.outOfStockCount || 0} out-of-stock items, {dashboardData.stats.lowStockCount || 0} low stock items, and {dashboardData.stats.expiringCount || 0} expiring items today.
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleShareMorningAlert();
            }}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs md:text-sm font-extrabold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer w-full md:w-auto shrink-0 animate-pulse hover:animate-none"
          >
            <Smartphone className="w-4 h-4 text-emerald-200" />
            Share Alerts to WhatsApp
          </button>
        </div>
      )}

      <StatCards stats={dashboardData?.stats} onCardClick={(type) => setActiveModalType(type)} />

      {/* Cockpit Actions and Instant Stock Search */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Quick Actions Grid */}
        <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 space-y-4">
          <h2 className="text-sm md:text-base font-bold text-slate-700 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-blue-500" />
            <span>Store Command Center</span>
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/sell" className="flex items-center gap-3 p-3 md:p-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-2xl transition-all shadow-sm border border-blue-100/50 hover:scale-[1.02] duration-200">
              <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
              <div>
                <p className="font-extrabold text-xs md:text-sm">Fast Billing</p>
                <p className="text-[9px] md:text-[10px] text-blue-600/80 font-medium">Scan & Sell</p>
              </div>
            </Link>
            <Link href="/purchase" className="flex items-center gap-3 p-3 md:p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl transition-all shadow-sm border border-indigo-100/50 hover:scale-[1.02] duration-200">
              <PackagePlus className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
              <div>
                <p className="font-extrabold text-xs md:text-sm">New Purchase</p>
                <p className="text-[9px] md:text-[10px] text-indigo-600/80 font-medium">Add stock</p>
              </div>
            </Link>
            <Link href="/inventory" className="flex items-center gap-3 p-3 md:p-4 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-2xl transition-all shadow-sm border border-sky-100/50 hover:scale-[1.02] duration-200">
              <Package className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
              <div>
                <p className="font-extrabold text-xs md:text-sm">Inventory</p>
                <p className="text-[9px] md:text-[10px] text-sky-600/80 font-medium">Manage stock</p>
              </div>
            </Link>
            <Link href="/reports" className="flex items-center gap-3 p-3 md:p-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl transition-all shadow-sm border border-slate-200/50 hover:scale-[1.02] duration-200">
              <FileText className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
              <div>
                <p className="font-extrabold text-xs md:text-sm">Reports</p>
                <p className="text-[9px] md:text-[10px] text-slate-500 font-medium">Store analysis</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Instant Medicine Locator */}
        <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 space-y-3.5 flex flex-col justify-between">
          <div>
            <h2 className="text-sm md:text-base font-bold text-slate-700 flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-500" />
              <span>Instant Stock Finder</span>
            </h2>
            <div className="relative mt-2">
              <input 
                type="text" 
                placeholder="Search medicine name, barcode, batch..." 
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl pl-10 pr-4 py-2.5 md:py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-xs md:text-sm font-semibold"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              {searching && <Loader2 className="w-4 h-4 text-blue-500 absolute right-3.5 top-3.5 animate-spin" />}
            </div>
          </div>
          
          <div className="flex-1 mt-3">
            {localSearchTerm.trim() === "" ? (
              <p className="text-[10px] md:text-xs text-slate-400 font-medium text-center py-6">Type medicine name above to search instantly.</p>
            ) : searchResults.length === 0 ? (
              <p className="text-[10px] md:text-xs text-rose-500 font-medium text-center py-6">No medicine found matching &quot;{localSearchTerm}&quot;</p>
            ) : (
              <div className="space-y-2 max-h-[120px] overflow-y-auto">
                {searchResults.map((med) => {
                  const isExpired = med.expiryDate && new Date(med.expiryDate) < new Date();
                  const isOutOfStock = med.quantity <= 0;
                  const isExpiringSoon = !isExpired && med.expiryDate && new Date(med.expiryDate) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
                  const isLowStock = !isOutOfStock && med.quantity < 10;
                  
                  let badgeStyle = "bg-emerald-100 text-emerald-700 border border-emerald-200";
                  let label = `${med.quantity} in stock`;

                  if (isExpired) {
                    badgeStyle = "bg-rose-100 text-rose-700 border border-rose-200 animate-pulse";
                    label = "Expired";
                  } else if (isOutOfStock) {
                    badgeStyle = "bg-rose-100 text-rose-700 border border-rose-200";
                    label = "Out of stock";
                  } else if (isExpiringSoon) {
                    badgeStyle = "bg-amber-100 text-amber-700 border border-amber-200";
                    label = `Expiring (${med.quantity} left)`;
                  } else if (isLowStock) {
                    badgeStyle = "bg-amber-100 text-amber-700 border border-amber-200";
                    label = `Low Stock (${med.quantity})`;
                  }

                  return (
                    <div key={med._id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[10px] md:text-xs hover:border-blue-200 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800">{med.name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Batch: {med.batch} | Exp: {new Date(med.expiryDate).toLocaleDateString('en-GB', { month: '2-digit', year: '2-digit' })}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 font-extrabold rounded-md ${badgeStyle}`}>
                          {label}
                        </span>
                        {med.rackNumber && <p className="text-[9px] text-slate-500 font-medium mt-0.5">Rack: {med.rackNumber}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sales Trend Chart & Expiry Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <SalesChart data={dashboardData?.salesData} onCardClick={(type) => setActiveModalType(type)} />
        <ExpiryAlerts alerts={dashboardData?.expiringMedicines} onCardClick={(type) => setActiveModalType(type)} />
      </div>

      {/* Today's Sales Cockpit & Reorder Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Today's Sales Performance & Payment modes */}
        <div 
          onClick={() => setActiveModalType("todayRevenue")}
          className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-blue-200 transition-colors cursor-pointer space-y-4 group"
        >
          <div className="flex justify-between items-center border-b border-slate-50 pb-2">
            <h2 className="text-sm md:text-base font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Today&apos;s Sales Dashboard</h2>
            <span className="text-[9px] md:text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">Click details →</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50/50 p-2.5 rounded-xl text-center border border-slate-100">
              <Banknote className="w-5 h-5 mx-auto text-blue-600 mb-1" />
              <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase">Cash Sales</p>
              <p className="text-xs md:text-sm font-extrabold text-slate-700 mt-0.5">₹{(dashboardData?.stats?.todayPaymentBreakdown?.Cash || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-50/50 p-2.5 rounded-xl text-center border border-slate-100">
              <Smartphone className="w-5 h-5 mx-auto text-indigo-500 mb-1" />
              <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase">UPI Sales</p>
              <p className="text-xs md:text-sm font-extrabold text-slate-700 mt-0.5">₹{(dashboardData?.stats?.todayPaymentBreakdown?.UPI || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-slate-50/50 p-2.5 rounded-xl text-center border border-slate-100">
              <CreditCard className="w-5 h-5 mx-auto text-amber-500 mb-1" />
              <p className="text-[8px] md:text-[9px] text-slate-400 font-bold uppercase">Card Sales</p>
              <p className="text-xs md:text-sm font-extrabold text-slate-700 mt-0.5">₹{(dashboardData?.stats?.todayPaymentBreakdown?.Card || 0).toLocaleString('en-IN')}</p>
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
                      <span className="text-slate-700 font-extrabold text-[11px] md:text-xs">₹{item.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Reorder Board (Out of Stock alert list) */}
        <div 
          onClick={() => setActiveModalType("outOfStock")}
          className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-amber-200 transition-colors cursor-pointer space-y-4 flex flex-col justify-between group"
        >
          <div>
            <div className="flex justify-between items-center border-b border-slate-50 pb-2">
              <h2 className="text-sm md:text-base font-bold text-slate-700 flex items-center gap-2 group-hover:text-amber-600 transition-colors">
                <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
                <span>Out of Stock / Reorder Alert</span>
              </h2>
              <span className="text-[9px] md:text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                {dashboardData?.stats?.outOfStockCount || 0} Products
              </span>
            </div>

            <div className="mt-3">
              {(!dashboardData?.reorderList || dashboardData.reorderList.length === 0) ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="font-semibold text-blue-600 bg-blue-50 px-4 py-3 rounded-2xl border border-blue-100 inline-block text-xs md:text-sm">
                    Perfect! No out-of-stock items. 📦
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[220px] overflow-y-auto">
                  {dashboardData.reorderList.map((med) => (
                    <div key={med._id} className="flex justify-between items-center p-3 bg-rose-50/50 border border-rose-100/50 rounded-2xl hover:bg-rose-50 transition-colors">
                      <div>
                        <p className="font-bold text-slate-800 text-xs md:text-sm">{med.name}</p>
                        <p className="text-[9px] md:text-[10px] text-slate-400 mt-0.5">Distributor: <span className="font-bold text-slate-600">{med.distributor}</span></p>
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
          
          {dashboardData?.stats?.outOfStockCount > 0 && (
            <button className="w-full text-center text-xs font-bold text-indigo-600 hover:text-indigo-700 pt-2 border-t border-slate-100 mt-2">
              View all out of stock products details →
            </button>
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
                  <div key={sess.deviceSessionId} className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${isThisDevice ? 'bg-blue-50/50 border-blue-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${sess.isOnline ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-800 text-[11px] md:text-xs flex items-center gap-1.5 truncate">
                          <span className="truncate">{sess.os} ({sess.browser})</span>
                          {isThisDevice && <span className="bg-blue-200 text-blue-800 text-[8px] font-extrabold px-1.5 py-0.5 rounded-sm shrink-0">THIS DEVICE</span>}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5 truncate">IP: {sess.ipAddress} | {sess.isOnline ? '🟢 Live' : '⚫ Offline'}</p>
                      </div>
                    </div>
                    {sess.isOnline ? (
                      <span className="bg-blue-100 text-blue-700 border border-blue-100 text-[8px] font-bold px-1.5 py-0.5 rounded-md shrink-0">ONLINE</span>
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

      {/* ⚠️ MANDATORY TERMS UPDATE ACCEPTANCE OVERLAY MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 select-none">
          <div className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100/80 p-6 md:p-8 space-y-6 animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mx-auto shadow-sm">
                <ShieldCheck className="w-8 h-8 animate-pulse" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Policies & Compliance Update</h2>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Required Action for MedERP License Access</p>
            </div>

            {/* Warning Info */}
            <div className="bg-blue-50 border border-blue-100/70 text-blue-800 text-xs font-semibold p-4 rounded-2xl leading-relaxed">
              We have updated the Terms of Service, SLA guidelines, Refund rules, and Privacy directives to maintain full compliance with the 
              <strong> Indian IT Act, GST regulations, and DPDP Act 2023</strong>. Please review the updated agreements below.
            </div>

            {/* Scrollable Terms Content */}
            <div className="flex-1 overflow-y-auto border border-slate-200/60 rounded-2xl p-4 bg-slate-50/50 space-y-4 max-h-[300px]">
              <h3 className="font-extrabold text-sm text-slate-800">MedERP & DevSamp Terms of Service (Summary)</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                By clicking &quot;Accept &amp; Proceed&quot;, you verify that you are a licensed pharmacist operating under valid drug license formats. You agree that DevSamp Technologies is not liable for wrong drug dosage dispensation or manual GST slab inputs configured on the billing terminal. All customer billing queue databases are encrypted to ensure data confidentiality.
              </p>
              <div className="text-xs text-slate-400 font-extrabold space-y-2 pt-2 border-t border-slate-200">
                <p>1. Terms & Conditions version: v1.0</p>
                <p>2. DPA (Data Processing) compliance version: v1.0</p>
                <p>3. SLA Response timelines version: v1.0</p>
              </div>
              <p className="text-xs text-slate-550 font-medium">
                You can review the individual legal pages in detail in the <Link href="/legal" target="_blank" className="text-blue-500 font-bold underline">Legal Hub Portal</Link>.
              </p>
            </div>

            {/* Checkbox and Accept Button */}
            <div className="space-y-4 pt-2">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  id="accept-terms-modal-checkbox"
                  className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
                />
                <span className="text-xs text-slate-500 font-semibold leading-relaxed">
                  I agree that I have read the terms, understand the liability disclaimers, and accept the legal policies to continue operations.
                </span>
              </label>

              <button
                onClick={async () => {
                  const cb = document.getElementById("accept-terms-modal-checkbox");
                  if (!cb || !cb.checked) {
                    toast.error("Please tick the checkbox to agree before proceeding!");
                    return;
                  }
                  await handleAcceptTermsUpdate();
                }}
                disabled={termsLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider py-4 rounded-2xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {termsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept & Proceed"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 📊 INTERACTIVE DASHBOARD DETAIL DRILLDOWN MODAL */}
      <DashboardDetailModal 
        isOpen={!!activeModalType}
        onClose={() => setActiveModalType(null)}
        modalType={activeModalType}
        data={dashboardData}
        stats={dashboardData?.stats}
        onClearExpired={handleClearExpired}
      />

    </div>
  );
}
