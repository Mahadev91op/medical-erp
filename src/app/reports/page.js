"use client";
import React, { useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { AlertTriangle, TrendingDown, Truck, Loader2, RefreshCw, Search, X, IndianRupee, ShoppingCart, PackageOpen, Award, Package, Receipt, TrendingUp, Printer, Trash2 } from "lucide-react";
import { formatExpiryDate } from "@/lib/formatDate";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Toaster } from "react-hot-toast";
import ReportDetailModal from "@/components/reports/ReportDetailModal";
import useReports from "@/hooks/useReports";
import ReportsSkeleton from "@/components/reports/ReportsSkeleton";
import ReportInvoicePrint from "@/components/reports/ReportInvoicePrint";
import ReportTabs from "@/components/reports/ReportTabs";
import { ExpiryPDFPrint, LowStockPDFPrint } from "@/components/reports/ReportPDFPrint";

export default function Reports() {
  const {
    data,
    loading,
    isRefreshing,
    isRefetching,
    activeReportTab,
    setActiveReportTab,
    printingInvoice,
    setPrintingInvoice,
    shopInfo,
    modalSearchQuery,
    localSearchQuery,
    setLocalSearchQuery,
    whatsappModalInvoice,
    setWhatsappModalInvoice,
    whatsappModalPhone,
    setWhatsappModalPhone,
    showAllDistributors,
    setShowAllDistributors,
    distributorSearch,
    setDistributorSearch,
    showTodayItems,
    setShowTodayItems,
    showSoldItemsModal,
    setShowSoldItemsModal,
    showExpiryModal,
    setShowExpiryModal,
    showLowStockModal,
    setShowLowStockModal,
    showExpiredModal,
    setShowExpiredModal,
    showOutOfStockModal,
    setShowOutOfStockModal,
    reportModalType,
    setReportModalType,
    dateFilter,
    setDateFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    customDays,
    setCustomDays,
    expiryMonths,
    setExpiryMonths,
    lowStockThreshold,
    setLowStockThreshold,
    triggerExpiryPrint,
    setTriggerExpiryPrint,
    triggerLowStockPrint,
    setTriggerLowStockPrint,
    itemsPage,
    setItemsPage,
    billsPage,
    setBillsPage,
    expiryPage,
    setExpiryPage,
    lowStockPage,
    setLowStockPage,
    ITEMS_PER_PAGE,
    reportsPdfConfig,
    filteredDistributors,
    handleDeleteMedicine,
    handleReportsWhatsAppSend,
    executeWhatsAppSend,
    handleRefresh,
    getSelectedDateLabel
  } = useReports();

  const printRef = useRef(null);
  const handleDownloadPDF = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Expiry_Report_${expiryMonths}_Months`,
  });

  const lowStockPrintRef = useRef(null);
  const handleDownloadLowStockPDF = useReactToPrint({
    contentRef: lowStockPrintRef,
    documentTitle: `Low_Stock_Report_Threshold_${lowStockThreshold}`,
  });

  const invoicePrintRef = useRef(null);
  const handlePrintInvoice = useReactToPrint({
    contentRef: invoicePrintRef,
    documentTitle: printingInvoice ? `Invoice_${printingInvoice.billNumber}` : 'Invoice',
  });

  useEffect(() => {
    if (triggerExpiryPrint) {
      const timer = setTimeout(() => {
        handleDownloadPDF();
        setTriggerExpiryPrint(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [triggerExpiryPrint, handleDownloadPDF, setTriggerExpiryPrint]);

  useEffect(() => {
    if (triggerLowStockPrint) {
      const timer = setTimeout(() => {
        handleDownloadLowStockPDF();
        setTriggerLowStockPrint(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [triggerLowStockPrint, handleDownloadLowStockPDF, setTriggerLowStockPrint]);

  useEffect(() => {
    if (printingInvoice) {
      handlePrintInvoice();
      setPrintingInvoice(null);
    }
  }, [printingInvoice, handlePrintInvoice, setPrintingInvoice]);

  const renderPagination = (currentPage, totalItems, onPageChange) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-between pt-4 pb-2 border-t border-slate-100 mt-4 bg-white px-4 py-3 sm:px-6 rounded-xl font-sans">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold">
              Showing <span className="font-bold text-slate-700">{Math.min(totalItems, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</span> to{" "}
              <span className="font-bold text-slate-700">{Math.min(totalItems, currentPage * ITEMS_PER_PAGE)}</span> of{" "}
              <span className="font-bold text-slate-700">{totalItems}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 rounded-l-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                First
              </button>
              <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-3 py-2 border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Prev
              </button>
              <span className="relative inline-flex items-center px-4 py-2 border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Next
              </button>
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-3 py-2 rounded-r-xl border border-slate-200 bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                Last
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 relative">
      <Toaster position="top-center" reverseOrder={false} />
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight flex items-center gap-2">
            Profit & Insights Reports
            {isRefetching && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
          </h1>
          <p className="text-slate-500 text-[10px] md:text-sm font-medium mt-0.5 md:mt-1">Track distributor performance, prevent losses, and manage stock.</p>
        </div>
        
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button 
            onClick={async () => {
              const start = customStartDate || new Date().toISOString().split('T')[0];
              const end = customEndDate || new Date().toISOString().split('T')[0];
              toast.loading("Generating GST Return Excel File...", { id: "gst-toast" });
              try {
                const url = `/api/reports/gst-export?startDate=${start}&endDate=${end}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error("Export failed");
                const blob = await res.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = downloadUrl;
                a.download = `GST_Return_Export_${dateFilter}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                toast.success("✅ GST Return Excel Downloaded!", { id: "gst-toast" });
              } catch (err) {
                toast.error("Failed to download GST Excel report", { id: "gst-toast" });
              }
            }}
            className="flex items-center justify-center text-xs md:text-sm font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 md:px-4 md:py-2.5 rounded-xl shadow-md shadow-emerald-500/20 transition-all focus:outline-none flex-1 md:flex-none cursor-pointer"
            title="Download GSTR-1, GSTR-3B & HSN Excel File"
          >
            <Receipt className="w-4 h-4 mr-1.5 shrink-0" />
            <span>Export GST Excel</span>
          </button>

          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center text-xs md:text-sm font-bold bg-white border border-slate-200 text-slate-600 px-3 py-2 md:px-4 md:py-2.5 rounded-xl shadow-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all focus:outline-none flex-1 md:flex-none shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Today's Flash Report (Daily Insights) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-5">
        {/* Revenue */}
        <div 
          onClick={() => { setActiveReportTab("bills"); setShowSoldItemsModal(true); }}
          className="bg-white p-4 md:p-5 rounded-[20px] md:rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center hover:border-blue-200 hover:shadow-md transition-all cursor-pointer group"
          title="Click to view total sales report"
        >
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mr-3 shrink-0 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-0.5">Sales Revenue</p>
            <p className="text-base md:text-lg font-extrabold text-slate-700">
              ₹{(data.todayOverview?.revenue || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Payment Breakdown Card */}
        <div 
          onClick={() => { setActiveReportTab("bills"); setShowSoldItemsModal(true); }}
          className="bg-white p-4 md:p-5 rounded-[20px] md:rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] border border-slate-100 flex flex-col justify-center hover:border-indigo-200 hover:shadow-md transition-all col-span-2 sm:col-span-1 cursor-pointer"
          title="Click for payment details"
        >
          <p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Payment Breakdown</span>
            <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-extrabold">Details →</span>
          </p>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-semibold flex items-center">💵 Cash</span>
              <span className="font-bold">₹{(data.todayOverview?.paymentBreakdown?.Cash || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-semibold flex items-center">📱 UPI</span>
              <span className="font-bold">₹{(data.todayOverview?.paymentBreakdown?.UPI || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span className="font-semibold flex items-center">💳 Card</span>
              <span className="font-bold">₹{(data.todayOverview?.paymentBreakdown?.Card || 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Stock Valuation */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 md:p-5 rounded-[20px] md:rounded-2xl shadow-lg text-white flex items-center hover:shadow-slate-800/30 transition-shadow">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mr-3 shrink-0">
            <Package className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-0.5">Stock Valuation</p>
            <p className="text-base md:text-lg font-extrabold text-white">
              ₹{(data.stockValuation || 0).toLocaleString('en-IN')}
            </p>
          </div>
        </div>
        
        {/* Items Sold */}
        <div 
          onClick={() => { setActiveReportTab("items"); setShowSoldItemsModal(true); }}
          className="bg-white p-4 md:p-5 rounded-[20px] md:rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center cursor-pointer hover:border-indigo-100 hover:shadow-md transition-all group"
          title="Click to view details"
        >
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mr-3 shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors text-indigo-500">
            <Package className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-0.5 truncate">Items Sold</p>
            <p className="text-base md:text-lg font-extrabold text-slate-700">
              {data.todayOverview?.itemsSold || 0} pcs
            </p>
          </div>
        </div>

        {/* Bills Generated */}
        <div 
          className="bg-white p-4 md:p-5 rounded-[20px] md:rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center cursor-pointer hover:border-amber-100 hover:shadow-md transition-all" 
          onClick={() => { setActiveReportTab("bills"); setShowSoldItemsModal(true); }} 
          title="Click to view details"
        >
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center mr-3 shrink-0 text-amber-500">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-slate-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-0.5">Total Bills</p>
            <p className="text-base md:text-lg font-extrabold text-slate-700">
              {data.todayOverview?.billsGenerated || 0} Bills
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Sales Chart */}
      {data.salesChartData && data.salesChartData.length > 0 && (
        <div className="bg-white p-4 md:p-6 rounded-[20px] md:rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] space-y-3 md:space-y-4">
          <div>
            <h2 className="text-sm md:text-base font-bold text-slate-700">Sales Trend Chart ({getSelectedDateLabel()})</h2>
            <p className="text-[10px] md:text-xs text-slate-400">Graphical visualization of pharmacy daily earnings over this date range.</p>
          </div>
          <div className="h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.salesChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        {/* Sold Items Report Card */}
        <div className="bg-white rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-blue-100 overflow-hidden flex flex-col">
          <div className="bg-blue-50/50 p-4 border-b border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm md:text-base font-bold text-blue-700 flex items-center min-w-0">
                <TrendingUp className="w-4 h-4 mr-1.5 shrink-0" /> 
                <span className="truncate">Sold Items Report</span>
              </h2>
              <span className="bg-blue-200 text-blue-800 text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0">
                {data.todayOverview?.transactions?.length || 0} Items
              </span>
            </div>
            
            <div className="flex flex-col gap-2 pt-1 border-t border-blue-100/50">
              <div className="flex items-center gap-1.5 w-full">
                <span className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-wider whitespace-nowrap">Filter:</span>
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-white border border-blue-200 text-blue-700 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 cursor-pointer w-full h-8"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="15days">Last 15 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="60days">Last 60 Days</option>
                  <option value="90days">Last 90 Days</option>
                  <option value="customDays">Custom Days Count</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-4 flex-1 flex flex-col justify-between min-h-[280px]">
            {(!data.todayOverview?.transactions || data.todayOverview.transactions.length === 0) ? (
              <p className="text-center text-slate-400 py-8 text-xs md:text-sm font-medium m-auto">No sales for this range! 😴</p>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[9px] md:text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-2 font-bold">Item & Details</th>
                      <th className="pb-2 font-bold text-center">Qty</th>
                      <th className="pb-2 font-bold text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.todayOverview.transactions.slice(0, 5).map((tx, index) => {
                      const txDate = new Date(tx.date);
                      const timeStr = txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                      const dateStr = txDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                      return (
                        <tr key={index} className="hover:bg-blue-50/30 transition-colors">
                          <td className="py-2.5 max-w-[140px] md:max-w-[160px]">
                            <p className="font-bold text-slate-700 text-xs md:text-sm leading-tight truncate" title={tx.name}>{tx.name}</p>
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-1 rounded">
                                {dateStr}
                              </span>
                              <span className="text-[9px] bg-slate-100 text-slate-500 font-semibold px-1 rounded">
                                {timeStr}
                              </span>
                              <span className={`text-[9px] font-bold px-1 rounded ${tx.paymentMethod === 'UPI' ? 'bg-indigo-50 text-indigo-600' : tx.paymentMethod === 'Card' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                {tx.paymentMethod}
                              </span>
                            </div>
                          </td>
                          <td className="py-2.5 text-center">
                            <span className="text-[10px] md:text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg inline-block">
                              {tx.quantity} pcs
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <p className="text-xs md:text-sm font-bold text-slate-800">
                              ₹{tx.total.toLocaleString('en-IN')}
                            </p>
                            <p className="text-[9px] text-slate-400">MRP: ₹{tx.mrp}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {data.todayOverview.transactions.length > 5 && (
                  <div className="pt-3 border-t border-slate-50 mt-auto">
                    <button
                      onClick={() => setShowSoldItemsModal(true)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl transition-colors w-full cursor-pointer"
                    >
                      See All ({data.todayOverview.transactions.length})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Urgent Expiry Report */}
        <div className="bg-white rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-rose-100 overflow-hidden flex flex-col">
          <div className="bg-rose-50/50 p-4 border-b border-rose-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm md:text-base font-bold text-rose-700 flex items-center min-w-0">
                <AlertTriangle className="w-4 h-4 mr-1.5 shrink-0" /> 
                <span className="truncate">Expiry Alert</span>
              </h2>
              <span className="bg-rose-200 text-rose-800 text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0">
                {data.expiringSoon?.length || 0} Items
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-rose-100/50">
              <div className="flex items-center gap-1">
                <span className="text-[10px] md:text-xs font-bold text-rose-600 uppercase tracking-wider">In:</span>
                <select 
                  value={expiryMonths} 
                  onChange={(e) => setExpiryMonths(Number(e.target.value))}
                  className="bg-white border border-rose-200 text-rose-700 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-rose-400 cursor-pointer min-w-[95px] h-8"
                >
                  <option value={1}>1 Month</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={9}>9 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>

              <button
                onClick={() => setTriggerExpiryPrint(true)}
                disabled={!data.expiringSoon || data.expiringSoon.length === 0}
                className="bg-slate-800 hover:bg-slate-900 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-xs font-bold px-3 py-1 h-8 rounded-lg flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
                title="Download Expiry Report as PDF"
              >
                <Printer className="w-3.5 h-3.5 shrink-0" />
                <span>PDF</span>
              </button>
            </div>
          </div>
          
          <div className="p-4 flex-1 flex flex-col justify-between min-h-[280px]">
            {data.expiringSoon?.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-xs md:text-sm font-medium m-auto">No medicines are expiring soon! 🎉</p>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[9px] md:text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-2 font-bold">Medicine</th>
                      <th className="pb-2 font-bold text-right">Expiry</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.expiringSoon?.slice(0, 5).map((med) => (
                      <tr key={med._id} className="hover:bg-rose-50/30 transition-colors">
                        <td className="py-2 max-w-[120px]">
                          <p className="font-bold text-slate-700 text-xs md:text-sm leading-tight truncate" title={med.name}>{med.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">Qty: <span className="font-bold text-rose-500">{med.quantity}</span> | {med.batch}</p>
                        </td>
                        <td className="py-2 text-right">
                          <div className="inline-flex items-center text-[10px] md:text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                            {formatExpiryDate(med.expiryDate)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {data.expiringSoon?.length > 5 && (
                  <div className="pt-3 border-t border-slate-50 mt-auto">
                    <button
                      onClick={() => setShowExpiryModal(true)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 py-2 rounded-xl transition-colors w-full cursor-pointer"
                    >
                      See All ({data.expiringSoon.length})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Low Stock Report */}
        <div className="bg-white rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-amber-100 overflow-hidden flex flex-col mt-4 md:mt-0 lg:mt-0">
          <div className="bg-amber-50/50 p-4 border-b border-amber-100 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm md:text-base font-bold text-amber-700 flex items-center min-w-0">
                <TrendingDown className="w-4 h-4 mr-1.5 shrink-0" /> 
                <span className="truncate">Low Stock Alert</span>
              </h2>
              <span className="bg-amber-200 text-amber-800 text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0">
                {data.lowStock?.length || 0} Items
              </span>
            </div>
            
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-100/50">
              <div className="flex items-center gap-1.5 w-full">
                <span className="text-[10px] md:text-xs font-bold text-amber-600 uppercase tracking-wider whitespace-nowrap">Qty &lt;:</span>
                <input 
                  type="number"
                  min="1"
                  max="1000"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(Math.max(1, parseInt(e.target.value) || 10))}
                  className="bg-white border border-amber-200 text-amber-700 rounded-lg px-2 py-1 w-full text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 h-8"
                />
              </div>
            </div>
          </div>
          
          <div className="p-4 flex-1 flex flex-col justify-between min-h-[280px]">
            {data.lowStock?.length === 0 ? (
              <p className="text-center text-slate-400 py-8 text-xs md:text-sm font-medium m-auto">All stock levels are optimal! 📦</p>
            ) : (
              <>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[9px] md:text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-2 font-bold">Medicine</th>
                      <th className="pb-2 font-bold text-right">Left</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.lowStock?.slice(0, 5).map((med) => (
                      <tr key={med._id} className="hover:bg-amber-50/30 transition-colors">
                        <td className="py-2 max-w-[120px]">
                          <p className="font-bold text-slate-700 text-xs md:text-sm leading-tight truncate" title={med.name}>{med.name}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 truncate">Dist: {med.distributor}</p>
                        </td>
                        <td className="py-2 text-right">
                          <span className="text-xs md:text-sm font-extrabold text-amber-500 bg-amber-50 px-2 py-1 rounded-xl inline-block">
                            {med.quantity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {data.lowStock?.length > 5 && (
                  <div className="pt-3 border-t border-slate-50 mt-auto">
                    <button
                      onClick={() => setShowLowStockModal(true)}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 py-2 rounded-xl transition-colors w-full cursor-pointer"
                    >
                      See All ({data.lowStock.length})
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 🚀 ADVANCED ERP REPORTS: Already Expired & Out of Stock Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6 pt-4">
        {/* Already Expired Stock Tracker */}
        <div 
          onClick={() => setShowExpiredModal(true)}
          className="bg-white rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-rose-200 hover:border-rose-400 overflow-hidden flex flex-col min-h-[350px] cursor-pointer hover:shadow-md transition-all group"
          title="Click to view all expired stock items"
        >
          <div className="bg-rose-50/50 p-4 md:p-5 border-b border-rose-100 flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-rose-800 flex items-center gap-2 group-hover:text-rose-600 transition-colors">
              <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
              <span>Expired Stock Tracker</span>
              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-bold ml-1">View Full List →</span>
            </h2>
            <span className="bg-rose-200 text-rose-800 text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0">
              {data.alreadyExpired?.length || 0} Items
            </span>
          </div>

          <div className="p-4 md:p-5 flex-1 flex flex-col justify-between overflow-x-auto">
            {(!data.alreadyExpired || data.alreadyExpired.length === 0) ? (
              <div className="text-center text-slate-400 my-auto py-8">
                <p className="font-semibold text-blue-600 bg-blue-50 px-4 py-3 rounded-2xl border border-blue-100 inline-block text-xs md:text-sm">
                  Excellent! No expired medicines in stock. 🎉
                </p>
              </div>
            ) : (
              <div className="w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-2 font-bold">Item Name</th>
                      <th className="pb-2 font-bold">Batch</th>
                      <th className="pb-2 font-bold text-center">Remaining</th>
                      <th className="pb-2 font-bold text-right">Expired On</th>
                      <th className="pb-2 font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {data.alreadyExpired.slice(0, 10).map((med) => (
                      <tr key={med._id} className="hover:bg-rose-50/20 transition-colors">
                        <td className="py-2.5 max-w-[150px] truncate">
                          <p className="font-bold text-slate-800">{med.name}</p>
                          <p className="text-[9px] text-slate-400">Dist: {med.distributor}</p>
                        </td>
                        <td className="py-2.5 font-semibold text-slate-600">{med.batch}</td>
                        <td className="py-2.5 text-center">
                          <span className="font-extrabold text-rose-600 bg-rose-50 px-2 py-0.5 rounded shadow-sm">{med.quantity} pcs</span>
                        </td>
                        <td className="py-2.5 text-right font-bold text-rose-500">
                          {formatExpiryDate(med.expiryDate)}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteMedicine(med._id, med.name);
                            }}
                            className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-500 rounded-lg transition-colors border border-rose-100 hover:border-rose-500 cursor-pointer"
                            title="Delete Expired Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.alreadyExpired.length > 10 && (
                  <p className="text-center text-[10px] text-slate-400 mt-3 font-semibold">
                    + {data.alreadyExpired.length - 10} more expired items. Click this card to view all.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Out of Stock / Reorder Checklist */}
        <div 
          onClick={() => setShowOutOfStockModal(true)}
          className="bg-white rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-amber-200 hover:border-amber-400 overflow-hidden flex flex-col min-h-[350px] cursor-pointer hover:shadow-md transition-all group"
          title="Click to view all out of stock medicines"
        >
          <div className="bg-amber-50/50 p-4 md:p-5 border-b border-amber-100 flex items-center justify-between">
            <h2 className="text-sm md:text-base font-bold text-amber-800 flex items-center gap-2 group-hover:text-amber-600 transition-colors">
              <PackageOpen className="w-5 h-5 text-amber-500" />
              <span>Out of Stock Checklist</span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold ml-1">View Full List →</span>
            </h2>
            <span className="bg-amber-200 text-amber-800 text-[10px] md:text-xs font-bold px-2.5 py-0.5 rounded-full shrink-0">
              {data.outOfStock?.length || 0} Items
            </span>
          </div>

          <div className="p-4 md:p-5 flex-1 flex flex-col justify-between overflow-x-auto">
            {(!data.outOfStock || data.outOfStock.length === 0) ? (
              <div className="text-center text-slate-400 my-auto py-8">
                <p className="font-semibold text-slate-600 bg-slate-50 px-4 py-3 rounded-2xl border border-slate-100 inline-block text-xs md:text-sm">
                  All medicines are currently in stock! 📦
                </p>
              </div>
            ) : (
              <div className="w-full">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider border-b border-slate-100">
                      <th className="pb-2 font-bold">Item Name</th>
                      <th className="pb-2 font-bold">Distributor / Agency</th>
                      <th className="pb-2 font-bold">Last Bill No.</th>
                      <th className="pb-2 font-bold text-right">MRP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {data.outOfStock.slice(0, 10).map((med) => (
                      <tr key={med._id} className="hover:bg-amber-50/10 transition-colors">
                        <td className="py-2.5">
                          <p className="font-bold text-slate-800">{med.name}</p>
                          <p className="text-[9px] text-slate-400">Batch: {med.batch}</p>
                        </td>
                        <td className="py-2.5 font-semibold text-slate-600">{med.distributor || "N/A"}</td>
                        <td className="py-2.5 text-slate-500 font-medium">{med.billNumber || "N/A"}</td>
                        <td className="py-2.5 text-right font-extrabold text-slate-700">₹{med.mrp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {data.outOfStock.length > 10 && (
                  <p className="text-center text-[10px] text-slate-400 mt-3 font-semibold">
                    + {data.outOfStock.length - 10} more out-of-stock items. Click this card to view all.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={() => setShowAllDistributors(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs md:text-sm px-6 py-3 rounded-2xl shadow-lg shadow-indigo-600/10 flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
        >
          <Truck className="w-4 h-4" /> View Distributor Performance Board
        </button>
      </div>

      {/* MODALS */}
      
      {/* Sold Items Modal */}
      <ReportTabs
        isOpen={showSoldItemsModal}
        onClose={() => { setShowSoldItemsModal(false); setLocalSearchQuery(""); }}
        activeReportTab={activeReportTab}
        setActiveReportTab={setActiveReportTab}
        data={data}
        localSearchQuery={localSearchQuery}
        setLocalSearchQuery={setLocalSearchQuery}
        modalSearchQuery={modalSearchQuery}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        customDays={customDays}
        setCustomDays={setCustomDays}
        itemsPage={itemsPage}
        setItemsPage={setItemsPage}
        billsPage={billsPage}
        setBillsPage={setBillsPage}
        ITEMS_PER_PAGE={ITEMS_PER_PAGE}
        setPrintingInvoice={setPrintingInvoice}
        handleReportsWhatsAppSend={handleReportsWhatsAppSend}
        getSelectedDateLabel={getSelectedDateLabel}
      />

      {/* Custom WhatsApp Phone Number Modal */}
      {whatsappModalInvoice && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500 fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.498 1.451 5.419 1.452 5.539 0 10.048-4.509 10.051-10.05.002-2.685-1.033-5.207-2.909-7.086C17.332 1.59 14.815.556 12.013.556c-5.545 0-10.055 4.51-10.059 10.051-.001 1.922.502 3.8 1.455 5.409L2.39 20.37l4.257-1.116-.001-.001zm11.367-7.611c-.302-.15-1.785-.882-2.057-.982-.272-.099-.47-.15-.668.15-.198.298-.767.982-.94 1.181-.173.199-.347.224-.649.075-.3-.15-1.268-.467-2.417-1.493-.893-.797-1.496-1.782-1.671-2.08-.174-.3-.018-.463.132-.612.135-.133.302-.35.452-.525.15-.175.2-.299.3-.499.1-.2.05-.375-.025-.525-.075-.15-.668-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.785-.73 2.033-1.433.248-.703.248-1.306.173-1.432-.074-.128-.272-.203-.574-.353z"/>
                </svg>
                <span>Send WhatsApp Receipt</span>
              </h2>
              <button 
                onClick={() => setWhatsappModalInvoice(null)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5 md:p-6 space-y-4">
              <p className="text-xs text-slate-500 font-medium">
                Customer mobile number is missing for Invoice **#{whatsappModalInvoice.billNumber}**. Enter their 10-digit WhatsApp number below:
              </p>
              
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">WhatsApp Number</label>
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={whatsappModalPhone}
                  onChange={(e) => setWhatsappModalPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 font-bold"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      executeWhatsAppSend(whatsappModalInvoice, whatsappModalPhone);
                      setWhatsappModalInvoice(null);
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setWhatsappModalInvoice(null)}
                className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  executeWhatsAppSend(whatsappModalInvoice, whatsappModalPhone);
                  setWhatsappModalInvoice(null);
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expired Stock Checklist Modal */}
      {showExpiredModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] md:rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg md:text-xl font-bold text-rose-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-rose-500" />
                All Expired Stock Items
              </h2>
              <button 
                onClick={() => setShowExpiredModal(false)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            
            <div className="p-4 md:p-6 overflow-x-auto overflow-y-auto flex-1 bg-slate-50/30">
              <table className="w-full min-w-[600px] text-left border-collapse bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                    <th className="p-3 md:p-4 font-bold">#</th>
                    <th className="p-3 md:p-4 font-bold">Medicine</th>
                    <th className="p-3 md:p-4 font-bold">Batch No.</th>
                    <th className="p-3 md:p-4 font-bold text-center">Remaining Stock</th>
                    <th className="p-3 md:p-4 font-bold text-right">Expired Date</th>
                    <th className="p-3 md:p-4 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                  {data.alreadyExpired?.map((med, index) => (
                    <tr key={med._id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="p-3 md:p-4 text-slate-400">{index + 1}</td>
                      <td className="p-3 md:p-4">
                        <p className="font-bold text-slate-800">{med.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Distributor: {med.distributor || 'N/A'}</p>
                      </td>
                      <td className="p-3 md:p-4 font-medium text-slate-600">{med.batch || 'N/A'}</td>
                      <td className="p-3 md:p-4 text-center">
                        <span className="font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg">
                          {med.quantity} pcs
                        </span>
                      </td>
                      <td className="p-3 md:p-4 text-right">
                        <span className="font-bold text-rose-600">
                          {formatExpiryDate(med.expiryDate)}
                        </span>
                      </td>
                      <td className="p-3 md:p-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMedicine(med._id, med.name);
                          }}
                          className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-500 rounded-lg transition-colors border border-rose-100 hover:border-rose-500 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Out of Stock Checklist Modal */}
      {showOutOfStockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] md:rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center">
                <PackageOpen className="w-5 h-5 mr-2 text-amber-500 animate-pulse" />
                All Out of Stock Medicines
              </h2>
              <button 
                onClick={() => setShowOutOfStockModal(false)}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            
            <div className="p-4 md:p-6 overflow-x-auto overflow-y-auto flex-1 bg-slate-50/30">
              <table className="w-full min-w-[600px] text-left border-collapse bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                    <th className="p-3 md:p-4 font-bold">#</th>
                    <th className="p-3 md:p-4 font-bold">Medicine</th>
                    <th className="p-3 md:p-4 font-bold">Distributor / Agency</th>
                    <th className="p-3 md:p-4 font-bold">Last Bill No.</th>
                    <th className="p-3 md:p-4 font-bold text-right">MRP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                  {data.outOfStock?.map((med, index) => (
                    <tr key={med._id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="p-3 md:p-4 text-slate-400">{index + 1}</td>
                      <td className="p-3 md:p-4">
                        <p className="font-bold text-slate-800">{med.name}</p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">Batch: {med.batch}</p>
                      </td>
                      <td className="p-3 md:p-4 font-semibold text-slate-600">{med.distributor || "N/A"}</td>
                      <td className="p-3 md:p-4 text-slate-500 font-medium">{med.billNumber || "N/A"}</td>
                      <td className="p-3 md:p-4 text-right font-extrabold text-slate-700">₹{med.mrp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Expiry Modal */}
      {showExpiryModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] md:rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg md:text-xl font-bold text-rose-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-rose-500" />
                Medicines Expiring Within {expiryMonths} Month{expiryMonths > 1 ? 's' : ''}
              </h2>
              <div className="flex items-center gap-3">
                {data.expiringSoon?.length > 0 && (
                  <button
                    onClick={() => setTriggerExpiryPrint(true)}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Download PDF
                  </button>
                )}
                <button 
                  onClick={() => setShowExpiryModal(false)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm cursor-pointer"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 md:p-6 overflow-x-auto overflow-y-auto flex-1 bg-slate-50/30">
              <table className="w-full text-left border-collapse bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                    <th className="p-3 md:p-4 font-bold">#</th>
                    <th className="p-3 md:p-4 font-bold">Medicine</th>
                    {reportsPdfConfig.showBatch && <th className="p-3 md:p-4 font-bold">Batch No.</th>}
                    {reportsPdfConfig.showBillNo && <th className="p-3 md:p-4 font-bold">Bill No.</th>}
                    {reportsPdfConfig.showQty && <th className="p-3 md:p-4 font-bold text-center">Stock Qty</th>}
                    {reportsPdfConfig.showExpiryDate && <th className="p-3 md:p-4 font-bold text-right">Expiry Date</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                  {data.expiringSoon?.slice((expiryPage - 1) * ITEMS_PER_PAGE, expiryPage * ITEMS_PER_PAGE).map((med, index) => (
                    <tr key={med._id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="p-3 md:p-4 text-slate-400">{(expiryPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td className="p-3 md:p-4">
                        <p className="font-bold text-slate-800">{med.name}</p>
                        {reportsPdfConfig.showDistributor && (
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Distributor: {med.distributor || 'N/A'}</p>
                        )}
                      </td>
                      {reportsPdfConfig.showBatch && <td className="p-3 md:p-4 font-medium text-slate-600">{med.batch || 'N/A'}</td>}
                      {reportsPdfConfig.showBillNo && <td className="p-3 md:p-4 font-medium text-slate-600">{med.billNumber || 'N/A'}</td>}
                      {reportsPdfConfig.showQty && (
                        <td className="p-3 md:p-4 text-center">
                          <span className="font-extrabold text-rose-500 bg-rose-50 px-2.5 py-1 rounded-lg">
                            {med.quantity}
                          </span>
                        </td>
                      )}
                      {reportsPdfConfig.showExpiryDate && (
                        <td className="p-3 md:p-4 text-right">
                          <span className="font-bold text-rose-600">
                            {formatExpiryDate(med.expiryDate)}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {renderPagination(expiryPage, data.expiringSoon?.length || 0, setExpiryPage)}
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Modal */}
      {showLowStockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] md:rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center">
                <TrendingDown className="w-5 h-5 mr-2 text-amber-500" />
                Low Stock Alerts (Qty &lt; {lowStockThreshold})
              </h2>
              <div className="flex items-center gap-3">
                {data.lowStock?.length > 0 && (
                  <button
                    onClick={() => setTriggerLowStockPrint(true)}
                    className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> Download PDF
                  </button>
                )}
                <button 
                  onClick={() => setShowLowStockModal(false)}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm cursor-pointer"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4 md:p-6 overflow-x-auto overflow-y-auto flex-1 bg-slate-50/30">
              <table className="w-full text-left border-collapse bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                    <th className="p-3 md:p-4 font-bold">#</th>
                    <th className="p-3 md:p-4 font-bold">Medicine</th>
                    {reportsPdfConfig.showBatch && <th className="p-3 md:p-4 font-bold">Batch No.</th>}
                    {reportsPdfConfig.showBillNo && <th className="p-3 md:p-4 font-bold">Bill No.</th>}
                    {reportsPdfConfig.showQty && <th className="p-3 md:p-4 font-bold text-right">Available Qty</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                  {data.lowStock?.slice((lowStockPage - 1) * ITEMS_PER_PAGE, lowStockPage * ITEMS_PER_PAGE).map((med, index) => (
                    <tr key={med._id} className="hover:bg-amber-50/20 transition-colors">
                      <td className="p-3 md:p-4 text-slate-400">{(lowStockPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                      <td className="p-3 md:p-4">
                        <p className="font-bold text-slate-800">{med.name}</p>
                        {reportsPdfConfig.showDistributor && (
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5">Distributor: {med.distributor || 'N/A'}</p>
                        )}
                      </td>
                      {reportsPdfConfig.showBatch && <td className="p-3 md:p-4 font-medium text-slate-600">{med.batch || 'N/A'}</td>}
                      {reportsPdfConfig.showBillNo && <td className="p-3 md:p-4 font-medium text-slate-600">{med.billNumber || 'N/A'}</td>}
                      {reportsPdfConfig.showQty && (
                        <td className="p-3 md:p-4 text-right">
                          <span className="font-extrabold text-amber-500 bg-amber-50 px-2.5 py-1 rounded-lg">
                            {med.quantity}
                          </span>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {renderPagination(lowStockPage, data.lowStock?.length || 0, setLowStockPage)}
            </div>
          </div>
        </div>
      )}

      {/* Distributors Board Modal */}
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
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm cursor-pointer"
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
                  className="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                />
              </div>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50/30">
              {filteredDistributors.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Search className="w-10 h-10 mb-3 text-slate-300" />
                  <p className="text-sm md:text-base font-medium">No distributors found matching &quot;{distributorSearch}&quot;</p>
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
                          <span className="text-sm font-extrabold text-blue-600 flex items-center">
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

      {/* Detail Drilldown Modal */}
      <ReportDetailModal 
        isOpen={!!reportModalType}
        onClose={() => setReportModalType(null)}
        modalType={reportModalType}
        data={data}
      />

      {/* Hidden printable receipt reprint */}
      <ReportInvoicePrint
        ref={invoicePrintRef}
        printingInvoice={printingInvoice}
        shopInfo={shopInfo}
      />

      {/* Hidden PDF print wrappers */}
      <ExpiryPDFPrint
        ref={printRef}
        data={data}
        expiryMonths={expiryMonths}
        reportsPdfConfig={reportsPdfConfig}
        formatExpiryDate={formatExpiryDate}
      />

      <LowStockPDFPrint
        ref={lowStockPrintRef}
        data={data}
        lowStockThreshold={lowStockThreshold}
        reportsPdfConfig={reportsPdfConfig}
      />
    </div>
  );
}