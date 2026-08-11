import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { safeStorage } from "@/lib/safeStorage";

export default function useReports() {
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
    
    const message = `*✨ INVOICE / BILL DETAILS ✨*\n-----------------------------\n*Store:* ${shopName}\n${shopPhone ? `*Phone:* ${shopPhone}\n` : ""}*Invoice No:* #${billNo}\n*Date:* ${dateStr}\n*Payment Method:* ${payMode}\n\n-----------------------------\n*Items:*\n${itemsText}-----------------------------\n*Grand Total: ₹${totalAmount}*\n\nThank you! Get well soon. 🏥`;

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

  const [reportsPdfConfig, setReportsPdfConfig] = useState(() => {
    const savedReports = safeStorage.getItem("super_reports_pdf_config");
    if (savedReports) {
      try {
        return JSON.parse(savedReports);
      } catch (e) {}
    }
    return {
      showDistributor: true,
      showBatch: true,
      showBillNo: true,
      showQty: true,
      showExpiryDate: true
    };
  });

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

  return {
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
    setReportsPdfConfig,
    filteredDistributors,
    handleDeleteMedicine,
    handleReportsWhatsAppSend,
    executeWhatsAppSend,
    fetchReports,
    handleRefresh,
    getSelectedDateLabel
  };
}
