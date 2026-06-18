"use client";
import { useState, useEffect, useRef } from "react";
import { 
  BookOpen, Search, UserPlus, IndianRupee, Phone, Calendar, 
  ArrowUpRight, ArrowDownLeft, Plus, Loader2, X, FileText, 
  CheckCircle2, Printer, AlertTriangle, Edit3, MessageSquare, ArrowDown, ArrowUp,
  Trash2
} from "lucide-react";
import { formatExpiryDate, formatDate } from "@/lib/formatDate";
import { useReactToPrint } from "react-to-print";
import toast, { Toaster } from "react-hot-toast";

const KhataSkeleton = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-pulse">
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-slate-200 rounded-2xl"></div>
          <div className="space-y-2">
            <div className="h-5 w-48 bg-slate-200 rounded-md"></div>
            <div className="h-3.5 w-64 bg-slate-200 rounded-md"></div>
          </div>
        </div>
        <div className="h-11 w-36 bg-slate-200 rounded-xl"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-100 space-y-4">
          <div className="h-10 w-full bg-slate-150 rounded-xl"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 w-full bg-slate-100 rounded-2xl"></div>
          ))}
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 space-y-6">
          <div className="h-20 w-full bg-slate-100 rounded-2xl"></div>
          <div className="h-48 w-full bg-slate-50 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
};

