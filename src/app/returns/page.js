"use client";
import { useState, useEffect, useRef } from "react";
import { 
  RotateCcw, Search, Truck, Calendar, AlertTriangle, 
  Printer, X, ChevronRight, CheckSquare, Square, Loader2 
} from "lucide-react";
import { formatExpiryDate, formatDate } from "@/lib/formatDate";
import { useReactToPrint } from "react-to-print";
import toast, { Toaster } from "react-hot-toast";

const ReturnsSkeleton = () => {
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
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-100 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 w-full bg-slate-100 rounded-2xl"></div>)}
        </div>
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 space-y-4">
          <div className="h-40 w-full bg-slate-50 rounded-2xl"></div>
        </div>
      </div>
    </div>
  );
};

export default function DistributorReturns() {
  const [groupedReturns, setGroupedReturns] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDist, setSelectedDist] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Selection items inside the current distributor
  const [selectedItems, setSelectedItems] = useState([]); // Array of medicine IDs
  const [returnQtys, setReturnQtys] = useState({}); // mapping: medicineId => return quantity
  const [processing, setProcessing] = useState(false);
  const [shopInfo, setShopInfo] = useState(null);

  // Print references
  const printRef = useRef(null);
  const [printData, setPrintData] = useState(null);

  useEffect(() => {
    fetchReturns();
    fetchShopInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchReturns = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/returns");
      const data = await res.json();
      if (data.success) {
        setGroupedReturns(data.groupedReturns);
        
        // Reset selections if the selected distributor was cleared/updated
        if (selectedDist && !data.groupedReturns[selectedDist]) {
          setSelectedDist("");
          setSelectedItems([]);
          setReturnQtys({});
        }
      }
    } catch (e) {
      toast.error("Failed to load return data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Debit_Note_${selectedDist}`,
    onAfterPrint: () => {
      setPrintData(null);
    }
  });

  const triggerPrintDebitNote = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to print!");
      return;
    }
    const currentMeds = groupedReturns[selectedDist] || [];
    const itemsToPrint = currentMeds.filter(m => selectedItems.includes(m._id)).map(m => ({
      ...m,
      returnQty: returnQtys[m._id] || m.quantity
    }));

    setPrintData({
      distributor: selectedDist,
      date: new Date(),
      items: itemsToPrint
    });
  };

  // Trigger print after state update is flushed
  useEffect(() => {
    if (printData) {
      setTimeout(() => {
        handlePrint();
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printData]);

  const handleProcessReturn = async () => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to return!");
      return;
    }
    if (!confirm("Are you sure you want to return these items? This will deduct them from inventory stock.")) return;

    setProcessing(true);
    const payload = selectedItems.map(id => ({
      medicineId: id,
      returnQty: returnQtys[id] || 0
    }));

    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: payload })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Successfully returned ${data.processed.length} items!`);
        setSelectedItems([]);
        setReturnQtys({});
        await fetchReturns(true);
      } else {
        toast.error(data.error || "Failed to process return");
      }
    } catch (e) {
      toast.error("Network error");
    } finally {
      setProcessing(false);
    }
  };

  const toggleItemSelection = (med) => {
    const id = med._id;
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(itemId => itemId !== id));
      setReturnQtys(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } else {
      setSelectedItems([...selectedItems, id]);
      setReturnQtys(prev => ({ ...prev, [id]: med.quantity }));
    }
  };

  const distributorsList = Object.keys(groupedReturns);
  const filteredDistributors = distributorsList.filter(d => 
    d.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedMeds = groupedReturns[selectedDist] || [];

  if (loading) return <ReturnsSkeleton />;

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 text-rose-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 border border-rose-100 shadow-sm shrink-0">
            <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-tight">Distributor Expiry Return Tracker</h1>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium mt-0.5">Manage expired stocks, group them by distributors, and print Debit Notes.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Distributors List */}
        <div className="lg:col-span-1 bg-white p-4 md:p-5 rounded-[24px] md:rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] space-y-4 flex flex-col max-h-[70vh]">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search Distributor</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl pl-10 pr-4 py-2.5 md:py-3 focus:outline-none focus:border-rose-400 focus:ring-4 focus:ring-rose-50 transition-all text-xs md:text-sm font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} 
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2">
            {filteredDistributors.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10 font-medium">No expired items found</p>
            ) : (
              filteredDistributors.map(d => {
                const count = groupedReturns[d]?.length || 0;
                const isActive = selectedDist === d;
                return (
                  <div 
                    key={d} 
                    onClick={() => { setSelectedDist(d); setSelectedItems([]); setReturnQtys({}); }}
                    className={`p-3 md:p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isActive 
                        ? 'bg-rose-50/50 border-rose-500 text-rose-950 font-bold shadow-md shadow-rose-500/5' 
                        : 'bg-slate-50/50 border-slate-100 text-slate-700 hover:border-rose-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-xs md:text-sm truncate capitalize">{d}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5 flex items-center gap-1">
                        <Truck className="w-3 h-3 text-slate-350" /> {count} items to return
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Return items table */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedDist ? (
            <div className="bg-slate-50 border border-dashed border-slate-300 p-12 md:p-24 rounded-[24px] md:rounded-3xl text-center h-full flex flex-col justify-center items-center">
              <Truck className="w-12 h-12 md:w-16 md:h-16 text-slate-200 mx-auto mb-3 opacity-60" />
              <h3 className="text-base md:text-lg font-bold text-slate-600">Select a Distributor</h3>
              <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xs mx-auto">Select a distributor from the left list to view their expired inventory, print debit notes, and deduct stock.</p>
            </div>
          ) : (
            <div className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] space-y-6 animate-in fade-in duration-200">
              
              {/* Header actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-800 capitalize leading-tight">{selectedDist}</h3>
                  <p className="text-[10px] text-slate-400 font-bold block mt-1 uppercase">Expired Medicines list</p>
                </div>

                <div className="flex gap-2.5 w-full sm:w-auto">
                  <button 
                    onClick={triggerPrintDebitNote}
                    disabled={selectedItems.length === 0}
                    className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Printer className="w-4 h-4 text-blue-400" /> Print Debit Note
                  </button>
                  <button 
                    onClick={handleProcessReturn}
                    disabled={selectedItems.length === 0 || processing}
                    className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/10 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4 text-rose-200" />} Confirm Return
                  </button>
                </div>
              </div>

              {/* Items List Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                      <th className="p-3 font-bold w-12 text-center">Select</th>
                      <th className="p-3 font-bold">Medicine Name</th>
                      <th className="p-3 font-bold text-center">Batch</th>
                      <th className="p-3 font-bold text-center">Expiry</th>
                      <th className="p-3 font-bold text-center">Return Qty</th>
                      <th className="p-3 font-bold text-right">Unit MRP</th>
                      <th className="p-3 font-bold text-right">Total MRP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs md:text-sm">
                    {selectedMeds.map((med) => {
                      const isSelected = selectedItems.includes(med._id);
                      const returnVal = returnQtys[med._id] || 0;
                      const lineTotal = returnVal * med.mrp;
                      return (
                        <tr key={med._id} className={`hover:bg-slate-50/20 transition-colors ${isSelected ? 'bg-rose-50/20' : ''}`}>
                          <td className="p-3 text-center">
                            <button onClick={() => toggleItemSelection(med)} className="focus:outline-none">
                              {isSelected ? 
                                <CheckSquare className="w-4 h-4 text-rose-600 mx-auto" /> : 
                                <Square className="w-4 h-4 text-slate-350 hover:text-rose-400 transition-colors mx-auto" />
                              }
                            </button>
                          </td>
                          <td className="p-3 font-bold text-slate-800">
                            {med.name}
                          </td>
                          <td className="p-3 text-center text-slate-500 font-bold uppercase">{med.batch}</td>
                          <td className="p-3 text-center text-rose-600 font-bold whitespace-nowrap">{formatExpiryDate(med.expiryDate)}</td>
                          <td className="p-3 text-center">
                            <input 
                              type="number"
                              disabled={!isSelected}
                              min="1"
                              max={med.quantity}
                              value={isSelected ? returnVal : ""}
                              placeholder={med.quantity}
                              onChange={(e) => {
                                const val = Math.max(1, Math.min(med.quantity, parseInt(e.target.value) || 1));
                                setReturnQtys({ ...returnQtys, [med._id]: val });
                              }}
                              className="w-16 bg-slate-50 border border-slate-200 px-1.5 py-1 rounded-md text-center text-xs font-bold focus:outline-none focus:border-rose-400 disabled:opacity-50"
                            />
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-500">₹{med.mrp}</td>
                          <td className="p-3 text-right font-black text-rose-600">₹{isSelected ? lineTotal.toFixed(2) : "0.00"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total claim info */}
              {selectedItems.length > 0 && (
                <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4 flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Total Return Claim Summary</p>
                    <p className="text-xs font-bold text-slate-600 mt-0.5">{selectedItems.length} products selected for return.</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-450 font-bold">Estimated Total Claim</p>
                    <p className="text-lg font-black text-rose-600">
                      ₹{selectedItems.reduce((sum, id) => {
                        const med = selectedMeds.find(m => m._id === id);
                        const qty = returnQtys[id] || 0;
                        return sum + (med ? qty * med.mrp : 0);
                      }, 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* Hidden printable Debit Note wrapper */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <div ref={printRef} className="p-10 text-black text-xs bg-white w-[210mm] font-sans" style={{ boxSizing: 'border-box' }}>
          {printData && (
            <div className="space-y-6">
              {/* Report Header */}
              <div className="flex justify-between items-start border-b border-black pb-4">
                <div>
                  <h1 className="text-lg font-black uppercase">{shopInfo?.shopName || "MedERP Pharmacy"}</h1>
                  <p className="text-[10px] font-semibold">{shopInfo?.address || "Medical Shop Address"}</p>
                  <p className="text-[10px] font-semibold">Phone: {shopInfo?.phoneNumber || "Shop Phone"}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-base font-black uppercase tracking-wider text-slate-700">DEBIT NOTE / RETURN MEMO</h2>
                  <p className="text-[10px] mt-1 font-bold">Date: {new Date(printData.date).toLocaleDateString("en-IN")}</p>
                </div>
              </div>

              {/* Distributor details */}
              <div className="border border-black p-3 rounded-lg bg-slate-50/50">
                <p className="font-bold text-[10px] uppercase text-slate-500">To Distributor:</p>
                <h3 className="font-extrabold text-sm capitalize mt-0.5">{printData.distributor}</h3>
                <p className="text-[10px] mt-0.5">Please accept the following expired/short-expiry medicines for credit note adjustment or refund claims.</p>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse border border-black text-[10px]">
                <thead>
                  <tr className="bg-slate-100 border-b border-black font-bold uppercase">
                    <th className="p-2 border-r border-black w-8 text-center">S.No</th>
                    <th className="p-2 border-r border-black">Medicine Name</th>
                    <th className="p-2 border-r border-black text-center">Batch No</th>
                    <th className="p-2 border-r border-black text-center">Expiry</th>
                    <th className="p-2 border-r border-black text-center">Return Qty</th>
                    <th className="p-2 border-r border-black text-right">MRP (₹)</th>
                    <th className="p-2 text-right">Total Value (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {printData.items.map((item, idx) => {
                    const lineVal = item.returnQty * item.mrp;
                    return (
                      <tr key={idx} className="border-b border-black font-medium">
                        <td className="p-2 border-r border-black text-center">{idx + 1}</td>
                        <td className="p-2 border-r border-black font-bold">{item.name}</td>
                        <td className="p-2 border-r border-black text-center font-mono">{item.batch}</td>
                        <td className="p-2 border-r border-black text-center font-mono">{formatExpiryDate(item.expiryDate)}</td>
                        <td className="p-2 border-r border-black text-center font-bold">{item.returnQty}</td>
                        <td className="p-2 border-r border-black text-right">₹{item.mrp}</td>
                        <td className="p-2 text-right font-bold">₹{lineVal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-bold border-t border-black bg-slate-50">
                    <td colSpan="4" className="p-2 border-r border-black text-right">Total Returned Quantity:</td>
                    <td className="p-2 border-r border-black text-center font-black">
                      {printData.items.reduce((sum, item) => sum + item.returnQty, 0)}
                    </td>
                    <td className="p-2 border-r border-black text-right font-black">Grand Total Value:</td>
                    <td className="p-2 text-right font-black text-sm text-slate-800">
                      ₹{printData.items.reduce((sum, item) => sum + (item.returnQty * item.mrp), 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-12 flex justify-between text-[10px]">
                <div className="border-t border-black w-40 text-center pt-1 font-bold text-slate-500">
                  Receiver Signature
                </div>
                <div className="border-t border-black w-40 text-center pt-1 font-bold text-slate-500">
                  Authorized Signatory
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
