"use client";
import { useState, useEffect } from "react";
import { 
  Users, 
  User,
  UserCheck, 
  UserX, 
  CalendarClock, 
  Search, 
  KeyRound, 
  DatabaseBackup, 
  Trash2, 
  ShieldAlert, 
  X, 
  Loader2, 
  PlusCircle, 
  PackageOpen, 
  Receipt, 
  Sparkles,
  ShieldCheck,
  History,
  CalendarX,
  Edit,
  Store,
  MapPin,
  Phone,
  Mail,
  Download,
  Upload,
  Database,
  Smartphone
} from "lucide-react";
import toast from "react-hot-toast";

const SuperAdminSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-pulse pt-4">
      {/* Grid of metrics cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] border border-slate-100 flex items-center shadow-sm">
            <div className="w-12 h-12 bg-slate-200 rounded-2xl mr-4 shrink-0"></div>
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
              <div className="h-5 w-12 bg-slate-200 rounded-md"></div>
            </div>
          </div>
        ))}
      </div>

      {/* Control Banner */}
      <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="h-10 w-full md:w-72 bg-slate-200 rounded-xl"></div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="h-10 w-28 bg-slate-200 rounded-xl"></div>
          <div className="h-10 w-28 bg-slate-200 rounded-xl"></div>
          <div className="h-10 w-28 bg-slate-200 rounded-xl"></div>
        </div>
      </div>

      {/* User Table Skeleton */}
      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center">
          <div className="h-5 w-36 bg-slate-200 rounded-md"></div>
          <div className="h-8 w-24 bg-slate-200 rounded-md"></div>
        </div>
        <div className="divide-y divide-slate-50">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-10 h-10 bg-slate-200 rounded-xl"></div>
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-40 bg-slate-200 rounded-md"></div>
                  <div className="h-3.5 w-60 bg-slate-200 rounded-md"></div>
                </div>
              </div>
              <div className="flex gap-4 items-center shrink-0">
                <div className="h-6 w-16 bg-slate-200 rounded-full"></div>
                <div className="h-8 w-24 bg-slate-200 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function SuperAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [stats, setStats] = useState({
    totalClients: 0,
    activeCount: 0,
    disabledCount: 0,
    expiredCount: 0,
    totalDatabaseSize: 0,
    totalDatabaseSizeFormatted: "0 Bytes"
  });

  // Modals state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showEndSubModal, setShowEndSubModal] = useState(false);
  const [showEditDetailsModal, setShowEditDetailsModal] = useState(false);
  const [showDevicesModal, setShowDevicesModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form inputs
  const [newPassword, setNewPassword] = useState("");
  const [subMonths, setSubMonths] = useState(1);
  const [customMonths, setCustomMonths] = useState("");
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [editDetails, setEditDetails] = useState({
    username: "",
    name: "",
    shopName: "",
    address: "",
    phoneNumber: "",
    email: ""
  });

  // Full System Backup & Restore state
  const [systemBackupLoading, setSystemBackupLoading] = useState(false);
  const [systemRestoreLoading, setSystemRestoreLoading] = useState(false);
  const [showSystemRestoreModal, setShowSystemRestoreModal] = useState(false);
  const [systemRestoreFile, setSystemRestoreFile] = useState(null);
  const [systemRestoreConfirmText, setSystemRestoreConfirmText] = useState("");

  const fetchUsers = async (currentPage = page, search = searchTerm, filter = filterStatus, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/superadmin/users?page=${currentPage}&limit=15&search=${encodeURIComponent(search)}&filter=${filter}`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
        if (data.stats) {
          setStats(data.stats);
        }
        if (data.pagination) {
          setPage(data.pagination.page);
          setTotalPages(data.pagination.totalPages);
          setTotalUsers(data.pagination.total);
        }
        // Update selectedUser context silently to update connection details in modals
        if (selectedUser) {
          const updated = data.users.find(u => u._id === selectedUser._id);
          if (updated) {
            setSelectedUser(updated);
          }
        }
      } else {
        if (!silent) toast.error(data.error || "Failed to load users list");
      }
    } catch (error) {
      if (!silent) toast.error("Network or server error occurred!");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Debounce search, page, and filter triggers
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchUsers(page, searchTerm, filterStatus);
    }, 300);
    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, filterStatus]);

  // Live active device polling every 20 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchUsers(page, searchTerm, filterStatus, true);
    }, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchTerm, filterStatus, selectedUser]);

  // Handle Search Input Change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  // Filter users based on search (already filtered on server, map directly)
  const filteredUsers = users;

  // Stats calculation from API state
  const totalUsersCount = stats.totalClients;
  const activeCount = stats.activeCount;
  const disabledCount = stats.disabledCount;
  const expiredCount = stats.expiredCount;

  const handleToggleStatus = async (user) => {
    const nextStatus = user.status === "active" ? "disabled" : "active";
    const toastId = toast.loading(`Updating ${user.username}'s status...`);
    try {
      const res = await fetch("/api/superadmin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          action: "toggleStatus",
          status: nextStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: toastId });
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to update status", { id: toastId });
      }
    } catch (err) {
      toast.error("Server error", { id: toastId });
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.trim().length < 4) {
      toast.error("Password must be at least 4 characters!");
      return;
    }

    const toastId = toast.loading("Updating password...");
    try {
      const res = await fetch("/api/superadmin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser._id,
          action: "changePassword",
          password: newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Password changed successfully!", { id: toastId });
        setShowPasswordModal(false);
        setNewPassword("");
      } else {
        toast.error(data.error || "Failed to update password", { id: toastId });
      }
    } catch (err) {
      toast.error("Server error", { id: toastId });
    }
  };

  const handleAddSubscription = async (e) => {
    e.preventDefault();
    const months = subMonths === "custom" ? parseInt(customMonths) : parseInt(subMonths);
    
    if (isNaN(months) || months <= 0) {
      toast.error("Please enter a valid number of months!");
      return;
    }

    const toastId = toast.loading("Adding subscription months...");
    try {
      const res = await fetch("/api/superadmin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser._id,
          action: "addSubscription",
          subscriptionMonths: months
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: toastId });
        setShowSubModal(false);
        setCustomMonths("");
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to update subscription", { id: toastId });
      }
    } catch (err) {
      toast.error("Server error", { id: toastId });
    }
  };

  const handleEndSubscription = async (e) => {
    e.preventDefault();
    const toastId = toast.loading("Terminating subscription...");
    try {
      const res = await fetch("/api/superadmin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser._id,
          action: "endSubscription"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message, { id: toastId });
        setShowEndSubModal(false);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to terminate subscription", { id: toastId });
      }
    } catch (err) {
      toast.error("Server error occurred", { id: toastId });
    }
  };

  const handleDeleteUser = async (e) => {
    e.preventDefault();
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm!");
      return;
    }

    const toastId = toast.loading("Deleting user and purging data...");
    try {
      const res = await fetch(`/api/superadmin/users?id=${selectedUser._id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User and all associated data deleted!", { id: toastId });
        setShowDeleteModal(false);
        setDeleteConfirmText("");
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to delete user", { id: toastId });
      }
    } catch (err) {
      toast.error("Server error", { id: toastId });
    }
  };

  const handleEditDetailsSubmit = async (e) => {
    e.preventDefault();
    if (!editDetails.username || !editDetails.email) {
      toast.error("Username and Email are required!");
      return;
    }

    const toastId = toast.loading("Updating client details...");
    try {
      const res = await fetch("/api/superadmin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser._id,
          action: "updateDetails",
          username: editDetails.username,
          name: editDetails.name,
          shopName: editDetails.shopName,
          address: editDetails.address,
          phoneNumber: editDetails.phoneNumber,
          email: editDetails.email
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Client details updated successfully!", { id: toastId });
        setShowEditDetailsModal(false);
        fetchUsers();
      } else {
        toast.error(data.error || "Failed to update details", { id: toastId });
      }
    } catch (err) {
      toast.error("Server error", { id: toastId });
    }
  };

  const handleDownloadUserBackup = async (user) => {
    const toastId = toast.loading(`Exporting ${user.username}'s data...`);
    try {
      const res = await fetch(`/api/superadmin/backup?id=${user._id}`);
      const data = await res.json();
      if (data.success) {
        // Trigger file download in browser
        const blob = new Blob([JSON.stringify(data.backupData, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("🎉 User backup exported successfully!", { id: toastId });
      } else {
        toast.error(data.error || "Failed to export data", { id: toastId });
      }
    } catch (err) {
      toast.error("Server error occurred", { id: toastId });
    }
  };

  const handleDownloadSystemBackup = async () => {
    setSystemBackupLoading(true);
    const toastId = toast.loading("Generating full system database backup...");
    try {
      const res = await fetch("/api/superadmin/backup");
      const data = await res.json();
      if (data.success && data.backupData) {
        const blob = new Blob([JSON.stringify(data.backupData, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = data.filename || `backup_full_system_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success("🎉 Full system backup exported successfully!", { id: toastId });
      } else {
        toast.error(data.error || "Failed to export system backup", { id: toastId });
      }
    } catch (err) {
      toast.error("Network or server error during backup generation.", { id: toastId });
    } finally {
      setSystemBackupLoading(false);
    }
  };

  const handleSystemFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      toast.error("Please upload a valid JSON backup file!");
      e.target.value = "";
      return;
    }

    setSystemRestoreFile(file);
    setSystemRestoreConfirmText("");
    setShowSystemRestoreModal(true);
    e.target.value = "";
  };

  const handleSystemRestoreSubmit = async (e) => {
    e.preventDefault();
    if (systemRestoreConfirmText !== "SYSTEM RESTORE") {
      toast.error("Please type SYSTEM RESTORE to confirm!");
      return;
    }

    setSystemRestoreLoading(true);
    const toastId = toast.loading("Executing full system restore...");

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
            toast.success(data.message || "🎉 System successfully restored!", { id: toastId });
            setShowSystemRestoreModal(false);
            setSystemRestoreFile(null);
            setSystemRestoreConfirmText("");
            fetchUsers();
          } else {
            toast.error(data.error || "Failed to restore system.", { id: toastId });
          }
        } catch (parseError) {
          toast.error("Invalid file structure. Make sure this is a valid full system backup.", { id: toastId });
        } finally {
          setSystemRestoreLoading(false);
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read file.", { id: toastId });
        setSystemRestoreLoading(false);
      };

      reader.readAsText(systemRestoreFile);

    } catch (err) {
      toast.error("Failed to read the backup file.", { id: toastId });
      setSystemRestoreLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return <SuperAdminSkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative pt-4">

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        
        {/* Total Users */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] flex items-center hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mr-4 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Clients</p>
            <p className="text-xl md:text-2xl font-extrabold text-slate-700">{totalUsersCount}</p>
          </div>
        </div>

        {/* Active Accounts */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] flex items-center hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mr-4 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Active Plans</p>
            <p className="text-xl md:text-2xl font-extrabold text-slate-700">{activeCount}</p>
          </div>
        </div>

        {/* Expired Accounts */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] flex items-center hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mr-4 shrink-0">
            <CalendarClock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Expired Plans</p>
            <p className="text-xl md:text-2xl font-extrabold text-slate-700">{expiredCount}</p>
          </div>
        </div>

        {/* Disabled Accounts */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] flex items-center hover:shadow-md transition-all">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mr-4 shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Suspended</p>
            <p className="text-xl md:text-2xl font-extrabold text-slate-700">{disabledCount}</p>
          </div>
        </div>

        {/* Total Database Size */}
        <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] flex items-center hover:shadow-md transition-all col-span-2 md:col-span-1">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mr-4 shrink-0">
            <Database className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Total Storage Size</p>
            <p className="text-xl md:text-2xl font-extrabold text-slate-700">{stats.totalDatabaseSizeFormatted || "0 Bytes"}</p>
          </div>
        </div>

      </div>

      {/* System Data Control (Backup & Restore) */}
      <div className="bg-white p-6 rounded-[28px] border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition-all">
        <div className="flex gap-4 items-start">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">System Data Control (Backup & Restore)</h2>
            <p className="text-slate-500 text-xs font-semibold mt-1 max-w-xl">
              Export all system datasets (all client accounts, medicines, and transactions) into a single encrypted format, or overwrite the active deployment database from a validated JSON backup.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto self-stretch md:self-auto justify-end">
          <button
            onClick={handleDownloadSystemBackup}
            disabled={systemBackupLoading}
            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs md:text-sm px-5 py-3 rounded-2xl shadow-sm hover:shadow transition-all disabled:opacity-50 cursor-pointer"
          >
            {systemBackupLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Full Backup
          </button>
          <label className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs md:text-sm px-5 py-3 rounded-2xl shadow-sm hover:shadow transition-all cursor-pointer">
            <Upload className="w-4 h-4" />
            Restore System
            <input
              type="file"
              accept=".json"
              onChange={handleSystemFileSelect}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* User Management List */}
      <div className="bg-white border border-slate-100 rounded-[28px] overflow-hidden shadow-sm flex flex-col">
        
        {/* Search Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/30">
          <div className="relative flex flex-1 max-w-md items-center bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-200 transition-all shadow-sm">
            <Search className="w-4 h-4 mr-2.5 text-slate-400 shrink-0" />
            <input 
              type="text" 
              placeholder="Search pharmacy account username..." 
              value={searchTerm}
              onChange={handleSearchChange}
              className="bg-transparent border-none outline-none w-full text-xs md:text-sm text-slate-700 font-bold"
            />
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest hidden md:inline">Filter:</span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm cursor-pointer"
            >
              <option value="all">All Clients</option>
              <option value="active">Active Plans</option>
              <option value="expired">Expired Plans</option>
              <option value="disabled">Suspended / Disabled</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-slate-400 py-12 text-sm font-medium">No pharmacy accounts found. 😴</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                  <th className="p-5 font-bold">Client Account</th>
                  <th className="p-5 font-bold text-center">Status</th>
                  <th className="p-5 font-bold text-center">Database Stats</th>
                  <th className="p-5 font-bold">Subscription Status</th>
                  <th className="p-5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs md:text-sm">
                {filteredUsers.map((user) => {
                  const expiry = user.subscriptionEnd ? new Date(user.subscriptionEnd) : null;
                  const isExpired = !expiry || expiry < new Date();
                  return (
                    <tr key={user._id} className="hover:bg-slate-50/20 transition-colors">
                      
                      {/* Name and Role */}
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center text-slate-500 shrink-0 font-extrabold uppercase">
                            {user.username.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 capitalize">{user.username}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{user.role === "admin" ? "Pharmacy Owner" : user.role}</p>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {user.isOnline ? (
                                <>
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                  </span>
                                  <span className="text-[10px] text-blue-600 font-extrabold uppercase">Online</span>
                                  <span className="text-[10px] text-slate-400 font-semibold">•</span>
                                  <button 
                                    onClick={() => { setSelectedUser(user); setShowDevicesModal(true); }}
                                    className="text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold hover:underline transition-colors"
                                  >
                                    {user.activeSessions?.length || 0} {user.activeSessions?.length === 1 ? 'device' : 'devices'}
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span className="h-2 w-2 rounded-full bg-slate-300 shrink-0"></span>
                                  <span className="text-[10px] text-slate-400 font-extrabold uppercase">Offline</span>
                                  {user.activeSessions?.length > 0 && (
                                    <>
                                      <span className="text-[10px] text-slate-400 font-semibold">•</span>
                                      <button 
                                        onClick={() => { setSelectedUser(user); setShowDevicesModal(true); }}
                                        className="text-[10px] text-slate-400 hover:text-slate-600 font-bold hover:underline transition-colors"
                                      >
                                        {user.activeSessions.length} {user.activeSessions.length === 1 ? 'device' : 'devices'}
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="p-5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                          user.status === "active" 
                            ? "bg-blue-50 text-blue-600 border-blue-100" 
                            : "bg-rose-50 text-rose-600 border-rose-100"
                        }`}>
                          {user.status === "active" ? "Active" : "Disabled"}
                        </span>
                      </td>

                      {/* DB Live Stats */}
                      <td className="p-5">
                        <div className="flex flex-col sm:flex-row gap-2 justify-center items-center flex-wrap">
                          <span className="inline-flex items-center gap-1 bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-lg text-[10px] font-extrabold">
                            <PackageOpen className="w-3.5 h-3.5" /> {user.medicinesCount || 0} Medicines
                          </span>
                          <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-100 text-amber-600 px-2 py-0.5 rounded-lg text-[10px] font-extrabold">
                            <Receipt className="w-3.5 h-3.5" /> {user.salesCount || 0} Bills
                          </span>
                          <span className="inline-flex items-center gap-1 bg-teal-50 border border-teal-100 text-teal-600 px-2 py-0.5 rounded-lg text-[10px] font-extrabold" title="Data storage space in database">
                            <Database className="w-3.5 h-3.5" /> {user.dataSizeFormatted || "0 Bytes"}
                          </span>
                        </div>
                      </td>

                      {/* Subscription End Date */}
                      <td className="p-5">
                        {(() => {
                          if (!expiry) {
                            return (
                              <>
                                <p className="font-extrabold text-rose-500">No Active Plan</p>
                                <p className="text-[10px] font-extrabold mt-0.5 text-rose-500">🔴 Expired</p>
                              </>
                            );
                          }
                          const diffTime = expiry - new Date();
                          const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                          return (
                            <>
                              <p className={`font-extrabold ${isExpired ? "text-rose-500 animate-pulse" : "text-slate-700"}`}>
                                {expiry.toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </p>
                              <p className="text-[10px] font-extrabold mt-0.5">
                                {isExpired ? (
                                  <span className="text-rose-500">🔴 Expired</span>
                                ) : (
                                  <span className="text-blue-600">🔵 Active ({daysLeft} days left)</span>
                                )}
                              </p>
                            </>
                          );
                        })()}
                      </td>

                      {/* Actions */}
                      <td className="p-5 text-right">
                        <div className="flex items-center justify-end gap-2 flex-wrap min-w-[280px]">
                          
                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`p-2 rounded-xl border transition-all ${
                              user.status === "active" 
                                ? "bg-rose-50 border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white" 
                                : "bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-500 hover:text-white"
                            }`}
                            title={user.status === "active" ? "Suspend Account" : "Activate Account"}
                          >
                            {user.status === "active" ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>

                          {/* Add Subscription */}
                          <button
                            onClick={() => { setSelectedUser(user); setShowSubModal(true); }}
                            className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-800 hover:text-white hover:border-slate-800 rounded-xl transition-all"
                            title="Add Plan Months"
                          >
                            <CalendarClock className="w-4 h-4" />
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setEditDetails({
                                username: user.username || "",
                                name: user.name || "",
                                shopName: user.shopName || "",
                                address: user.address || "",
                                phoneNumber: user.phoneNumber || "",
                                email: user.email || ""
                              });
                              setShowEditDetailsModal(true);
                            }}
                            className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-800 hover:text-white hover:border-slate-800 rounded-xl transition-all"
                            title="Edit Client Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Change Password */}
                          <button
                            onClick={() => { setSelectedUser(user); setShowPasswordModal(true); }}
                            className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-800 hover:text-white hover:border-slate-800 rounded-xl transition-all"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {/* Terminate/End Subscription */}
                          {!isExpired && (
                            <button
                              onClick={() => { setSelectedUser(user); setShowEndSubModal(true); }}
                              className="p-2 bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                              title="Terminate Subscription Immediately"
                            >
                              <CalendarX className="w-4 h-4" />
                            </button>
                          )}

                          {/* View Subscription History */}
                          <button
                            onClick={() => { setSelectedUser(user); setShowHistoryModal(true); }}
                            className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-800 hover:text-white hover:border-slate-800 rounded-xl transition-all"
                            title="View Plan History"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          {/* Download Backup */}
                          <button
                            onClick={() => handleDownloadUserBackup(user)}
                            className="p-2 bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-800 hover:text-white hover:border-slate-800 rounded-xl transition-all"
                            title="Export Backup File"
                          >
                            <DatabaseBackup className="w-4 h-4" />
                          </button>

                          {/* Delete Account */}
                          <button
                            onClick={() => { setSelectedUser(user); setShowDeleteModal(true); }}
                            className="p-2 bg-rose-50 border border-rose-100 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all"
                            title="Purge User Data"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-slate-500">
              Showing <span className="text-slate-800">{(page - 1) * 15 + 1}</span> to{" "}
              <span className="text-slate-800">{Math.min(page * 15, totalUsers)}</span> of{" "}
              <span className="text-slate-800">{totalUsers}</span> pharmacy accounts
            </p>
            <div className="inline-flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="px-4 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                Previous
              </button>
              <span className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-extrabold flex items-center">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                className="px-4 py-2 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modal 1: Add Subscription */}
      {showSubModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center">
                <CalendarClock className="w-5 h-5 mr-2 text-blue-500" />
                Subscription Addition
              </h2>
              <button 
                onClick={() => setShowSubModal(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleAddSubscription} className="p-6 space-y-5">
              <p className="text-xs text-slate-500 font-medium">Select package or input custom months for <strong className="text-slate-700 capitalize">{selectedUser.username}</strong>.</p>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Duration Package</label>
                <select
                  value={subMonths}
                  onChange={(e) => setSubMonths(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-3 focus:outline-none focus:border-blue-400 font-bold cursor-pointer"
                >
                  <option value={1}>1 Month Extension</option>
                  <option value={3}>3 Months Extension</option>
                  <option value={6}>6 Months Extension</option>
                  <option value={12}>12 Months Extension (1 Year)</option>
                  <option value="custom">Custom Months Count</option>
                </select>
              </div>

              {subMonths === "custom" && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Custom Months</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    required
                    placeholder="Enter number of months"
                    value={customMonths}
                    onChange={(e) => setCustomMonths(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-3 focus:outline-none focus:border-blue-400 font-semibold"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" /> Extend Subscription
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Change Password */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center">
                <KeyRound className="w-5 h-5 mr-2 text-blue-500" />
                Reset Password
              </h2>
              <button 
                onClick={() => setShowPasswordModal(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleChangePassword} className="p-6 space-y-5">
              <p className="text-xs text-slate-500 font-medium">Input a new secure password for <strong className="text-slate-700 capitalize">{selectedUser.username}</strong>.</p>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="Enter at least 4 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3.5 py-3 focus:outline-none focus:border-blue-400 font-semibold"
                />
              </div>
 
              <button
                type="submit"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-slate-200"
              >
                Update Password
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: View Subscription History */}
      {showHistoryModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center">
                <History className="w-5 h-5 mr-2 text-blue-500" />
                Subscription History for {selectedUser.username}
              </h2>
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Detailed Plan Stats Card */}
              {(() => {
                const expiry = new Date(selectedUser.subscriptionEnd);
                const isExpired = expiry < new Date();
                const diffTime = expiry - new Date();
                const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                
                let planName = "Standard Trial Plan";
                if (selectedUser.subscriptionHistory && selectedUser.subscriptionHistory.length > 0) {
                  const lastExt = selectedUser.subscriptionHistory[selectedUser.subscriptionHistory.length - 1];
                  const m = lastExt.addedMonths;
                  if (m === 1) planName = "Monthly Premium Plan";
                  else if (m === 3) planName = "Quarterly Premium Plan";
                  else if (m === 6) planName = "Half-Yearly Premium Plan";
                  else if (m === 12) planName = "Annual Enterprise Plan";
                  else planName = `Custom Premium (${m} Months)`;
                }

                return (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active License Plan</p>
                      <h4 className="text-sm font-bold text-slate-800">{planName}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold mt-1">
                        Expiry: <strong className="text-slate-700">{expiry.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</strong>
                      </p>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                      selectedUser.status === "disabled"
                        ? "bg-rose-50 text-rose-600 border-rose-100"
                        : isExpired
                          ? "bg-rose-50 text-rose-600 border-rose-100"
                          : "bg-blue-50 text-blue-600 border-blue-100"
                    }`}>
                      {selectedUser.status === "disabled" ? "Account Disabled" : isExpired ? "Expired" : `${daysLeft} Days Left`}
                    </span>
                  </div>
                );
              })()}

              {!selectedUser.subscriptionHistory || selectedUser.subscriptionHistory.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm font-semibold bg-slate-50 rounded-2xl border border-slate-100/50">
                  No subscription extension history found for this user.
                </div>
              ) : (
                <div className="relative border-l border-slate-100 ml-3 pl-5 space-y-4 max-h-[250px] overflow-y-auto pr-1">
                  {selectedUser.subscriptionHistory.slice().reverse().map((item, index) => {
                    let additionLabel = `${item.addedMonths} Month extension`;
                    if (item.addedMonths === 0) additionLabel = "Subscription Terminated by Admin";
                    else if (item.addedMonths === 1) additionLabel = "Monthly Subscription Added";
                    else if (item.addedMonths === 12) additionLabel = "Annual Subscription Renewal";
                    else if (item.addedMonths === 3) additionLabel = "Quarterly Subscription Renewal";
                    else if (item.addedMonths === 6) additionLabel = "Half-Yearly Renewal";

                    return (
                      <div key={index} className="relative group">
                        {/* Timeline Bullet */}
                        <div className="absolute -left-[27px] top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                        
                        <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-slate-700">{additionLabel}</p>
                              <p className="text-[9px] text-slate-400 font-semibold mt-0.5">
                                Added: {new Date(item.addedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold ${item.addedMonths === 0 ? 'bg-rose-50 text-rose-600' : 'bg-blue-50 text-blue-600'}`}>
                              {item.addedMonths === 0 ? 'Cancel' : `+${item.addedMonths} M`}
                            </span>
                          </div>
                          <p className="text-[9px] text-slate-500 font-semibold mt-1">
                            New Expiration: <strong className="text-slate-700">{new Date(item.newExpirationDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Delete Confirmation */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
              <h2 className="text-base md:text-lg font-bold text-rose-800 flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2 text-rose-500" />
                DANGER: Purge User Account
              </h2>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleDeleteUser} className="p-6 space-y-5">
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 text-rose-700 text-xs font-semibold leading-relaxed">
                🚨 WARNING: Account deletion will permanently purge <strong className="capitalize">{selectedUser.username}</strong>, all their registered medicines, and all sales records. This action cannot be undone!
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Type <strong className="text-rose-600">DELETE</strong> to confirm</label>
                <input
                  type="text"
                  required
                  placeholder="Type DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-slate-50 border border-rose-200 text-slate-700 rounded-xl px-3.5 py-3 focus:outline-none focus:border-rose-400 font-bold"
                />
              </div>

              <button
                type="submit"
                disabled={deleteConfirmText !== "DELETE"}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" /> Purge Account and Data
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 5: End Subscription Confirmation */}
      {showEndSubModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
              <h2 className="text-base md:text-lg font-bold text-rose-800 flex items-center">
                <ShieldAlert className="w-5 h-5 mr-2 text-rose-500" />
                Terminate User Subscription
              </h2>
              <button 
                onClick={() => setShowEndSubModal(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleEndSubscription} className="p-6 space-y-5">
              <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold p-4 rounded-xl leading-relaxed">
                🚨 WARNING: Ending the subscription for <strong className="capitalize">{selectedUser.username}</strong> will immediately restrict their dashboard access. They will be logged out or redirected to the Pause screen.
              </div>

              <p className="text-xs text-slate-500 font-medium">Are you sure you want to end this client&apos;s active subscription right now?</p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEndSubModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all shadow-md shadow-rose-100 text-xs flex items-center justify-center gap-1"
                >
                  <CalendarX className="w-3.5 h-3.5" /> Confirm End Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 6: Edit Client Details */}
      {showEditDetailsModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center">
                <Edit className="w-5 h-5 mr-2 text-blue-500" />
                Edit Client Details: <span className="capitalize ml-1 text-blue-600">{selectedUser.username}</span>
              </h2>
              <button 
                onClick={() => setShowEditDetailsModal(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleEditDetailsSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Username"
                    value={editDetails.username}
                    onChange={(e) => setEditDetails({ ...editDetails, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-400 font-semibold text-sm"
                  />
                  <User className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Owner Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Owner Name"
                      value={editDetails.name}
                      onChange={(e) => setEditDetails({ ...editDetails, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-400 font-semibold text-sm"
                    />
                    <User className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Shop Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Pharmacy/Shop Name"
                      value={editDetails.shopName}
                      onChange={(e) => setEditDetails({ ...editDetails, shopName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-400 font-semibold text-sm"
                    />
                    <Store className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Address</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Pharmacy Address"
                    value={editDetails.address}
                    onChange={(e) => setEditDetails({ ...editDetails, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-400 font-semibold text-sm"
                  />
                  <MapPin className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={editDetails.phoneNumber}
                      onChange={(e) => setEditDetails({ ...editDetails, phoneNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-400 font-semibold text-sm"
                    />
                    <Phone className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="Email Address"
                      value={editDetails.email}
                      onChange={(e) => setEditDetails({ ...editDetails, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-400 font-semibold text-sm"
                    />
                    <Mail className="absolute left-3.5 top-3 text-slate-400 w-4 h-4" />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center gap-1.5 mt-2"
              >
                Save Details (No OTP)
              </button>
            </form>
          </div>
        </div>
      )}

      {/* System Restore Confirmation Modal */}
      {showSystemRestoreModal && systemRestoreFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => {
                setShowSystemRestoreModal(false);
                setSystemRestoreFile(null);
                setSystemRestoreConfirmText("");
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Dangerous Action: Full System Restore</h3>
                <p className="text-xs text-slate-500 font-semibold mt-1">
                  You are about to restore the system from backup file: <span className="font-bold text-slate-700 block mt-0.5 break-all">&quot;{systemRestoreFile.name}&quot;</span>
                </p>
                <div className="mt-3 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-[11px] text-rose-600 font-semibold text-left space-y-1">
                  <p>⚠️ Warning:</p>
                  <p>• All existing client accounts (except superadmin) will be wiped.</p>
                  <p>• All active medicines and sales records will be replaced.</p>
                  <p>• This action is irreversible.</p>
                </div>
              </div>

              <form onSubmit={handleSystemRestoreSubmit} className="w-full space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase text-left mb-1.5">
                    Type <span className="font-extrabold text-rose-600 select-all">SYSTEM RESTORE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="SYSTEM RESTORE"
                    value={systemRestoreConfirmText}
                    onChange={(e) => setSystemRestoreConfirmText(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:border-rose-500 font-bold text-center tracking-wider text-sm placeholder:tracking-normal placeholder:font-normal"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSystemRestoreModal(false);
                      setSystemRestoreFile(null);
                      setSystemRestoreConfirmText("");
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={systemRestoreConfirmText !== "SYSTEM RESTORE" || systemRestoreLoading}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer text-xs uppercase"
                  >
                    {systemRestoreLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Confirm Restore"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 7: View Connected Devices */}
      {showDevicesModal && selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center">
                <Smartphone className="w-5 h-5 mr-2 text-indigo-500" />
                Connected Devices for {selectedUser.username}
              </h2>
              <button 
                onClick={() => setShowDevicesModal(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Status</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedUser.isOnline ? (
                      <>
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                        <span className="text-xs font-bold text-blue-600">Currently Online</span>
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-slate-400"></span>
                        <span className="text-xs font-bold text-slate-500">Offline</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs font-extrabold uppercase px-2.5 py-1 rounded-full border bg-indigo-50 text-indigo-600 border-indigo-100">
                  {selectedUser.activeSessions?.length || 0} active {selectedUser.activeSessions?.length === 1 ? 'session' : 'sessions'}
                </span>
              </div>

              {!selectedUser.activeSessions || selectedUser.activeSessions.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm font-semibold bg-slate-50 rounded-2xl border border-slate-100/50">
                  No active sessions or logged-in devices found.
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {selectedUser.activeSessions.map((sess, idx) => (
                    <div key={idx} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3.5 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-800 truncate">
                            {sess.os} ({sess.browser})
                          </p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate">
                            IP: {sess.ipAddress} | Type: {sess.deviceType || "Desktop"}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right shrink-0">
                        {sess.isOnline ? (
                          <span className="bg-blue-100 text-blue-800 border border-blue-200 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md inline-block mb-1.5 tracking-wider">ONLINE</span>
                        ) : (
                          <span className="bg-slate-200 text-slate-600 border border-slate-300 text-[8px] font-extrabold px-1.5 py-0.5 rounded-md inline-block mb-1.5 tracking-wider">OFFLINE</span>
                        )}
                        <p className="text-[10px] font-bold text-slate-500">
                          Last Active
                        </p>
                        <p className="text-[9px] text-slate-400 font-medium mt-0.5">
                          {new Date(sess.lastActive).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