const getCustomerStatusDetails = (cust) => {
  if (!cust || cust.balance <= 0) {
    return { 
      oldestDebtDays: 0, 
      status: "Settled", 
      badgeClass: "bg-emerald-50 border-emerald-100 text-emerald-605 text-emerald-600", 
      stars: 5, 
      isLocked: false, 
      reason: "" 
    };
  }
  
  let oldestDebtDays = 0;
  if (cust.transactions && cust.transactions.length > 0) {
    const debts = cust.transactions.filter(tx => tx.type === "Sale" || tx.type === "Debt");
    if (debts.length > 0) {
      const sortedDebts = [...debts].sort((a, b) => new Date(a.date) - new Date(b.date));
      const oldestDebtDate = new Date(sortedDebts[0].date);
      const diffTime = Math.abs(new Date() - oldestDebtDate);
      oldestDebtDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
  }
  
  let promiseOverdueDays = 0;
  if (cust.promiseDate) {
    const pDate = new Date(cust.promiseDate);
    const today = new Date();
    pDate.setHours(0,0,0,0);
    today.setHours(0,0,0,0);
    if (pDate < today) {
      const diff = Math.abs(today - pDate);
      promiseOverdueDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
  }
  
  const isLocked = oldestDebtDays > 60 || promiseOverdueDays > 7;
  let reason = "";
  if (oldestDebtDays > 60) reason = `Outstanding balance is older than ${oldestDebtDays} days (>60 days limit).`;
  else if (promiseOverdueDays > 7) reason = `Repayment promise deadline missed by ${promiseOverdueDays} days (>7 days grace period).`;
  
  let status = "Active (<30d)";
  let badgeClass = "bg-blue-50 border-blue-105 text-blue-600";
  
  if (oldestDebtDays > 60) {
    status = "Critical (>60d)";
    badgeClass = "bg-rose-50 border-rose-100 text-rose-600 animate-pulse";
  } else if (oldestDebtDays > 30) {
    status = "Warning (>30d)";
    badgeClass = "bg-amber-50 border-amber-100 text-amber-600";
  }
  
  let stars = 5;
  if (oldestDebtDays > 60) stars = 2;
  else if (oldestDebtDays > 30) stars = 3.5;
  else if (oldestDebtDays > 15) stars = 4.5;
  if (cust.balance > (cust.creditLimit || 10000)) stars = Math.max(1, stars - 1);
  if (promiseOverdueDays > 0) stars = Math.max(1, stars - 1);
  
  return { oldestDebtDays, status, badgeClass, stars, isLocked, reason };
};

export default function KhataBook() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCust, setSelectedCust] = useState(null);
  
  // List Filters & Sorting
  const [filterType, setFilterType] = useState("all"); // all, pending, settled
  const [sortBy, setSortBy] = useState("balance"); // balance, name

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showPromiseModal, setShowPromiseModal] = useState(false);
  const [viewingBill, setViewingBill] = useState(null);
  
  // Forms
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newLimit, setNewLimit] = useState("10000");
  
  const [repaymentAmount, setRepaymentAmount] = useState("");
  const [repaymentNote, setRepaymentNote] = useState("");
  
  const [debtAmount, setDebtAmount] = useState("");
  const [debtNote, setDebtNote] = useState("");
  
  const [editLimitAmount, setEditLimitAmount] = useState("");
  const [editPromiseDate, setEditPromiseDate] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [shopInfo, setShopInfo] = useState(null);

  // Printing Statement References
  const printRef = useRef(null);
  const [printData, setPrintData] = useState(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedCust ? `Ledger_Statement_${selectedCust.name}` : 'Statement',
    onAfterPrint: () => {
      setPrintData(null);
    }
  });

  useEffect(() => {
    fetchShopInfo();
  }, []);

  const fetchShopInfo = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.success) setShopInfo(data.user);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async (silent = false, searchStr = "") => {
    if (!silent) setLoading(true);
    try {
      const url = searchStr ? `/api/customer?search=${encodeURIComponent(searchStr)}` : "/api/customer";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
        // Refresh selected customer details if active
        if (selectedCust) {
          const updated = data.customers.find(c => c._id === selectedCust._id);
          if (updated) setSelectedCust(updated);
        }
      }
    } catch (e) {
      toast.error("Failed to load credit ledger accounts!");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Debounced server-side customer list fetch to handle 100,000+ records cleanly
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers(customers.length > 0, searchTerm);
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, phone: newPhone })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.alreadyExists ? "Profile already exists!" : "Customer added successfully!");
        setNewName("");
        setNewPhone("");
        setShowAddModal(false);
        await fetchCustomers(true);
        setSelectedCust(data.customer);
      } else {
        toast.error(data.error || "Failed to create profile");
      }
    } catch (e) {
      toast.error("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const sendRepaymentWhatsApp = (cust, amount, note) => {
    if (!cust) return;
    const shopName = shopInfo?.shopName || "MedERP Pharmacy";
    const shopPhone = shopInfo?.phoneNumber || "";
    
    let message = `*✨ PAYMENT RECEIPT & STATEMENT - ${shopName}* \n`;
    message += `-----------------------------\n`;
    message += `Dear *${cust.name}*,\n\n`;
    message += `We have successfully recorded your repayment of *₹${amount}*.\n`;
    if (note) message += `*Payment Note:* ${note}\n`;
    message += `-----------------------------\n`;
    message += `*Current Remaining Balance: ₹${cust.balance}*\n\n`;
    
    message += `*Recent Transactions History:*\n`;
    const sortedTx = [...cust.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    sortedTx.forEach(tx => {
      const txDate = new Date(tx.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const sign = tx.type === "Payment" ? "Paid (Jama)" : tx.type === "Debt" ? "Custom Udhaar" : "Udhaar Sale";
      message += `• ${txDate}: ${sign} - ₹${tx.amount}`;
      if (tx.note) message += ` _(${tx.note})_`;
      message += `\n`;
    });
    
    message += `-----------------------------\n`;
    message += `Thank you for choosing us! Get well soon. ❤️`;
    
    let cleanPhone = cust.phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
    
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const handleRecordRepayment = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(repaymentAmount);
    if (!repaymentAmount || parsedAmount <= 0) {
      toast.error("Please enter a valid received amount!");
      return;
    }
    if (parsedAmount > selectedCust.balance) {
      toast.error(`Payment amount cannot exceed outstanding dues of ₹${selectedCust.balance}!`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCust._id,
          action: "repayment",
          amount: repaymentAmount,
          note: repaymentNote || "Jama (Cash Received)"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Success! Recorded repayment of ₹${repaymentAmount}`);
        
        // Send WhatsApp Payment Statement immediately
        sendRepaymentWhatsApp(data.customer, repaymentAmount, repaymentNote || "Jama (Cash Received)");
        
        setRepaymentAmount("");
        setRepaymentNote("");
        setShowPayModal(false);
        await fetchCustomers(true);
      } else {
        toast.error(data.error || "Failed to record transaction");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordDebt = async (e) => {
    e.preventDefault();
    if (!debtAmount || parseFloat(debtAmount) <= 0) {
      toast.error("Please enter a valid debt amount!");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCust._id,
          action: "debt",
          amount: debtAmount,
          note: debtNote || "Custom credit/adjustment"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Success! Recorded custom debt of ₹${debtAmount}`);
        setDebtAmount("");
        setDebtNote("");
        setShowDebtModal(false);
        await fetchCustomers(true);
      } else {
        toast.error(data.error || "Failed to save entry");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLimit = async (e) => {
    e.preventDefault();
    if (!editLimitAmount || parseFloat(editLimitAmount) < 0) {
      toast.error("Please enter a valid credit limit!");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCust._id,
          action: "updateLimit",
          limit: editLimitAmount
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Credit limit updated to ₹${editLimitAmount}!`);
        setShowLimitModal(false);
        await fetchCustomers(true);
      } else {
        toast.error(data.error || "Failed to update limit");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePromiseDate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCust._id,
          action: "updatePromiseDate",
          promiseDate: editPromiseDate || null
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(editPromiseDate ? `Repayment promise date set to ${editPromiseDate}!` : "Promise date cleared!");
        setShowPromiseModal(false);
        await fetchCustomers(true);
      } else {
        toast.error(data.error || "Failed to update promise date");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewBill = async (saleId) => {
    if (!saleId) return;
    const toastId = toast.loading("Fetching bill details...");
    try {
      const res = await fetch(`/api/sell?saleId=${saleId}`);
      const data = await res.json();
      if (data.success) {
        toast.dismiss(toastId);
        setViewingBill(data.sale);
      } else {
        toast.error(data.error || "Failed to load bill details!", { id: toastId });
      }
    } catch (e) {
      toast.error("Network error loading bill", { id: toastId });
    }
  };

  const handleDeleteCustomer = async () => {
    if (!selectedCust) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete ${selectedCust.name}'s profile? All outstanding balance and transaction statement history will be permanently deleted. This action cannot be undone.`);
    if (!confirmDelete) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/customer?customerId=${selectedCust._id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Customer profile deleted successfully!");
        setSelectedCust(null);
        await fetchCustomers(true, searchTerm);
      } else {
        toast.error(data.error || "Failed to delete customer profile");
      }
    } catch (e) {
      toast.error("Network error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // WhatsApp balance reminder logic
  const handleSendReminder = () => {
    if (!selectedCust) return;
    const shopName = shopInfo?.shopName || "MedERP Pharmacy";
    const shopPhone = shopInfo?.phoneNumber || "";
    
    let message = `*🏥 OUTSTANDING DUE REMINDER - ${shopName}* \n`;
    message += `-----------------------------\n`;
    message += `Dear *${selectedCust.name}*,\n\n`;
    message += `This is a friendly reminder regarding your outstanding credit balance at our pharmacy:\n`;
    message += `*Total Due Amount: ₹${selectedCust.balance.toLocaleString('en-IN')}*\n`;
    if (selectedCust.creditLimit) {
      message += `*Allowed Credit Limit: ₹${selectedCust.creditLimit.toLocaleString('en-IN')}*\n`;
    }
    if (selectedCust.promiseDate) {
      const pDate = new Date(selectedCust.promiseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
      const today = new Date();
      today.setHours(0,0,0,0);
      const isOverdue = new Date(selectedCust.promiseDate) < today;
      message += `*Target Repayment Date:* ${pDate}${isOverdue ? " ⚠️ (OVERDUE)" : ""}\n`;
    }
    message += `-----------------------------\n`;
    message += `Please settle this balance at your earliest convenience. You can pay via Cash, UPI, or Card.\n\n`;
    if (shopPhone) message += `For queries, contact: ${shopPhone}\n`;
    message += `Thank you, and get well soon! ❤️`;

    let cleanPhone = selectedCust.phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) cleanPhone = "91" + cleanPhone;
    
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
    toast.success("Reminder generated and opened in WhatsApp!");
  };

  // WhatsApp full outstanding dues report
  const handleSendDuesReportToWhatsApp = () => {
    const pendingCustomers = customers.filter(c => c.balance > 0);
    if (pendingCustomers.length === 0) {
      toast.error("No pending dues accounts found to generate report!");
      return;
    }

    const shopName = shopInfo?.shopName || "MedERP Pharmacy";
    const totalOutstanding = pendingCustomers.reduce((sum, c) => sum + (c.balance || 0), 0);
    
    let message = `*📊 OUTSTANDING DUES REPORT - ${shopName}*\n`;
    message += `-----------------------------\n`;
    message += `*Date:* ${new Date().toLocaleDateString("en-IN")}\n\n`;
    message += `*Pending Customer Accounts (${pendingCustomers.length}):*\n`;
    
    pendingCustomers.forEach((c, idx) => {
      message += `${idx + 1}. *${c.name}* (${c.phone}): ₹${c.balance.toLocaleString("en-IN")}\n`;
    });
    
    message += `-----------------------------\n`;
    message += `*Total Dues Outstanding: ₹${totalOutstanding.toLocaleString("en-IN")}*\n`;
    message += `-----------------------------`;

    let recipientPhone = "";
    if (shopInfo?.phoneNumber) {
      recipientPhone = shopInfo.phoneNumber.replace(/\D/g, "");
      if (recipientPhone.length === 10) {
        recipientPhone = "91" + recipientPhone;
      }
    }

    const waUrl = recipientPhone 
      ? `https://wa.me/${recipientPhone}?text=${encodeURIComponent(message)}` 
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
      
    window.open(waUrl, "_blank");
    toast.success("Dues report generated and opened in WhatsApp!");
  };

  // Trigger print view
  const triggerPrintStatement = () => {
    if (!selectedCust) return;
    setPrintData({
      customer: selectedCust,
      date: new Date(),
      transactions: [...selectedCust.transactions]
    });
  };

  useEffect(() => {
    if (printData) {
      setTimeout(() => {
        handlePrint();
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printData]);

  // Filters & Sorting logic
  const filteredCustomers = customers
    .filter(c => {
      // Search filter
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
      if (!matchesSearch) return false;
      
      // Tab filter
      if (filterType === "pending") return c.balance > 0;
      if (filterType === "settled") return c.balance <= 0;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return b.balance - a.balance; // balance (highest first)
    });

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.balance || 0), 0);

  // Advanced insights logic for selected customer
  const getInsights = () => {
    if (!selectedCust || !selectedCust.transactions) return { totalTaken: 0, totalPaid: 0, lastPayment: null };
    let totalTaken = 0;
    let totalPaid = 0;
    let lastPayment = null;

    selectedCust.transactions.forEach(tx => {
      if (tx.type === "Sale" || tx.type === "Debt") {
        totalTaken += tx.amount;
      } else if (tx.type === "Payment") {
        totalPaid += tx.amount;
        if (!lastPayment || new Date(tx.date) > new Date(lastPayment.date)) {
          lastPayment = tx;
        }
      }
    });

    return { totalTaken, totalPaid, lastPayment };
  };

  const insights = getInsights();

  if (loading) return <KhataSkeleton />;

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 border border-emerald-100 shadow-sm shrink-0">
            <BookOpen className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-tight">Advanced Credit Book (Khata Ledger)</h1>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium mt-0.5">Audit customer transaction records, log repayments, adjust credit limits, and print account statements.</p>
          </div>
        </div>

        <button 
          onClick={handleSendDuesReportToWhatsApp}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center justify-center transition-all shadow-md shrink-0 w-full sm:w-auto hover:scale-[1.02] duration-200 gap-1.5"
        >
          <MessageSquare className="w-4 h-4 text-emerald-100" /> WhatsApp Dues Report
        </button>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-in fade-in duration-300">
        
        {/* Total Outstanding */}
        <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-5 md:p-6 text-white shadow-lg shadow-emerald-500/10 flex flex-col justify-between h-32 md:h-36">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-100/90">Total Credit Outstanding</p>
          <h2 className="text-2xl md:text-3xl font-black flex items-center mt-1">
            <IndianRupee className="w-6 h-6 mr-0.5" /> {totalOutstanding.toLocaleString("en-IN")}
          </h2>
          <p className="text-[10px] text-emerald-100/70">Across {customers.length} total customer ledger accounts.</p>
        </div>

        {/* Pending Accounts */}
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] flex flex-col justify-between h-32 md:h-36">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-450">Pending Dues Accounts</p>
          <h2 className="text-2xl md:text-3xl font-black text-rose-500 flex items-center mt-1">
            {customers.filter(c => c.balance > 0).length} <span className="text-xs font-semibold text-slate-550 ml-1.5">Accounts Pending</span>
          </h2>
          <p className="text-[10px] text-slate-400">Ledgers with credit outstanding balance &gt; 0.</p>
        </div>

        {/* Safe / Settled Accounts */}
        <div className="bg-white rounded-3xl p-5 md:p-6 border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] flex flex-col justify-between h-32 md:h-36">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-455">Settled/Clear Accounts</p>
          <h2 className="text-2xl md:text-3xl font-black text-emerald-600 flex items-center mt-1">
            {customers.filter(c => c.balance <= 0).length} <span className="text-xs font-semibold text-slate-550 ml-1.5">Accounts Clear</span>
          </h2>
          <p className="text-[10px] text-slate-400">Ledgers with fully cleared or advance balances.</p>
        </div>

      </div>

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: customer list and filter controls */}
        <div className="lg:col-span-1 bg-white p-4 md:p-5 rounded-[24px] md:rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] space-y-4 flex flex-col max-h-[80vh]">
          {/* Search */}
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search Customer name or phone..." 
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl pl-10 pr-4 py-2.5 md:py-3 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all text-xs md:text-sm font-semibold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          </div>

          {/* List controls */}
          <div className="space-y-2 border-b border-slate-50 pb-3">
            {/* Filter Buttons */}
            <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl text-[10px] font-bold select-none">
              <button 
                onClick={() => setFilterType("all")}
                className={`flex-1 py-1.5 rounded-lg transition-all ${filterType === "all" ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterType("pending")}
                className={`flex-1 py-1.5 rounded-lg transition-all ${filterType === "pending" ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Dues Pending
              </button>
              <button 
                onClick={() => setFilterType("settled")}
                className={`flex-1 py-1.5 rounded-lg transition-all ${filterType === "settled" ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Settled
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-400">
              <span>Sort By:</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSortBy("balance")}
                  className={`flex items-center gap-0.5 px-2 py-0.5 rounded ${sortBy === "balance" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "hover:text-slate-600"}`}
                >
                  Balance <ArrowDown className="w-2.5 h-2.5" />
                </button>
                <button 
                  onClick={() => setSortBy("name")}
                  className={`flex items-center gap-0.5 px-2 py-0.5 rounded ${sortBy === "name" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "hover:text-slate-600"}`}
                >
                  Name A-Z
                </button>
              </div>
            </div>
          </div>

          {/* Customer list container */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {filteredCustomers.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10 font-semibold">No credit profiles found matching parameters.</p>
            ) : (
              filteredCustomers.map(c => {
                const isActive = selectedCust && selectedCust._id === c._id;
                const statusDetails = getCustomerStatusDetails(c);
                const fullStars = Math.floor(statusDetails.stars);
                const hasHalf = statusDetails.stars % 1 !== 0;
                
                return (
                  <div 
                    key={c._id} 
                    onClick={() => { 
                      setSelectedCust(c); 
                      setEditLimitAmount(c.creditLimit || "10000"); 
                      setEditPromiseDate(c.promiseDate ? c.promiseDate.split('T')[0] : "");
                    }}
                    className={`p-3 md:p-4 rounded-2xl border cursor-pointer transition-all flex flex-col gap-2 ${
                      isActive 
                        ? 'bg-emerald-50/50 border-emerald-500 text-emerald-950 font-bold shadow-md shadow-emerald-500/5' 
                        : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:border-emerald-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-xs md:text-sm truncate capitalize flex items-center gap-1.5">
                          <span>{c.name}</span>
                          {statusDetails.isLocked && <span className="text-[10px] shrink-0" title="Credit Locked">🔒</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-350" /> {c.phone}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-black px-2.5 py-1 rounded-xl block ${
                          c.balance > 0 
                            ? 'bg-rose-50 border border-rose-100 text-rose-600' 
                            : 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                        }`}>
                          ₹{c.balance}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] border-t border-slate-150/50 pt-1.5 mt-0.5">
                      <span className="text-amber-500 font-bold flex items-center gap-0.5">
                        {"★".repeat(fullStars)}
                        {hasHalf ? "½" : ""}
                        <span className="text-slate-400 font-normal text-[9px] ml-1">({statusDetails.stars})</span>
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusDetails.badgeClass}`}>
                        {statusDetails.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right column: customer details, analytics, and statements */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedCust ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 p-12 md:p-24 rounded-[24px] md:rounded-3xl text-center h-full flex flex-col justify-center items-center">
              <BookOpen className="w-12 h-12 md:w-16 md:h-16 text-slate-200 mx-auto mb-3 opacity-60 animate-pulse" />
              <h3 className="text-base md:text-lg font-bold text-slate-600">Trace credit logs</h3>
              <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-sm mx-auto">Select a credit profile from the list to manage outstanding bills, adjust limits, write custom transactions, or print statements.</p>
            </div>
          ) : (
            <div className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] space-y-6 animate-in fade-in duration-200">
              
              {/* Profile Details Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-extrabold text-lg text-slate-800 capitalize leading-tight">{selectedCust.name}</h3>
                    {(() => {
                      const statusDetails = getCustomerStatusDetails(selectedCust);
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${statusDetails.badgeClass}`}>
                          {statusDetails.status}
                        </span>
                      );
                    })()}
                    {selectedCust.balance > (selectedCust.creditLimit || 10000) && (
                      <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-rose-200 select-none animate-pulse">
                        ⚠️ LIMIT EXCEEDED
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase">
                    <span>Phone: {selectedCust.phone}</span>
                    <span>•</span>
                    {(() => {
                      const statusDetails = getCustomerStatusDetails(selectedCust);
                      const fullStars = Math.floor(statusDetails.stars);
                      const hasHalf = statusDetails.stars % 1 !== 0;
                      const emptyStars = 5 - Math.ceil(statusDetails.stars);
                      return (
                        <span className="text-amber-500 font-bold flex items-center gap-0.5">
                          {"★".repeat(fullStars)}
                          {hasHalf ? "½" : ""}
                          {"☆".repeat(emptyStars)}
                          <span className="text-slate-400 font-semibold text-[9px] ml-1">({statusDetails.stars}/5 stars)</span>
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={triggerPrintStatement}
                    className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                    title="Print Account Statement"
                  >
                    <Printer className="w-4 h-4 text-blue-400" /> Statement
                  </button>
                  
                  <button 
                    onClick={handleSendReminder}
                    className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5"
                    title="Send Payment Reminder to WhatsApp"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-200" /> WhatsApp Reminder
                  </button>

                  <button 
                    onClick={() => { setSelectedCust(null); }}
                    className="bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 p-2.5 rounded-xl border border-slate-150 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Transactions commands cockpit */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-wrap gap-2.5">
                {selectedCust.balance > 0 && (
                  <button 
                    onClick={() => setShowPayModal(true)}
                    className="flex-1 min-w-[140px] bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/10 flex items-center justify-center gap-1.5 hover:scale-[1.02] duration-200"
                  >
                    <Plus className="w-4 h-4 text-emerald-250" /> Record Repayment
                  </button>
                )}
                <button 
                  onClick={() => { 
                    setEditPromiseDate(selectedCust.promiseDate ? selectedCust.promiseDate.split('T')[0] : ""); 
                    setShowPromiseModal(true); 
                  }}
                  className="flex-1 min-w-[140px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-4 h-4 text-slate-400" /> Promise Date
                </button>
                <button 
                  onClick={() => { setEditLimitAmount(selectedCust.creditLimit || 10000); setShowLimitModal(true); }}
                  className="flex-1 min-w-[140px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5"
                >
                  <Edit3 className="w-4 h-4 text-slate-400" /> Change Limit
                </button>
                <button 
                  onClick={handleDeleteCustomer}
                  className="flex-1 min-w-[140px] bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/10 flex items-center justify-center gap-1.5 hover:scale-[1.02] duration-200"
                >
                  <Trash2 className="w-4 h-4 text-rose-250" /> Delete Profile
                </button>
              </div>

              {/* Overdue/Lock Warnings */}
              {(() => {
                const statusDetails = getCustomerStatusDetails(selectedCust);
                return (
                  <div className="space-y-3">
                    {statusDetails.isLocked && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl flex items-start gap-3 shadow-sm animate-pulse">
                        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-extrabold text-sm text-rose-900">🚨 Credit Account Locked</p>
                          <p className="text-xs font-semibold text-rose-700 mt-1">This customer&apos;s credit has been locked in Fast Billing. Reason: {statusDetails.reason}</p>
                        </div>
                      </div>
                    )}
                    
                    {selectedCust.promiseDate && (
                      <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 shadow-sm ${
                        new Date(selectedCust.promiseDate) < new Date()
                          ? 'bg-rose-50/50 border-rose-150 text-rose-850'
                          : 'bg-indigo-50/30 border-indigo-100 text-indigo-900'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <Calendar className={`w-5 h-5 ${new Date(selectedCust.promiseDate) < new Date() ? 'text-rose-500' : 'text-indigo-500'}`} />
                          <div>
                            <p className="font-extrabold text-xs">Repayment Promise Date</p>
                            <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                              Target deadline: {new Date(selectedCust.promiseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        {new Date(selectedCust.promiseDate) < new Date() ? (
                          <span className="bg-rose-100 text-rose-700 text-[9px] font-black px-2 py-0.5 rounded-full border border-rose-200 select-none animate-pulse">
                            ⚠️ OVERDUE
                          </span>
                        ) : (
                          <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-indigo-200 select-none">
                            Upcoming
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Credit Limit Info Bar */}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400">Credit Limit Utilization</span>
                  <span className="font-black text-slate-700">₹{selectedCust.balance} / ₹{selectedCust.creditLimit || 10000}</span>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedCust.balance > (selectedCust.creditLimit || 10000) 
                        ? 'bg-rose-500' 
                        : (selectedCust.balance / (selectedCust.creditLimit || 10000)) > 0.8 
                          ? 'bg-amber-500' 
                          : 'bg-emerald-500'
                    }`} 
                    style={{ width: `${Math.min(100, (selectedCust.balance / (selectedCust.creditLimit || 10000)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Analytics summary details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-rose-50/30 border border-rose-100/60 rounded-2xl p-3 text-center flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Total Credit Taken</span>
                  <span className="text-sm md:text-base font-extrabold text-rose-600 mt-1 block">₹{insights.totalTaken.toLocaleString("en-IN")}</span>
                </div>
                <div className="bg-emerald-50/30 border border-emerald-100/60 rounded-2xl p-3 text-center flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Total Repaid</span>
                  <span className="text-sm md:text-base font-extrabold text-emerald-600 mt-1 block">₹{insights.totalPaid.toLocaleString("en-IN")}</span>
                </div>
                <div className={`border rounded-2xl p-3 text-center flex flex-col justify-center transition-all ${
                  selectedCust.balance > 0 
                    ? 'bg-rose-50 border-rose-200 shadow-sm animate-pulse' 
                    : 'bg-emerald-50 border-emerald-200'
                }`}>
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">
                    {selectedCust.balance > 0 ? "Net Dues (Remaining)" : "Dues Settled"}
                  </span>
                  <span className={`text-sm md:text-base font-black mt-1 block ${
                    selectedCust.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                  }`}>
                    ₹{selectedCust.balance.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl text-center flex flex-col justify-center border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Last Repayment</span>
                  <span className="text-[10px] md:text-xs font-black text-slate-700 mt-0.5 block">
                    {insights.lastPayment 
                      ? `₹${insights.lastPayment.amount} (${new Date(insights.lastPayment.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })})` 
                      : "No payments yet"}
                  </span>
                </div>
              </div>

              {/* Transaction history logs */}
              <div className="space-y-4">
                <h4 className="font-extrabold text-xs md:text-sm text-slate-800 uppercase tracking-wider flex items-center">
                  <span>Ledger Logs (Credit & Debit audit)</span>
                </h4>
                
                {(!selectedCust.transactions || selectedCust.transactions.length === 0) ? (
                  <div className="py-12 text-center text-slate-400 bg-slate-50/50 border border-slate-100 rounded-2xl">
                    <CheckCircle2 className="w-10 h-10 text-emerald-250 mx-auto mb-2" />
                    <p className="text-xs md:text-sm font-semibold text-emerald-700">Account cleared! No logs pending.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                          <th className="p-3 font-bold">Type</th>
                          <th className="p-3 font-bold text-center">Amount</th>
                          <th className="p-3 font-bold">Notes</th>
                          <th className="p-3 font-bold text-right">Date & Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-xs md:text-sm">
                        {[...selectedCust.transactions].reverse().map((tx, idx) => {
                          const dateObj = new Date(tx.date);
                          const dateStr = dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                          const timeStr = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
                          
                          const typeLabel = tx.type === "Sale" ? "Credit Sale" : tx.type === "Debt" ? "Custom Debt" : "Repayment";
                          const typeStyle = tx.type === "Payment" 
                            ? "bg-emerald-50 border-emerald-100 text-emerald-600" 
                            : tx.type === "Debt" 
                              ? "bg-rose-50 border-rose-100 text-rose-600" 
                              : "bg-blue-50 border-blue-100 text-blue-600";
                          const arrow = tx.type === "Payment" ? <ArrowDownLeft className="w-3 h-3 text-emerald-500" /> : <ArrowUpRight className="w-3 h-3 text-rose-500" />;
                          const sign = tx.type === "Payment" ? "-" : "+";
                          
                          const isSaleWithId = tx.type === "Sale" && tx.saleId;
                          
                          return (
                            <tr 
                              key={idx} 
                              onClick={() => { if (isSaleWithId) handleViewBill(tx.saleId); }}
                              className={`transition-colors ${isSaleWithId ? 'cursor-pointer hover:bg-blue-50/35' : 'hover:bg-slate-50/20'}`}
                              title={isSaleWithId ? "Click to view detailed purchase bill" : undefined}
                            >
                              <td className="p-3">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-extrabold border ${typeStyle}`}>
                                  {arrow} {typeLabel}
                                  {isSaleWithId && <FileText className="w-3 h-3 ml-0.5 text-blue-500" />}
                                </span>
                              </td>
                              <td className={`p-3 text-center font-black ${tx.type === "Payment" ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {sign}₹{tx.amount}
                              </td>
                              <td className="p-3 text-slate-500 font-medium max-w-[200px] truncate" title={tx.note}>
                                {tx.note || (tx.type === "Payment" ? "Cash Repayment" : "Credit Purchase")}
                              </td>
                              <td className="p-3 text-right whitespace-nowrap">
                                <span className="font-bold block text-slate-700">{dateStr}</span>
                                <span className="text-[10px] text-slate-400 font-bold">{timeStr}</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
              <h2 className="text-sm md:text-base font-bold">Add Credit Ledger Profile</h2>
              <button onClick={() => setShowAddModal(false)} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Customer Full Name *</label>
                <input 
                  type="text" required placeholder="e.g. Ramesh Kumar"
                  value={newName} onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-bold text-sm"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">WhatsApp Mobile No *</label>
                <input 
                  type="tel" required placeholder="e.g. 9876543210"
                  value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-bold text-sm"
                />
              </div>
              <button 
                type="submit" disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Profile"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Repayment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
              <h2 className="text-sm md:text-base font-bold">Record Repayment</h2>
              <button onClick={() => setShowPayModal(false)} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRecordRepayment} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Amount Received (₹) *</label>
                <input 
                  type="number" required placeholder="Amount in Rupees" min="1" step="0.01"
                  value={repaymentAmount} onChange={(e) => setRepaymentAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-emerald-600 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-black text-base"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Remark / Note</label>
                <input 
                  type="text" placeholder="e.g. Paid in Cash, Google Pay, etc."
                  value={repaymentNote} onChange={(e) => setRepaymentNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-medium text-xs"
                />
              </div>
              <button 
                type="submit" disabled={submitting}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Repayment"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Record Custom Debt Modal */}
      {showDebtModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-rose-600 p-4 flex justify-between items-center text-white">
              <h2 className="text-sm md:text-base font-bold">Record Custom Debt</h2>
              <button onClick={() => setShowDebtModal(false)} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRecordDebt} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Debt Amount (₹) *</label>
                <input 
                  type="number" required placeholder="Amount in Rupees" min="1" step="0.01"
                  value={debtAmount} onChange={(e) => setDebtAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-rose-600 rounded-xl px-3 py-2.5 focus:outline-none focus:border-rose-500 font-black text-base"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Description / Reason</label>
                <input 
                  type="text" placeholder="e.g. Previous Balance carried forward, adjustments"
                  value={debtNote} onChange={(e) => setDebtNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-rose-500 font-medium text-xs"
                />
              </div>
              <button 
                type="submit" disabled={submitting}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Debt Record"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
              <h2 className="text-sm md:text-base font-bold">Configure Customer Credit Limit</h2>
              <button onClick={() => setShowLimitModal(false)} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateLimit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Max Outstanding Limit (₹) *</label>
                <input 
                  type="number" required placeholder="10000" min="0" step="100"
                  value={editLimitAmount} onChange={(e) => setEditLimitAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-slate-800 font-black text-base"
                />
                <p className="text-[10px] text-slate-400 mt-1.5">Warns store manager on quick sell checkout if customer outstanding balance exceeds this limit.</p>
              </div>
              <button 
                type="submit" disabled={submitting}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save limit setting"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Configure Repayment Promise Date Modal */}
      {showPromiseModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
              <h2 className="text-sm md:text-base font-bold">Set Repayment Promise Date</h2>
              <button onClick={() => setShowPromiseModal(false)} className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdatePromiseDate} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 tracking-widest block mb-1.5 uppercase">Promise Date</label>
                <input 
                  type="date"
                  value={editPromiseDate}
                  onChange={(e) => setEditPromiseDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-3 py-2.5 focus:outline-none focus:border-slate-800 font-bold text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1.5">Allows setting a target repayment date. Shows overdue alert if missed by more than 7 days, locking further credit sales.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={async () => {
                    setSubmitting(true);
                    try {
                      const res = await fetch("/api/customer", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          customerId: selectedCust._id,
                          action: "updatePromiseDate",
                          promiseDate: null
                        })
                      });
                      const data = await res.json();
                      if (data.success) {
                        toast.success("Promise date cleared!");
                        setShowPromiseModal(false);
                        await fetchCustomers(true);
                      } else {
                        toast.error(data.error || "Failed to clear promise date");
                      }
                    } catch (e) {
                      toast.error("Network error");
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold transition-all border border-slate-200"
                >
                  Clear Date
                </button>
                <button 
                  type="submit" disabled={submitting}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Promise Date"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detailed Bill View Modal */}
      {viewingBill && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm md:text-base font-bold">Detailed Purchase Bill</h2>
              </div>
              <button 
                onClick={() => setViewingBill(null)} 
                className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-left">
              {/* Header Details */}
              <div className="border-b border-slate-100 pb-3 flex justify-between text-xs text-slate-500 font-semibold">
                <div>
                  <p>Bill ID: <span className="font-extrabold text-slate-800">#{viewingBill._id.toString().slice(-6).toUpperCase()}</span></p>
                  <p className="mt-0.5">Date: {new Date(viewingBill.createdAt || viewingBill.date).toLocaleString('en-IN')}</p>
                </div>
                <div className="text-right">
                  <p>Customer: <span className="font-extrabold text-slate-800 capitalize">{viewingBill.customerName || "Walk-in Customer"}</span></p>
                  {viewingBill.customerPhone && <p className="mt-0.5">Phone: {viewingBill.customerPhone}</p>}
                </div>
              </div>

              {/* Prescription Rx Details if present */}
              {viewingBill.prescriptionDetail?.doctorName && (
                <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl text-xs space-y-1">
                  <p className="font-bold text-indigo-700 uppercase tracking-wider text-[9px]">Rx Doctor Details (Schedule H)</p>
                  <p className="font-semibold text-slate-700">Dr. {viewingBill.prescriptionDetail.doctorName} {viewingBill.prescriptionDetail.doctorRegNo ? `(Reg: ${viewingBill.prescriptionDetail.doctorRegNo})` : ""}</p>
                  <p className="text-slate-500 text-[10px]">Patient: {viewingBill.prescriptionDetail.patientAge ? `${viewingBill.prescriptionDetail.patientAge} Years old / ` : ""}{viewingBill.prescriptionDetail.patientGender}</p>
                </div>
              )}

              {/* Items List */}
              <div className="space-y-2">
                <p className="font-bold text-[10px] uppercase text-slate-455 tracking-wider">Items Purchased:</p>
                <div className="divide-y divide-slate-100 border border-slate-150 rounded-xl overflow-hidden shadow-sm bg-slate-50/50">
                  {viewingBill.items.map((item, idx) => {
                    const discount = item.discountPercent || 0;
                    const gst = item.gstPercent || 0;
                    const mrp = item.mrp || 0;
                    const qty = item.quantity || 0;
                    const discountedMrp = mrp * (1 - discount / 100);
                    const total = qty * discountedMrp;
                    
                    return (
                      <div key={idx} className="p-3 text-xs flex justify-between items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <div className="flex flex-wrap items-center gap-2 text-[9px] text-slate-400 font-bold mt-1">
                            <span>Qty: {qty}</span>
                            <span>•</span>
                            <span>Unit MRP: ₹{mrp}</span>
                            {discount > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-600">Disc: {discount}%</span>
                              </>
                            )}
                            {gst > 0 && (
                              <>
                                <span>•</span>
                                <span>GST: {gst}%</span>
                              </>
                            )}
                          </div>
                        </div>
                        <span className="font-black text-slate-800 text-sm">₹{total.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="border-t border-slate-150 pt-3 space-y-1.5 text-xs text-slate-500 font-semibold">
                {viewingBill.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-extrabold">
                    <span>Total Discount Saved:</span>
                    <span>-₹{viewingBill.totalDiscount.toFixed(2)}</span>
                  </div>
                )}
                {viewingBill.totalTax > 0 && (
                  <div className="flex justify-between">
                    <span>Tax Amount (GST):</span>
                    <span>₹{viewingBill.totalTax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-800 font-black text-sm pt-1.5 border-t border-slate-150">
                  <span>Grand Total Amount:</span>
                  <span className="text-blue-600">₹{viewingBill.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button 
                onClick={() => setViewingBill(null)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-md text-center cursor-pointer"
              >
                Close Bill Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable statement wrapper */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <div ref={printRef} className="p-10 text-black text-xs bg-white w-[210mm] font-sans" style={{ boxSizing: 'border-box' }}>
          {printData && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-black pb-4">
                <div>
                  <h1 className="text-lg font-black uppercase">{shopInfo?.shopName || "MedERP Pharmacy"}</h1>
                  <p className="text-[10px] font-semibold">{shopInfo?.address || "Medical Shop Address"}</p>
                  <p className="text-[10px] font-semibold">Phone: {shopInfo?.phoneNumber || "Shop Phone"}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-700">LEDGER STATEMENT</h2>
                  <p className="text-[10px] mt-1 font-bold">As of: {new Date(printData.date).toLocaleDateString("en-IN")}</p>
                </div>
              </div>

              {/* Customer details */}
              <div className="border border-black p-3 rounded-lg bg-slate-50/50">
                <p className="font-bold text-[10px] uppercase text-slate-500">Customer Details:</p>
                <h3 className="font-extrabold text-sm capitalize mt-0.5">{printData.customer.name}</h3>
                <p className="text-[10px] font-semibold">Mobile: {printData.customer.phone}</p>
                <p className="text-[10px] font-semibold">Credit Limit Configured: ₹{printData.customer.creditLimit || 10000}</p>
              </div>

              {/* Ledger Summary Card */}
              <div className="grid grid-cols-3 gap-4 border border-black p-3 rounded-lg text-center bg-slate-50/20 font-semibold text-[10px]">
                <div>
                  <span className="text-slate-450 block uppercase">Total Credit</span>
                  <span className="text-sm font-black text-rose-600 block mt-1">₹{insights.totalTaken.toFixed(2)}</span>
                </div>
                <div className="border-l border-black">
                  <span className="text-slate-450 block uppercase">Total Repaid</span>
                  <span className="text-sm font-black text-emerald-600 block mt-1">₹{insights.totalPaid.toFixed(2)}</span>
                </div>
                <div className="border-l border-black">
                  <span className="text-slate-450 block uppercase font-black text-slate-800">Final Outstanding Due</span>
                  <span className="text-sm font-black text-rose-600 block mt-1">₹{printData.customer.balance.toFixed(2)}</span>
                </div>
              </div>

              {/* Ledger Table */}
              <table className="w-full text-left border-collapse border border-black text-[10px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-black font-bold uppercase">
                    <th className="p-2 border-r border-black w-8 text-center">S.No</th>
                    <th className="p-2 border-r border-black">Transaction Type</th>
                    <th className="p-2 border-r border-black">Notes</th>
                    <th className="p-2 border-r border-black text-right">Debit (Owed)</th>
                    <th className="p-2 border-r border-black text-right">Credit (Paid)</th>
                    <th className="p-2 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    let runBal = 0;
                    return printData.transactions.map((tx, idx) => {
                      const isSale = tx.type === "Sale" || tx.type === "Debt";
                      const isPayment = tx.type === "Payment";
                      
                      if (isSale) runBal += tx.amount;
                      if (isPayment) runBal -= tx.amount;

                      return (
                        <tr key={idx} className="border-b border-black font-medium">
                          <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                          <td className="p-2 border-r border-black font-bold">
                            {tx.type === "Sale" ? "Credit Purchase" : tx.type === "Debt" ? "Custom Debt Adjust" : "Repayment"}
                          </td>
                          <td className="p-2 border-r border-black text-slate-600 truncate max-w-[180px]">{tx.note || (isPayment ? "Repayment" : "Purchase Invoice")}</td>
                          <td className="p-2 border-r border-black text-right text-rose-600 font-bold">{isSale ? `₹${tx.amount.toFixed(2)}` : "-"}</td>
                          <td className="p-2 border-r border-black text-right text-emerald-600 font-bold">{isPayment ? `₹${tx.amount.toFixed(2)}` : "-"}</td>
                          <td className="p-2 text-right font-black text-slate-800">₹{runBal.toFixed(2)}</td>
                        </tr>
                      );
                    });
                  })()}
                  <tr className="font-bold border-t border-black bg-slate-100">
                    <td colSpan="5" className="p-2 border-r border-black text-right uppercase">Final Outstanding Balance:</td>
                    <td className="p-2 text-right font-black text-sm text-slate-800">
                      ₹{printData.customer.balance.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-12 flex justify-between text-[10px]">
                <div className="border-t border-black w-40 text-center pt-1 font-bold text-slate-500">
                  Customer Signature
                </div>
                <div className="border-t border-black w-40 text-center pt-1 font-bold text-slate-500">
                  Store Seal & Signature
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
