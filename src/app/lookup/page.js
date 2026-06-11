"use client";
import { useState, useEffect, useRef } from "react";
import { 
  Search, ScanBarcode, Camera, Package, AlertCircle, 
  History, Calendar, User, FileText, Loader2, ArrowRight, X, ShieldAlert
} from "lucide-react";
import { formatDate, formatExpiryDate } from "@/lib/formatDate";
import CameraScanner from "@/components/sell/CameraScanner";
import toast, { Toaster } from "react-hot-toast";

const TableHistorySkeleton = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-slate-50 h-10 w-full border-b border-slate-150 flex items-center px-4">
          <div className="h-3.5 w-full bg-slate-200 rounded-md"></div>
        </div>
        <div className="divide-y divide-slate-50">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="h-4 w-20 bg-slate-200 rounded-md"></div>
              <div className="h-4 w-12 bg-slate-200 rounded-md"></div>
              <div className="h-4 w-16 bg-slate-200 rounded-md"></div>
              <div className="h-4 w-16 bg-slate-200 rounded-md"></div>
              <div className="h-4 w-28 bg-slate-200 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function MedicineLookup() {
  const [searchTerm, setSearchTerm] = useState("");
  const [medicines, setMedicines] = useState([]);
  const [selectedMed, setSelectedMed] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  const inputRef = useRef(null);

  // Debounced search for medicines (including out of stock)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        fetchMedicines(searchTerm);
      } else {
        setMedicines([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const fetchMedicines = async (search = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/medicine?all=true&limit=10&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setMedicines(data.medicines);
      }
    } catch (error) {
      toast.error("Error searching medicines!");
    } finally {
      setLoading(false);
    }
  };

  const processBarcode = async (scannedCode) => {
    if (!scannedCode.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/medicine/search?barcode=${encodeURIComponent(scannedCode.trim())}`);
      const data = await res.json();
      if (data.success) {
        setSelectedMed(data.medicine);
        fetchHistory(data.medicine._id);
        toast.success(`Medicine found: ${data.medicine.name}`);
      } else {
        toast.error(data.error || "No medicine found with this barcode ID.");
      }
    } catch (error) {
      toast.error("Error searching barcode!");
    } finally {
      setLoading(false);
      setShowCamera(false);
    }
  };

  const fetchHistory = async (medicineId) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/medicine/history?medicineId=${medicineId}`);
      const data = await res.json();
      if (data.success) {
        setSalesHistory(data.history);
      }
    } catch (error) {
      toast.error("Failed to load sales history!");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSelectMedicine = (med) => {
    setSelectedMed(med);
    fetchHistory(med._id);
    setSearchTerm("");
    setMedicines([]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      <Toaster position="top-center" />

      {showCamera && (
        <CameraScanner 
          onScan={(decoded) => processBarcode(decoded)} 
          onClose={() => setShowCamera(false)} 
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 text-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 border border-indigo-150 shadow-sm shrink-0">
            <Search className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-tight">Medicine Tracer & History</h1>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium mt-0.5">Trace stock updates, check out-of-stock items, and audit sales logs.</p>
          </div>
        </div>

        <button 
          onClick={() => setShowCamera(true)}
          className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center justify-center transition-all shadow-md w-full md:w-auto shrink-0"
        >
          <Camera className="w-4 h-4 mr-2" /> Scan Barcode
        </button>
      </div>

      {/* Search Section */}
      <div className="bg-white p-4 md:p-6 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 relative z-30">
        <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search stock (In Stock & Out of Stock)</label>
        <div className="relative">
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Type Medicine Name, Batch No, or Barcode ID..." 
            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-4 py-3 md:py-4 focus:outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all text-sm md:text-base font-semibold shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <Search className="absolute left-3.5 md:left-4 top-3.5 md:top-4.5 text-slate-400 w-5 h-5" />
          {loading && <Loader2 className="absolute right-4 top-3.5 md:top-4.5 text-indigo-500 w-5 h-5 animate-spin" />}
        </div>

        {/* Live Dropdown Results */}
        {medicines.length > 0 && (
          <div className="absolute left-4 right-4 mt-2 bg-white rounded-2xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.08)] border border-slate-150 overflow-hidden z-40">
            <div className="p-2 space-y-1">
              {medicines.map((med) => {
                const isOutOfStock = med.quantity <= 0;
                const isExpired = new Date(med.expiryDate) < new Date();
                return (
                  <div 
                    key={med._id} 
                    onClick={() => handleSelectMedicine(med)}
                    className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-100"
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{med.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5 uppercase">Batch: {med.batch} | Dist: {med.distributor}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-500">₹{med.mrp}</p>
                      <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-1 border ${
                        isExpired 
                          ? "bg-rose-50 border-rose-100 text-rose-500" 
                          : isOutOfStock 
                            ? "bg-rose-50 border-rose-100 text-rose-500" 
                            : "bg-blue-50 border-blue-100 text-blue-600"
                      }`}>
                        {isExpired ? "Expired" : isOutOfStock ? "Out of Stock" : `${med.quantity} in stock`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Details & History Grid */}
      {!selectedMed ? (
        <div className="bg-slate-50 border border-dashed border-slate-300 p-12 md:p-24 rounded-[24px] md:rounded-3xl text-center">
          <ScanBarcode className="w-12 h-12 md:w-16 md:h-16 text-slate-300 mx-auto mb-3 opacity-60" />
          <h3 className="text-base md:text-lg font-bold text-slate-600">No Medicine Traced</h3>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-sm mx-auto">Use the search bar above or scan the medicine&apos;s barcode using the camera to look up details and sales history logs.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* Details Card */}
          <div className="lg:col-span-1 bg-white p-5 md:p-6 rounded-[24px] md:rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="space-y-6">
              
              {/* Header Title */}
              <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-800 capitalize leading-tight">{selectedMed.name}</h3>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1 uppercase">Barcode: {selectedMed.barcodeId}</span>
                </div>
                
                <button 
                  onClick={() => { setSelectedMed(null); setSalesHistory([]); }}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                {selectedMed.quantity <= 0 ? (
                  <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-100 text-rose-500 px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase">
                    <ShieldAlert className="w-3.5 h-3.5" /> Finished (Out of Stock)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-blue-50 border border-blue-100 text-blue-600 px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase">
                    <Package className="w-3.5 h-3.5" /> {selectedMed.quantity} Units Available
                  </span>
                )}

                {new Date(selectedMed.expiryDate) < new Date() && (
                  <span className="inline-flex items-center gap-1 bg-rose-50 border border-rose-100 text-rose-500 px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5" /> Expired Stock
                  </span>
                )}
              </div>

              {/* Meta information */}
              <div className="space-y-4 pt-4 border-t border-slate-50">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400 uppercase">Batch Number</span>
                  <span className="text-slate-700 font-extrabold">{selectedMed.batch}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400 uppercase">MRP Price</span>
                  <span className="text-blue-600 font-extrabold text-sm">₹{selectedMed.mrp}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400 uppercase">Expiry Date</span>
                  <span className="text-slate-700 font-extrabold">{formatExpiryDate(selectedMed.expiryDate)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400 uppercase">Distributor / Agency</span>
                  <span className="text-slate-700 font-extrabold capitalize">{selectedMed.distributor}</span>
                </div>
              </div>

            </div>

            {/* Bill Details */}
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-4 mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400 flex items-center gap-1">
                  <FileText className="w-4 h-4" /> Bill Number
                </span>
                <span className="text-slate-700 font-extrabold">{selectedMed.billNumber || "N/A"}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Purchase Date
                </span>
                <span className="text-slate-700 font-extrabold">{selectedMed.purchaseDate ? formatDate(selectedMed.purchaseDate) : "N/A"}</span>
              </div>
            </div>

          </div>

          {/* Sales History Card */}
          <div className="lg:col-span-2 bg-white p-5 md:p-6 rounded-[24px] md:rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm md:text-base text-slate-800 flex items-center mb-3">
                <History className="w-5 h-5 text-indigo-500 mr-2" />
                Sales Transaction Logs
              </h3>

              {historyLoading ? (
                <TableHistorySkeleton />
              ) : salesHistory.length === 0 ? (
                <div className="py-16 text-center text-slate-400 bg-slate-50/50 border border-slate-100 rounded-2xl">
                  <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs md:text-sm font-semibold">No sales logged for this medicine batch yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                        <th className="p-3 font-bold">Receipt</th>
                        <th className="p-3 font-bold text-center">Sold Qty</th>
                        <th className="p-3 font-bold text-center">Pay Mode</th>
                        <th className="p-3 font-bold text-right">Revenue</th>
                        <th className="p-3 font-bold text-right">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs md:text-sm">
                      {salesHistory.map((item, i) => {
                        const txDate = new Date(item.date);
                        const dateStr = txDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
                        const timeStr = txDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
                        return (
                          <tr key={i} className="hover:bg-slate-50/20 transition-colors">
                            <td className="p-3 font-bold text-indigo-600">#{item.billNumber}</td>
                            <td className="p-3 text-center">
                              <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg font-bold">
                                {item.quantity} pcs
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                                item.paymentMethod === "UPI" 
                                  ? "bg-indigo-50 border border-indigo-100 text-indigo-600" 
                                  : item.paymentMethod === "Card" 
                                    ? "bg-amber-50 border border-amber-100 text-amber-600" 
                                    : "bg-blue-50 border border-blue-100 text-blue-600"
                              }`}>
                                {item.paymentMethod}
                              </span>
                            </td>
                            <td className="p-3 text-right font-bold text-slate-700">₹{item.total.toLocaleString("en-IN")}</td>
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

            {/* Aggregated Totals */}
            {!historyLoading && salesHistory.length > 0 && (
              <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 mt-6 flex justify-between items-center flex-wrap gap-3">
                <div>
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wide">Aggregate Traced Stats</p>
                  <p className="text-xs font-bold text-slate-600 mt-0.5">Total sold quantity and earnings generated by this batch.</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-400 font-bold">Total Sold</p>
                    <p className="text-sm font-extrabold text-slate-700">{salesHistory.reduce((sum, x) => sum + x.quantity, 0)} Units</p>
                  </div>
                  <div className="text-right border-l border-indigo-100 pl-4">
                    <p className="text-[10px] text-slate-400 font-bold">Total Revenue</p>
                    <p className="text-sm font-extrabold text-blue-600">₹{salesHistory.reduce((sum, x) => sum + x.total, 0).toLocaleString("en-IN")}</p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
