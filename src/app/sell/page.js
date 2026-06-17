"use client";
import { useState, useRef, useEffect } from "react";
import { ScanBarcode, ShoppingCart, Trash2, CheckCircle, Loader2, Camera, IndianRupee, Search, Printer, X } from "lucide-react";
import { formatDate, formatExpiryDate } from "@/lib/formatDate";
import CameraScanner from "@/components/sell/CameraScanner"; 
import toast, { Toaster } from "react-hot-toast";
import { useReactToPrint } from "react-to-print";

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
    if (!manualSearch.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/medicine?search=${encodeURIComponent(manualSearch)}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setSearchResults(data.medicines);
        if(data.medicines.length === 0) toast.error("No medicine found with this name");
      }
    } catch (error) {
      toast.error("Search failed");
    }
    setLoading(false);
  };

  const addToCart = (med) => {
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
      if (existingItem.sellQuantity < med.quantity) {
        setCart(cart.map(item => item._id === med._id ? { ...item, sellQuantity: item.sellQuantity + 1 } : item));
        toast.success(`Quantity increased for ${med.name}`);
      } else {
        toast.error("Cannot add more! Insufficient stock.");
      }
    } else {
      setCart([...cart, { ...med, sellQuantity: 1 }]);
      toast.success(`${med.name} added to cart`);
    }
    setSearchResults([]);
    setManualSearch("");
  };

  const removeItem = (id) => {
    setCart(cart.filter(item => item._id !== id));
    inputRef.current?.focus();
  };

  const totalCartAmount = cart.reduce((total, item) => total + ((item.mrp || 0) * item.sellQuantity), 0);

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
      itemsText += `• ${item.name} (${item.sellQuantity} x ₹${item.mrp}) = ₹${item.sellQuantity * item.mrp}\n`;
    });
    
    const message = `*✨ INVOICE / BILL DETAILS ✨*
-----------------------------
*Store:* ${shopName}
${shopPhone ? `*Phone:* ${shopPhone}\n` : ""}*Invoice No:* #${billNo}
*Date:* ${dateStr}
*Payment Method:* ${payMode}
${invoice.customerName ? `*Customer Name:* ${invoice.customerName}\n` : ""}
-----------------------------
*Items:*
${itemsText}-----------------------------
*Grand Total: ₹${totalAmount}*

Thank you! Get well soon. 🏥`;

    const encodedText = encodeURIComponent(message);
    const waUrl = `https://wa.me/${cleanedPhone}?text=${encodedText}`;
    
    window.open(waUrl, "_blank");
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/sell", {
        method: "POST",
        body: JSON.stringify({ cartItems: cart, paymentMethod, customerName, customerPhone }), 
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`✅ Sale Complete! Bill: ₹${data.totalAmount}`);
        const newInvoice = {
          billNumber: data.saleId ? data.saleId.toString().slice(-6).toUpperCase() : "N/A",
          date: new Date().toISOString(),
          items: [...cart],
          totalAmount: data.totalAmount,
          paymentMethod,
          customerName,
          customerPhone
        };
        
        setCompletedInvoice(newInvoice);
        setWaPhone(customerPhone);
        
        // Auto WhatsApp send if phone number entered
        if (customerPhone.trim()) {
          triggerWhatsAppSend(newInvoice, customerPhone);
        }
        
        setCart([]); 
        setPaymentMethod("Cash");
        setCustomerName("");
        setCustomerPhone("");
      } else {
        toast.error(data.error || "Error during checkout.");
      }
    } catch (error) {
      toast.error("Error during checkout.");
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
            <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-3xl shadow-sm border border-blue-100">
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
                    {med.quantity <= 0 ? (
                      <button disabled className="bg-rose-100 text-rose-700 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold shrink-0 opacity-80 cursor-not-allowed border border-rose-200">
                        Sold Out
                      </button>
                    ) : (
                      <button onClick={() => addToCart(med)} className="bg-blue-100 text-blue-700 px-2.5 py-1.5 md:px-3 md:py-1.5 rounded-lg text-[10px] md:text-xs font-bold hover:bg-blue-200 transition-colors shrink-0">
                        + Add
                      </button>
                    )}
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
                {cart.map((item) => (
                  <div key={item._id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 bg-slate-50/50 rounded-xl md:rounded-2xl border border-slate-100 gap-3 sm:gap-0">
                    <div className="flex-1 pr-0 sm:pr-4 min-w-0">
                      <p className="font-bold text-slate-800 text-sm md:text-lg truncate">{item.name}</p>
                      
                      <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-1 mb-1.5 md:mb-2">
                        <span className="text-[9px] md:text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-1.5 md:px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Batch: {item.batch}</span>
                        <span className="text-[9px] md:text-[10px] font-bold bg-rose-50 border border-rose-100 text-rose-600 px-1.5 md:px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Exp: {formatExpiryDate(item.expiryDate)}</span>
                        {item.rackNumber && <span className="text-[9px] md:text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-600 px-1.5 md:px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)]">Rack: {item.rackNumber}</span>}
                        {item.distributor && <span className="text-[9px] md:text-[10px] font-bold bg-amber-50 border border-amber-100 text-amber-600 px-1.5 md:px-2 py-0.5 rounded-md shadow-[0_1px_2px_rgba(0,0,0,0.05)] max-w-[100px] md:max-w-[120px] truncate">Dist: {item.distributor}</span>}
                      </div>

                      <p className="text-xs md:text-sm text-blue-600 font-extrabold">₹{item.mrp || 0} / unit</p>
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
                        ₹{(item.mrp || 0) * item.sellQuantity}
                      </div>
                      <button onClick={() => removeItem(item._id)} className="p-1.5 md:p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg md:rounded-xl transition-colors">
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>
                ))}
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
                className="w-full bg-slate-700 border-none text-white rounded-xl px-3 md:px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer text-xs md:text-base"
              >
                <option value="Cash">💵 Cash</option>
                <option value="UPI">📱 UPI / PhonePe</option>
                <option value="Card">💳 Card</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-bold mb-1.5 md:mb-2 block">Customer Name</label>
              <input
                type="text"
                placeholder="Optional Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full bg-slate-700 border-none text-white rounded-xl px-3 md:px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm placeholder-slate-500 font-semibold"
              />
            </div>

            <div className="mb-2">
              <label className="text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-bold mb-1.5 md:mb-2 block">Customer Phone (WhatsApp)</label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full bg-slate-700 border-none text-white rounded-xl px-3 md:px-4 py-2.5 md:py-3 focus:ring-2 focus:ring-blue-500 outline-none text-xs md:text-sm placeholder-slate-500 font-semibold"
              />
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
                </div>
                
                <div className="space-y-2 pb-3 mb-3 border-b border-dashed border-slate-300">
                  <div className="flex justify-between font-bold text-[9px] text-slate-400">
                    <span>Item Name</span>
                    <span>Qty x Price</span>
                  </div>
                  {completedInvoice.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-[10px] leading-tight">
                      <span className="truncate max-w-[150px]">{item.name}</span>
                      <span>{item.sellQuantity} x ₹{item.mrp}</span>
                    </div>
                  ))}
                </div>
                
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
              </div>
              <div className="items-table">
                <div className="row head">
                  <span>Item Name</span>
                  <span>Qty x Price</span>
                </div>
                {completedInvoice.items.map((item, i) => (
                  <div key={i} className="row">
                    <span style={{ maxWidth: '32mm', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                    <span>{item.sellQuantity} x ₹{item.mrp}</span>
                  </div>
                ))}
              </div>
              <div className="total-row">
                <span>Grand Total:</span>
                <span>₹{completedInvoice.totalAmount}</span>
              </div>
              <div className="footer">
                Thank you! Get well soon.<br/>
                *Medicines once sold cannot be returned.*
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}