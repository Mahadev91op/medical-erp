"use client";
import { useState, useRef, useEffect } from "react";
import { ScanBarcode, ShoppingCart, Trash2, CheckCircle, Loader2, Camera, IndianRupee, Search, Printer, X } from "lucide-react";
import { formatDate, formatExpiryDate } from "@/lib/formatDate";
import CameraScanner from "@/components/sell/CameraScanner"; 
import toast, { Toaster } from "react-hot-toast";
import { useReactToPrint } from "react-to-print";

const invoiceCalculations = (invoice) => {
  if (!invoice) return { totalTaxable: 0, totalDiscount: 0, totalCGST: 0, totalSGST: 0 };
  let totalTaxable = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  invoice.items.forEach((item) => {
    const qty = item.sellQuantity || item.quantity || 1;
    const mrp = item.mrp || 0;
    const discountPercent = item.discountPercent || 0;
    const gstPercent = item.gstPercent || 0;

    const originalTotal = mrp * qty;
    const discountedTotal = originalTotal * (1 - discountPercent / 100);
    const taxable = discountedTotal / (1 + gstPercent / 100);
    const tax = discountedTotal - taxable;

    totalTaxable += taxable;
    totalDiscount += originalTotal - discountedTotal;
    totalTax += tax;
  });

  return {
    totalTaxable: Number(totalTaxable.toFixed(2)),
    totalDiscount: Number(totalDiscount.toFixed(2)),
    totalCGST: Number((totalTax / 2).toFixed(2)),
    totalSGST: Number((totalTax / 2).toFixed(2))
  };
};

