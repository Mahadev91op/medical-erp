"use client";
import { useState, useRef } from "react";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import { PackagePlus, Printer, CheckCircle2, Loader2 } from "lucide-react";

export default function PurchaseEntry() {
  const [formData, setFormData] = useState({
    name: "", batch: "", expiryDate: "", quantity: "", distributor: "A"
  });
  const [loading, setLoading] = useState(false);
  const [savedMed, setSavedMed] = useState(null);
  
  // Printing ke liye reference
  const printRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
  });

  // Form Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
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
        // Form Reset kar do next entry ke liye
        setFormData({ name: "", batch: "", expiryDate: "", quantity: "", distributor: "A" }); 
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      alert("Kuch galat ho gaya!");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex items-center">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mr-3 border border-emerald-100">
          <PackagePlus className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Smart Purchase Entry</h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium mt-0.5">Naya maal enter karein aur Barcode nikalein.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Left Side: Entry Form */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Dawai ka Naam */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dawai Ka Naam</label>
              <input type="text" required placeholder="e.g. Paracetamol 500mg"
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>

            {/* Batch & Quantity (Side by Side on PC, Stacked on Mobile) */}
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

            {/* Expiry & Distributor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expiry Date</label>
                <input type="date" required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
                  value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Distributor</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
                  value={formData.distributor} onChange={(e) => setFormData({...formData, distributor: e.target.value})}>
                  <option value="A">Distributor A (Sharma Med)</option>
                  <option value="B">Distributor B (Gupta Agency)</option>
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm px-4 py-4 rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-4">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Entry & Generate Barcode"}
            </button>
          </form>
        </div>

        {/* Right Side: Barcode Sticker Preview */}
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
              
              {/* Ye Div specifically 50x25mm (Thermal Printer Size) ke liye design kiya gaya hai */}
              <div className="bg-white shadow-xl shadow-slate-200 rounded-lg p-4 mb-8">
                <div ref={printRef} className="bg-white flex flex-col items-center justify-center overflow-hidden" style={{ width: '50mm', height: '25mm', padding: '2mm' }}>
                  <Barcode value={savedMed.barcodeId} width={1.2} height={35} fontSize={10} margin={0} background="#ffffff" lineColor="#000000" displayValue={true} />
                  <p className="text-[8px] font-bold text-black mt-1 uppercase tracking-tight w-full text-center leading-tight truncate">
                    {savedMed.name.substring(0, 18)} | EXP: {new Date(savedMed.expiryDate).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>

              <button onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all shadow-lg flex items-center">
                <Printer className="w-4 h-4 mr-2" />
                Print Sticker (1-Click)
              </button>
              <p className="text-xs text-slate-400 font-medium mt-3">Ready for Thermal Printer (50x25mm)</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}