"use client";
import { useState, useEffect } from "react";
import { 
  Truck, Search, Phone, MapPin, UserCheck, 
  Package, Receipt, RefreshCw, ChevronDown, ChevronUp, Loader2, Edit, Save, X,
  Trash2, BarChart3, Coins, AlertTriangle, TrendingUp
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { formatExpiryDate } from "@/lib/formatDate";

export default function Distributors() {
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDist, setExpandedDist] = useState(null);
  const [distItems, setDistItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Local storage contacts editor state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ phone: "", address: "" });
  const [contacts, setContacts] = useState({});

  // Advanced delete & analysis states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDist, setDeletingDist] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisDistName, setAnalysisDistName] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisSearchTerm, setAnalysisSearchTerm] = useState("");
  const [analysisFilterStatus, setAnalysisFilterStatus] = useState("all");

  useEffect(() => {
    // Load persisted distributor contact details from localStorage
    const savedContacts = localStorage.getItem("distributor_contacts");
    if (savedContacts) {
      try {
        setContacts(JSON.parse(savedContacts));
      } catch (err) {
        console.error("Failed to load local contacts:", err);
      }
    }
    fetchDistributorData();
  }, []);

  const startDelete = (distName) => {
    setDeletingDist(distName);
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  };

  const executeDelete = async (e) => {
    e.preventDefault();
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm!");
      return;
    }
    setDeleteLoading(true);
    const toastId = toast.loading(`Deleting distributor '${deletingDist}' and all supplied medicines...`);
    try {
      const res = await fetch(`/api/distributor?name=${encodeURIComponent(deletingDist)}`, {
        method: "DELETE"
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success(resData.message || "Distributor and all associated medicines deleted!", { id: toastId });
        setShowDeleteModal(false);
        setDeletingDist(null);
        setDeleteConfirmText("");
        fetchDistributorData();
      } else {
        toast.error(resData.error || "Failed to delete distributor", { id: toastId });
      }
    } catch (err) {
      toast.error("Server error occurred during deletion", { id: toastId });
    } finally {
      setDeleteLoading(false);
    }
  };

  const openAnalysis = async (distName) => {
    setAnalysisDistName(distName);
    setShowAnalysisModal(true);
    setAnalysisLoading(true);
    setAnalysisData(null);
    setAnalysisSearchTerm("");
    setAnalysisFilterStatus("all");
    try {
      const res = await fetch(`/api/distributor?name=${encodeURIComponent(distName)}`);
      const resData = await res.json();
      if (resData.success) {
        setAnalysisData(resData);
      } else {
        toast.error(resData.error || "Failed to load distributor analysis");
        setShowAnalysisModal(false);
      }
    } catch (err) {
      toast.error("Server error loading distributor analysis");
      setShowAnalysisModal(false);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const fetchDistributorData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch("/api/reports?expiryMonths=3&lowStockThreshold=10");
      const data = await res.json();
      if (data.success) {
        setDistributors(data.distributorStock || []);
      }
    } catch (err) {
      toast.error("Failed to fetch distributor data!");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDistributorData(true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const fetchDistributorItems = async (distName) => {
    setItemsLoading(true);
    setDistItems([]);
    try {
      const res = await fetch(`/api/medicine?all=true&limit=100&search=${encodeURIComponent(distName)}`);
      const data = await res.json();
      if (data.success) {
        // Enforce exact matching distributor name just in case search was fuzzy
        const matched = data.medicines.filter(m => m.distributor?.toLowerCase() === distName.toLowerCase());
        setDistItems(matched);
      }
    } catch (error) {
      toast.error("Failed to load distributor brands!");
    } finally {
      setItemsLoading(false);
    }
  };

  const toggleExpand = (distName) => {
    if (expandedDist === distName) {
      setExpandedDist(null);
    } else {
      setExpandedDist(distName);
      fetchDistributorItems(distName);
    }
  };

  const startEdit = (distName, currentContact) => {
    setEditingId(distName);
    setEditForm({
      phone: currentContact?.phone || "",
      address: currentContact?.address || ""
    });
  };

  const saveContact = (distName) => {
    const updated = {
      ...contacts,
      [distName]: { ...editForm }
    };
    setContacts(updated);
    localStorage.setItem("distributor_contacts", JSON.stringify(updated));
    setEditingId(null);
    toast.success("Distributor contacts updated locally!");
  };

  const filteredDistributors = distributors.filter(d => 
    d._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && distributors.length === 0) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
        <Toaster position="top-center" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 border border-blue-100 shadow-sm shrink-0">
              <Truck className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-tight">Distributor Directory</h1>
              <p className="text-slate-500 text-[10px] md:text-sm font-medium mt-0.5">Manage supply agencies, details, earnings, and stock inventory.</p>
            </div>
          </div>
        </div>
        <DistributorSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 border border-blue-100 shadow-sm shrink-0">
            <Truck className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-tight">Distributor Directory</h1>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium mt-0.5">Manage supply agencies, details, earnings, and stock inventory.</p>
          </div>
        </div>

        <button 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center justify-center bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0 w-full md:w-auto"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Search Header */}
      <div className="bg-white p-4 md:p-5 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center bg-slate-50/30">
        <div className="relative flex flex-1 items-center bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-200 transition-all shadow-sm">
          <Search className="w-4 h-4 mr-2.5 text-slate-400 shrink-0" />
          <input 
            type="text" 
            placeholder="Search distributor agency name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-xs md:text-sm text-slate-700 font-bold"
          />
        </div>
      </div>

      {/* Distributors Listing */}
      {filteredDistributors.length === 0 ? (
        <div className="bg-white border border-slate-150 p-12 text-center rounded-[24px]">
          <Truck className="w-12 h-12 text-slate-200 mx-auto mb-2 opacity-50" />
          <p className="text-slate-400 font-semibold text-sm">No distributor found match.</p>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {filteredDistributors.map((dist) => {
            const isExpanded = expandedDist === dist._id;
            const contact = contacts[dist._id] || {};
            const isEditing = editingId === dist._id;

            return (
              <div 
                key={dist._id} 
                className={`bg-white rounded-2xl md:rounded-3xl border shadow-sm transition-all duration-300 overflow-hidden ${isExpanded ? 'border-blue-200 shadow-md' : 'border-slate-100'}`}
              >
                {/* Info Card Summary Header */}
                <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                  
                  {/* Left: Identity Details */}
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 border border-slate-150 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-500 shrink-0 font-extrabold uppercase text-sm md:text-base">
                      {dist._id.slice(0, 2)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-extrabold text-slate-800 text-sm md:text-lg leading-tight truncate capitalize">{dist._id}</h3>
                      
                      {/* Contacts display */}
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] md:text-xs text-slate-400 font-semibold">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          {contact.phone || <em className="opacity-60">No phone saved</em>}
                        </span>
                        <span className="flex items-center gap-1 max-w-[200px] truncate" title={contact.address}>
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          {contact.address || <em className="opacity-60">No address saved</em>}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Performance Statistics */}
                  <div className="flex items-center justify-start md:justify-center gap-4 border-t border-b md:border-t-0 md:border-b-0 border-slate-50 py-3 md:py-0 shrink-0">
                    <div className="text-left md:text-center">
                      <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">30d Revenue</p>
                      <p className="text-xs md:text-base font-extrabold text-blue-600">₹{(dist.revenueGenerated || 0).toLocaleString("en-IN")}</p>
                    </div>
                    
                    <div className="w-px h-6 bg-slate-150" />
                    
                    <div className="text-left md:text-center">
                      <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Stock Left</p>
                      <p className="text-xs md:text-base font-extrabold text-slate-700">{dist.totalQuantity || 0} <span className="text-[8px] md:text-[10px] font-bold text-slate-400">({dist.totalItems || 0} items)</span></p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center justify-end gap-1.5 shrink-0">
                    <button 
                      onClick={() => openAnalysis(dist._id)}
                      className="p-2 hover:bg-blue-50 border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-xl shadow-sm transition-all cursor-pointer"
                      title="Analyze supplied brands & stock"
                    >
                      <BarChart3 className="w-4 h-4" />
                    </button>

                    {/* Local Contact Editor Trigger */}
                    {isEditing ? (
                      <div className="flex gap-1 animate-in fade-in zoom-in duration-200">
                        <button 
                          onClick={() => saveContact(dist._id)}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
                          title="Save Contacts"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setEditingId(null)}
                          className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors cursor-pointer"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => startEdit(dist._id, contact)}
                        className="p-2 hover:bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-700 rounded-xl shadow-sm transition-all cursor-pointer"
                        title="Edit Contact Card"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}

                    <button 
                      onClick={() => startDelete(dist._id)}
                      className="p-2 hover:bg-rose-50 border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-xl shadow-sm transition-all cursor-pointer"
                      title="Delete distributor & all supplied inventory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    {/* Expand Detail Button */}
                    <button 
                      onClick={() => toggleExpand(dist._id)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${isExpanded ? 'bg-blue-50 border-blue-100 text-blue-600' : 'hover:bg-slate-50 border-slate-200 text-slate-400'}`}
                      title={isExpanded ? "Collapse Details" : "View Supplied Inventory"}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                </div>

                {/* Local Editor Input Form Block */}
                {isEditing && (
                  <div className="px-4 pb-4 md:px-6 md:pb-6 pt-0 animate-in slide-in-from-top duration-200 border-t border-slate-50 bg-slate-50/50 p-4">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Edit Contact Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Phone Number</label>
                        <input 
                          type="text" 
                          placeholder="e.g. +91 98765-43210"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">Office / Warehouse Address</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Sector-10, Medical Plaza, Mumbai"
                          value={editForm.address}
                          onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Expand details view (List of brands supplied by distributor) */}
                {isExpanded && (
                  <div className="px-4 pb-4 md:px-6 md:pb-6 border-t border-slate-100 bg-slate-50/30 animate-in fade-in duration-300">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-4 pb-3 flex items-center">
                      <Package className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Supplied Brands & Batches
                    </h4>
                    
                    {itemsLoading ? (
                      <div className="py-10 text-center text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        <span className="font-semibold text-xs">Loading items details...</span>
                      </div>
                    ) : distItems.length === 0 ? (
                      <p className="text-center text-slate-400 py-6 text-xs font-medium">No brands found currently listed.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                              <th className="p-3 font-bold">Brand/Medicine Name</th>
                              <th className="p-3 font-bold">Batch No.</th>
                              <th className="p-3 font-bold text-center">MRP</th>
                              <th className="p-3 font-bold text-center">Remaining Stock</th>
                              <th className="p-3 font-bold text-right">Expiration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                            {distItems.map((item) => {
                              const isOutOfStock = item.quantity <= 0;
                              return (
                                <tr key={item._id} className="hover:bg-slate-50/10 transition-colors">
                                  <td className="p-3 font-extrabold text-slate-700 capitalize">{item.name}</td>
                                  <td className="p-3 font-semibold text-slate-500">{item.batch}</td>
                                  <td className="p-3 text-center font-bold text-blue-600">₹{item.mrp}</td>
                                  <td className="p-3 text-center">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-lg font-extrabold text-[10px] ${isOutOfStock ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-700'}`}>
                                      {isOutOfStock ? "Finished" : `${item.quantity} units`}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-600">{formatExpiryDate(item.expiryDate)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
              <h2 className="text-base md:text-lg font-bold text-rose-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-rose-500 animate-pulse" />
                Purge Distributor Inventory
              </h2>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={executeDelete} className="p-6 space-y-5">
              <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 text-rose-700 text-xs font-semibold leading-relaxed">
                🚨 WARNING: Deleting the distributor <strong className="capitalize text-slate-800">{deletingDist}</strong> will permanently remove **ALL** medicines and batches supplied by them from your inventory. This action cannot be undone!
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Type <strong className="text-rose-600 select-all">DELETE</strong> to confirm</label>
                <input
                  type="text"
                  required
                  placeholder="Type DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-slate-50 border border-rose-200 text-slate-700 rounded-xl px-3.5 py-3 focus:outline-none focus:border-rose-400 font-bold"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmText !== "DELETE" || deleteLoading}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer text-xs uppercase"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Confirm Purge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Distributor Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] md:rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center capitalize">
                <BarChart3 className="w-5 h-5 mr-2 text-blue-500" />
                {analysisDistName} - Performance & Stock Analysis
              </h2>
              <button 
                onClick={() => setShowAnalysisModal(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {analysisLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                <p className="font-semibold text-sm">Aggregating inventory metrics...</p>
              </div>
            ) : !analysisData ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400">
                <p className="font-semibold text-sm">No analysis details found.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Stats grid */}
                <div className="p-5 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/20 border-b border-slate-100 shrink-0">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unique Brands</p>
                    <p className="text-xl font-extrabold text-slate-700">{analysisData.summary.totalItems}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Total distinct medicine models</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stock Left</p>
                    <p className="text-xl font-extrabold text-slate-700">{analysisData.summary.totalQuantity} <span className="text-xs font-semibold text-slate-400">units</span></p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Across {analysisData.summary.activeBatchesCount} active batches</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">MRP Inventory Value</p>
                    <p className="text-xl font-extrabold text-blue-600">₹{analysisData.summary.stockValuation.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Cost Valuation: ₹{analysisData.summary.purchaseValuation.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">All-Time Sales</p>
                    <p className="text-xl font-extrabold text-emerald-600">₹{(analysisData.summary.revenueGenerated || 0).toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">{analysisData.summary.soldQuantity || 0} units sold ({analysisData.summary.salesCount || 0} bills)</p>
                  </div>
                </div>

                {/* Batch status summary bar */}
                <div className="px-5 py-3 md:px-6 bg-slate-50 border-b border-slate-150 flex flex-wrap gap-3 items-center justify-between shrink-0">
                  <div className="flex flex-wrap gap-2 text-[10px] md:text-xs font-bold">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg">
                      Active: {analysisData.summary.activeBatchesCount} batches
                    </span>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg">
                      Expiring &lt; 3M: {analysisData.summary.expiringSoonCount}
                    </span>
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg">
                      Expired: {analysisData.summary.expiredMedsCount}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-250 rounded-lg">
                      Out of Stock: {analysisData.summary.outOfStockCount}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={analysisFilterStatus}
                      onChange={(e) => setAnalysisFilterStatus(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-600 text-[10px] md:text-xs font-extrabold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Batches</option>
                      <option value="active">Active Only</option>
                      <option value="lowStock">Low Stock (&lt; 10)</option>
                      <option value="expiringSoon">Expiring Soon</option>
                      <option value="expired">Expired Only</option>
                      <option value="outOfStock">Out of Stock</option>
                    </select>
                  </div>
                </div>

                {/* Search bar inside modal */}
                <div className="p-4 bg-white border-b border-slate-100 shrink-0">
                  <div className="relative flex items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-200 transition-all shadow-sm">
                    <Search className="w-4 h-4 mr-2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search supplied medicine name or batch number..."
                      value={analysisSearchTerm}
                      onChange={(e) => setAnalysisSearchTerm(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-xs font-semibold text-slate-700"
                    />
                  </div>
                </div>

                {/* Scrollable table */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-slate-50/10">
                  {(() => {
                    const filtered = (analysisData.medicines || []).filter(m => {
                      const matchSearch = m.name?.toLowerCase().includes(analysisSearchTerm.toLowerCase()) || m.batch?.toLowerCase().includes(analysisSearchTerm.toLowerCase());
                      
                      let matchFilter = true;
                      const exp = new Date(m.expiryDate);
                      const nowTime = new Date();
                      const threeM = new Date();
                      threeM.setMonth(threeM.getMonth() + 3);

                      if (analysisFilterStatus === "active") matchFilter = m.quantity > 0;
                      else if (analysisFilterStatus === "lowStock") matchFilter = m.quantity > 0 && m.quantity < 10;
                      else if (analysisFilterStatus === "expired") matchFilter = m.quantity > 0 && exp < nowTime;
                      else if (analysisFilterStatus === "expiringSoon") {
                        matchFilter = m.quantity > 0 && exp >= nowTime && exp <= threeM;
                      }
                      else if (analysisFilterStatus === "outOfStock") matchFilter = m.quantity === 0;

                      return matchSearch && matchFilter;
                    });

                    if (filtered.length === 0) {
                      return <p className="text-center text-slate-400 py-12 text-xs font-semibold">No medicines found matching filters.</p>;
                    }

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                              <th className="p-3 font-bold">Brand/Medicine Name</th>
                              <th className="p-3 font-bold">Batch No.</th>
                              <th className="p-3 font-bold text-center">MRP / Purchase</th>
                              <th className="p-3 font-bold text-center">Remaining Stock</th>
                              <th className="p-3 font-bold text-right">Expiration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                            {filtered.map((item) => {
                              const isOutOfStock = item.quantity <= 0;
                              const isExp = new Date(item.expiryDate) < new Date();
                              const threeM = new Date();
                              threeM.setMonth(threeM.getMonth() + 3);
                              const isNearExp = !isExp && new Date(item.expiryDate) <= threeM;
                              return (
                                <tr key={item._id} className="hover:bg-slate-50/10 transition-colors">
                                  <td className="p-3 font-extrabold text-slate-700 capitalize">
                                    <p>{item.name}</p>
                                    <p className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Barcode: {item.barcodeId}</p>
                                  </td>
                                  <td className="p-3 font-semibold text-slate-500">{item.batch}</td>
                                  <td className="p-3 text-center">
                                    <p className="font-bold text-blue-600">MRP: ₹{item.mrp}</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5">Cost: ₹{item.purchasePrice || 0}</p>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-lg font-extrabold text-[10px] ${isOutOfStock ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-700'}`}>
                                      {isOutOfStock ? "Out of Stock" : `${item.quantity} units`}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <p className={`font-bold ${isExp ? 'text-rose-500' : isNearExp ? 'text-amber-500' : 'text-slate-600'}`}>
                                      {new Date(item.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                    <p className="text-[9px] font-bold mt-0.5">
                                      {isExp ? (
                                        <span className="text-rose-500 uppercase tracking-widest text-[8px]">🔴 Expired</span>
                                      ) : isNearExp ? (
                                        <span className="text-amber-500 uppercase tracking-widest text-[8px]">⚠️ Expiring soon</span>
                                      ) : (
                                        <span className="text-slate-400 uppercase tracking-widest text-[8px]">🟢 Safe</span>
                                      )}
                                    </p>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

// 🚀 Premium Shimmering Skeleton Loader for initial state loading
function DistributorSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white p-4 md:p-5 rounded-[24px] md:rounded-3xl border border-slate-100 flex items-center bg-slate-50/30">
        <div className="w-full bg-slate-100 h-10 rounded-xl animate-pulse" />
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 p-4 md:p-6 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-sm animate-pulse">
          <div className="flex items-center gap-3 md:gap-4 flex-1">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-100 rounded-xl md:rounded-2xl shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="bg-slate-100 h-4 rounded w-1/3" />
              <div className="bg-slate-100 h-3 rounded w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-4 py-2 md:py-0 shrink-0">
            <div className="space-y-2">
              <div className="bg-slate-100 h-3 rounded w-12" />
              <div className="bg-slate-100 h-4 rounded w-16" />
            </div>
            <div className="w-px h-6 bg-slate-100" />
            <div className="space-y-2">
              <div className="bg-slate-100 h-3 rounded w-12" />
              <div className="bg-slate-100 h-4 rounded w-16" />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 shrink-0">
            <div className="w-8 h-8 bg-slate-100 rounded-xl" />
            <div className="w-8 h-8 bg-slate-100 rounded-xl" />
            <div className="w-8 h-8 bg-slate-100 rounded-xl" />
            <div className="w-8 h-8 bg-slate-100 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