export default function QuickSell() {
  const [barcode, setBarcode] = useState("");
  const [manualSearch, setManualSearch] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState("Cash"); 
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef(null);

  const [completedInvoice, setCompletedInvoice] = useState(null);
  const [shopInfo, setShopInfo] = useState(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [waPhone, setWaPhone] = useState("");

  const [searchQtys, setSearchQtys] = useState({});
  const [isPrescriptionRequired, setIsPrescriptionRequired] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [doctorRegNo, setDoctorRegNo] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Male");
  
  const [offlineQueue, setOfflineQueue] = useState([]);
  const [dbCustomers, setDbCustomers] = useState([]);
  const [selectedDbCustomer, setSelectedDbCustomer] = useState(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [custSearch, setCustSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const fetchDbCustomers = async () => {
    try {
      const res = await fetch("/api/customer");
      const data = await res.json();
      if (data.success) {
        setDbCustomers(data.customers);
      }
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    }
  };

  useEffect(() => {
    const queue = JSON.parse(localStorage.getItem("offline_sales_queue") || "[]");
    setTimeout(() => {
      setOfflineQueue(queue);
    }, 0);
  }, []);

  // Background offline sales sync worker
  useEffect(() => {
    const syncOfflineQueue = async () => {
      if (!navigator.onLine) return;
      const queue = JSON.parse(localStorage.getItem("offline_sales_queue") || "[]");
      if (queue.length === 0) return;

      const toastId = toast.loading(`Syncing ${queue.length} offline bills to server...`);
      let successCount = 0;
      let remainingQueue = [...queue];

      for (const sale of queue) {
        try {
          const res = await fetch("/api/sell", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sale)
          });
          const data = await res.json();
          if (data.success) {
            successCount++;
            remainingQueue = remainingQueue.filter(item => item.id !== sale.id);
            localStorage.setItem("offline_sales_queue", JSON.stringify(remainingQueue));
            setOfflineQueue(remainingQueue);
          } else {
            console.error("Failed to sync offline sale:", data.error);
          }
        } catch (err) {
          console.error("Sync error:", err);
          break; // Stop syncing if network error happens again
        }
      }

      if (successCount > 0) {
        toast.success(`Synced ${successCount} offline bills to database successfully!`, { id: toastId });
      } else {
        toast.dismiss(toastId);
      }
    };

    const interval = setInterval(syncOfflineQueue, 10000);
    window.addEventListener("online", syncOfflineQueue);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", syncOfflineQueue);
    };
  }, []);

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
    setTimeout(() => {
      fetchDbCustomers();
    }, 0);
  }, []);

  const invoicePrintRef = useRef(null);
  
  const handlePrintInvoice = useReactToPrint({
    contentRef: invoicePrintRef,
    documentTitle: completedInvoice ? `Invoice_${completedInvoice.billNumber}` : 'Invoice',
  });

  useEffect(() => {
    if (!showCamera) {
      inputRef.current?.focus();
    }
  }, [showCamera]);

  const performSearch = async (query, isManualClick = false) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/medicine?search=${encodeURIComponent(query)}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.medicines);
        if (isManualClick && data.medicines.length === 0) {
          toast.error("No medicine found with this name");
        }
      }
    } catch (error) {
      if (isManualClick) {
        toast.error("Search failed");
      }
      console.error("Search error:", error);
    }
    setLoading(false);
  };

  // Debounced manual search for medicine suggestions as user types
  useEffect(() => {
    if (!manualSearch.trim()) {
      setTimeout(() => {
        setSearchResults([]);
      }, 0);
      return;
    }
    const timer = setTimeout(() => {
      performSearch(manualSearch, false);
    }, 250); // 250ms debounce
    return () => clearTimeout(timer);
  }, [manualSearch]);

  const processBarcode = async (scannedCode) => {
    if (!scannedCode.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/medicine/search?barcode=${encodeURIComponent(scannedCode.trim())}`);
      const data = await res.json();
      
      if (data.success) {
        if (data.medicine.quantity <= 0) {
          setSearchResults([data.medicine]);
          toast.error(`${data.medicine.name} is completely Sold Out!`);
        } else {
          addToCart(data.medicine);
        }
      } else {
        toast.error(data.error || "Medicine not found."); 
      }
    } catch (error) {
      toast.error("Error fetching medicine!");
    }
    
    setBarcode("");
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleManualSearch = async (e) => {
    e.preventDefault();
    performSearch(manualSearch, true);
  };

  const addToCart = (med, customQty = 1) => {
    // Expired Medicine Block
    if (med.expiryDate && new Date(med.expiryDate) < new Date()) {
      toast.error(`Cannot sell ${med.name}! This medicine batch has EXPIRED (${formatExpiryDate(med.expiryDate)}).`);
      return;
    }

    if (med.quantity <= 0) {
      toast.error(`${med.name} is out of stock!`);
      return; 
    } 

    const existingItem = cart.find(item => item._id === med._id);
    
    if (existingItem) {
      const newQty = existingItem.sellQuantity + customQty;
      if (newQty <= med.quantity) {
        setCart(cart.map(item => item._id === med._id ? { ...item, sellQuantity: newQty } : item));
        toast.success(`Quantity increased for ${med.name}`);
      } else {
        toast.error(`Cannot add more! Insufficient stock. Available: ${med.quantity}`);
      }
    } else {
      if (customQty <= med.quantity) {
        setCart([...cart, { ...med, sellQuantity: customQty, discountPercent: 0, gstPercent: 0 }]);
        toast.success(`${med.name} added to cart`);
      } else {
        toast.error(`Cannot add! Insufficient stock. Available: ${med.quantity}`);
      }
    }
    setSearchResults([]);
    setManualSearch("");
    setSearchQtys({});
  };

  const removeItem = (id) => {
    setCart(cart.filter(item => item._id !== id));
    inputRef.current?.focus();
  };

  const totalCartAmount = Number(cart.reduce((total, item) => total + ((item.mrp || 0) * item.sellQuantity * (1 - (item.discountPercent || 0) / 100)), 0).toFixed(2));

  const triggerWhatsAppSend = (invoice, phone) => {
    let cleanedPhone = phone.replace(/\D/g, "");
    if (cleanedPhone.length === 10) {
      cleanedPhone = "91" + cleanedPhone;
    }
    
    if (cleanedPhone.length < 10) {
      toast.error("Invalid WhatsApp phone number!");
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
      const discount = item.discountPercent || 0;
      const gst = item.gstPercent || 0;
      const netUnit = item.mrp * (1 - discount / 100);
      itemsText += `• ${item.name} (${item.sellQuantity} x ₹${item.mrp})`;
      if (discount > 0 || gst > 0) {
        itemsText += `\n  _Disc: ${discount}% | GST: ${gst}%_`;
      }
      itemsText += ` = ₹${(item.sellQuantity * netUnit).toFixed(2)}\n`;
    });
    
    const cal = invoiceCalculations(invoice);

    let message = `*✨ INVOICE / BILL DETAILS ✨*\n`;
    message += `-----------------------------\n`;
    message += `*Store:* ${shopName}\n`;
    if (shopPhone) message += `*Phone:* ${shopPhone}\n`;
    message += `*Invoice No:* #${billNo}\n`;
    message += `*Date:* ${dateStr}\n`;
    message += `*Payment Method:* ${payMode}\n`;
    if (invoice.customerName) message += `*Customer Name:* ${invoice.customerName}\n`;
    if (invoice.prescriptionDetail?.doctorName) {
      message += `*Doctor:* ${invoice.prescriptionDetail.doctorName}\n`;
    }
    message += `-----------------------------\n`;
    message += `*Items:*\n`;
    message += `${itemsText}`;
    message += `-----------------------------\n`;
    if (cal.totalDiscount > 0) message += `*Discount Saved:* ₹${cal.totalDiscount}\n`;
    message += `*Taxable Value:* ₹${cal.totalTaxable}\n`;
    if (cal.totalCGST > 0) {
      message += `*CGST:* ₹${cal.totalCGST}\n`;
      message += `*SGST:* ₹${cal.totalSGST}\n`;
    }
    message += `-----------------------------\n`;
    message += `*Grand Total: ₹${totalAmount}*\n\n`;
    message += `_Disclaimer: This invoice is generated using MedERP. Tax slabs, dosage, and stock parameters are configured and verified by the licensed pharmacist. DevSamp Technologies holds no liability for tax rate errors or wrong drug dispensation._`;
    const waUrl = `https://wa.me/${cleanedPhone}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  const getCustomerLockDetails = (cust) => {
    if (!cust || cust.balance <= 0) return { isLocked: false, reason: "", stars: 5 };
    
    let oldestDebtDays = 0;
    let oldestDebtDate = null;
    if (cust.transactions && cust.transactions.length > 0) {
      const debts = cust.transactions.filter(tx => tx.type === "Sale" || tx.type === "Debt");
      if (debts.length > 0) {
        const sortedDebts = [...debts].sort((a, b) => new Date(a.date) - new Date(b.date));
        oldestDebtDate = new Date(sortedDebts[0].date);
        const diffTime = Math.abs(new Date() - oldestDebtDate);
        oldestDebtDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    if (!oldestDebtDate && cust.createdAt) {
      oldestDebtDate = new Date(cust.createdAt);
      const diffTime = Math.abs(new Date() - oldestDebtDate);
      oldestDebtDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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
    
    let stars = 5;
    if (oldestDebtDays > 60) stars = 2;
    else if (oldestDebtDays > 30) stars = 3.5;
    else if (oldestDebtDays > 15) stars = 4.5;
    if (cust.balance > (cust.creditLimit || 10000)) stars = Math.max(1, stars - 1);
    if (promiseOverdueDays > 0) stars = Math.max(1, stars - 1);
    
    return { isLocked, reason, stars };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    // Check credit lock status
    if (paymentMethod === "Udhaar" && selectedDbCustomer) {
      const lockDetails = getCustomerLockDetails(selectedDbCustomer);
      if (lockDetails.isLocked) {
        toast.error(`❌ Checkout Blocked! Credit is locked for ${selectedDbCustomer.name} due to: ${lockDetails.reason}`);
        return;
      }
    }

    setCheckoutLoading(true);
    
    const mappedItems = cart.map(item => ({
      _id: item._id,
      name: item.name,
      sellQuantity: item.sellQuantity,
      mrp: item.mrp,
      batch: item.batch,
      expiryDate: item.expiryDate,
      discountPercent: item.discountPercent || 0,
      gstPercent: item.gstPercent || 0
    }));

    const prescriptionDetail = isPrescriptionRequired ? {
      doctorName,
      doctorRegNo,
      patientAge: parseInt(patientAge) || null,
      patientGender
    } : null;

    try {
      const res = await fetch("/api/sell", {
        method: "POST",
        body: JSON.stringify({ 
          cartItems: mappedItems, 
          paymentMethod, 
          customerName, 
          customerPhone,
          prescriptionDetail
        }), 
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`✅ Sale Complete! Bill: ₹${data.totalAmount}`);
        const newInvoice = {
          billNumber: data.saleId ? data.saleId.toString().slice(-6).toUpperCase() : "N/A",
          date: new Date().toISOString(),
          items: mappedItems,
          totalAmount: data.totalAmount,
          paymentMethod,
          customerName,
          customerPhone,
          prescriptionDetail
        };
        
        setCompletedInvoice(newInvoice);
        setWaPhone(customerPhone);
        
        setCart([]); 
        setPaymentMethod("Cash");
        setCustomerName("");
        setCustomerPhone("");
        setIsPrescriptionRequired(false);
        setDoctorName("");
        setDoctorRegNo("");
        setPatientAge("");
        setPatientGender("Male");
        setSelectedDbCustomer(null);
        setIsNewCustomer(false);
        setCustSearch("");
        fetchDbCustomers();
      } else {
        toast.error(data.error || "Error during checkout.");
      }
    } catch (error) {
      // Offline fallback
      const totalAmount = cart.reduce((total, item) => {
        const discount = item.discountPercent || 0;
        return total + ((item.mrp || 0) * item.sellQuantity * (1 - discount / 100));
      }, 0);

      const newInvoice = {
        billNumber: "OFF-" + Date.now().toString().slice(-6),
        date: new Date().toISOString(),
        items: mappedItems,
        totalAmount: Number(totalAmount.toFixed(2)),
        paymentMethod,
        customerName,
        customerPhone,
        prescriptionDetail,
        isOffline: true
      };

      const currentQueue = JSON.parse(localStorage.getItem("offline_sales_queue") || "[]");
      const offlineSale = {
        id: "off_" + Date.now() + "_" + Math.random().toString(36).substring(2),
        cartItems: mappedItems,
        paymentMethod,
        customerName,
        customerPhone,
        prescriptionDetail
      };
      
      const newQueue = [...currentQueue, offlineSale];
      localStorage.setItem("offline_sales_queue", JSON.stringify(newQueue));
      setOfflineQueue(newQueue);

      toast.success("🔴 Device is Offline! Bill saved locally in offline queue.");
      
      setCompletedInvoice(newInvoice);
      setWaPhone(customerPhone);
      
      setCart([]); 
      setPaymentMethod("Cash");
      setCustomerName("");
      setCustomerPhone("");
      setIsPrescriptionRequired(false);
      setDoctorName("");
      setDoctorRegNo("");
      setPatientAge("");
      setPatientGender("Male");
      setSelectedDbCustomer(null);
      setIsNewCustomer(false);
      setCustSearch("");
    }
    setCheckoutLoading(false);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
      <Toaster position="top-center" reverseOrder={false} />

      {showCamera && (
        <CameraScanner 
          onScan={(decoded) => { setShowCamera(false); processBarcode(decoded); }} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4">
        <div className="flex items-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 shrink-0 border border-blue-100 shadow-sm">
            <ScanBarcode className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-slate-800 leading-tight">Fast Billing & Outward</h1>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium mt-0.5">Scan barcode to deduct stock.</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowCamera(true)}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center justify-center transition-all shadow-lg w-full md:w-auto shrink-0"
        >
          <Camera className="w-4 h-4 md:w-4 md:h-4 mr-2" /> Use Phone Camera
        </button>
      </div>

      {/* Offline sync queue alert */}
      {offlineQueue.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs md:text-sm font-bold px-4 py-3 rounded-xl flex items-center justify-between shadow-sm animate-pulse">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping shrink-0" />
            Offline Queue: {offlineQueue.length} sales pending server sync
          </span>
          <span className="text-[10px] uppercase font-bold text-rose-500">Syncing automatically when online</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          
          {/* Barcode & Manual Search Box */}
          <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex gap-3 md:gap-4 flex-col md:flex-row">
            <form onSubmit={(e) => { e.preventDefault(); processBarcode(barcode); }} className="flex-1">
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-3">Scan Barcode</label>
              <div className="relative">
                <input 
                  ref={inputRef} type="text" placeholder="Focus here to scan..." 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-4 py-3 md:py-4 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm md:text-base font-semibold"
                  value={barcode} onChange={(e) => setBarcode(e.target.value)} 
                />
                <ScanBarcode className="absolute left-3 md:left-4 top-3 md:top-4.5 text-slate-400 w-5 h-5 md:w-6 md:h-6" />
                {loading && <Loader2 className="absolute right-3 md:right-4 top-3 md:top-4.5 text-blue-500 w-5 h-5 md:w-6 md:h-6 animate-spin" />}
              </div>
            </form>

            <form onSubmit={handleManualSearch} className="flex-1">
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 md:mb-3">Manual Search</label>
              <div className="flex">
                <input 
                  type="text" placeholder="Medicine name..." 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-l-xl md:rounded-l-2xl px-3 md:px-4 py-3 md:py-4 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm md:text-base font-semibold"
                  value={manualSearch} onChange={(e) => setManualSearch(e.target.value)} 
                />
                <button type="submit" className="bg-blue-600 text-white px-4 md:px-5 rounded-r-xl md:rounded-r-2xl hover:bg-blue-700 transition-colors">
                  <Search className="w-4 h-4 md:w-5 md:h-5"/>
                </button>
              </div>
            </form>
          </div>

          {/* Search Results Display */}
          {searchResults.length > 0 && (
            <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-sm border border-blue-100 animate-in fade-in duration-200">
              <h3 className="text-xs md:text-sm font-bold mb-2 md:mb-3 text-slate-700">Search Results:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
                {searchResults.map(med => (
                  <div key={med._id} className="flex justify-between items-center bg-slate-50 p-2.5 md:p-3 rounded-xl border border-slate-200 hover:border-blue-200 transition-colors">
                    <div className="flex-1 pr-2 md:pr-3 min-w-0">
                      <p className="font-bold text-xs md:text-sm text-slate-800 truncate">{med.name}</p>
                      
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[8px] md:text-[9px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded shadow-sm">Stock: {med.quantity}</span>
                        <span className="text-[8px] md:text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded shadow-sm">₹{med.mrp}</span>
                        <span className="text-[8px] md:text-[9px] font-bold bg-rose-50 border border-rose-100 text-rose-600 px-1.5 py-0.5 rounded shadow-sm">Exp: {formatExpiryDate(med.expiryDate)}</span>
                        {med.rackNumber && <span className="text-[8px] md:text-[9px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded shadow-sm">Rack: {med.rackNumber}</span>}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 shrink-0">
                      {med.quantity > 0 && (
                        <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-white shadow-sm">
                          <button
                            type="button"
                            onClick={() => {
                              const current = searchQtys[med._id] || 1;
                              if (current > 1) {
                                setSearchQtys({ ...searchQtys, [med._id]: current - 1 });
                              }
                            }}
                            className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded text-xs focus:outline-none"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={med.quantity}
                            value={searchQtys[med._id] || 1}
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(med.quantity, parseInt(e.target.value) || 1));
                              setSearchQtys({ ...searchQtys, [med._id]: val });
                            }}
                            className="w-8 text-center font-bold text-slate-800 focus:outline-none text-[10px] bg-transparent border-none p-0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const current = searchQtys[med._id] || 1;
                              if (current < med.quantity) {
                                setSearchQtys({ ...searchQtys, [med._id]: current + 1 });
                              }
                            }}
                            className="w-5 h-5 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded text-xs focus:outline-none"
                          >
                            +
                          </button>
                        </div>
                      )}

                      {med.quantity <= 0 ? (
                        <button disabled className="bg-rose-100 text-rose-700 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold shrink-0 opacity-80 cursor-not-allowed border border-rose-200">
                          Sold Out
                        </button>
                      ) : (
                        <button onClick={() => addToCart(med, searchQtys[med._id] || 1)} className="bg-blue-600 text-white px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold hover:bg-blue-700 transition-colors shrink-0">
                          + Add
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cart Display */}
          <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 min-h-[250px] md:min-h-[300px]">
            <h2 className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-wider mb-3 md:mb-4 flex items-center">
              <ShoppingCart className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" /> Current Cart
            </h2>
            
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 md:h-48 text-slate-400">
                <ScanBarcode className="w-10 h-10 md:w-12 md:h-12 mb-2 md:mb-3 opacity-20" />
                <p className="font-medium text-xs md:text-sm">Cart is empty. Scan a barcode.</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {cart.map((item) => {
                  const discPercent = item.discountPercent || 0;
                  const discountedPrice = (item.mrp || 0) * (1 - discPercent / 100);
                  const itemTotal = discountedPrice * item.sellQuantity;
                  
                  return (
                    <div key={item._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-slate-50/50 rounded-xl md:rounded-2xl border border-slate-100 gap-3 sm:gap-0 animate-in fade-in duration-200">
                      <div className="flex-1 pr-0 sm:pr-4 min-w-0">
                        <p className="font-bold text-slate-800 text-sm md:text-lg truncate">{item.name}</p>
                        
                        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1 mb-1.5 md:mb-2">
                          <span className="text-[9px] md:text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-1.5 md:px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Batch: {item.batch}</span>
                          <span className="text-[9px] md:text-[10px] font-bold bg-rose-50 border border-rose-100 text-rose-600 px-1.5 md:px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Exp: {formatExpiryDate(item.expiryDate)}</span>
                          {item.rackNumber && <span className="text-[9px] md:text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 md:px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Rack: {item.rackNumber}</span>}
                          {item.distributor && <span className="text-[9px] md:text-[10px] font-bold bg-amber-50 border border-amber-100 text-amber-600 px-1.5 md:px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)] max-w-[100px] md:max-w-[120px] truncate">Dist: {item.distributor}</span>}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 mt-2">
                          {/* Unit price display */}
                          <div className="text-xs md:text-sm text-blue-600 font-extrabold flex items-center">
                            {discPercent > 0 ? (
                              <>
                                <span className="line-through text-slate-400 mr-1.5 font-semibold">₹{item.mrp || 0}</span>
                                <span>₹{discountedPrice.toFixed(2)}</span>
                              </>
                            ) : (
                              `₹${item.mrp || 0}`
                            )} <span className="text-[9px] text-slate-400 font-bold ml-1">/ unit</span>
                          </div>

                          {/* GST Slab Selector */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">GST:</span>
                            <select
                              value={item.gstPercent || 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setCart(cart.map(c => c._id === item._id ? { ...c, gstPercent: val } : c));
                              }}
                              className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded focus:outline-none cursor-pointer h-6"
                            >
                              <option value={0}>0%</option>
                              <option value={5}>5%</option>
                              <option value={12}>12%</option>
                              <option value={18}>18%</option>
                            </select>
                          </div>

                          {/* Discount Input */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Disc %:</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={item.discountPercent || ""}
                              onChange={(e) => {
                                const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                                setCart(cart.map(c => c._id === item._id ? { ...c, discountPercent: val } : c));
                              }}
                              className="bg-white border border-slate-200 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 rounded focus:outline-none w-10 text-center h-6"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-3 md:space-x-4 shrink-0 bg-white sm:bg-transparent p-2 sm:p-0 rounded-lg sm:rounded-none border sm:border-none border-slate-100">
                        <div className="flex items-center space-x-1.5 bg-slate-50 sm:bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.sellQuantity > 1) {
                                setCart(cart.map(c => c._id === item._id ? { ...c, sellQuantity: c.sellQuantity - 1 } : c));
                              } else {
                                removeItem(item._id);
                              }
                            }}
                            className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg transition-colors text-sm focus:outline-none"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.quantity}
                            value={item.sellQuantity}
                            onChange={(e) => {
                              const val = Math.max(1, Math.min(item.quantity, parseInt(e.target.value) || 1));
                              setCart(cart.map(c => c._id === item._id ? { ...c, sellQuantity: val } : c));
                            }}
                            className="w-10 text-center font-bold text-slate-800 focus:outline-none text-xs md:text-sm bg-transparent border-none p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (item.sellQuantity < item.quantity) {
                                setCart(cart.map(c => c._id === item._id ? { ...c, sellQuantity: c.sellQuantity + 1 } : c));
                              } else {
                                toast.error("Cannot add more! Insufficient stock.");
                              }
                            }}
                            className="w-7 h-7 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg transition-colors text-sm focus:outline-none"
                          >
                            +
                          </button>
                        </div>
                        <div className="font-bold text-base md:text-lg text-slate-800 min-w-[50px] md:min-w-[60px] text-right">
                          ₹{itemTotal.toFixed(2)}
                        </div>
                        <button onClick={() => removeItem(item._id)} className="p-1.5 md:p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg md:rounded-xl transition-colors">
                          <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Checkout Sidebar */}
        <div className="bg-slate-800 p-5 md:p-8 rounded-[24px] md:rounded-3xl shadow-lg flex flex-col justify-between text-white lg:h-fit lg:sticky lg:top-24 gap-6">
          <div>
            <h2 className="text-base md:text-lg font-bold text-blue-400 mb-4 md:mb-6 flex items-center border-b border-slate-700 pb-3 md:pb-4">
              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" /> Summary
            </h2>
            
            <div className="flex justify-between items-center mb-3 md:mb-4">
              <span className="text-slate-400 font-medium text-xs md:text-base">Total Items</span>
              <span className="text-lg md:text-xl font-bold">{cart.reduce((total, item) => total + item.sellQuantity, 0)}</span>
            </div>

            <div className="flex justify-between items-center mb-5 md:mb-6 pt-3 md:pt-4 border-t border-slate-700">
              <span className="text-slate-300 font-bold text-sm md:text-base">Total Amount</span>
              <span className="text-2xl md:text-3xl font-bold text-blue-400 flex items-center">
                <IndianRupee className="w-5 h-5 md:w-6 md:h-6 mr-0.5 md:mr-1" /> {totalCartAmount}
              </span>
            </div>

            <div className="mb-4">
              <label className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-bold mb-1.5 md:mb-2 block">Payment Method</label>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-700 border-none text-white rounded-xl px-3 md:px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-xs md:text-base font-bold"
              >
                <option value="Cash">💵 Cash</option>
                <option value="UPI">📱 UPI / PhonePe</option>
                <option value="Card">💳 Card</option>
                <option value="Udhaar">📒 Credit (Credit Book)</option>
              </select>
            </div>

            {paymentMethod === "Udhaar" ? (
              <div 
                className="mb-4 space-y-4 p-4 bg-slate-750/30 rounded-2xl border border-slate-700/50 transition-all relative text-left"
                onMouseLeave={() => setShowSuggestions(false)}
              >
                <div>
                  <label className="text-[10px] md:text-xs text-slate-350 uppercase tracking-wider font-bold mb-1.5 block">Search & Select Customer *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type Name or Mobile No..."
                      value={custSearch}
                      onChange={(e) => {
                        setCustSearch(e.target.value);
                        setShowSuggestions(true);
                        if (!e.target.value) {
                          setSelectedDbCustomer(null);
                          setCustomerName("");
                          setCustomerPhone("");
                          setIsNewCustomer(false);
                        }
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-semibold placeholder-slate-500"
                    />
                    {custSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustSearch("");
                          setSelectedDbCustomer(null);
                          setCustomerName("");
                          setCustomerPhone("");
                          setIsNewCustomer(false);
                          setShowSuggestions(false);
                        }}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Suggestions list */}
                  {showSuggestions && (
                    <div className="absolute left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl mt-1 shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-700 text-left">
                      {dbCustomers
                        .filter(c => 
                          c.name.toLowerCase().includes(custSearch.toLowerCase()) || 
                          c.phone.includes(custSearch)
                        )
                        .slice(0, 8)
                        .map(c => {
                          const lockDetails = getCustomerLockDetails(c);
                          return (
                            <div
                              key={c._id}
                              onClick={() => {
                                setSelectedDbCustomer(c);
                                setCustomerName(c.name);
                                setCustomerPhone(c.phone);
                                setCustSearch(`${c.name} (${c.phone})`);
                                setIsNewCustomer(false);
                                setShowSuggestions(false);
                              }}
                              className="p-3 hover:bg-slate-750 cursor-pointer text-xs flex justify-between items-center transition-colors text-slate-200"
                            >
                              <div>
                                <p className="font-bold text-white flex items-center gap-1">
                                  <span>👤 {c.name}</span>
                                  {lockDetails.isLocked && <span className="text-[10px] text-rose-400 shrink-0 animate-pulse" title="Credit Locked">🔒</span>}
                                  <span className="text-amber-400 font-normal text-[10px] ml-1">{"★".repeat(Math.floor(lockDetails.stars))}</span>
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Mobile: {c.phone}</p>
                              </div>
                              <span className="text-[10px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-extrabold shrink-0">
                                Dues: ₹{c.balance.toLocaleString("en-IN")}
                              </span>
                            </div>
                          );
                        })}
                      
                      {custSearch.trim().length > 0 && (
                        <div
                          onClick={() => {
                            setIsNewCustomer(true);
                            setSelectedDbCustomer(null);
                            const isNum = /^\d+$/.test(custSearch.trim());
                            if (isNum) {
                              setCustomerPhone(custSearch.trim());
                              setCustomerName("");
                            } else {
                              setCustomerName(custSearch.trim());
                              setCustomerPhone("");
                            }
                            setShowSuggestions(false);
                          }}
                          className="p-3 hover:bg-slate-750 cursor-pointer text-xs text-blue-400 font-bold flex items-center gap-1.5 transition-colors border-t border-slate-700"
                        >
                           <span>➕ Create New Profile for &quot;{custSearch}&quot;</span>
                        </div>
                      )}

                      {dbCustomers.filter(c => 
                        c.name.toLowerCase().includes(custSearch.toLowerCase()) || 
                        c.phone.includes(custSearch)
                      ).length === 0 && !custSearch.trim() && (
                        <div className="p-3 text-slate-500 text-xs text-center">Type name/number to search...</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Show details of selected customer */}
                {selectedDbCustomer && (
                  <div className="bg-slate-800/80 p-3.5 rounded-xl space-y-2.5 border border-slate-700 text-xs text-slate-200 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center text-[10px] text-slate-450 uppercase font-black">
                      <span>Ledger Status</span>
                      <span className={selectedDbCustomer.balance > (selectedDbCustomer.creditLimit || 10000) ? "text-rose-400 font-black" : "text-emerald-400 font-black"}>
                        {selectedDbCustomer.balance > (selectedDbCustomer.creditLimit || 10000) ? "⚠️ Limit Exceeded" : "🟢 Under Limit"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Current Outstanding:</span>
                      <span className="font-extrabold text-white">₹{selectedDbCustomer.balance.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Configured Limit:</span>
                      <span className="font-semibold text-slate-350">₹{(selectedDbCustomer.creditLimit || 10000).toLocaleString("en-IN")}</span>
                    </div>
                    
                    {/* Utilization Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            selectedDbCustomer.balance > (selectedDbCustomer.creditLimit || 10000) 
                              ? 'bg-rose-500' 
                              : (selectedDbCustomer.balance / (selectedDbCustomer.creditLimit || 10000)) > 0.8 
                                ? 'bg-amber-500' 
                                : 'bg-emerald-500'
                          }`} 
                          style={{ width: `${Math.min(100, (selectedDbCustomer.balance / (selectedDbCustomer.creditLimit || 10000)) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Warning if total will exceed limit */}
                    {selectedDbCustomer.balance + totalCartAmount > (selectedDbCustomer.creditLimit || 10000) && (
                      <div className="bg-rose-500/10 border border-rose-500/30 text-rose-350 p-2.5 rounded-lg font-bold text-[10px] mt-1.5 animate-pulse">
                        ⚠️ Limit Warning: Total outstanding dues will reach ₹{selectedDbCustomer.balance + totalCartAmount}, exceeding the limit of ₹{selectedDbCustomer.creditLimit || 10000}!
                      </div>
                    )}

                    {/* Dynamic Lock details and Trust Stars */}
                    {(() => {
                      const lockDetails = getCustomerLockDetails(selectedDbCustomer);
                      const fullStars = Math.floor(lockDetails.stars);
                      const hasHalf = lockDetails.stars % 1 !== 0;
                      const emptyStars = 5 - Math.ceil(lockDetails.stars);
                      return (
                        <div className="space-y-2 border-t border-slate-700/50 pt-2.5 text-[11px]">
                          <div className="flex justify-between items-center">
                            <span>Customer Rating:</span>
                            <span className="text-amber-400 font-extrabold flex items-center gap-0.5">
                              {"★".repeat(fullStars)}
                              {hasHalf ? "½" : ""}
                              {"☆".repeat(emptyStars)}
                              <span className="text-slate-400 text-[10px] ml-1 font-semibold">({lockDetails.stars}/5)</span>
                            </span>
                          </div>
                          {selectedDbCustomer.promiseDate && (
                            <div className="flex justify-between items-center">
                              <span>Repayment Promise Date:</span>
                              <span className={`font-bold ${new Date(selectedDbCustomer.promiseDate) < new Date() ? 'text-rose-400 font-black animate-pulse' : 'text-slate-300'}`}>
                                {new Date(selectedDbCustomer.promiseDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                {new Date(selectedDbCustomer.promiseDate) < new Date() && " (Overdue)"}
                              </span>
                            </div>
                          )}
                          {lockDetails.isLocked && (
                            <div className="bg-rose-500/20 border border-rose-500/40 text-rose-350 p-2.5 rounded-lg font-extrabold text-[10px] mt-2 flex items-start gap-1.5">
                              <span className="animate-bounce mt-0.5">🔒</span>
                              <div>
                                <p className="uppercase text-rose-400 font-black">Credit Checkout Locked</p>
                                <p className="font-semibold text-slate-300 mt-0.5">{lockDetails.reason}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* If creating new customer */}
                {isNewCustomer && (
                  <div className="space-y-3 pt-2.5 border-t border-slate-700/50 animate-in slide-in-from-top-2 duration-200">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Customer Name *</label>
                      <input
                        type="text"
                        placeholder="Ramesh Kumar"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full bg-slate-800 border-none text-white rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">New Customer Phone (WhatsApp) *</label>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-slate-800 border-none text-white rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm font-semibold"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-bold mb-1.5 md:mb-2 block">Customer Name</label>
                  <input
                    type="text"
                    placeholder="Optional Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full border-none text-white rounded-xl px-3 md:px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm placeholder-slate-500 font-semibold bg-slate-700"
                  />
                </div>

                <div className="mb-4">
                  <label className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-bold mb-1.5 md:mb-2 block">Customer Phone (WhatsApp)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full border-none text-white rounded-xl px-3 md:px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm placeholder-slate-500 font-semibold bg-slate-700"
                  />
                </div>
              </>
            )}

            {/* Prescription Drug Section */}
            <div className="mb-4">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input 
                  type="checkbox"
                  checked={isPrescriptionRequired}
                  onChange={(e) => setIsPrescriptionRequired(e.target.checked)}
                  className="rounded bg-slate-750 border-none text-blue-500 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-300 select-none">Schedule H / Rx Details</span>
              </label>

              {isPrescriptionRequired && (
                <div className="space-y-2 bg-slate-700/50 p-3 rounded-xl border border-slate-750 animate-in fade-in duration-200">
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Doctor Name</label>
                    <input
                      type="text"
                      placeholder="Dr. John Doe"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="w-full bg-slate-700 border-none text-white rounded-lg px-2.5 py-1.5 text-xs placeholder-slate-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Doctor Reg No.</label>
                    <input
                      type="text"
                      placeholder="Reg No"
                      value={doctorRegNo}
                      onChange={(e) => setDoctorRegNo(e.target.value)}
                      className="w-full bg-slate-700 border-none text-white rounded-lg px-2.5 py-1.5 text-xs placeholder-slate-500 font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Patient Age</label>
                      <input
                        type="number"
                        placeholder="Age"
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="w-full bg-slate-700 border-none text-white rounded-lg px-2.5 py-1.5 text-xs placeholder-slate-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mb-1 block">Gender</label>
                      <select
                        value={patientGender}
                        onChange={(e) => setPatientGender(e.target.value)}
                        className="w-full bg-slate-700 border-none text-white rounded-lg px-2 py-1.5 text-xs outline-none cursor-pointer font-semibold"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={handleCheckout} 
            disabled={cart.length === 0 || checkoutLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm md:text-lg px-4 py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkoutLoading ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : "Complete Sale"}
          </button>
        </div>
      </div>

      {/* 5. Thermal Receipt Print Modal */}
      {completedInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-blue-400" />
                <h2 className="text-sm md:text-base font-bold">Billing Completed</h2>
              </div>
              <button 
                onClick={() => setCompletedInvoice(null)} 
                className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Scrollable Receipt Preview */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50 flex flex-col items-center">
              <p className="text-xs text-slate-500 font-medium mb-4">Receipt generated. You can print a thermal ticket below.</p>
              
              {/* Receipt Ticket Box */}
              <div className="bg-white shadow-md border border-slate-200 rounded-xl p-4 w-[280px] text-slate-800 text-xs font-mono">
                <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
                  <h3 className="font-extrabold text-sm uppercase">{shopInfo?.shopName || "MedERP Pharmacy"}</h3>
                  {shopInfo?.address && <p className="text-[10px] text-slate-500 mt-1">{shopInfo.address}</p>}
                  {shopInfo?.phoneNumber && <p className="text-[10px] text-slate-500 mt-0.5">Phone: {shopInfo.phoneNumber}</p>}
                  <p className="text-[9px] text-slate-400 mt-1">Date: {new Date(completedInvoice.date).toLocaleString('en-IN')}</p>
                </div>
                
                <div className="space-y-1 pb-3 mb-3 border-b border-dashed border-slate-300">
                  <p className="text-[10px]"><span className="text-slate-400">Invoice:</span> #{completedInvoice.billNumber}</p>
                  <p className="text-[10px]"><span className="text-slate-400">Pay Mode:</span> {completedInvoice.paymentMethod}</p>
                  {completedInvoice.customerName && <p className="text-[10px]"><span className="text-slate-400">Customer:</span> {completedInvoice.customerName}</p>}
                  {completedInvoice.customerPhone && <p className="text-[10px]"><span className="text-slate-400">Phone:</span> {completedInvoice.customerPhone}</p>}
                  {completedInvoice.prescriptionDetail?.doctorName && (
                    <div className="text-[9px] text-indigo-650 bg-indigo-50/50 p-1.5 rounded mt-1.5 border border-indigo-100/30">
                      <p className="font-bold">Rx details (Schedule H)</p>
                      <p>Dr: {completedInvoice.prescriptionDetail.doctorName} {completedInvoice.prescriptionDetail.doctorRegNo ? `(Reg: ${completedInvoice.prescriptionDetail.doctorRegNo})` : ""}</p>
                      <p>Patient: {completedInvoice.prescriptionDetail.patientAge ? `${completedInvoice.prescriptionDetail.patientAge}y/` : ""}{completedInvoice.prescriptionDetail.patientGender}</p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 pb-3 mb-3 border-b border-dashed border-slate-300">
                  <div className="flex justify-between font-bold text-[9px] text-slate-400 border-b border-dashed border-slate-200 pb-1">
                    <span>Item Name</span>
                    <span>Qty x Price</span>
                  </div>
                  {completedInvoice.items.map((item, i) => {
                    const discount = item.discountPercent || 0;
                    const gst = item.gstPercent || 0;
                    const itemUnitTotal = item.mrp * (1 - discount / 100);
                    return (
                      <div key={i} className="text-[10px] leading-tight space-y-0.5">
                        <div className="flex justify-between">
                          <span className="truncate max-w-[150px] font-bold">{item.name}</span>
                          <span>{item.sellQuantity} x ₹{item.mrp}</span>
                        </div>
                        {(discount > 0 || gst > 0) && (
                          <div className="flex justify-between text-[8px] text-slate-400 font-semibold pl-2">
                            <span>{discount > 0 ? `Disc: ${discount}%` : ""} {gst > 0 ? `GST: ${gst}%` : ""}</span>
                            <span>Net Unit: ₹{itemUnitTotal.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Split Tax / Discount Summary */}
                {(() => {
                  const cal = invoiceCalculations(completedInvoice);
                  return (
                    <div className="space-y-1 pb-3 mb-3 border-b border-dashed border-slate-300 text-[10px]">
                      {cal.totalDiscount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Discount Saved:</span>
                          <span>-₹{cal.totalDiscount}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Taxable Value:</span>
                        <span>₹{cal.totalTaxable}</span>
                      </div>
                      {cal.totalCGST > 0 && (
                        <>
                          <div className="flex justify-between">
                            <span>CGST:</span>
                            <span>₹{cal.totalCGST}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>SGST:</span>
                            <span>₹{cal.totalSGST}</span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}
                
                <div className="flex justify-between font-extrabold text-xs">
                  <span>Grand Total:</span>
                  <span>₹{completedInvoice.totalAmount}</span>
                </div>
                
                <div className="text-center text-[8px] text-slate-400 mt-5 border-t border-slate-100 pt-3">
                  Thank you! Get well soon.<br/>
                  *Medicines once sold cannot be returned.*
                </div>
              </div>

              {/* WhatsApp Box */}
              <div className="w-[280px] bg-white border border-slate-200 rounded-xl p-4 mt-4 shadow-sm">
                <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                  <span className="text-emerald-500">💬</span> Send Invoice via WhatsApp
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp Phone Number</label>
                    <input 
                      type="tel"
                      placeholder="Enter 10-digit number"
                      value={waPhone}
                      onChange={(e) => setWaPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-semibold"
                    />
                  </div>
                  <button 
                    onClick={() => {
                      if (!waPhone.trim()) {
                        toast.error("Please enter a valid WhatsApp number.");
                        return;
                      }
                      triggerWhatsAppSend(completedInvoice, waPhone);
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1"
                  >
                    <span>Send via WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setCompletedInvoice(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
              <button 
                onClick={handlePrintInvoice}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-blue-100" /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden printable receipt wrapper */}
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

          {completedInvoice && (
            <div className="thermal-invoice">
              <div className="header">
                <h3 style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{shopInfo?.shopName || "MedERP Pharmacy"}</h3>
                {shopInfo?.address && <p style={{ fontSize: '8px', margin: '2px 0 0 0' }}>{shopInfo.address}</p>}
                {shopInfo?.phoneNumber && <p style={{ fontSize: '8px', margin: '1px 0 0 0' }}>Phone: {shopInfo.phoneNumber}</p>}
                <p style={{ fontSize: '8px', margin: '2px 0 0 0' }}>Date: {new Date(completedInvoice.date).toLocaleString('en-IN')}</p>
              </div>
              <div className="info">
                <p>Invoice No: #{completedInvoice.billNumber}</p>
                <p>Payment Mode: {completedInvoice.paymentMethod}</p>
                {completedInvoice.customerName && <p>Customer: {completedInvoice.customerName}</p>}
                {completedInvoice.customerPhone && <p>Phone: {completedInvoice.customerPhone}</p>}
                {completedInvoice.prescriptionDetail?.doctorName && (
                  <div style={{ fontSize: '8px', border: '0.5px solid black', padding: '2px', marginTop: '4px' }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>Rx details (Schedule H)</p>
                    <p style={{ margin: 0 }}>Dr: {completedInvoice.prescriptionDetail.doctorName} {completedInvoice.prescriptionDetail.doctorRegNo ? `(Reg: ${completedInvoice.prescriptionDetail.doctorRegNo})` : ""}</p>
                    <p style={{ margin: 0 }}>Patient: {completedInvoice.prescriptionDetail.patientAge ? `${completedInvoice.prescriptionDetail.patientAge}y/` : ""}{completedInvoice.prescriptionDetail.patientGender}</p>
                  </div>
                )}
              </div>
              <div className="items-table">
                <div className="row head">
                  <span>Item Name</span>
                  <span>Qty x Price</span>
                </div>
                {completedInvoice.items.map((item, i) => {
                  const discount = item.discountPercent || 0;
                  const gst = item.gstPercent || 0;
                  const itemUnitTotal = item.mrp * (1 - discount / 100);
                  return (
                    <div key={i} style={{ marginBottom: '4px' }}>
                      <div className="row" style={{ margin: 0 }}>
                        <span style={{ maxWidth: '32mm', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                        <span>{item.sellQuantity} x ₹{item.mrp}</span>
                      </div>
                      {(discount > 0 || gst > 0) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '7px', color: 'gray', paddingLeft: '4px' }}>
                          <span>{discount > 0 ? `D:${discount}%` : ""} {gst > 0 ? `G:${gst}%` : ""}</span>
                          <span>Net Unit: ₹{itemUnitTotal.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {(() => {
                const cal = invoiceCalculations(completedInvoice);
                return (
                  <div style={{ borderBottom: '1px dashed black', paddingBottom: '4px', marginBottom: '6px', fontSize: '9px' }}>
                    {cal.totalDiscount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                        <span>Discount Saved:</span>
                        <span>-₹{cal.totalDiscount}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Taxable Value:</span>
                      <span>₹{cal.totalTaxable}</span>
                    </div>
                    {cal.totalCGST > 0 && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>CGST:</span>
                          <span>₹{cal.totalCGST}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>SGST:</span>
                          <span>₹{cal.totalSGST}</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              <div className="total-row">
                <span>Grand Total:</span>
                <span>₹{completedInvoice.totalAmount}</span>
              </div>
              <div className="footer">
                Thank you! Get well soon.<br/>
                *Medicines once sold cannot be returned.*<br/>
                <span style={{ fontSize: '5.5px', display: 'block', marginTop: '6px', lineHeight: '1.2', color: '#555', fontWeight: 'normal', textTransform: 'none' }}>
                  This invoice is generated using MedERP. Tax slabs, dosage, and stock parameters are configured and verified by the licensed pharmacist. DevSamp Technologies holds no liability for tax rate errors or wrong drug dispensation.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}