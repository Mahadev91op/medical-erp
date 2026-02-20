"use client";
import { useState, useRef, useEffect } from "react";
import Barcode from "react-barcode";
import { PackagePlus, Printer, CheckCircle2, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast"; 

export default function PurchaseEntry() {
  // Rack Number yahan se hata diya gaya hai
  const [formData, setFormData] = useState({
    name: "", batch: "", expiryDate: "", quantity: "", distributor: "", mrp: ""
  });
  const [loading, setLoading] = useState(false);
  const [savedMed, setSavedMed] = useState(null);
  
  // Distributor Auto-suggest List State
  const [distributors, setDistributors] = useState([]);
  
  const nameInputRef = useRef(null); 

  // Component load hote hi purane distributors fetch karenge
  useEffect(() => {
    const fetchDistributors = async () => {
      try {
        const res = await fetch("/api/medicine?limit=1000");
        const data = await res.json();
        if (data.success) {
          // Unique distributors nikalna
          const uniqueDists = [...new Set(data.medicines.map(m => m.distributor).filter(Boolean))];
          setDistributors(uniqueDists);
        }
      } catch (error) {
        console.error("Error fetching distributors:", error);
      }
    };
    fetchDistributors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const selectedDate = new Date(formData.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    if (selectedDate <= today) {
      toast.error("Expiry date aaj ki ya purani nahi ho sakti!");
      return;
    }

    setLoading(true);
    
    try {
      const res = await fetch("/api/medicine", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();
      if (data.success) {
        setSavedMed(data.medicine);
        toast.success(`${data.medicine.name} database me save ho gayi!`); 

        // Agar distributor naya hai toh use local list me add kar lo taaki turant next time suggestion me aaye
        if (formData.distributor && !distributors.includes(formData.distributor)) {
          setDistributors([...distributors, formData.distributor]);
        }
        
        // Form Reset (Rack Number removed)
        setFormData({ name: "", batch: "", expiryDate: "", quantity: "", distributor: "", mrp: "" }); 
        
        nameInputRef.current?.focus();
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (error) {
      toast.error("Kuch galat ho gaya! Network check karein.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Toaster position="top-center" reverseOrder={false} /> 
      
      <div className="flex items-center">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mr-3 border border-emerald-100">
          <PackagePlus className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Smart Purchase Entry</h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium mt-0.5">Naya maal enter karein aur Barcode dekhein.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Left Side: Entry Form */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dawai Ka Naam</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Paracetamol 500mg"
                ref={nameInputRef}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Batch No.</label>
                <input type="text" required placeholder="e.g. B-1029"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
                  value={formData.batch} onChange={(e) => setFormData({...formData, batch: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quantity (Ptte)</label>
                <input type="number" required placeholder="0" min="1"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
                  value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">MRP (Bikri Rate) ₹</label>
                <input type="number" required placeholder="0.00" min="0" step="0.01"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
                  value={formData.mrp} onChange={(e) => setFormData({...formData, mrp: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expiry Date</label>
                <input type="date" required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
                  value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
              </div>
            </div>

            {/* Distributor Field - Rack Number Removed so it takes full width */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Distributor / Agency</label>
              <input 
                type="text" required placeholder="e.g. Cipla / SunPharma"
                list="distributor-suggestions"
                autoComplete="off"
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
                value={formData.distributor} 
                onChange={(e) => setFormData({...formData, distributor: e.target.value})} 
              />
              <datalist id="distributor-suggestions">
                {distributors.map((dist, index) => (
                  <option key={index} value={dist} />
                ))}
              </datalist>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-4 py-4 rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-4">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Entry & Generate Barcode"}
            </button>
          </form>
        </div>

        {/* Right Side: Barcode Sticker Preview (Print Button Removed) */}
        <div className="bg-slate-100/50 p-6 md:p-8 rounded-3xl border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
          
          {!savedMed ? (
            <div className="text-center text-slate-400">
              <Printer className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Form submit karein barcode dekhne ke liye</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="flex items-center text-emerald-600 font-bold mb-6 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Entry Saved Successfully!
              </div>
              
              <div className="bg-white shadow-xl shadow-slate-200 rounded-lg p-4 mb-8">
                <div className="bg-white flex flex-col items-center justify-center overflow-hidden" style={{ width: '50mm', height: '25mm', padding: '2mm' }}>
                  <Barcode value={savedMed.barcodeId} width={1.2} height={35} fontSize={10} margin={0} background="#ffffff" lineColor="#000000" displayValue={true} />
                  <p className="text-[8px] font-bold text-black mt-1 uppercase tracking-tight w-full text-center leading-tight truncate">
                    {savedMed.name.substring(0, 15)} | ₹{savedMed.mrp} | EXP: {new Date(savedMed.expiryDate).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>
              
            </div>
          )}

        </div>
      </div>
    </div>
  );
}