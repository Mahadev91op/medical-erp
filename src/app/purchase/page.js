"use client";
import { useState, useRef } from "react";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import { PackagePlus, Printer, CheckCircle2, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast"; 

export default function PurchaseEntry() {
  const [formData, setFormData] = useState({
    name: "", batch: "", expiryDate: "", quantity: "", distributor: "", mrp: ""
  });
  const [loading, setLoading] = useState(false);
  const [savedMed, setSavedMed] = useState(null);
  const nameInputRef = useRef(null);

  const printRef = useRef();
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Medicine_Barcode",
  });

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
        toast.success(`${data.medicine.name} save ho gayi!`); 
        setFormData({ name: "", batch: "", expiryDate: "", quantity: "", distributor: "", mrp: "" }); 
        nameInputRef.current?.focus();
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (error) {
      toast.error("Network error aaya!");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Toaster position="top-center" /> 
      <div className="flex items-center">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mr-3 border border-emerald-100">
          <PackagePlus className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800">Smart Purchase Entry</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dawai Ka Naam</label>
              <input type="text" required placeholder="e.g. Paracetamol" ref={nameInputRef}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all outline-none font-medium"
                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Batch No.</label>
                <input type="text" required placeholder="B-102" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-400"
                  value={formData.batch} onChange={(e) => setFormData({...formData, batch: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Quantity</label>
                <input type="number" required placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-400"
                  value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">MRP ₹</label>
                <input type="number" required placeholder="0.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-400"
                  value={formData.mrp} onChange={(e) => setFormData({...formData, mrp: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Expiry Date</label>
                <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-400"
                  value={formData.expiryDate} onChange={(e) => setFormData({...formData, expiryDate: e.target.value})} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Distributor</label>
              <input type="text" required placeholder="Agency Name" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-400"
                value={formData.distributor} onChange={(e) => setFormData({...formData, distributor: e.target.value})} />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center disabled:opacity-70">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Entry & Barcode"}
            </button>
          </form>
        </div>

        <div className="bg-slate-100/50 p-8 rounded-3xl border border-slate-100 flex flex-col items-center justify-center min-h-[400px]">
          {!savedMed ? (
            <div className="text-slate-400 text-center"><Printer className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>Barcode preview yahan dikhega</p></div>
          ) : (
            <div className="flex flex-col items-center">
              <div ref={printRef} className="bg-white p-4 rounded shadow-md mb-6" style={{ width: '50mm' }}>
                <Barcode value={savedMed.barcodeId} width={1.2} height={35} fontSize={10} displayValue={true} />
                <p className="text-[8px] font-bold text-center mt-1 truncate">{savedMed.name} | ₹{savedMed.mrp}</p>
              </div>
              <button onClick={handlePrint} className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold flex items-center">
                <Printer className="w-4 h-4 mr-2" /> Print Sticker
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}