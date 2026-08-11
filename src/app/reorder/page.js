"use client";
import { useState, useEffect, useCallback } from "react";
import { 
  ClipboardList, Plus, Search, Loader2, CheckCircle2, 
  Send, PhoneCall, Trash2, Clock, AlertCircle, PackageCheck, 
  ArrowRight, RefreshCw, MessageSquare
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function ReorderNotebook() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [distributors, setDistributors] = useState([]);

  // Form State
  const [formData, setFormData] = useState({
    medicineName: "",
    quantity: "1 Strip",
    distributor: "",
    customerName: "",
    customerPhone: "",
    urgency: "Urgent",
    note: ""
  });

  const [shopInfo, setShopInfo] = useState(null);

  const fetchShopInfo = useCallback(async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.success) {
        setShopInfo(data.user);
      }
    } catch (err) {
      console.error("Failed to fetch shop info:", err);
    }
  }, []);

  const fetchDistributors = useCallback(async () => {
    try {
      const res = await fetch("/api/medicine?getDistributors=true");
      const data = await res.json();
      if (data.success) {
        setDistributors(data.distributors || []);
      }
    } catch (err) {}
  }, []);

  const fetchReorders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reorder?status=${encodeURIComponent(filterStatus)}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (error) {
      toast.error("Failed to fetch shortage items");
    }
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReorders();
    fetchDistributors();
    fetchShopInfo();
  }, [fetchReorders, fetchDistributors, fetchShopInfo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.medicineName.trim()) {
      toast.error("Please enter medicine name!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/reorder", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`"${formData.medicineName}" added to Reorder Book!`);
        setFormData({
          medicineName: "",
          quantity: "1 Strip",
          distributor: "",
          customerName: "",
          customerPhone: "",
          urgency: "Urgent",
          note: ""
        });
        fetchReorders();
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (error) {
      toast.error("Something went wrong!");
    }
    setSubmitting(false);
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch("/api/reorder", {
        method: "PUT",
        body: JSON.stringify({ id, status: newStatus }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Status updated to "${newStatus}"!`);
        fetchReorders();
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`/api/reorder?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success("Item removed");
        fetchReorders();
      }
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  // WhatsApp Order to Distributor
  const sendDistributorWhatsAppOrder = (distName = "") => {
    const targetItems = items.filter(item => 
      item.status !== "Received" && 
      (!distName || item.distributor.toLowerCase() === distName.toLowerCase())
    );

    if (targetItems.length === 0) {
      toast.error("No pending shortage items found to order!");
      return;
    }

    const shopName = shopInfo?.shopName || "MedERP Pharmacy";
    const shopPhone = shopInfo?.phoneNumber || "";
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    let message = `📋 *PHARMACY PURCHASE REORDER LIST*\n`;
    message += `-----------------------------\n`;
    message += `*Store:* ${shopName}\n`;
    if (shopPhone) message += `*Contact:* ${shopPhone}\n`;
    message += `*Date:* ${dateStr}\n`;
    if (distName) message += `*Supplier:* ${distName}\n`;
    message += `-----------------------------\n`;
    message += `*Items Required:*\n`;

    targetItems.forEach((item, index) => {
      message += `${index + 1}. *${item.medicineName}* - ${item.quantity}`;
      if (item.urgency === "Urgent") message += ` ⚡ _[URGENT]_`;
      if (item.note) message += `\n   Note: ${item.note}`;
      message += `\n`;
    });

    message += `-----------------------------\n`;
    message += `Please confirm dispatch date. Thank you!`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  // WhatsApp Notification to Customer when Stock Arrives
  const notifyCustomerWhatsApp = (item) => {
    if (!item.customerPhone) {
      toast.error("No customer phone number recorded for this item!");
      return;
    }

    let phone = item.customerPhone.replace(/\D/g, "");
    if (phone.length === 10) phone = "91" + phone;

    const shopName = shopInfo?.shopName || "MedERP Pharmacy";

    let message = `Namaste ${item.customerName || "ji"}! 💊\n\n`;
    message += `Aapne jis dawai *${item.medicineName}* (${item.quantity}) ke liye request kiya tha, wo *${shopName}* me aa gayi hai.\n\n`;
    message += `Aap dukan par aakar ise le ja sakte hain.\n\n`;
    message += `*Store:* ${shopName}\n`;
    if (shopInfo?.address) message += `*Address:* ${shopInfo.address}\n`;
    message += `Dhanyawad!`;

    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const [mobileTab, setMobileTab] = useState("list"); // 'list' or 'add'

  const filteredItems = items.filter(item => 
    item.medicineName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.distributor.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingCount = items.filter(i => i.status === "Pending").length;
  const urgentCount = items.filter(i => i.urgency === "Urgent" && i.status !== "Received").length;
  const orderedCount = items.filter(i => i.status === "Ordered").length;
  const receivedCount = items.filter(i => i.status === "Received").length;

  return (
    <div className="max-w-7xl mx-auto space-y-4 md:space-y-6 lg:space-y-8 px-1 md:px-0">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 md:pb-4">
        <div className="flex items-center">
          <div className="w-9 h-9 md:w-12 md:h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mr-3 border border-amber-100 shadow-sm shrink-0">
            <ClipboardList className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-slate-800 tracking-tight leading-tight">Shortage & Reorder Book</h1>
            <p className="text-slate-500 text-[9px] md:text-sm font-medium mt-0.5">Log demands, order stock, and send WhatsApp alerts.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => sendDistributorWhatsAppOrder("")}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] md:text-sm px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Send Order List (WhatsApp)
          </button>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-4">
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <div className="text-[8px] md:text-[10px] font-bold uppercase text-slate-400">Pending Shortages</div>
          <div className="text-base md:text-2xl font-black text-slate-800 mt-0.5">{pendingCount}</div>
        </div>
        <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 shadow-sm">
          <div className="text-[8px] md:text-[10px] font-bold uppercase text-amber-700">⚡ Urgent (Waiting)</div>
          <div className="text-base md:text-2xl font-black text-amber-600 mt-0.5">{urgentCount}</div>
        </div>
        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 shadow-sm">
          <div className="text-[8px] md:text-[10px] font-bold uppercase text-blue-700">📦 Ordered</div>
          <div className="text-base md:text-2xl font-black text-blue-600 mt-0.5">{orderedCount}</div>
        </div>
        <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 shadow-sm">
          <div className="text-[8px] md:text-[10px] font-bold uppercase text-emerald-700">✅ Received</div>
          <div className="text-base md:text-2xl font-black text-emerald-600 mt-0.5">{receivedCount}</div>
        </div>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-slate-150 p-1 rounded-2xl border border-slate-200/50 mb-1 select-none">
        <button
          type="button"
          onClick={() => setMobileTab("list")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold uppercase transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "list" ? "bg-white text-slate-800 shadow-sm font-black" : "text-slate-500"
          }`}
        >
          <ClipboardList className="w-4 h-4" /> View List ({filteredItems.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("add")}
          className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold uppercase transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === "add" ? "bg-white text-slate-800 shadow-sm font-black" : "text-slate-500"
          }`}
        >
          <Plus className="w-4 h-4 text-blue-600" /> Log Shortage
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">

        {/* Left Column: Form */}
        <div className={`lg:col-span-1 bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm h-fit lg:block ${mobileTab === 'add' ? 'block' : 'hidden'}`}>
          <h2 className="text-xs md:text-base font-bold text-slate-800 mb-3 md:mb-4 flex items-center">
            <Plus className="w-4 h-4 text-blue-600 mr-2" /> Log Shortage / Request
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Medicine Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Augmentin 625 Duo"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm font-bold focus:outline-none focus:border-blue-400"
                value={formData.medicineName}
                onChange={(e) => setFormData({ ...formData, medicineName: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Quantity Needed</label>
                <input
                  type="text"
                  placeholder="e.g. 2 Strips"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:border-blue-400"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Priority / Urgency</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm font-bold focus:outline-none focus:border-blue-400"
                >
                  <option value="Urgent">⚡ Urgent (Customer Waiting)</option>
                  <option value="Normal">📦 Normal Stock Reorder</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Preferred Distributor (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Cipla Wholesale"
                list="dist-list"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm font-medium focus:outline-none focus:border-blue-400"
                value={formData.distributor}
                onChange={(e) => setFormData({ ...formData, distributor: e.target.value })}
              />
              <datalist id="dist-list">
                {distributors.map((d, i) => <option key={i} value={d} />)}
              </datalist>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Details (For WhatsApp Notification)</p>
              
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Customer Name"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-400"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-400"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Special Note</label>
              <input
                type="text"
                placeholder="e.g. Customer promised by tomorrow evening"
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3 py-2.5 text-xs font-medium focus:outline-none focus:border-blue-400"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs md:text-sm py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save to Shortage Notebook"}
            </button>
          </form>
        </div>

        {/* Right Column: List & Filters */}
        <div className={`lg:col-span-2 space-y-4 lg:block ${mobileTab === 'list' ? 'block' : 'hidden'}`}>
          <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {["All", "Pending", "Ordered", "Received"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    filterStatus === st 
                      ? "bg-slate-800 text-white shadow-sm" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search reorder items..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:border-blue-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {loading ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-slate-100 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl text-center border border-dashed border-slate-200">
              <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-600 text-sm">No shortage items logged</p>
              <p className="text-xs text-slate-400 mt-1">Add items using the form on the left.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div key={item._id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-slate-800 text-sm md:text-base">{item.medicineName}</h3>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        item.urgency === "Urgent" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"
                      }`}>
                        {item.urgency === "Urgent" ? "⚡ Urgent" : "📦 Normal"}
                      </span>

                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                        item.status === "Pending" ? "bg-rose-100 text-rose-700" :
                        item.status === "Ordered" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {item.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-medium">
                      <span>Qty: <strong className="text-slate-800">{item.quantity}</strong></span>
                      {item.distributor && <span>• Supplier: <strong className="text-slate-700">{item.distributor}</strong></span>}
                      {item.customerName && (
                        <span className="text-blue-600 font-semibold">• Requested by: {item.customerName} ({item.customerPhone || "No Phone"})</span>
                      )}
                    </div>

                    {item.note && <p className="text-[11px] text-slate-400 italic">Note: {item.note}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
                    {item.customerPhone && item.status === "Received" && (
                      <button
                        onClick={() => notifyCustomerWhatsApp(item)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 shadow-sm"
                        title="Send WhatsApp arrival notification to customer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Notify Customer
                      </button>
                    )}

                    {item.status === "Pending" && (
                      <button
                        onClick={() => handleUpdateStatus(item._id, "Ordered")}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                      >
                        Mark Ordered
                      </button>
                    )}

                    {item.status === "Ordered" && (
                      <button
                        onClick={() => handleUpdateStatus(item._id, "Received")}
                        className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                      >
                        Mark Received
                      </button>
                    )}

                    <a
                      href={`/purchase?reorderName=${encodeURIComponent(item.medicineName)}&reorderDistributor=${encodeURIComponent(item.distributor || "")}`}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                    >
                      + Purchase Stock <ArrowRight className="w-3 h-3" />
                    </a>

                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
