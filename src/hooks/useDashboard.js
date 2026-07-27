import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function useDashboard() {
  const { data: session, status } = useSession();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsLoading, setTermsLoading] = useState(false);
  const [activeModalType, setActiveModalType] = useState(null);
  
  // Instant search states
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [shopInfo, setShopInfo] = useState(null);

  // Debounced manual search for medicine suggestions as user types
  useEffect(() => {
    if (!localSearchTerm.trim()) {
      setSearchTerm("");
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      setSearchTerm(localSearchTerm);
    }, 250); // 250ms debounce
    return () => clearTimeout(timer);
  }, [localSearchTerm]);

  useEffect(() => {
    if (searchTerm.trim()) {
      executeSearch(searchTerm);
    }
  }, [searchTerm]);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const data = await res.json();

      if (data.success) {
        setDashboardData(data);
        if (!data.termsAccepted || data.termsVersion !== "v1.0") {
          setShowTermsModal(true);
        } else {
          setShowTermsModal(false);
        }
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error) {
      toast.error("Network or Server error occurred!");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptTermsUpdate = async () => {
    setTermsLoading(true);
    try {
      const res = await fetch("/api/user/profile/accept-terms", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success("Policies accepted successfully!");
        setShowTermsModal(false);
        fetchDashboardData(true);
      } else {
        toast.error(resData.error || "Failed to accept terms.");
      }
    } catch (err) {
      toast.error("Connection error. Please try again.");
    } finally {
      setTermsLoading(false);
    }
  };

  const executeSearch = async (val) => {
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
      await executeSearch(searchTerm);
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

  const handleClearExpired = async () => {
    const isConfirm = window.confirm("⚠️ WARNING ⚠️\n\nAre you sure you want to delete all expired medicines from your inventory? This action is permanent and cannot be undone!");
    if (!isConfirm) return;
    
    const toastId = toast.loading("⏳ Deleting all expired medicines...");
    try {
      const res = await fetch("/api/medicine?id=all-expired", {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Expired stock cleared successfully!", { id: toastId, duration: 5000 });
        setActiveModalType(null);
        fetchDashboardData(true); // silent refresh
      } else {
        toast.error(data.error || "Failed to clear expired stock", { id: toastId, duration: 6000 });
      }
    } catch (err) {
      toast.error("Network or Server error occurred!", { id: toastId });
    }
  };

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

  const handleShareMorningAlert = async () => {
    const toastId = toast.loading("Preparing WhatsApp summary...");
    try {
      const res = await fetch("/api/reports?expiryMonths=3&lowStockThreshold=10");
      const reportData = await res.json();
      if (!reportData.success) {
        toast.error("Failed to fetch inventory alert data");
        return;
      }
      
      const shopName = shopInfo?.shopName || "MedERP Pharmacy";
      const shopPhone = shopInfo?.phoneNumber || "";
      
      let message = `*🌅 MORNING INVENTORY ALERT 🌅*\n`;
      message += `-----------------------------\n`;
      message += `*Store:* ${shopName}\n`;
      if (shopPhone) message += `*Phone:* ${shopPhone}\n`;
      message += `*Date:* ${new Date().toLocaleDateString('en-IN')}\n`;
      message += `-----------------------------\n\n`;

      const lowStockList = reportData.lowStock || [];
      const expiringSoonList = reportData.expiringSoon || [];
      const outOfStockList = reportData.outOfStock || [];

      if (outOfStockList.length > 0) {
        message += `*🚨 OUT OF STOCK ITEMS (${outOfStockList.length})*\n`;
        outOfStockList.slice(0, 15).forEach((item) => {
          message += `• ${item.name} (Batch: ${item.batch})\n`;
        });
        if (outOfStockList.length > 15) {
          message += `  _...and ${outOfStockList.length - 15} more_\n`;
        }
        message += `\n`;
      }

      if (lowStockList.length > 0) {
        message += `*⚠️ LOW STOCK ITEMS (${lowStockList.length})*\n`;
        lowStockList.slice(0, 15).forEach((item) => {
          message += `• ${item.name} (${item.quantity} units left)\n`;
        });
        if (lowStockList.length > 15) {
          message += `  _...and ${lowStockList.length - 15} more_\n`;
        }
        message += `\n`;
      }

      if (expiringSoonList.length > 0) {
        message += `*⏳ EXPIRING SOON (${expiringSoonList.length})*\n`;
        expiringSoonList.slice(0, 15).forEach((item) => {
          const expStr = new Date(item.expiryDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
          message += `• ${item.name} (Exp: ${expStr} | Qty: ${item.quantity})\n`;
        });
        if (expiringSoonList.length > 15) {
          message += `  _...and ${expiringSoonList.length - 15} more_\n`;
        }
        message += `\n`;
      }

      message += `-----------------------------\n`;
      message += `Please reorder low stock/out of stock items and clear expiring inventory. 🏥`;

      const encodedText = encodeURIComponent(message);
      let ownerPhone = shopInfo?.phoneNumber || "";
      let cleanedPhone = ownerPhone.replace(/\D/g, "");
      if (cleanedPhone.length === 10) {
        cleanedPhone = "91" + cleanedPhone;
      }

      const waUrl = cleanedPhone ? `https://wa.me/${cleanedPhone}?text=${encodedText}` : `https://wa.me/?text=${encodedText}`;
      
      window.open(waUrl, "_blank");
      toast.success("Alert summary generated!", { id: toastId });
    } catch (err) {
      toast.error("Error generating WhatsApp share", { id: toastId });
    }
  };

  return {
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
    setShowTermsModal,
    handleRefresh,
    handleAcceptTermsUpdate,
    handleBackup,
    handleRestore,
    handleClearExpired,
    handleShareMorningAlert
  };
}
