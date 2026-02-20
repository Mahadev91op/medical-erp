"use client";
import { useState, useRef, useEffect } from "react";
import { ScanBarcode, ShoppingCart, Trash2, CheckCircle, Loader2, Camera, IndianRupee } from "lucide-react";
import CameraScanner from "@/components/sell/CameraScanner"; 
import toast, { Toaster } from "react-hot-toast";

export default function QuickSell() {
  const [barcode, setBarcode] = useState("");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState("Cash"); 
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!showCamera) {
      inputRef.current?.focus();
    }
  }, [showCamera]);

  const processBarcode = async (scannedCode) => {
    if (!scannedCode.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/medicine/search?barcode=${scannedCode}`);
      const data = await res.json();
      
      if (data.success) {
        const med = data.medicine;
        const existingItem = cart.find(item => item._id === med._id);
        
        // BUG FIX: Agar stock 0 hai toh add mat hone do
        if (med.quantity <= 0) {
          toast.error(`${med.name} ka stock khatam (0) hai!`);
        } 
        else if (existingItem) {
          if (existingItem.sellQuantity < med.quantity) {
            setCart(cart.map(item => item._id === med._id ? { ...item, sellQuantity: item.sellQuantity + 1 } : item));
            toast.success(`${med.name} ki quantity badha di`);
          } else {
            toast.error("Bhaiya, isse zyada stock me nahi hai!");
          }
        } else {
          setCart([...cart, { ...med, sellQuantity: 1 }]);
          toast.success(`${med.name} cart me add ho gayi`);
        }
      } else {
        toast.error("Dawai nahi mili. Galat barcode?"); 
      }
    } catch (error) {
      toast.error("Error fetching medicine!");
    }
    
    setBarcode("");
    setLoading(false);
    inputRef.current?.focus();
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    processBarcode(barcode);
  };

  const handleCameraScan = (decodedText) => {
    setShowCamera(false); 
    processBarcode(decodedText); 
  };

  const removeItem = (id) => {
    setCart(cart.filter(item => item._id !== id));
    inputRef.current?.focus();
  };

  // Total amount calculate karna (MRP * Quantity)
  const totalCartAmount = cart.reduce((total, item) => total + ((item.mrp || 0) * item.sellQuantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/sell", {
        method: "POST",
        body: JSON.stringify({ cartItems: cart, paymentMethod }), 
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();
      if (data.success) {
        toast.success(`✅ Sale Complete! Bill: ₹${data.totalAmount}`);
        setCart([]); 
        setPaymentMethod("Cash"); // Reset payment method
      } else {
        toast.error(data.error || "Checkout me error aaya.");
      }
    } catch (error) {
      toast.error("Checkout me error aaya.");
    }
    setCheckoutLoading(false);
    inputRef.current?.focus();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Toast Notifications */}
      <Toaster position="top-center" reverseOrder={false} />

      {showCamera && (
        <CameraScanner 
          onScan={handleCameraScan} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mr-3 border border-emerald-100">
            <ScanBarcode className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800">Fast Billing & Outward</h1>
            <p className="text-slate-500 text-xs md:text-sm font-medium mt-0.5">Barcode scan karein aur stock minus karein.</p>
          </div>
        </div>
        
        <button 
          onClick={() => setShowCamera(true)}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center transition-all shadow-lg md:w-auto w-full"
        >
          <Camera className="w-4 h-4 mr-2" /> Use Phone Camera
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* Left Side: Scanner Input & Cart Table */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white p-6 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100">
            <form onSubmit={handleFormSubmit}>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                <span>USB Scanner / Manual Entry</span>
              </label>
              <div className="relative">
                <input 
                  ref={inputRef}
                  type="text" 
                  placeholder="Focus here to scan with USB device..." 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-semibold text-lg"
                  value={barcode} 
                  onChange={(e) => setBarcode(e.target.value)} 
                />
                <ScanBarcode className="absolute left-4 top-4.5 text-slate-400 w-6 h-6" />
                {loading && <Loader2 className="absolute right-4 top-4.5 text-emerald-500 w-6 h-6 animate-spin" />}
              </div>
            </form>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 min-h-[300px]">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center">
              <ShoppingCart className="w-4 h-4 mr-2" /> Current Cart
            </h2>
            
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400">
                <ScanBarcode className="w-12 h-12 mb-3 opacity-20" />
                <p className="font-medium text-sm">Cart khaali hai. Barcode scan karein.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 text-lg">{item.name}</p>
                      <p className="text-xs text-slate-500 font-medium">Batch: {item.batch} | Rack: {item.rackNumber || 'N/A'}</p>
                      <p className="text-sm text-emerald-600 font-bold mt-1">₹{item.mrp || 0} / unit</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="bg-white border border-slate-200 px-4 py-1.5 rounded-xl font-bold text-slate-700 shadow-sm">
                        Qty: {item.sellQuantity}
                      </div>
                      <div className="font-bold text-lg text-slate-800 min-w-[60px] text-right">
                        ₹{(item.mrp || 0) * item.sellQuantity}
                      </div>
                      <button onClick={() => removeItem(item._id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Checkout Summary */}
        <div className="bg-slate-800 p-6 md:p-8 rounded-3xl shadow-lg flex flex-col justify-between text-white lg:h-[450px] lg:sticky lg:top-24">
          <div>
            <h2 className="text-lg font-bold text-emerald-400 mb-6 flex items-center border-b border-slate-700 pb-4">
              <CheckCircle className="w-5 h-5 mr-2" /> Summary
            </h2>
            
            <div className="flex justify-between items-center mb-4">
              <span className="text-slate-400 font-medium">Total Items</span>
              <span className="text-xl font-bold">{cart.reduce((total, item) => total + item.sellQuantity, 0)}</span>
            </div>

            <div className="flex justify-between items-center mb-6 pt-4 border-t border-slate-700">
              <span className="text-slate-300 font-bold">Total Amount</span>
              <span className="text-3xl font-bold text-emerald-400 flex items-center">
                <IndianRupee className="w-6 h-6 mr-1" /> {totalCartAmount}
              </span>
            </div>

            <div className="mb-6">
              <label className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-2 block">Payment Method</label>
              <select 
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-700 border-none text-white rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
              >
                <option value="Cash">💵 Cash</option>
                <option value="UPI">📱 UPI / PhonePe</option>
                <option value="Card">💳 Card</option>
              </select>
            </div>
          </div>

          <button 
            onClick={handleCheckout} 
            disabled={cart.length === 0 || checkoutLoading}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-lg px-4 py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {checkoutLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "Complete Sale"}
          </button>
        </div>

      </div>
    </div>
  );
}