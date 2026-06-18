"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { 
  Lock, 
  User, 
  KeyRound, 
  Loader2, 
  CalendarClock, 
  ShieldAlert, 
  LogOut, 
  History, 
  CalendarDays,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  ShieldCheck,
  Store,
  MapPin,
  Phone,
  Mail,
  X,
  BadgeHelp,
  Download,
  Upload,
  Database,
  Trash2,
  FileText,
  ScanBarcode,
  PackageOpen,
  Laptop,
  Smartphone,
  Tablet,
  Shield,
  HardDrive,
  Percent,
  Activity,
  ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";

const ProfileSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-6 w-60 bg-slate-200 rounded-md"></div>
        <div className="h-4 w-96 bg-slate-200 rounded-md"></div>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* User Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-4 shadow-sm">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-200 rounded-2xl mb-4"></div>
              <div className="h-4 w-32 bg-slate-200 rounded-md mb-2"></div>
              <div className="h-5 w-24 bg-slate-200 rounded-full"></div>
            </div>
            <div className="border-t border-slate-50 pt-4 space-y-3">
              <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
              <div className="h-4 w-28 bg-slate-200 rounded-md"></div>
            </div>
          </div>
        </div>

        {/* Right Columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form Details */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 space-y-6 shadow-sm">
            <div className="h-5 w-40 bg-slate-200 rounded-md"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-20 bg-slate-200 rounded-md"></div>
                  <div className="h-10 w-full bg-slate-100 rounded-xl"></div>
                </div>
              ))}
            </div>
            <div className="h-10 w-32 bg-slate-200 rounded-xl ml-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Profile() {
  const { data: session } = useSession();
  const [profileData, setProfileData] = useState({
    name: "",
    shopName: "",
    address: "",
    phoneNumber: "",
    email: ""
  });
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [subDetails, setSubDetails] = useState({ subscriptionEnd: null, subscriptionHistory: [] });
  const [subLoading, setSubLoading] = useState(true);

  // OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [debugOtp, setDebugOtp] = useState(null);

  // Backup & Restore state
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreConfirmText, setRestoreConfirmText] = useState("");

  // Advanced configurations
  const [purchaseFormConfig, setPurchaseFormConfig] = useState({
    name: true, batch: true, quantity: true, distributor: true, mrp: true, billNumber: true, purchaseDate: true, expiryDate: true
  });
  const [barcodeConfig, setBarcodeConfig] = useState({
    showName: true, showPrice: true, showExpiry: true, showBatch: true, showBillNo: true, showPurchaseDate: true, showBarcodeText: true
  });
  const [reportsPdfConfig, setReportsPdfConfig] = useState({
    showDistributor: true, showBatch: true, showBillNo: true, showQty: true, showExpiryDate: true
  });

  // Active sub-page tabs: "profile", "subHistory", "devices", "databasePurge", "configurations"
  const [activeTab, setActiveTab] = useState("profile");

  // Database metrics
  const [medicinesCount, setMedicinesCount] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [dataSize, setDataSize] = useState(0);
  const [dataSizeFormatted, setDataSizeFormatted] = useState("0 Bytes");

  // Device Sessions states
  const [activeSessions, setActiveSessions] = useState([]);
  const [revokingSessionId, setRevokingSessionId] = useState(null);

  // Database custom cleanup preferences
  const [cleanupMonths, setCleanupMonths] = useState(6);
  const [cleanupSoldOut, setCleanupSoldOut] = useState(true);
  const [cleanupExpired, setCleanupExpired] = useState(true);
  const [cleanupSales, setCleanupSales] = useState(true);
  const [cleanupKhata, setCleanupKhata] = useState(true);

  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupConfirmText, setCleanupConfirmText] = useState("");
  const [cleanupLoading, setCleanupLoading] = useState(false);

  useEffect(() => {
    const savedForm = localStorage.getItem("super_purchase_form_config");
    if (savedForm) {
      try { setPurchaseFormConfig(JSON.parse(savedForm)); } catch(e) {}
    }
    const savedBarcode = localStorage.getItem("super_barcode_config");
    if (savedBarcode) {
      try { setBarcodeConfig(JSON.parse(savedBarcode)); } catch(e) {}
    }
    const savedReports = localStorage.getItem("super_reports_pdf_config");
    if (savedReports) {
      try { setReportsPdfConfig(JSON.parse(savedReports)); } catch(e) {}
    }
  }, []);

  const handleSaveFormConfig = (newConfig) => {
    setPurchaseFormConfig(newConfig);
    localStorage.setItem("super_purchase_form_config", JSON.stringify(newConfig));
    toast.success("Purchase Form fields updated!");
  };

  const handleSaveBarcodeConfig = (newConfig) => {
    setBarcodeConfig(newConfig);
    localStorage.setItem("super_barcode_config", JSON.stringify(newConfig));
    toast.success("Barcode label printing layout updated!");
  };

  const handleSaveReportsPdfConfig = (newConfig) => {
    setReportsPdfConfig(newConfig);
    localStorage.setItem("super_reports_pdf_config", JSON.stringify(newConfig));
    toast.success("Reports PDF column configurations updated!");
  };

  const handleCustomDatabaseCleanup = async (e) => {
    e.preventDefault();
    if (cleanupConfirmText !== "CLEANUP") {
      toast.error("Please type CLEANUP to confirm!");
      return;
    }
    setCleanupLoading(true);
    const toastId = toast.loading("Executing storage database cleanup...");
    try {
      const res = await fetch("/api/cleanup", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          months: cleanupMonths,
          cleanSoldOut: cleanupSoldOut,
          cleanExpired: cleanupExpired,
          cleanSales: cleanupSales,
          cleanKhata: cleanupKhata
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Storage database cleanup executed successfully!", { id: toastId, duration: 6000 });
        setShowCleanupModal(false);
        setCleanupConfirmText("");
        // Refresh profile stats
        fetchProfileDetails();
      } else {
        toast.error(data.error || "Database cleanup failed", { id: toastId });
      }
    } catch (err) {
      toast.error("Server communication error", { id: toastId });
    } finally {
      setCleanupLoading(false);
    }
  };

  const fetchProfileDetails = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.success) {
        if (data.user) {
          setProfileData({
            name: data.user.name || "",
            shopName: data.user.shopName || "",
            address: data.user.address || "",
            phoneNumber: data.user.phoneNumber || "",
            email: data.user.email || ""
          });
        }
        setMedicinesCount(data.medicinesCount || 0);
        setSalesCount(data.salesCount || 0);
        setDataSize(data.dataSize || 0);
        setDataSizeFormatted(data.dataSizeFormatted || "0 Bytes");
        setActiveSessions(data.activeSessions || []);
      }
    } catch (error) {
      console.error("Failed to load profile details:", error);
    } finally {
      setProfileLoading(false);
    }
  };

  const fetchSubscriptionDetails = async () => {
    try {
      const res = await fetch("/api/user/subscription?history=true");
      const data = await res.json();
      if (data.success) {
        setSubDetails(data);
      }
    } catch (error) {
      console.error("Failed to load subscription details:", error);
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileDetails();
    fetchSubscriptionDetails();
  }, []);

  const handleRevokeSession = async (deviceSessionId) => {
    setRevokingSessionId(deviceSessionId);
    try {
      const res = await fetch("/api/user/profile/revoke-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceSessionId })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Device session logged out successfully!");
        fetchProfileDetails(); // Refresh sessions list
      } else {
        toast.error(data.error || "Failed to log out device.");
      }
    } catch (err) {
      toast.error("Network or server communication error.");
    } finally {
      setRevokingSessionId(null);
    }
  };

  // Triggers OTP request and opens the verification modal
  const handleRequestProfileUpdate = async (e) => {
    e.preventDefault();

    if (passwords.newPassword && passwords.newPassword !== passwords.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setSendingOtp(true);
    setDebugOtp(null);
    setOtpCode("");

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "profile"
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Security verification OTP sent to your registered email!");
        setShowOtpModal(true);
        if (data.debug) {
          setDebugOtp(data.debug);
        }
      } else {
        toast.error(data.error || "Failed to send OTP code.");
      }
    } catch (error) {
      toast.error("Server communication error.");
    } finally {
      setSendingOtp(false);
    }
  };

  // Submits the updates with the entered OTP code
  const handleSaveProfileChanges = async (e) => {
    e.preventDefault();
    if (!otpCode) {
      toast.error("Please enter the verification OTP code!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name,
          shopName: profileData.shopName,
          address: profileData.address,
          phoneNumber: profileData.phoneNumber,
          email: profileData.email,
          newPassword: passwords.newPassword || undefined,
          otp: otpCode
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Profile details updated successfully!");
        setShowOtpModal(false);
        setPasswords({ newPassword: "", confirmPassword: "" });
        setOtpCode("");
        setDebugOtp(null);
        fetchProfileDetails(); // Refresh details
      } else {
        toast.error(data.error || "Failed to update profile.");
      }
    } catch (error) {
      toast.error("Server or Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    setBackupLoading(true);
    const toastId = toast.loading("Generating your database backup file...");
    try {
      const res = await fetch("/api/backup");
      const data = await res.json();
      if (data.success && data.backupData) {
        // Trigger browser level download of local JSON file
        const blob = new Blob([JSON.stringify(data.backupData, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || `backup_${session?.user?.name?.toLowerCase()}_data.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success(data.message || "🎉 Backup downloaded successfully!", { id: toastId });
      } else {
        toast.error(data.error || "Failed to download backup.", { id: toastId });
      }
    } catch (err) {
      toast.error("Network or server error during backup generation.", { id: toastId });
    } finally {
      setBackupLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      toast.error("Please upload a valid JSON backup file!");
      e.target.value = "";
      return;
    }

    setRestoreFile(file);
    setRestoreConfirmText("");
    setShowRestoreModal(true);
    e.target.value = "";
  };

  const handleRestoreSubmit = async (e) => {
    e.preventDefault();
    if (restoreConfirmText !== "RESTORE") {
      toast.error("Please type RESTORE to confirm!");
      return;
    }

    setRestoreLoading(true);
    const toastId = toast.loading("Uploading and restoring your database records...");

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const backupData = JSON.parse(event.target.result);

          const res = await fetch("/api/restore", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ backupData })
          });

          const data = await res.json();
          if (data.success) {
            toast.success(data.message || "🎉 Data restored successfully!", { id: toastId });
            setShowRestoreModal(false);
            setRestoreFile(null);
            setRestoreConfirmText("");
            fetchProfileDetails(); // Refresh stats
          } else {
            toast.error(data.error || "Failed to restore data.", { id: toastId });
          }
        } catch (parseError) {
          toast.error("Invalid file structure. Make sure this is a valid backup JSON.", { id: toastId });
        } finally {
          setRestoreLoading(false);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file.", { id: toastId });
        setRestoreLoading(false);
      };

      reader.readAsText(restoreFile);

    } catch (err) {
      toast.error("Failed to initiate restore flow.", { id: toastId });
      setRestoreLoading(false);
    }
  };

  // Detailed subscription analysis
  const getSubscriptionInfo = () => {
    if (session?.user?.role === "superadmin") {
      return {
        planName: "Lifetime Enterprise Admin",
        daysLeft: "Unlimited",
        percentLeft: 100,
        badgeColor: "bg-purple-50 text-purple-600 border-purple-200",
        statusText: "Active (Lifetime)",
        expiryText: "Never Expires",
        icon: <Award className="w-5 h-5 text-purple-500" />
      };
    }

    if (!subDetails.subscriptionEnd) {
      return {
        planName: "No Active Plan",
        daysLeft: 0,
        percentLeft: 0,
        badgeColor: "bg-rose-50 text-rose-600 border-rose-200",
        statusText: "Suspended",
        expiryText: "N/A",
        icon: <ShieldAlert className="w-5 h-5 text-rose-500" />
      };
    }

    const expiry = new Date(subDetails.subscriptionEnd);
    const today = new Date();
    const diffTime = expiry - today;
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    let planName = "Standard Trial Plan";
    let cycleDuration = 30; // Default trial is 30 days
    
    if (subDetails.subscriptionHistory && subDetails.subscriptionHistory.length > 0) {
      const lastExtension = subDetails.subscriptionHistory[subDetails.subscriptionHistory.length - 1];
      const months = lastExtension.addedMonths;
      cycleDuration = months * 30;
      
      if (months === 1) planName = "Monthly Premium Plan";
      else if (months === 3) planName = "Quarterly Premium Plan";
      else if (months === 6) planName = "Half-Yearly Premium Plan";
      else if (months === 12) planName = "Annual Enterprise Plan";
      else planName = `Custom Premium (${months} Months)`;
    }

    let badgeColor = "bg-blue-50 text-blue-600 border-blue-200";
    let statusText = "Active";
    let icon = <ShieldCheck className="w-5 h-5 text-blue-500" />;

    if (daysLeft === 0) {
      badgeColor = "bg-rose-50 text-rose-600 border-rose-200";
      statusText = "Expired";
      icon = <ShieldAlert className="w-5 h-5 text-rose-500" />;
    } else if (daysLeft <= 5) {
      badgeColor = "bg-amber-50 text-amber-600 border-amber-200 animate-pulse";
      statusText = "Expiring Soon";
      icon = <Clock className="w-5 h-5 text-amber-500" />;
    }

    const percentLeft = Math.min(100, Math.max(0, (daysLeft / cycleDuration) * 100));
    const expiryText = expiry.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    return {
      planName,
      daysLeft,
      percentLeft,
      badgeColor,
      statusText,
      expiryText,
      icon
    };
  };

  const getProfileCompleteness = () => {
    const fields = [profileData.name, profileData.shopName, profileData.address, profileData.phoneNumber, profileData.email];
    const filled = fields.filter(f => f && f.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  };

  const getSubscriptionTimeline = () => {
    const timeline = [];
    if (session?.user?.role === "superadmin") {
      return [{
        type: "lifetime",
        title: "Lifetime Administrator Access Active",
        description: "Your super admin environment is pre-configured with permanent, unlimited licensing.",
        startDate: new Date(),
        endDate: new Date("9999-12-31"),
        status: "active"
      }];
    }

    // Attempt to parse start date
    let userCreatedAt = subDetails.subscriptionHistory?.[0]?.addedAt 
      ? new Date(subDetails.subscriptionHistory[0].addedAt) 
      : (session?.user?.createdAt ? new Date(session.user.createdAt) : new Date());

    const trialEnd = new Date(userCreatedAt);
    trialEnd.setDate(trialEnd.getDate() + 7);

    timeline.push({
      type: "trial",
      title: "7-Day Free Trial Activated",
      description: "PharmaERP Trial license enabled automatically upon registration.",
      startDate: userCreatedAt,
      endDate: trialEnd,
      status: "completed"
    });

    let currentExpiration = trialEnd;
    const history = subDetails.subscriptionHistory || [];
    const sortedHistory = [...history].sort((a, b) => new Date(a.addedAt) - new Date(b.addedAt));

    sortedHistory.forEach((item) => {
      const addedAt = new Date(item.addedAt);
      const newExpirationDate = new Date(item.newExpirationDate);

      // Gap detection: inactive period (paused/band)
      if (addedAt > currentExpiration) {
        timeline.push({
          type: "suspended",
          title: "ERP License Suspended (Inactive Period)",
          description: "Access was temporarily locked due to a subscription gap.",
          startDate: new Date(currentExpiration),
          endDate: new Date(addedAt),
          status: "expired"
        });
      }

      timeline.push({
        type: "purchase",
        title: item.addedMonths === 0 ? "Subscription Terminated" : `Purchased ${item.addedMonths} Month Extension`,
        description: item.addedMonths === 0
          ? "ERP License canceled immediately by Administrator command."
          : `Subscription purchased. License validity successfully pushed forward.`,
        startDate: addedAt > currentExpiration ? addedAt : currentExpiration,
        endDate: newExpirationDate,
        addedMonths: item.addedMonths,
        addedAt: addedAt,
        status: item.addedMonths === 0 ? "terminated" : "completed"
      });

      currentExpiration = newExpirationDate;
    });

    const now = new Date();
    if (currentExpiration < now) {
      timeline.push({
        type: "suspended",
        title: "ERP License Currently Suspended",
        description: "ERP account is locked from performing billing and stock operations. Renew subscription to unlock.",
        startDate: currentExpiration,
        endDate: now,
        status: "expired"
      });
    }

    return timeline.reverse(); // Latest events on top
  };

  const subInfo = getSubscriptionInfo();
  const completeness = getProfileCompleteness();
  const timelineEvents = getSubscriptionTimeline();

  if (profileLoading) {
    return <ProfileSkeleton />;
  }

  // Define tab navigation buttons array
  const navigationTabs = [
    { id: "profile", label: "Profile Information", icon: <User className="w-4 h-4" /> },
    { id: "subHistory", label: "Subscription History", icon: <History className="w-4 h-4" />, hide: session?.user?.role === "superadmin" },
    { id: "devices", label: "Devices & Sessions", icon: <Laptop className="w-4 h-4" /> },
    { id: "databasePurge", label: "Storage Cleanup", icon: <Trash2 className="w-4 h-4" />, hide: session?.user?.id === "000000000000000000000000" },
    { id: "configurations", label: "Preferences & Config", icon: <ScanBarcode className="w-4 h-4" /> },
  ].filter(t => !t.hide);

  return (
    <div className="max-w-6xl mx-auto space-y-8 select-none">
      
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-500 shrink-0" />
          Settings & Account Portal
        </h1>
        <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">
          Monitor your pharmacy data statistics, logs, license history, and optimize database usage.
        </p>
      </div>

      {/* Quick Dashboard Overview Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100/70 p-5 rounded-3xl flex items-center justify-between shadow-[0_2px_10px_-4px_rgba(0,0,0,0.01)] transition-all hover:scale-[1.01]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Active Medicines</span>
            <p className="text-2xl font-black text-slate-800">{medicinesCount}</p>
          </div>
          <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-150">
            <PackageOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100/70 p-5 rounded-3xl flex items-center justify-between shadow-[0_2px_10px_-4px_rgba(0,0,0,0.01)] transition-all hover:scale-[1.01]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Total Sales Invoices</span>
            <p className="text-2xl font-black text-slate-800">{salesCount}</p>
          </div>
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-150">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 border border-purple-100/70 p-5 rounded-3xl flex items-center justify-between shadow-[0_2px_10px_-4px_rgba(0,0,0,0.01)] transition-all hover:scale-[1.01]">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Estimated Data Size</span>
            <p className="text-2xl font-black text-slate-800">{dataSizeFormatted}</p>
          </div>
          <div className="w-12 h-12 bg-purple-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-purple-150">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account Details & Navigation Tabs */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* User Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-150 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/40 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 mb-4">
                <User className="text-white w-9 h-9" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 capitalize leading-none mb-1">{session?.user?.name}</h2>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${subInfo.badgeColor} mt-2`}>
                {subInfo.statusText}
              </span>
            </div>

            {/* Profile Completion Index */}
            <div className="border-t border-slate-100 mt-6 pt-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-blue-500" /> Completeness Index
                </span>
                <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{completeness}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${completeness === 100 ? 'bg-emerald-500' : completeness >= 50 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 mt-5 pt-5 space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pharmacy Role</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">
                  {session?.user?.role === "superadmin" ? "System Superadmin" : session?.user?.role === "admin" ? "Pharmacy Owner" : "Staff Pharmacist"}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account ID</p>
                <p className="text-xs font-mono font-semibold text-slate-500 mt-0.5 break-all select-all">{session?.user?.id}</p>
              </div>
            </div>
          </div>

          {/* Premium Vertical Tab bar Menu */}
          <div className="bg-white rounded-3xl p-3 border border-slate-150 shadow-sm space-y-1">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider px-3.5 pt-2 pb-1">Menu Sections</p>
            {navigationTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-bold text-xs uppercase transition-all tracking-wider ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  {tab.icon}
                  <span>{tab.label}</span>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${activeTab === tab.id ? 'translate-x-0.5' : 'text-slate-300'}`} />
              </button>
            ))}
          </div>

          {/* Sign Out Button */}
          <button 
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/login";
            }}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider border border-rose-100 bg-rose-50/50 text-rose-600 hover:bg-rose-100 transition-all shadow-sm cursor-pointer mt-3"
          >
            <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Sign Out</span>
          </button>

          {/* Dev System admin alert */}
          {session?.user?.id === "000000000000000000000000" && (
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 text-amber-700 text-xs font-semibold flex gap-2.5 mt-3">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
              <p>Default local admin profile credentials cannot be modified via UI. Please edit your system <code>.env</code> file directly.</p>
            </div>
          )}

        </div>

        {/* Right Column: Tab View Contents */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PROFILE SETTINGS TAB */}
          {activeTab === "profile" && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-150 shadow-sm animate-in fade-in duration-300">
              <h3 className="text-base font-bold text-slate-800 flex items-center mb-6">
                <Store className="w-5 h-5 text-blue-500 mr-2.5 shrink-0" />
                Manage Pharmacy Profile
              </h3>

              <form onSubmit={handleRequestProfileUpdate} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Owner Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Owner Name"
                        disabled={session?.user?.id === "000000000000000000000000"}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-semibold text-sm disabled:opacity-60"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      />
                      <User className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Pharmacy Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="Pharmacy Name"
                        disabled={session?.user?.id === "000000000000000000000000"}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-semibold text-sm disabled:opacity-60"
                        value={profileData.shopName}
                        onChange={(e) => setProfileData({ ...profileData, shopName: e.target.value })}
                      />
                      <Store className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Shop Address</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Pharmacy Address"
                      disabled={session?.user?.id === "000000000000000000000000"}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-semibold text-sm disabled:opacity-60"
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    />
                    <MapPin className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number"
                        disabled={session?.user?.id === "000000000000000000000000"}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-semibold text-sm disabled:opacity-60"
                        value={profileData.phoneNumber}
                        onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                      />
                      <Phone className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        placeholder="Email Address"
                        disabled={session?.user?.id === "000000000000000000000000"}
                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-semibold text-sm disabled:opacity-60"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      />
                      <Mail className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                    </div>
                  </div>
                </div>

                {session?.user?.id !== "000000000000000000000000" && (
                  <div className="border-t border-slate-100 pt-5 space-y-4">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-slate-400" />
                      Change Account Password (Optional)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="Enter new password"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-semibold text-sm"
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                          />
                          <Lock className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm Password</label>
                        <div className="relative">
                          <input
                            type="password"
                            placeholder="Confirm new password"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-semibold text-sm"
                            value={passwords.confirmPassword}
                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                          />
                          <Lock className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {session?.user?.id !== "000000000000000000000000" && (
                  <button
                    type="submit"
                    disabled={sendingOtp}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2 disabled:opacity-75 text-xs uppercase tracking-wider"
                  >
                    {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile Details (Sends OTP)"}
                  </button>
                )}
              </form>
            </div>
          )}

          {/* SUBSCRIPTION TIMELINE HISTORY TAB */}
          {activeTab === "subHistory" && session?.user?.role !== "superadmin" && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-150 shadow-sm space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                    {subInfo.icon}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active ERP License</p>
                    <h3 className="text-base md:text-lg font-bold text-slate-800">{subInfo.planName}</h3>
                  </div>
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border ${subInfo.badgeColor}`}>
                  {subInfo.statusText}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Days Remaining</p>
                  <p className="text-xl md:text-2xl font-black text-slate-700 mt-1">{subInfo.daysLeft}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">License Expiration</p>
                  <p className="text-sm md:text-base font-extrabold text-slate-700 mt-2">{subInfo.expiryText}</p>
                </div>
              </div>

              {subInfo.percentLeft > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400">LICENSE EXPIRY RATIO</span>
                    <span className="text-blue-600">{subInfo.percentLeft}% Left</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${subInfo.percentLeft}%` }} />
                  </div>
                </div>
              )}

              {/* Enhanced timeline showing both extensions and suspensions */}
              <div className="pt-4 border-t border-slate-100 space-y-6">
                <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <History className="w-4 h-4 text-slate-400" /> Interactive License History Timeline
                </h4>

                {subLoading ? (
                  <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
                    <p className="text-xs font-semibold">Loading License history timeline...</p>
                  </div>
                ) : timelineEvents.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm font-semibold bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                    No timeline log logs found. Free trial active. 📦
                  </div>
                ) : (
                  <div className="relative border-l border-slate-100 ml-4 pl-6 space-y-6">
                    {timelineEvents.map((event, index) => {
                      const isSuspended = event.type === "suspended";
                      const isTrial = event.type === "trial";
                      
                      return (
                        <div key={index} className="relative group">
                          
                          {/* Timeline Bullet */}
                          <div className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-4 border-white group-hover:scale-115 transition-transform shadow-md ${
                            isSuspended 
                              ? "bg-rose-500 shadow-rose-100" 
                              : isTrial 
                                ? "bg-amber-500 shadow-amber-100" 
                                : "bg-blue-500 shadow-blue-100"
                          }`} />
                          
                          <div className={`border rounded-2xl p-4 transition-colors shadow-[0_2px_10px_-4px_rgba(0,0,0,0.01)] ${
                            isSuspended 
                              ? "bg-rose-50/30 border-rose-100 hover:border-rose-200" 
                              : isTrial
                                ? "bg-amber-50/30 border-amber-100 hover:border-amber-200"
                                : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                          }`}>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <div>
                                <p className={`font-extrabold text-sm ${isSuspended ? "text-rose-800" : "text-slate-800"}`}>
                                  {event.title}
                                </p>
                                <p className="text-xs font-semibold text-slate-500 mt-1">{event.description}</p>
                                
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2 flex items-center gap-1">
                                  <CalendarDays className="w-3.5 h-3.5" />
                                  Duration: {new Date(event.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                  {" - "}
                                  {new Date(event.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                              </div>
                              
                              <div className="sm:text-right mt-1 sm:mt-0">
                                <span className={`inline-block border px-2.5 py-1 rounded-xl text-[10px] font-extrabold uppercase ${
                                  isSuspended 
                                    ? "bg-rose-100 border-rose-200 text-rose-700" 
                                    : isTrial 
                                      ? "bg-amber-100 border-amber-200 text-amber-700" 
                                      : "bg-blue-50 border-blue-100 text-blue-600"
                                }`}>
                                  {isSuspended 
                                    ? "Suspended Period" 
                                    : isTrial 
                                      ? "7-Day Trial" 
                                      : `+${event.addedMonths} Months`}
                                </span>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DEVICES & ACTIVE SESSIONS TAB */}
          {activeTab === "devices" && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-150 shadow-sm space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center">
                  <Laptop className="w-5 h-5 text-blue-500 mr-2.5 shrink-0" />
                  Active Sessions & Device Logs
                </h3>
                <p className="text-slate-500 text-xs font-semibold mt-1">
                  Review and manage the devices currently logged into your pharmacy dashboard. Revoke access to instantly log out any unrecognized devices.
                </p>
              </div>

              {activeSessions.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm font-semibold bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  No active session logs found. Please log in again. 📦
                </div>
              ) : (
                <div className="space-y-4">
                  {activeSessions.map((sess) => {
                    const isMobile = sess.deviceType === "Mobile";
                    const isTablet = sess.deviceType === "Tablet";
                    
                    return (
                      <div 
                        key={sess.deviceSessionId} 
                        className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shrink-0 shadow-sm text-slate-600">
                            {isMobile ? <Smartphone className="w-5 h-5" /> : isTablet ? <Tablet className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-slate-800 text-sm">{sess.os} • {sess.browser}</span>
                              {sess.isOnline ? (
                                <span className="bg-emerald-50 text-emerald-600 border border-emerald-150 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                                  Online
                                </span>
                              ) : (
                                <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
                                  Offline
                                </span>
                              )}
                            </div>
                            
                            <p className="text-[10px] text-slate-500 font-semibold mt-1">
                              IP Address: <span className="font-mono">{sess.ipAddress}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              Last Activity: {new Date(sess.lastActive).toLocaleDateString("en-IN", {
                                day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center">
                          <button
                            onClick={() => handleRevokeSession(sess.deviceSessionId)}
                            disabled={revokingSessionId === sess.deviceSessionId}
                            className="w-full sm:w-auto bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 font-bold text-xs uppercase px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
                          >
                            {revokingSessionId === sess.deviceSessionId ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Lock className="w-3.5 h-3.5" />
                            )}
                            Revoke Access
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* DATABASE STORAGE PURGE TAB */}
          {activeTab === "databasePurge" && session?.user?.id !== "000000000000000000000000" && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-150 shadow-sm space-y-6 animate-in fade-in duration-300">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center">
                  <Trash2 className="w-5 h-5 text-rose-500 mr-2.5 shrink-0" />
                  Database Storage Purge Tool
                </h3>
                <p className="text-slate-500 text-xs font-semibold mt-1">
                  Optimize your database performance by permanently clearing out old, useless historical records. This operation cannot be undone.
                </p>
              </div>

              {/* Configurable Purge Form */}
              <div className="bg-rose-50 border border-rose-100 rounded-3xl p-5 md:p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-100 rounded-2xl flex items-center justify-center text-rose-600 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-900 leading-tight">Advanced Data Purge Configuration</h4>
                    <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider mt-0.5">Customize what useless data to wipe</p>
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Category options */}
                  <div className="space-y-3">
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Select Categories to Purge</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                      <label className="flex items-center space-x-3 p-3 bg-white border border-rose-100 rounded-xl hover:bg-rose-50/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={cleanupSoldOut}
                          onChange={(e) => setCleanupSoldOut(e.target.checked)}
                          className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-700">Sold-out Stock</p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Quantity is 0</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 p-3 bg-white border border-rose-100 rounded-xl hover:bg-rose-50/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={cleanupExpired}
                          onChange={(e) => setCleanupExpired(e.target.checked)}
                          className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-700">Expired Batches</p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Expiry date passed</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 p-3 bg-white border border-rose-100 rounded-xl hover:bg-rose-50/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={cleanupSales}
                          onChange={(e) => setCleanupSales(e.target.checked)}
                          className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-700">Sales Invoices</p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Billing history</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-3 p-3 bg-white border border-rose-100 rounded-xl hover:bg-rose-50/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={cleanupKhata}
                          onChange={(e) => setCleanupKhata(e.target.checked)}
                          className="w-4 h-4 text-rose-600 border-slate-300 rounded focus:ring-rose-500 cursor-pointer"
                        />
                        <div className="text-left">
                          <p className="text-xs font-bold text-slate-700">Settled Credit Accounts</p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Credit profiles with 0 dues</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Age threshold */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">Select Age Threshold</label>
                    <select
                      value={cleanupMonths}
                      onChange={(e) => setCleanupMonths(parseInt(e.target.value))}
                      className="w-full bg-white border border-rose-100 text-slate-700 rounded-xl px-3.5 py-3 focus:outline-none focus:border-rose-400 transition-all font-semibold text-sm cursor-pointer"
                    >
                      <option value={3}>Older than 3 Months</option>
                      <option value={6}>Older than 6 Months (Recommended)</option>
                      <option value={12}>Older than 12 Months (1 Year)</option>
                      <option value={24}>Older than 24 Months (2 Years)</option>
                    </select>
                  </div>

                  <p className="text-xs text-rose-700/80 leading-relaxed font-semibold bg-white p-3.5 rounded-xl border border-rose-100/50">
                    ℹ️ Current settings will delete records older than <strong className="text-rose-900">{cleanupMonths} months</strong>. Active stock levels, recent transactions, and non-expired batches will remain fully unaffected.
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={!cleanupSoldOut && !cleanupExpired && !cleanupSales && !cleanupKhata}
                      onClick={() => {
                        setCleanupConfirmText("");
                        setShowCleanupModal(true);
                      }}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase px-5 py-3.5 rounded-xl transition-all shadow-md shadow-rose-200/50 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" /> Purge Useless Old Data
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONFIGURATIONS & PREFERENCES TAB */}
          {activeTab === "configurations" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Purchase Entry Configuration */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-150 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center">
                  <PackageOpen className="w-5 h-5 text-blue-500 mr-2.5 shrink-0" />
                  Smart Purchase Form Fields
                </h3>
                <p className="text-xs text-slate-450 font-semibold">Select which fields should be visible in your Purchase Entry Form. Hidden fields will automatically use pre-configured defaults behind the scenes.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  {Object.keys(purchaseFormConfig).map((field) => (
                    <label key={field} className="flex items-center space-x-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={purchaseFormConfig[field]}
                        onChange={(e) => {
                          const updated = { ...purchaseFormConfig, [field]: e.target.checked };
                          handleSaveFormConfig(updated);
                        }}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Barcode Customization */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-150 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center">
                  <ScanBarcode className="w-5 h-5 text-blue-500 mr-2.5 shrink-0" />
                  Barcode Printed Layout Customization
                </h3>
                <p className="text-xs text-slate-450 font-semibold">Choose the specific metadata fields that should be printed on your thermal label stickers (50mm x 25mm).</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  {Object.keys(barcodeConfig).map((field) => (
                    <label key={field} className="flex items-center space-x-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={barcodeConfig[field]}
                        onChange={(e) => {
                          const updated = { ...barcodeConfig, [field]: e.target.checked };
                          handleSaveBarcodeConfig(updated);
                        }}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Report Export Customization */}
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-150 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-slate-800 flex items-center">
                  <FileText className="w-5 h-5 text-blue-500 mr-2.5 shrink-0" />
                  Reports PDF Columns Export
                </h3>
                <p className="text-xs text-slate-450 font-semibold">Select the tables columns to export when downloading Expiry Alerts or Low Stock Alerts PDFs.</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                  {Object.keys(reportsPdfConfig).map((field) => (
                    <label key={field} className="flex items-center space-x-2.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={reportsPdfConfig[field]}
                        onChange={(e) => {
                          const updated = { ...reportsPdfConfig, [field]: e.target.checked };
                          handleSaveReportsPdfConfig(updated);
                        }}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-bold text-slate-700 capitalize">
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Backup & Recovery Center */}
              {session?.user?.id !== "000000000000000000000000" && (
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-150 shadow-sm space-y-4">
                  <h3 className="text-base font-bold text-slate-800 flex items-center">
                    <Database className="w-5 h-5 text-blue-500 mr-2.5 shrink-0" />
                    Data Backup & Recovery Utilities
                  </h3>
                  <p className="text-slate-500 text-xs font-semibold mb-6">
                    Save a secure backup of your database as a local JSON file. In case of any issues, you can upload this backup file to restore your inventory and bills data.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={handleDownloadBackup}
                      disabled={backupLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                    >
                      {backupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Download Backup (.json)
                    </button>

                    <label className="flex-1 flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-600 font-bold py-3.5 px-4 rounded-xl transition-all shadow-sm text-xs uppercase tracking-wider cursor-pointer text-center select-none">
                      <Upload className="w-4 h-4" />
                      Upload & Restore
                      <input
                        type="file"
                        accept=".json,application/json"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* Profile OTP Verification Dialog */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-blue-500" />
                Profile Authorization Code
              </h2>
              <button 
                onClick={() => { setShowOtpModal(false); setDebugOtp(null); }}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveProfileChanges} className="p-6 space-y-5">
              <p className="text-xs text-slate-500 font-medium">To authorize updates to your profile details, enter the 6-digit security code sent to your registered email address (<strong className="text-slate-700">{profileData.email}</strong>).</p>
              
              {/* Developer debug notification */}
              {debugOtp && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 text-xs text-amber-800 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <BadgeHelp className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Developer Notice (Mock OTP Delivery):</span>
                  </div>
                  <p className="font-semibold">
                    SMTP details are not configured in your <code>.env</code>. To help you test for free locally, use this code:
                  </p>
                  <p className="font-extrabold text-sm underline text-slate-800">OTP Code: {debugOtp.emailOtp}</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 text-center">Authorization OTP</label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-center focus:outline-none focus:border-blue-400 font-bold text-lg tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Save Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Local Data Restore Confirmation Dialog */}
      {showRestoreModal && restoreFile && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
              <h2 className="text-base md:text-lg font-bold text-rose-800 flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2 text-rose-500" />
                Restore Database: {restoreFile.name}
              </h2>
              <button 
                onClick={() => { setShowRestoreModal(false); setRestoreFile(null); }}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleRestoreSubmit} className="p-6 space-y-5">
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-4 rounded-xl leading-relaxed">
                ⚠️ DANGER: Restoring a custom backup file will permanently wipe all your current local medicine and sales records, replacing them with the data from this backup file. This action cannot be undone!
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Type <strong className="text-rose-600">RESTORE</strong> to confirm</label>
                <input
                  type="text"
                  required
                  placeholder="Type RESTORE"
                  value={restoreConfirmText}
                  onChange={(e) => setRestoreConfirmText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-3 focus:outline-none focus:border-rose-400 font-bold text-center"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowRestoreModal(false); setRestoreFile(null); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restoreConfirmText !== "RESTORE" || restoreLoading}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-rose-100 text-xs uppercase flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {restoreLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Restore"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Database Cleanup Confirmation Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
              <h2 className="text-base md:text-lg font-bold text-rose-800 flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2 text-rose-500" />
                Confirm Storage Data Purge
              </h2>
              <button 
                onClick={() => { setShowCleanupModal(false); }}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleCustomDatabaseCleanup} className="p-6 space-y-5">
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-4 rounded-xl leading-relaxed space-y-1.5">
                <p className="font-extrabold">⚠️ WARNING: You are purging database storage records older than {cleanupMonths} months:</p>
                <ul className="list-disc list-inside space-y-1 pl-1 font-semibold text-rose-800">
                  {cleanupSoldOut && <li>Sold-out medicines (quantity 0)</li>}
                  {cleanupExpired && <li>Expired medicine batches</li>}
                  {cleanupSales && <li>Historical transaction sales invoices</li>}
                  {cleanupKhata && <li>Settled credit profiles with 0 outstanding balance</li>}
                </ul>
                <p className="text-[10px] mt-2 text-rose-600 font-bold uppercase tracking-wider">This action is irreversible!</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Type <strong className="text-rose-600">CLEANUP</strong> to confirm</label>
                <input
                  type="text"
                  required
                  placeholder="Type CLEANUP"
                  value={cleanupConfirmText}
                  onChange={(e) => setCleanupConfirmText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-3 focus:outline-none focus:border-rose-400 font-bold text-center"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowCleanupModal(false); }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={cleanupConfirmText !== "CLEANUP" || cleanupLoading}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-rose-100 text-xs uppercase flex items-center justify-center gap-1 disabled:opacity-50"
                >
                  {cleanupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Purge"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
