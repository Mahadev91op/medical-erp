"use client";
import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { AlertTriangle, TrendingDown, Truck, Loader2, CalendarClock, RefreshCw, Search, X, IndianRupee, ShoppingCart, PackageOpen, Award, Package, Receipt, TrendingUp, Printer, Trash2 } from "lucide-react";
import { formatDate, formatExpiryDate } from "@/lib/formatDate";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import toast, { Toaster } from "react-hot-toast";
import ReportDetailModal from "@/components/reports/ReportDetailModal";

const ReportsSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-6 w-52 bg-slate-200 rounded-md"></div>
          <div className="h-4 w-72 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-10 w-32 bg-slate-200 rounded-xl"></div>
      </div>

      {/* Grid of Flash Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white p-4 md:p-5 rounded-[20px] md:rounded-2xl border border-slate-100 flex items-center space-x-3 shadow-sm">
            <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0"></div>
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
              <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Date filter bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
        <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
        <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
        <div className="h-9 w-28 bg-slate-200 rounded-lg"></div>
      </div>

      {/* Chart and Details Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
          <div className="h-5 w-40 bg-slate-200 rounded-md"></div>
          <div className="h-64 bg-slate-50 rounded-2xl flex items-end justify-between p-4">
            {[30, 50, 40, 70, 60, 80, 50, 90, 75, 85].map((h, idx) => (
              <div key={idx} className="w-full mx-1.5 bg-slate-200 rounded-t-md" style={{ height: `${h}%` }}></div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 space-y-4 shadow-sm">
          <div className="h-5 w-36 bg-slate-200 rounded-md"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                <div className="space-y-1.5">
                  <div className="h-3.5 w-24 bg-slate-200 rounded-md"></div>
                  <div className="h-2.5 w-16 bg-slate-200 rounded-md"></div>
                </div>
                <div className="h-5 w-10 bg-slate-200 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Reports() {
  const [data, setData] = useState({ expiringSoon: [], lowStock: [], distributorStock: [], todayOverview: {} });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState("items");
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setModalSearchQuery(localSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearchQuery]);

  const [whatsappModalInvoice, setWhatsappModalInvoice] = useState(null);
  const [whatsappModalPhone, setWhatsappModalPhone] = useState("");

  useEffect(() => {
    const fetchShopInfo = async () => {
      try {
        const res = await fetch("/api/user/profile");
        const data = await res.json();
        if (data.success) {
          setShopInfo(data.user);
        }
      } catch (err) {
        console.error("Failed to fetch shop info:", err);
      }
    };
    fetchShopInfo();
  }, []);

  const handleDeleteMedicine = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name} from your inventory? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/medicine?id=${id}`, { method: "DELETE" });
      const resData = await res.json();
      if (resData.success) {
        toast.success(`${name} has been deleted successfully!`);
        fetchReports(true, expiryMonths, lowStockThreshold, dateFilter);
      } else {
        toast.error(resData.error || "Failed to delete medicine");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };
  
  const invoicePrintRef = useRef(null);
  const handlePrintInvoice = useReactToPrint({
    contentRef: invoicePrintRef,
    documentTitle: printingInvoice ? `Invoice_${printingInvoice.billNumber}` : 'Invoice',
  });

  useEffect(() => {
    if (printingInvoice) {
      handlePrintInvoice();
      setPrintingInvoice(null);
    }
  }, [printingInvoice, handlePrintInvoice]);

  const handleReportsWhatsAppSend = (invoice) => {
    let phone = invoice.customerPhone || "";
    if (!phone) {
      setWhatsappModalInvoice(invoice);
      setWhatsappModalPhone("");
      return;
    }
    executeWhatsAppSend(invoice, phone);
  };

  const executeWhatsAppSend = (invoice, phone) => {
    let cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length === 10) {
      cleanedPhone = "91" + cleanedPhone;
    }
    
    if (cleanedPhone.length < 10) {
      toast.error("Invalid phone number entered!");
      return;
    }
    
    const shopName = shopInfo?.shopName || "MedERP Pharmacy";
    const shopPhone = shopInfo?.phoneNumber || "";
    const billNo = invoice.billNumber;
    const dateStr = new Date(invoice.date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const payMode = invoice.paymentMethod;
    const totalAmount = invoice.totalAmount;
    
    let itemsText = "";
    invoice.items.forEach((item) => {
      itemsText += `• ${item.name} (${item.quantity || item.sellQuantity} x ₹${item.mrp}) = ₹${(item.quantity || item.sellQuantity) * item.mrp}\n`;
    });
    
    const message = `*✨ INVOICE / BILL DETAILS ✨*
-----------------------------
*Store:* ${shopName}
${shopPhone ? `*Phone:* ${shopPhone}\n` : ""}*Invoice No:* #${billNo}
*Date:* ${dateStr}
*Payment Method:* ${payMode}

-----------------------------
*Items:*
${itemsText}-----------------------------
*Grand Total: ₹${totalAmount}*

Thank you! Get well soon. 🏥`;

    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanedPhone}?text=${encodedText}`;
    
    window.open(waUrl, "_blank");
  };
  
  const [showAllDistributors, setShowAllDistributors] = useState(false);
  const [distributorSearch, setDistributorSearch] = useState("");
  
  const [showTodayItems, setShowTodayItems] = useState(false);
  const [showSoldItemsModal, setShowSoldItemsModal] = useState(false);
  const [showExpiryModal, setShowExpiryModal] = useState(false);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showExpiredModal, setShowExpiredModal] = useState(false);
  const [showOutOfStockModal, setShowOutOfStockModal] = useState(false);
  const [reportModalType, setReportModalType] = useState(null);

  const [dateFilter, setDateFilter] = useState("today"); // today, yesterday, 7days, 15days, 30days, 60days, 90days, customDays, custom
  const [customStartDate, setCustomStartDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [customEndDate, setCustomEndDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [customDays, setCustomDays] = useState(10);

  const [expiryMonths, setExpiryMonths] = useState(3);
  const [lowStockThreshold, setLowStockThreshold] = useState(10);
  const [initialLoaded, setInitialLoaded] = useState(false);

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDateRangeForFilter = (filter) => {
    const today = new Date();
    let start = new Date();
    let end = new Date();
    
    if (filter === "today") {
      // default today
    } else if (filter === "yesterday") {
      start.setDate(today.getDate() - 1);
      end.setDate(today.getDate() - 1);
    } else if (filter === "7days") {
      start.setDate(today.getDate() - 6);
    } else if (filter === "15days") {
      start.setDate(today.getDate() - 14);
    } else if (filter === "30days") {
      start.setDate(today.getDate() - 29);
    } else if (filter === "60days") {
      start.setDate(today.getDate() - 59);
    } else if (filter === "90days") {
      start.setDate(today.getDate() - 89);
    } else if (filter === "customDays") {
      const days = parseInt(customDays) || 1;
      start.setDate(today.getDate() - (days - 1));
    } else if (filter === "custom") {
      return {
        startDate: customStartDate || getTodayDateString(),
        endDate: customEndDate || getTodayDateString()
      };
    }
    
    const formatDateStr = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    return {
      startDate: formatDateStr(start),
      endDate: formatDateStr(end)
    };
  };

  const getSelectedDateLabel = () => {
    if (dateFilter === "today") return "Today";
    if (dateFilter === "yesterday") return "Yesterday";
    if (dateFilter === "7days") return "Last 7 Days";
    if (dateFilter === "15days") return "Last 15 Days";
    if (dateFilter === "30days") return "Last 30 Days";
    if (dateFilter === "60days") return "Last 60 Days";
    if (dateFilter === "90days") return "Last 90 Days";
    if (dateFilter === "customDays") return `Last ${customDays} Days`;
    
    const formatLabel = (dateStr) => {
      if (!dateStr) return "";
      const [y, m, d] = dateStr.split("-");
      return `${d}/${m}/${y.slice(-2)}`;
    };
    
    const start = customStartDate ? formatLabel(customStartDate) : "Start";
    const end = customEndDate ? formatLabel(customEndDate) : "End";
    return `${start} to ${end}`;
  };

  const [triggerExpiryPrint, setTriggerExpiryPrint] = useState(false);
  const [triggerLowStockPrint, setTriggerLowStockPrint] = useState(false);

  const [itemsPage, setItemsPage] = useState(1);
  const [billsPage, setBillsPage] = useState(1);
  const [expiryPage, setExpiryPage] = useState(1);
  const [lowStockPage, setLowStockPage] = useState(1);
  const ITEMS_PER_PAGE = 50;

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

  useEffect(() => {
    if (triggerExpiryPrint) {
      const timer = setTimeout(() => {
        handleDownloadPDF();
        setTriggerExpiryPrint(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [triggerExpiryPrint, handleDownloadPDF]);

  useEffect(() => {
    if (triggerLowStockPrint) {
      const timer = setTimeout(() => {
        handleDownloadLowStockPDF();
        setTriggerLowStockPrint(false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [triggerLowStockPrint, handleDownloadLowStockPDF]);

  useEffect(() => {
    setItemsPage(1);
    setBillsPage(1);
  }, [modalSearchQuery, activeReportTab, dateFilter]);

  useEffect(() => {
    setExpiryPage(1);
  }, [expiryMonths]);

  useEffect(() => {
    setLowStockPage(1);
  }, [lowStockThreshold]);

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

  const [reportsPdfConfig, setReportsPdfConfig] = useState({
    showDistributor: true, showBatch: true, showBillNo: true, showQty: true, showExpiryDate: true
  });

  useEffect(() => {
    const savedReports = localStorage.getItem("super_reports_pdf_config");
    if (savedReports) {
      try { setReportsPdfConfig(JSON.parse(savedReports)); } catch(e) {}
    }
  }, []);

  const fetchReports = async (isSilent = false, currentExpiryMonths = expiryMonths, currentLowStockThreshold = lowStockThreshold, filter = dateFilter) => {
    if (!isSilent) setLoading(true);
    else setIsRefetching(true);
    try {
      const { startDate, endDate } = getDateRangeForFilter(filter);
      const res = await fetch(`/api/reports?expiryMonths=${currentExpiryMonths}&lowStockThreshold=${currentLowStockThreshold}&startDate=${startDate}&endDate=${endDate}`, { cache: "no-store" });
      const result = await res.json();
      if (result.success) {
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      if (!isSilent) setLoading(false);
      else setIsRefetching(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReports(true, expiryMonths, lowStockThreshold, dateFilter);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!initialLoaded) {
        await fetchReports(false, expiryMonths, lowStockThreshold, dateFilter);
        if (active) setInitialLoaded(true);
      } else {
        await fetchReports(true, expiryMonths, lowStockThreshold, dateFilter);
      }
    };
    load();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiryMonths, lowStockThreshold, dateFilter, customStartDate, customEndDate, customDays]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchReports(true, expiryMonths, lowStockThreshold, dateFilter);
    }, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiryMonths, lowStockThreshold, dateFilter, customStartDate, customEndDate, customDays]);

  const filteredDistributors = data.distributorStock?.filter((dist) =>
    dist._id?.toLowerCase().includes(distributorSearch.toLowerCase())
  ) || [];

  if (loading) {
    return <ReportsSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 relative">
      
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
              const { startDate, endDate } = getDateRangeForFilter(dateFilter);
              toast.loading("Generating GST Return Excel File...", { id: "gst-toast" });
              try {
                const url = `/api/reports/gst-export?startDate=${startDate}&endDate=${endDate}`;
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
            <p className="text-slate-405 text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center justify-between">
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
              
              {dateFilter === "customDays" && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-wider whitespace-nowrap">Days:</span>
                  <input 
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="bg-white border border-blue-200 text-blue-700 rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 w-full h-8"
                  />
                </div>
              )}
              
              {dateFilter === "custom" && (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-[9px] font-bold text-blue-600 uppercase">From:</span>
                    <input 
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-white border border-blue-200 text-blue-700 rounded-lg px-1.5 py-0.5 text-[10px] font-bold focus:outline-none w-full h-7"
                    />
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="text-[9px] font-bold text-blue-600 uppercase">To:</span>
                    <input 
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-white border border-blue-200 text-blue-700 rounded-lg px-1.5 py-0.5 text-[10px] font-bold focus:outline-none w-full h-7"
                    />
                  </div>
                </div>
              )}
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
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl transition-colors w-full"
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
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 py-2 rounded-xl transition-colors w-full"
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
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 py-2 rounded-xl transition-colors w-full"
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


      {showSoldItemsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] md:rounded-3xl w-full max-w-5xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center">
                <Package className="w-5 h-5 mr-2 text-indigo-500" />
                Sales Report ({getSelectedDateLabel()})
              </h2>
              <button 
                onClick={() => { setShowSoldItemsModal(false); setModalSearchQuery(""); setLocalSearchQuery(""); }}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-slate-100 px-4 md:px-6 bg-slate-50/50">
              <button
                onClick={() => { setActiveReportTab("items"); setModalSearchQuery(""); setLocalSearchQuery(""); }}
                className={`py-3 px-4 font-bold text-xs md:text-sm border-b-2 transition-all ${activeReportTab === "items" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                Sold Medicines
              </button>
              <button
                onClick={() => { setActiveReportTab("bills"); setModalSearchQuery(""); setLocalSearchQuery(""); }}
                className={`py-3 px-4 font-bold text-xs md:text-sm border-b-2 transition-all ${activeReportTab === "bills" ? "border-blue-500 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                Receipt Invoices
              </button>
            </div>

            {/* Search Input Bar & Date Filter */}
            <div className="p-4 md:p-6 border-b border-slate-100 bg-white flex flex-col lg:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    activeReportTab === "items" 
                      ? "Search by medicine name or receipt number..." 
                      : "Search by invoice, medicine, customer name or phone..."
                  }
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="w-full pl-10 md:pl-12 pr-10 py-2.5 md:py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-700"
                />
                {localSearchQuery && (
                  <button 
                    onClick={() => { setModalSearchQuery(""); setLocalSearchQuery(""); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-slate-500">Date Range:</span>
                <select 
                  value={dateFilter} 
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-slate-750 rounded-xl px-3 py-2 text-xs md:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer h-10 md:h-12"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="15days">Last 15 Days</option>
                  <option value="30days">Last 30 Days</option>
                  <option value="60days">Last 60 Days</option>
                  <option value="90days">Last 90 Days (3 Months)</option>
                  <option value="customDays">Custom Days Count</option>
                  <option value="custom">Custom Range</option>
                </select>

                {dateFilter === "customDays" && (
                  <input 
                    type="number"
                    min="1"
                    max="365"
                    value={customDays}
                    onChange={(e) => setCustomDays(Math.max(1, parseInt(e.target.value) || 10))}
                    className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-2.5 text-xs font-bold w-20 text-center h-10 md:h-12"
                  />
                )}

                {dateFilter === "custom" && (
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-2 rounded-xl h-10 md:h-12">
                    <input 
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-transparent text-slate-700 text-xs font-bold focus:outline-none"
                    />
                    <span className="text-slate-400 font-bold text-xs">to</span>
                    <input 
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-transparent text-slate-700 text-xs font-bold focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-4 md:p-6 overflow-x-auto overflow-y-auto flex-1 bg-slate-50/30">
              {activeReportTab === "items" ? (
                (() => {
                  const filteredTransactions = (data.todayOverview?.transactions || []).filter((tx) => {
                    const query = modalSearchQuery.trim().toLowerCase();
                    if (!query) return true;
                    return (
                      tx.name?.toLowerCase().includes(query) ||
                      tx.billNumber?.toLowerCase().includes(query)
                    );
                  });

                  if (filteredTransactions.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Package className="w-10 h-10 mb-3 text-slate-300" />
                        <p className="text-sm md:text-base font-medium">
                          {modalSearchQuery ? "No medicines matching your search query. 🔍" : "No sales recorded for this range. 😴"}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                            <th className="p-3 md:p-4 font-bold">#</th>
                            <th className="p-3 md:p-4 font-bold">Receipt</th>
                            <th className="p-3 md:p-4 font-bold">Medicine</th>
                            <th className="p-3 md:p-4 font-bold text-center">Qty</th>
                            <th className="p-3 md:p-4 font-bold text-center">MRP</th>
                            <th className="p-3 md:p-4 font-bold text-center">Pay Mode</th>
                            <th className="p-3 md:p-4 font-bold text-right">Total Price</th>
                            <th className="p-3 md:p-4 font-bold text-right">Date & Time</th>
                            <th className="p-3 md:p-4 font-bold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                          {filteredTransactions.slice((itemsPage - 1) * ITEMS_PER_PAGE, itemsPage * ITEMS_PER_PAGE).map((tx, index) => {
                            const txDate = new Date(tx.date);
                            const timeStr = txDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                            const dateStr = txDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                            
                            const parentSale = (data.todayOverview?.sales || []).find(s => s._id === tx.saleId);
                            const billNo = tx.billNumber || "N/A";

                            return (
                              <tr key={index} className="hover:bg-blue-50/20 transition-colors">
                                <td className="p-3 md:p-4 text-slate-400">{(itemsPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                <td className="p-3 md:p-4 font-medium text-slate-500">#{billNo}</td>
                                <td className="p-3 md:p-4">
                                  <p className="font-bold text-slate-800">{tx.name}</p>
                                </td>
                                <td className="p-3 md:p-4 text-center">
                                  <span className="font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg">
                                    {tx.quantity} pcs
                                  </span>
                                </td>
                                <td className="p-3 md:p-4 text-center font-medium text-slate-600">₹{tx.mrp}</td>
                                <td className="p-3 md:p-4 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${tx.paymentMethod === 'UPI' ? 'bg-indigo-50 text-indigo-600' : tx.paymentMethod === 'Card' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {tx.paymentMethod}
                                  </span>
                                </td>
                                <td className="p-3 md:p-4 text-right font-extrabold text-slate-700">₹{tx.total.toLocaleString('en-IN')}</td>
                                <td className="p-3 md:p-4 text-right whitespace-nowrap">
                                  <span className="font-bold text-slate-700 block">{dateStr}</span>
                                  <span className="text-[11px] text-slate-400 font-semibold">{timeStr}</span>
                                </td>
                                <td className="p-3 md:p-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        if (parentSale) {
                                          setPrintingInvoice({
                                            billNumber: billNo,
                                            date: parentSale.date || parentSale.createdAt,
                                            items: parentSale.items,
                                            totalAmount: parentSale.totalAmount,
                                            paymentMethod: parentSale.paymentMethod || "Cash",
                                            customerName: parentSale.customerName || "",
                                            customerPhone: parentSale.customerPhone || ""
                                          });
                                        } else {
                                          setPrintingInvoice({
                                            billNumber: billNo,
                                            date: tx.date,
                                            items: [{ name: tx.name, quantity: tx.quantity, mrp: tx.mrp, total: tx.total }],
                                            totalAmount: tx.total,
                                            paymentMethod: tx.paymentMethod || "Cash",
                                            customerName: "",
                                            customerPhone: ""
                                          });
                                        }
                                      }}
                                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm"
                                      title="Print / Reprint Thermal Invoice"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        if (parentSale) {
                                          handleReportsWhatsAppSend({
                                            billNumber: billNo,
                                            date: parentSale.date || parentSale.createdAt,
                                            items: parentSale.items,
                                            totalAmount: parentSale.totalAmount,
                                            paymentMethod: parentSale.paymentMethod || "Cash",
                                            customerPhone: parentSale.customerPhone || "",
                                            customerName: parentSale.customerName || ""
                                          });
                                        } else {
                                          handleReportsWhatsAppSend({
                                            billNumber: billNo,
                                            date: tx.date,
                                            items: [{ name: tx.name, quantity: tx.quantity, mrp: tx.mrp, total: tx.total }],
                                            totalAmount: tx.total,
                                            paymentMethod: tx.paymentMethod || "Cash",
                                            customerPhone: "",
                                            customerName: ""
                                          });
                                        }
                                      }}
                                      className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm"
                                      title="Share Invoice on WhatsApp"
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.498 1.45 5.411 1.451 5.928 0 10.755-4.827 10.758-10.758.002-2.874-1.116-5.576-3.149-7.61S14.887 2.19 12.012 2.19c-5.93 0-10.757 4.827-10.76 10.759-.001 2.02.527 3.997 1.528 5.724L1.87 21.8l3.32-.872zM17.487 14.39c-.3-.15-1.78-.878-2.079-.988-.3-.109-.519-.163-.739.163-.22.327-.852.988-1.045 1.21-.193.22-.386.248-.686.098-.3-.15-1.265-.466-2.41-1.488-.89-.794-1.49-1.776-1.665-2.076-.175-.3-.019-.462.13-.611.135-.133.3-.35.45-.525.15-.175.2-.299.3-.499.1-.2.05-.374-.025-.524-.075-.15-.739-1.78-1.012-2.438-.266-.643-.538-.553-.739-.563-.19-.01-.409-.01-.629-.01s-.578.083-.88.408c-.301.327-1.15 1.12-1.15 2.729s1.17 3.16 1.33 3.38c.163.22 2.3 3.51 5.57 4.92.778.336 1.385.537 1.857.687.782.248 1.49.213 2.05.13.628-.094 1.78-.729 2.03-1.43c.25-.701.25-1.3.175-1.43-.075-.13-.275-.205-.575-.355z"/>
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {renderPagination(itemsPage, filteredTransactions.length, setItemsPage)}
                    </>
                  );
                })()
              ) : (
                (() => {
                  const filteredSales = (data.todayOverview?.sales || []).filter((sale) => {
                    const query = modalSearchQuery.trim().toLowerCase();
                    if (!query) return true;
                    const billNo = sale._id ? sale._id.toString().slice(-6).toUpperCase() : "";
                    const customerName = (sale.customerName || "").toLowerCase();
                    const customerPhone = (sale.customerPhone || "").toLowerCase();
                    const paymentMethod = (sale.paymentMethod || "").toLowerCase();
                    const matchesItems = (sale.items || []).some(item => item.name?.toLowerCase().includes(query));
                    return (
                      billNo.includes(query) ||
                      customerName.includes(query) ||
                      customerPhone.includes(query) ||
                      paymentMethod.includes(query) ||
                      matchesItems
                    );
                  });

                  if (filteredSales.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <Receipt className="w-10 h-10 mb-3 text-slate-300" />
                        <p className="text-sm md:text-base font-medium">
                          {modalSearchQuery ? "No invoices matching your search query. 🔍" : "No invoices generated in this range. 😴"}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                            <th className="p-3 md:p-4 font-bold">#</th>
                            <th className="p-3 md:p-4 font-bold">Invoice Receipt</th>
                            <th className="p-3 md:p-4 font-bold">Customer Info</th>
                            <th className="p-3 md:p-4 font-bold">Medicines (Items)</th>
                            <th className="p-3 md:p-4 font-bold text-center">Payment Mode</th>
                            <th className="p-3 md:p-4 font-bold text-right">Grand Total</th>
                            <th className="p-3 md:p-4 font-bold text-right">Date & Time</th>
                            <th className="p-3 md:p-4 font-bold text-center">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                          {filteredSales.slice((billsPage - 1) * ITEMS_PER_PAGE, billsPage * ITEMS_PER_PAGE).map((sale, index) => {
                            const txDate = new Date(sale.date || sale.createdAt);
                            const timeStr = txDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                            const dateStr = txDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                            const billNo = sale._id ? sale._id.toString().slice(-6).toUpperCase() : "N/A";
                            return (
                              <tr key={sale._id || index} className="hover:bg-slate-50/20 transition-colors">
                                <td className="p-3 md:p-4 text-slate-400">{(billsPage - 1) * ITEMS_PER_PAGE + index + 1}</td>
                                <td className="p-3 md:p-4 font-extrabold text-slate-800">#{billNo}</td>
                                <td className="p-3 md:p-4">
                                  {sale.customerName || sale.customerPhone ? (
                                    <div>
                                      <p className="font-bold text-slate-800 leading-tight">{sale.customerName || "Customer"}</p>
                                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{sale.customerPhone || "N/A"}</p>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 italic text-[11px]">Walk-in Customer</span>
                                  )}
                                </td>
                                <td className="p-3 md:p-4 max-w-[220px]" title={sale.items.map(item => `${item.name} (${item.quantity})`).join(", ")}>
                                  <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto pr-1">
                                    {sale.items.map((item, idx) => (
                                      <span key={idx} className="inline-block bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                                        {item.name} <span className="text-blue-600 font-bold">x{item.quantity}</span>
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="p-3 md:p-4 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sale.paymentMethod === 'UPI' ? 'bg-indigo-50 text-indigo-600' : sale.paymentMethod === 'Card' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                                    {sale.paymentMethod || "Cash"}
                                  </span>
                                </td>
                                <td className="p-3 md:p-4 text-right font-extrabold text-slate-800 text-sm md:text-base">
                                  ₹{(sale.totalAmount || 0).toLocaleString('en-IN')}
                                </td>
                                <td className="p-3 md:p-4 text-right whitespace-nowrap">
                                  <span className="font-bold text-slate-700 block">{dateStr}</span>
                                  <span className="text-[11px] text-slate-400 font-semibold">{timeStr}</span>
                                </td>
                                <td className="p-3 md:p-4 text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <button
                                      onClick={() => {
                                        setPrintingInvoice({
                                          billNumber: billNo,
                                          date: sale.date || sale.createdAt,
                                          items: sale.items,
                                          totalAmount: sale.totalAmount,
                                          paymentMethod: sale.paymentMethod || "Cash",
                                          customerName: sale.customerName || "",
                                          customerPhone: sale.customerPhone || ""
                                        });
                                      }}
                                      className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm"
                                      title="Print / Reprint Thermal Invoice"
                                    >
                                      <Printer className="w-4 h-4" />
                                    </button>
                                    
                                    <button
                                      onClick={() => {
                                        handleReportsWhatsAppSend({
                                          billNumber: billNo,
                                          date: sale.date || sale.createdAt,
                                          items: sale.items,
                                          totalAmount: sale.totalAmount,
                                          paymentMethod: sale.paymentMethod || "Cash",
                                          customerPhone: sale.customerPhone || "",
                                          customerName: sale.customerName || ""
                                        });
                                      }}
                                      className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm"
                                      title="Share Invoice on WhatsApp"
                                    >
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.458L0 24zm6.59-4.846c1.6.95 3.498 1.451 5.419 1.452 5.539 0 10.048-4.509 10.051-10.05.002-2.685-1.033-5.207-2.909-7.086C17.332 1.59 14.815.556 12.013.556c-5.545 0-10.055 4.51-10.059 10.051-.001 1.922.502 3.8 1.455 5.409L2.39 20.37l4.257-1.116-.001-.001zm11.367-7.611c-.302-.15-1.785-.882-2.057-.982-.272-.099-.47-.15-.668.15-.198.298-.767.982-.94 1.181-.173.199-.347.224-.649.075-.3-.15-1.268-.467-2.417-1.493-.893-.797-1.496-1.782-1.671-2.08-.174-.3-.018-.463.132-.612.135-.133.302-.35.452-.525.15-.175.2-.299.3-.499.1-.2.05-.375-.025-.525-.075-.15-.668-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.785-.73 2.033-1.433.248-.703.248-1.306.173-1.432-.074-.128-.272-.203-.574-.353z"/>
                                      </svg>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {renderPagination(billsPage, filteredSales.length, setBillsPage)}
                    </>
                  );
                })()
              )}
            </div>
          </div>
        </div>
      )}

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
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
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
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50"
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
                className="flex-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 py-2.5 rounded-xl text-xs font-bold transition-all"
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

      {/* MODAL 2: Expiry Alert Full Details */}
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
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
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

      {/* MODAL 3: Low Stock Alert Full Details */}
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
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
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

      {/* MODAL 2: View All Distributors */}
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

      {/* Hidden printable container for B&W PDF Expiry Report */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <div ref={printRef} className="p-8 bg-white text-black font-sans w-[210mm]">
          {triggerExpiryPrint && (
            <>
              <style type="text/css" media="print">
                {`
                  @page {
                    size: A4;
                    margin: 20mm 15mm 20mm 15mm;
                  }
                  body {
                    color: #000 !important;
                    background: #fff !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  }
                  .print-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                  }
                  .print-table th {
                    border-bottom: 2px solid #000;
                    padding: 10px 8px;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                    text-align: left;
                  }
                  .print-table td {
                    border-bottom: 1px solid #ddd;
                    padding: 10px 8px;
                    font-size: 11px;
                    color: #000;
                  }
                  .print-header {
                    border-bottom: 3px solid #000;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                  }
                  .print-title {
                    font-size: 22px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    text-transform: uppercase;
                    margin: 0;
                  }
                  .print-subtitle {
                    font-size: 11px;
                    color: #555;
                    margin-top: 4px;
                    font-weight: 500;
                  }
                  .print-meta {
                    font-size: 10px;
                    color: #333;
                    text-align: right;
                    font-weight: 500;
                    line-height: 1.4;
                  }
                  .print-summary-box {
                    background-color: #f8fafc;
                    border: 1px solid #000;
                    padding: 12px;
                    display: flex;
                    justify-content: space-between;
                    margin-top: 15px;
                    font-size: 11px;
                    font-weight: bold;
                  }
                `}
              </style>
              
              {/* Header */}
              <div className="print-header">
                <div>
                  <h1 className="print-title">Medicines Expiry Report</h1>
                  <p className="print-subtitle">Smart Inventory & Loss Prevention insights</p>
                </div>
                <div className="print-meta">
                  <p>Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <p>Filter: Expiring in {expiryMonths} Month{expiryMonths > 1 ? 's' : ''}</p>
                </div>
              </div>

              {/* Quick Summary Banner */}
              <div className="print-summary-box">
                <span>TOTAL EXPIRING PRODUCTS: {data.expiringSoon?.length || 0}</span>
                <span>STATUS: URGENT / ATTENTION REQUIRED</span>
              </div>

              {/* Data Table */}
              <table className="print-table">
                <thead>
                  <tr>
                    <th style={{ width: '6%' }}>#</th>
                    <th style={{ width: '40%' }}>Medicine Name</th>
                    {reportsPdfConfig.showBatch && <th style={{ width: '15%' }}>Batch No.</th>}
                    {reportsPdfConfig.showBillNo && <th style={{ width: '15%' }}>Bill Number</th>}
                    {reportsPdfConfig.showQty && <th style={{ width: '12%', textAlign: 'center' }}>Stock Qty</th>}
                    {reportsPdfConfig.showExpiryDate && <th style={{ width: '12%', textAlign: 'right' }}>Expiry Date</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.expiringSoon?.map((med, idx) => (
                    <tr key={med._id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>{med.name}</div>
                        {reportsPdfConfig.showDistributor && (
                          <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>Dist: {med.distributor || 'N/A'}</div>
                        )}
                      </td>
                      {reportsPdfConfig.showBatch && <td>{med.batch || 'N/A'}</td>}
                      {reportsPdfConfig.showBillNo && <td>{med.billNumber || 'N/A'}</td>}
                      {reportsPdfConfig.showQty && <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{med.quantity}</td>}
                      {reportsPdfConfig.showExpiryDate && <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{formatExpiryDate(med.expiryDate)}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* Hidden printable container for B&W PDF Low Stock Report */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <div ref={lowStockPrintRef} className="p-8 bg-white text-black font-sans w-[210mm]">
          {triggerLowStockPrint && (
            <>
              <style type="text/css" media="print">
                {`
                  @page {
                    size: A4;
                    margin: 20mm 15mm 20mm 15mm;
                  }
                  body {
                    color: #000 !important;
                    background: #fff !important;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                  }
                  .print-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                  }
                  .print-table th {
                    border-bottom: 2px solid #000;
                    padding: 10px 8px;
                    font-size: 11px;
                    font-weight: bold;
                    text-transform: uppercase;
                    text-align: left;
                  }
                  .print-table td {
                    border-bottom: 1px solid #ddd;
                    padding: 10px 8px;
                    font-size: 11px;
                    color: #000;
                  }
                  .print-header {
                    border-bottom: 3px solid #000;
                    padding-bottom: 15px;
                    margin-bottom: 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                  }
                  .print-title {
                    font-size: 22px;
                    font-weight: 800;
                    letter-spacing: -0.5px;
                    text-transform: uppercase;
                    margin: 0;
                  }
                  .print-subtitle {
                    font-size: 11px;
                    color: #555;
                    margin-top: 4px;
                    font-weight: 500;
                  }
                  .print-meta {
                    font-size: 10px;
                    color: #333;
                    text-align: right;
                    font-weight: 500;
                    line-height: 1.4;
                  }
                  .print-summary-box {
                    background-color: #f8fafc;
                    border: 1px solid #000;
                    padding: 12px;
                    display: flex;
                    justify-content: space-between;
                    margin-top: 15px;
                    font-size: 11px;
                    font-weight: bold;
                  }
                `}
              </style>
              
              {/* Header */}
              <div className="print-header">
                <div>
                  <h1 className="print-title">Medicines Low Stock Report</h1>
                  <p className="print-subtitle">Smart Inventory replenishment insights</p>
                </div>
                <div className="print-meta">
                  <p>Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  <p>Filter: Stock Level below {lowStockThreshold} Units</p>
                </div>
              </div>

              {/* Quick Summary Banner */}
              <div className="print-summary-box">
                <span>TOTAL LOW STOCK PRODUCTS: {data.lowStock?.length || 0}</span>
                <span>STATUS: REORDER RECOMMENDED</span>
              </div>

              {/* Data Table */}
              <table className="print-table">
                <thead>
                  <tr>
                    <th style={{ width: '6%' }}>#</th>
                    <th style={{ width: '40%' }}>Medicine Name</th>
                    {reportsPdfConfig.showBatch && <th style={{ width: '15%' }}>Batch No.</th>}
                    {reportsPdfConfig.showBillNo && <th style={{ width: '15%' }}>Bill Number</th>}
                    {reportsPdfConfig.showQty && <th style={{ width: '15%', textAlign: 'right' }}>Available Qty</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.lowStock?.map((med, idx) => (
                    <tr key={med._id}>
                      <td>{idx + 1}</td>
                      <td>
                        <div style={{ fontWeight: 'bold' }}>{med.name}</div>
                        {reportsPdfConfig.showDistributor && (
                          <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>Dist: {med.distributor || 'N/A'}</div>
                        )}
                      </td>
                      {reportsPdfConfig.showBatch && <td>{med.batch || 'N/A'}</td>}
                      {reportsPdfConfig.showBillNo && <td>{med.billNumber || 'N/A'}</td>}
                      {reportsPdfConfig.showQty && <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{med.quantity}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* Hidden printable receipt wrapper for reprint */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <div ref={invoicePrintRef}>
          <style type="text/css" media="print">
            {`
              @page { 
                size: 58mm auto; 
                margin: 0mm !important; 
              }
              body { 
                margin: 0mm !important; 
                padding: 0mm !important; 
                font-family: monospace !important;
                background-color: white;
                color: black;
              }
              .thermal-invoice {
                width: 58mm !important; 
                box-sizing: border-box; 
                padding: 4mm 2mm; 
                font-size: 10px;
                line-height: 1.2;
              }
              .header {
                text-align: center;
                border-bottom: 1px dashed black;
                padding-bottom: 4px;
                margin-bottom: 6px;
              }
              .header h3 {
                margin: 0;
                font-size: 12px;
                text-transform: uppercase;
                font-weight: bold;
              }
              .header p {
                margin: 2px 0 0 0;
                font-size: 8px;
              }
              .info {
                border-bottom: 1px dashed black;
                padding-bottom: 4px;
                margin-bottom: 6px;
                font-size: 9px;
              }
              .info p {
                margin: 1px 0;
              }
              .items-table {
                width: 100%;
                border-bottom: 1px dashed black;
                padding-bottom: 4px;
                margin-bottom: 6px;
              }
              .items-table .row {
                display: flex;
                justify-content: space-between;
                margin: 2px 0;
                font-size: 9px;
              }
              .items-table .row.head {
                font-weight: bold;
                font-size: 8px;
                border-bottom: 0.5px solid black;
                padding-bottom: 2px;
                margin-bottom: 2px;
              }
              .total-row {
                display: flex;
                justify-content: space-between;
                font-weight: bold;
                font-size: 11px;
                margin-top: 4px;
              }
              .footer {
                text-align: center;
                font-size: 8px;
                margin-top: 15px;
                border-top: 0.5px solid black;
                padding-top: 4px;
              }
            `}
          </style>

          {printingInvoice && (            <div className="thermal-invoice">
              <div className="header">
                <h3>{shopInfo?.shopName || "MedERP Pharmacy"}</h3>
                {shopInfo?.address && <p style={{ fontSize: '8px', margin: '2px 0 0 0' }}>{shopInfo.address}</p>}
                {shopInfo?.phoneNumber && <p style={{ fontSize: '8px', margin: '1px 0 0 0' }}>Phone: {shopInfo.phoneNumber}</p>}
                <p style={{ fontSize: '8px', margin: '2px 0 0 0' }}>Date: {new Date(printingInvoice.date).toLocaleString('en-IN')}</p>
              </div>              <div className="info">
                <p>Invoice No: #{printingInvoice.billNumber}</p>
                <p>Payment Mode: {printingInvoice.paymentMethod}</p>
                {printingInvoice.customerPhone && <p>Cust Mobile: {printingInvoice.customerPhone}</p>}
                {printingInvoice.customerName && <p>Cust Name: {printingInvoice.customerName}</p>}
              </div>
              <div className="items-table">
                <div className="row head">
                  <span>Item Name</span>
                  <span>Qty x Price</span>
                </div>
                {printingInvoice.items.map((item, i) => (
                  <div key={i} className="row">
                    <span style={{ maxWidth: '32mm', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <span>{(item.quantity || item.sellQuantity)} x ₹{item.mrp}</span>
                  </div>
                ))}
              </div>
              <div className="total-row">
                <span>Grand Total:</span>
                <span>₹{printingInvoice.totalAmount}</span>
              </div>
              <div className="footer">
                Thank you! Get well soon.<br/>
                *Medicines once sold cannot be returned.*
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 📊 INTERACTIVE REPORTS DETAIL DRILLDOWN MODAL */}
      <ReportDetailModal 
        isOpen={!!reportModalType}
        onClose={() => setReportModalType(null)}
        modalType={reportModalType}
        data={data}
      />

      {/* 🔴 EXPIRED STOCK DETAIL MODAL */}
      {showExpiredModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] md:rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg md:text-xl font-bold text-rose-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-rose-500" />
                All Expired Stock Items
              </h2>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowExpiredModal(false); }}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            
            <div className="p-4 md:p-6 overflow-x-auto overflow-y-auto flex-1 bg-slate-50/30 custom-scrollbar">
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

      {/* 🟡 OUT OF STOCK DETAIL MODAL */}
      {showOutOfStockModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] md:rounded-3xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95">
            <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center">
                <PackageOpen className="w-5 h-5 mr-2 text-amber-500 animate-pulse" />
                All Out of Stock Medicines
              </h2>
              <button 
                onClick={(e) => { e.stopPropagation(); setShowOutOfStockModal(false); }}
                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            
            <div className="p-4 md:p-6 overflow-x-auto overflow-y-auto flex-1 bg-slate-50/30 custom-scrollbar">
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

    </div>
  );
}