"use client";
import { useState, useEffect, useRef } from "react";
import { 
  Package, Search, Printer, Edit, Trash2, 
  Loader2, X, Filter, AlertCircle, CheckCircle2 
} from "lucide-react";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import toast, { Toaster } from "react-hot-toast";

export default function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMed, setEditMed] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const printRef = useRef();
  const [printData, setPrintData] = useState(null);

  useEffect(() => { fetchMedicines(); }, []);

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/medicine");
      const data = await res.json();
      if (data.success) setMedicines(data.medicines);
    } catch (error) {
      toast.error("Data load nahi ho paya!");
    }
    setLoading(false);
  };

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Barcode_Label",
  });

  const handleDelete = async (id) => {
    if (!confirm("Kya aap sach mein is entry ko delete karna chahte hain?")) return;
    try {
      const res = await fetch(`/api/medicine?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Medicine delete ho gayi!");
        fetchMedicines();
      }
    } catch (error) {
      toast.error("Delete karne mein error aaya!");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch("/api/medicine", {
        method: "PUT",
        body: JSON.stringify({ id: editMed._id, ...editMed }),
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        toast.success("Stock update ho gaya!");
        setEditMed(null);
        fetchMedicines();
      }
    } catch (error) {
      toast.error("Update fail ho gaya!");
    }
    setIsUpdating(false);
  };

  const filtered = medicines.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.batch.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.barcodeId.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center text-slate-400">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
        <p className="font-medium">Inventory Load Ho Rahi Hai...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <Toaster position="top-center" />
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mr-4 border border-emerald-100 shadow-sm">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Medicine Inventory</h1>
            <p className="text-slate-500 text-sm font-medium">Apna pura stock aur barcodes manage karein.</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-96 group">
          <input 
            type="text" 
            placeholder="Search by Name, Batch or Barcode..." 
            className="w-full bg-white border border-slate-200 text-slate-700 rounded-2xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium shadow-sm"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-4 text-slate-400 w-5 h-5 group-focus-within:text-emerald-500 transition-colors" />
        </div>
      </div>

      {/* Inventory Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-20 text-center border border-dashed border-slate-300">
          <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600">Koi medicine nahi mili</h3>
          <p className="text-slate-400">Search term badal kar dekhein ya nayi entry karein.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((med) => (
            <div key={med._id} className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 overflow-hidden group">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 group-hover:text-emerald-600 transition-colors">{med.name}</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{med.barcodeId}</span>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => setEditMed(med)}
                      className="p-2 bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(med._id)}
                      className="p-2 bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">Stock Qty</p>
                    <p className={`text-lg font-extrabold ${med.quantity < 10 ? 'text-rose-500' : 'text-slate-700'}`}>
                      {med.quantity} <span className="text-[10px] font-medium text-slate-400">Units</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">MRP ₹</p>
                    <p className="text-lg font-extrabold text-emerald-600">
                      ₹{med.mrp}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-6 px-1">
                  <div className="flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1 text-slate-300" />
                    Batch: <span className="text-slate-800 ml-1">{med.batch}</span>
                  </div>
                  <div className="flex items-center">
                    Exp: <span className="text-slate-800 ml-1">{new Date(med.expiryDate).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-50 flex flex-col items-center">
                  <div className="bg-white p-2 rounded-lg border border-slate-100 mb-3">
                    <Barcode value={med.barcodeId} width={1} height={30} fontSize={10} background="transparent" />
                  </div>
                  <button 
                    onClick={() => { setPrintData(med); setTimeout(handlePrint, 100); }} 
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white py-3 rounded-2xl text-xs font-bold flex items-center justify-center transition-all shadow-md"
                  >
                    <Printer className="w-4 h-4 mr-2" /> Print Sticker
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modern Edit Modal */}
      {editMed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-emerald-500 p-6 flex justify-between items-center text-white">
              <div className="flex items-center">
                <Edit className="w-5 h-5 mr-3" />
                <h2 className="text-lg font-bold tracking-tight">Update Medicine Details</h2>
              </div>
              <button onClick={() => setEditMed(null)} className="bg-white/20 hover:bg-white/30 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Medicine Name</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-50 outline-none font-bold"
                  value={editMed.name} 
                  onChange={(e) => setEditMed({...editMed, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 text-rose-500">Edit Stock</label>
                  <input 
                    type="number" required
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-50 outline-none font-bold"
                    value={editMed.quantity} 
                    onChange={(e) => setEditMed({...editMed, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Price ₹</label>
                  <input 
                    type="number" required
                    className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl focus:ring-4 focus:ring-emerald-50 outline-none font-bold"
                    value={editMed.mrp} 
                    onChange={(e) => setEditMed({...editMed, mrp: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isUpdating}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center"
              >
                {isUpdating ? <Loader2 className="w-6 h-6 animate-spin" /> : "Confirm Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hidden Print Content */}
      <div className="hidden">
        <div ref={printRef} style={{ width: '50mm', padding: '10px' }} className="flex flex-col items-center justify-center">
          {printData && (
            <>
              <Barcode value={printData.barcodeId} width={1.2} height={35} fontSize={10} displayValue={true} />
              <p className="text-[8px] font-bold text-center mt-1 uppercase" style={{fontFamily: 'sans-serif'}}>
                {printData.name} | MRP: ₹{printData.mrp}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}