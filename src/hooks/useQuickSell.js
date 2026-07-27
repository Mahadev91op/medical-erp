import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { formatExpiryDate } from "@/lib/formatDate";

const invoiceCalculations = (invoice) => {
  if (!invoice) return { totalTaxable: 0, totalDiscount: 0, totalCGST: 0, totalSGST: 0 };
  let totalTaxable = 0;
  let totalDiscount = 0;
  let totalTax = 0;

  invoice.items.forEach((item) => {
    const qty = item.sellQuantity || item.quantity || 1;
    const mrp = item.sellMrp || item.mrp || 0;
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

export default function useQuickSell() {
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
  const [sellUnits, setSellUnits] = useState({}); // mapped medicine id to unit type: 'strip' | 'tab'
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

  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const queue = JSON.parse(localStorage.getItem("offline_sales_queue") || "[]");
      setOfflineQueue(queue);
      setIsOnline(navigator.onLine);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const manualSyncOfflineQueue = async () => {
    if (!navigator.onLine) {
      toast.error("Device is still offline. Reconnect to internet first!");
      return;
    }
    const queue = JSON.parse(localStorage.getItem("offline_sales_queue") || "[]");
    if (queue.length === 0) {
      toast.success("No offline bills pending sync!");
      return;
    }

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
        }
      } catch (err) {
        console.error("Sync error:", err);
        break;
      }
    }

    if (successCount > 0) {
      toast.success(`Synced ${successCount} offline bills to database successfully!`, { id: toastId });
    } else {
      toast.error("Failed to sync offline bills", { id: toastId });
    }
  };

  // Background offline sales sync worker
  useEffect(() => {
    const syncOfflineQueue = async () => {
      if (!navigator.onLine) return;
      const queue = JSON.parse(localStorage.getItem("offline_sales_queue") || "[]");
      if (queue.length === 0) return;

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
          }
        } catch (err) {
          break;
        }
      }

      if (successCount > 0) {
        toast.success(`Auto-synced ${successCount} offline bills to database!`);
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

  useEffect(() => {
    if (!showCamera) {
      inputRef.current?.focus();
    }
  }, [showCamera]);

  const searchControllerRef = useRef(null);

  const performSearch = async (query, isManualClick = false) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    if (searchControllerRef.current) {
      searchControllerRef.current.abort();
    }
    searchControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const res = await fetch(`/api/medicine?search=${encodeURIComponent(query)}&limit=20`, {
        signal: searchControllerRef.current.signal
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.medicines);
        if (isManualClick && data.medicines.length === 0) {
          toast.error("No medicine found with this name");
        }
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        if (isManualClick) {
          toast.error("Search failed");
        }
        console.error("Search error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Ultra-fast debounced search as user types (150ms)
  useEffect(() => {
    if (!manualSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(() => {
      performSearch(manualSearch, false);
    }, 150);
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

    const selectedUnit = sellUnits[med._id] || (med.isLoose ? "strip" : "tab");
    const tabletsPerStrip = med.tabletsPerStrip || 1;
    const requiredQty = selectedUnit === "strip" ? customQty * tabletsPerStrip : customQty;

    // Check if total quantity of this medicine in the cart (across both units if any) exceeds available stock
    const alreadyInCartQty = cart
      .filter(item => item._id === med._id)
      .reduce((sum, item) => sum + (item.sellUnit === "strip" ? item.sellQuantity * (item.tabletsPerStrip || 1) : item.sellQuantity), 0);

    if (alreadyInCartQty + requiredQty > med.quantity) {
      toast.error(`Cannot add! Insufficient stock. Total available: ${med.quantity} tablets. Already in cart: ${alreadyInCartQty} tablets.`);
      return;
    }

    const sellMrp = selectedUnit === "strip" ? (med.stripMrp || med.mrp * tabletsPerStrip) : med.mrp;
    
    // Find item with same _id AND same unit
    const existingItem = cart.find(item => item._id === med._id && item.sellUnit === selectedUnit);
    
    if (existingItem) {
      setCart(cart.map(item => 
        (item._id === med._id && item.sellUnit === selectedUnit)
          ? { ...item, sellQuantity: item.sellQuantity + customQty }
          : item
      ));
      toast.success(`Quantity increased for ${med.name} (${selectedUnit}s)`);
    } else {
      setCart([...cart, { 
        ...med, 
        sellUnit: selectedUnit, 
        sellQuantity: customQty, 
        sellMrp, // Actual price for this row's unit type
        discountPercent: 0, 
        gstPercent: 0 
      }]);
      toast.success(`${med.name} (${selectedUnit}) added to cart`);
    }

    setSearchResults([]);
    setManualSearch("");
    setSearchQtys({});
  };

  const removeItem = (id, unit) => {
    setCart(cart.filter(item => !(item._id === id && item.sellUnit === unit)));
    inputRef.current?.focus();
  };

  const totalCartAmount = Number(cart.reduce((total, item) => total + ((item.sellMrp || item.mrp || 0) * item.sellQuantity * (1 - (item.discountPercent || 0) / 100)), 0).toFixed(2));

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
      mrp: item.sellMrp || item.mrp,
      batch: item.batch,
      expiryDate: item.expiryDate,
      discountPercent: item.discountPercent || 0,
      gstPercent: item.gstPercent || 0,
      sellUnit: item.sellUnit || "tab",
      tabletsPerStrip: item.tabletsPerStrip || 1
    }));

    const prescriptionDetail = isPrescriptionRequired ? {
      doctorName,
      doctorRegNo,
      patientAge: parseInt(patientAge) || null,
      patientGender
    } : null;

    try {
      if (!navigator.onLine) {
        throw new Error("Device is Offline");
      }
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

  return {
    barcode,
    setBarcode,
    manualSearch,
    setManualSearch,
    searchResults,
    setSearchResults,
    cart,
    setCart,
    loading,
    checkoutLoading,
    paymentMethod,
    setPaymentMethod,
    showCamera,
    setShowCamera,
    completedInvoice,
    setCompletedInvoice,
    shopInfo,
    customerName,
    setCustomerName,
    customerPhone,
    setCustomerPhone,
    waPhone,
    setWaPhone,
    searchQtys,
    setSearchQtys,
    sellUnits,
    setSellUnits,
    isPrescriptionRequired,
    setIsPrescriptionRequired,
    doctorName,
    setDoctorName,
    doctorRegNo,
    setDoctorRegNo,
    patientAge,
    setPatientAge,
    patientGender,
    setPatientGender,
    offlineQueue,
    dbCustomers,
    selectedDbCustomer,
    setSelectedDbCustomer,
    isNewCustomer,
    setIsNewCustomer,
    custSearch,
    setCustSearch,
    showSuggestions,
    setShowSuggestions,
    isOnline,
    inputRef,
    manualSyncOfflineQueue,
    processBarcode,
    handleManualSearch,
    addToCart,
    removeItem,
    totalCartAmount,
    triggerWhatsAppSend,
    getCustomerLockDetails,
    handleCheckout
  };
}
