"use client";
import { useState, useEffect, useRef } from "react";
import { 
  Package, Search, Printer, Edit, Trash2, 
  Loader2, X, AlertCircle, CheckSquare, Square, RefreshCw
} from "lucide-react";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import toast, { Toaster } from "react-hot-toast";
import { formatDate, formatExpiryDate } from "@/lib/formatDate";

const InventorySkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-pulse">
      {/* Header Area */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-200 rounded-xl md:rounded-2xl shrink-0"></div>
          <div className="ml-3 md:ml-4 space-y-2">
            <div className="h-5 w-44 bg-slate-200 rounded-md"></div>
            <div className="h-3.5 w-64 bg-slate-200 rounded-md"></div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="h-10 w-24 bg-slate-200 rounded-xl"></div>
          <div className="h-10 w-full sm:w-80 bg-slate-200 rounded-xl"></div>
        </div>
      </div>

      {/* Grid of Shimmer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 p-4 md:p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="w-5 h-5 bg-slate-200 rounded mt-1 shrink-0"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-5 w-3/4 bg-slate-200 rounded-md"></div>
                  <div className="h-3 w-1/2 bg-slate-200 rounded-md"></div>
                </div>
              </div>
              <div className="w-16 h-6 bg-slate-200 rounded-full"></div>
            </div>

            <div className="border-t border-slate-50 pt-4 space-y-2">
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-200 rounded-md"></div>
                <div className="h-3 w-28 bg-slate-200 rounded-md"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
                <div className="h-3 w-24 bg-slate-200 rounded-md"></div>
              </div>
              <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-200 rounded-md"></div>
                <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
              </div>
            </div>

            <div className="border-t border-slate-50 pt-4 flex justify-between items-center gap-4">
              <div className="space-y-1">
                <div className="h-3.5 w-16 bg-slate-200 rounded-md"></div>
                <div className="h-5 w-24 bg-slate-200 rounded-md"></div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Inventory() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMed, setEditMed] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Selections
  const [selectedMeds, setSelectedMeds] = useState([]); 
  const [selectedMedsData, setSelectedMedsData] = useState({});
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [printCopies, setPrintCopies] = useState({}); 
  
  const printRef = useRef(null);
  const [printQueue, setPrintQueue] = useState([]); 
  
  const isActionActive = useRef(false);

  const [barcodeConfig, setBarcodeConfig] = useState({
    showName: true, showPrice: true, showExpiry: true, showBatch: true, showBillNo: true, showPurchaseDate: true, showBarcodeText: true
  });

  useEffect(() => {
    const savedBarcode = localStorage.getItem("super_barcode_config");
    if (savedBarcode) {
      try { setBarcodeConfig(JSON.parse(savedBarcode)); } catch(e) {}
    }
  }, []);

  useEffect(() => {
    isActionActive.current = showBulkModal || !!editMed;
  }, [showBulkModal, editMed]);

  // DEBOUNCED SERVER-SIDE SEARCH (resets page to 1)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchMedicines(false, searchTerm, 1);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Auto Refresh
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isActionActive.current) {
        fetchMedicines(true, searchTerm, currentPage);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [searchTerm, currentPage]);

  const fetchMedicines = async (isSilent = false, search = "", page = 1) => {
    if (!isSilent) setLoading(true);
    try {
      const limit = 50; // Performance friendly limit
      const res = await fetch(`/api/medicine?limit=${limit}&page=${page}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setMedicines(data.medicines);
        setCurrentPage(data.pagination.page || 1);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalItems(data.pagination.total || 0);
        
        if (!isSilent) {
          const initialCopies = {};
          data.medicines.forEach(m => initialCopies[m._id] = 1);
          setPrintCopies(initialCopies);
        } else {
          setPrintCopies(prev => {
            const newCopies = { ...prev };
            data.medicines.forEach(m => {
              if (newCopies[m._id] === undefined) newCopies[m._id] = 1;
            });
            return newCopies;
          });
        }
      }
    } catch (error) {
      if (!isSilent) toast.error("Failed to load data!");
    }
    if (!isSilent) setLoading(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMedicines(true, searchTerm, currentPage);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handlePrintFn = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Barcode_Label",
    onAfterPrint: () => {
      console.log("Print process finished, clearing queue.");
      setPrintQueue([]);
      setShowBulkModal(false);
      setSelectedMeds([]);
      setSelectedMedsData({});
    },
    onPrintError: (error) => {
      console.error("Print Error:", error);
      toast.error("Error generating print!");
      setPrintQueue([]);
    }
  });

  useEffect(() => {
    if (printQueue.length > 0) {
      const timer = setTimeout(() => {
        handlePrintFn();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printQueue]);

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    try {
      const res = await fetch(`/api/medicine?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Medicine deleted successfully!");
        setSelectedMeds(prev => prev.filter(medId => medId !== id)); 
        setSelectedMedsData(prev => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
        fetchMedicines(true, searchTerm, currentPage);
      }
    } catch (error) {
      toast.error("Error deleting medicine!");
    }
  };

  const handleBulkDelete = async () => {
    if (selectedMeds.length === 0) return;
    if (!confirm(`Are you sure you want to delete all ${selectedMeds.length} selected medicines?`)) return;
    try {
      const idsStr = selectedMeds.join(",");
      const res = await fetch(`/api/medicine?id=${idsStr}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Selected medicines deleted successfully!");
        setSelectedMeds([]);
        setSelectedMedsData({});
        fetchMedicines(true, searchTerm, currentPage);
      } else {
        toast.error("Failed to delete selected medicines!");
      }
    } catch (error) {
      toast.error("Error deleting selected medicines!");
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
        toast.success("Stock updated successfully!");
        setEditMed(null);
        fetchMedicines(true, searchTerm, currentPage);
      }
    } catch (error) {
      toast.error("Update failed!");
    }
    setIsUpdating(false);
  };

  const toggleSelection = (med) => {
    const id = med._id;
    if (selectedMeds.includes(id)) {
      setSelectedMeds(selectedMeds.filter(medId => medId !== id));
      setSelectedMedsData(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    } else {
      setSelectedMeds([...selectedMeds, id]);
      setSelectedMedsData(prev => ({ ...prev, [id]: med }));
    }
  };

  const generateBulkQueue = () => {
    const queue = [];
    selectedMeds.forEach(id => {
      const med = selectedMedsData[id];
      if (med) {
        const copies = printCopies[id] || 1;
        for (let i = 0; i < copies; i++) {
          queue.push(med);
        }
      }
    });
    
    if (queue.length === 0) {
      toast.error("No medicine selected!");
      return;
    }
    
    setPrintQueue(queue); 
  };

  const handleSinglePrint = (med) => {
    setPrintQueue([med]);
  };

  if (loading && medicines.length === 0) {
    return <InventorySkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
      <Toaster position="top-center" />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 md:mr-4 border border-blue-100 shadow-sm shrink-0">
            <Package className="w-5 h-5 md:w-6 md:h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-tight">Medicine Inventory</h1>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium mt-0.5">Manage your entire stock and barcodes.</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center justify-center bg-white border border-slate-200 text-slate-600 px-3 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold shadow-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>

          {selectedMeds.length > 0 && (
            <>
              <button 
                onClick={handleBulkDelete}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center justify-center transition-all shadow-md shrink-0 animate-in fade-in"
              >
                <Trash2 className="w-4 h-4 md:w-5 md:h-5 mr-2 text-rose-200" />
                Delete ({selectedMeds.length})
              </button>
              
              <button 
                onClick={() => setShowBulkModal(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center justify-center transition-all shadow-md shrink-0 animate-in fade-in"
              >
                <Printer className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-400" />
                Print ({selectedMeds.length})
              </button>
            </>
          )}

          <div className="relative w-full sm:w-80 group">
            <input 
              type="text" 
              placeholder="Search Name, Batch or Barcode..." 
              className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-4 py-3 md:py-3.5 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm md:text-base font-medium shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3.5 md:left-4 top-3 md:top-4 text-slate-400 w-4 h-4 md:w-5 md:h-5 group-focus-within:text-blue-500 transition-colors" />
          </div>
        </div>
      </div>

      {medicines.length === 0 ? (
        <div className="bg-white rounded-2xl md:rounded-3xl p-10 md:p-20 text-center border border-dashed border-slate-300">
          <Package className="w-12 h-12 md:w-16 md:h-16 text-slate-200 mx-auto mb-3 md:mb-4" />
          <h3 className="text-base md:text-lg font-bold text-slate-600">No medicines found</h3>
          <p className="text-xs md:text-sm text-slate-400 mt-1">Try a different search term or add a new entry.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {medicines.map((med) => {
            const isSelected = selectedMeds.includes(med._id);
            return (
              <div 
                key={med._id} 
                className={`bg-white rounded-2xl md:rounded-3xl border shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden group ${isSelected ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-100'}`}
              >
                <div className="p-4 md:p-6">
                  <div className="flex justify-between items-start gap-4 mb-3 md:mb-4">
                    <div className="flex items-start gap-2.5 md:gap-3 flex-1 min-w-0">
                      <button onClick={() => toggleSelection(med)} className="mt-0.5 md:mt-1 focus:outline-none shrink-0">
                        {isSelected ? 
                          <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-blue-500" /> : 
                          <Square className="w-4 h-4 md:w-5 md:h-5 text-slate-300 hover:text-blue-400 transition-colors" />
                        }
                      </button>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm md:text-lg text-slate-800 group-hover:text-blue-600 transition-colors leading-tight truncate" title={med.name}>{med.name}</h3>
                        <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5 md:mt-1">ID: {med.barcodeId}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button 
                        onClick={() => setEditMed(med)}
                        className="p-1.5 md:p-2 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg md:rounded-xl transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(med._id)}
                        className="p-1.5 md:p-2 bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg md:rounded-xl transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-5 pl-7 md:pl-8">
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 tracking-wider">Stock Qty</p>
                      <p className={`text-sm md:text-base font-extrabold ${med.quantity < 10 ? 'text-rose-500' : 'text-slate-700'}`}>
                        {med.quantity} <span className="text-[8px] font-medium text-slate-400">Pcs</span>
                      </p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 tracking-wider">Cost Price</p>
                      <p className="text-sm md:text-base font-extrabold text-slate-700">
                        ₹{med.purchasePrice || 0}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-2 rounded-xl">
                      <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 tracking-wider">MRP</p>
                      <p className="text-sm md:text-base font-extrabold text-blue-600">
                        ₹{med.mrp}
                      </p>
                    </div>
                  </div>

                  <div className="pl-7 md:pl-8 mb-4 md:mb-5 flex justify-center">
                    <div className="bg-white px-3 py-2 border border-slate-100 rounded-xl shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)] inline-flex flex-col items-center">
                      <Barcode 
                        value={med.barcodeId} 
                        width={1.2} 
                        height={32} 
                        fontSize={10} 
                        margin={0} 
                        displayValue={true} 
                        background="transparent"
                        lineColor="#334155" 
                      />
                      <div className="w-full text-center mt-1">
                        <p className="text-[8px] font-bold text-slate-700 uppercase tracking-tight leading-tight truncate">
                          BILL: {med.billNumber || "N/A"} | PUR: {med.purchaseDate ? formatDate(med.purchaseDate) : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[9px] md:text-xs font-bold text-slate-500 mb-4 md:mb-6 pl-7 md:pl-8">
                    <div className="flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1 text-slate-300 hidden md:block" />
                      Batch: <span className="text-slate-800 ml-1">{med.batch}</span>
                    </div>
                    <div className="flex items-center">
                      Exp: <span className="text-slate-800 ml-1">{formatExpiryDate(med.expiryDate)}</span>
                    </div>
                  </div>

                  <div className="pt-3 md:pt-4 border-t border-slate-50 flex flex-col items-center">
                    <button 
                      onClick={() => handleSinglePrint(med)} 
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold flex items-center justify-center transition-all"
                    >
                      <Printer className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" /> Print Single Label
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Premium Pagination Controls */}
      {medicines.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm mt-4 animate-in fade-in duration-200">
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{medicines.length}</span> of{" "}
            <span className="font-bold text-slate-800">{totalItems.toLocaleString("en-IN")}</span> medicines
          </p>
          
          <div className="flex items-center gap-1.5 select-none">
            {/* First Page */}
            <button
              onClick={() => fetchMedicines(false, searchTerm, 1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 disabled:cursor-not-allowed shrink-0"
              title="First Page"
            >
              First
            </button>
            
            {/* Previous Page */}
            <button
              onClick={() => fetchMedicines(false, searchTerm, currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 disabled:cursor-not-allowed shrink-0"
              title="Previous Page"
            >
              Prev
            </button>
            
            {/* Page indicator */}
            <span className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-black tracking-wide shrink-0">
              Page {currentPage} of {totalPages}
            </span>
            
            {/* Next Page */}
            <button
              onClick={() => fetchMedicines(false, searchTerm, currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 disabled:cursor-not-allowed shrink-0"
              title="Next Page"
            >
              Next
            </button>
            
            {/* Last Page */}
            <button
              onClick={() => fetchMedicines(false, searchTerm, totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-600 disabled:hover:border-slate-200 disabled:cursor-not-allowed shrink-0"
              title="Last Page"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[24px] md:rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 p-4 md:p-6 flex justify-between items-center text-white">
              <div className="flex items-center">
                <Printer className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 text-blue-400" />
                <h2 className="text-base md:text-lg font-bold tracking-tight">Bulk Print Setup</h2>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="bg-white/10 hover:bg-white/20 p-1.5 md:p-2 rounded-full transition-colors">
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            
            <div className="p-4 md:p-6 overflow-y-auto flex-1 bg-slate-50">
              <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 md:mb-4">Set Copies for Each Medicine</p>
              <div className="space-y-2.5 md:space-y-3">
                {selectedMeds.map(id => {
                  const med = medicines.find(m => m._id === id);
                  if (!med) return null;
                  return (
                    <div key={id} className="flex items-center justify-between bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm">
                      <div className="flex-1 pr-3 md:pr-4 min-w-0">
                        <p className="font-bold text-xs md:text-sm text-slate-800 truncate">{med.name}</p>
                        <p className="text-[9px] md:text-[10px] text-slate-500 mt-0.5">Stock: {med.quantity} | {med.barcodeId}</p>
                      </div>
                      <div className="flex items-center space-x-1.5 md:space-x-2 shrink-0">
                        <label className="text-[10px] md:text-xs font-bold text-slate-400">Copies:</label>
                        <input 
                          type="number" min="1" max="100"
                          className="w-12 md:w-16 bg-slate-50 border border-slate-200 px-1 md:px-2 py-1 md:py-1.5 rounded-lg text-center text-xs md:text-sm font-bold outline-none focus:border-blue-400"
                          value={printCopies[id] || 1}
                          onChange={(e) => setPrintCopies({...printCopies, [id]: parseInt(e.target.value) || 1})}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex gap-3 md:gap-4">
              <button 
                onClick={() => setShowBulkModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={generateBulkQueue}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center"
              >
                <Printer className="w-4 h-4 mr-1.5 md:mr-2" /> Start Print
              </button>
            </div>
          </div>
        </div>
      )}

      {editMed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[24px] md:rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 p-4 md:p-6 flex justify-between items-center text-white">
              <div className="flex items-center">
                <Edit className="w-4 h-4 md:w-5 h-5 mr-2 md:mr-3" />
                <h2 className="text-base md:text-lg font-bold tracking-tight">Update Details</h2>
              </div>
              <button onClick={() => setEditMed(null)} className="bg-white/20 hover:bg-white/30 p-1.5 md:p-2 rounded-full transition-colors">
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-5 md:p-8 space-y-4 md:space-y-5">
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 md:mb-2">Medicine Name</label>
                <input 
                  type="text" required
                  className="w-full bg-slate-50 border border-slate-200 p-3 md:p-4 rounded-xl md:rounded-2xl text-sm md:text-base focus:ring-4 focus:ring-blue-50 outline-none font-bold"
                  value={editMed.name} 
                  onChange={(e) => setEditMed({...editMed, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 md:gap-4">
                <div>
                  <label className="block text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 text-rose-500">Edit Stock</label>
                  <input 
                    type="number" required
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 md:p-3.5 rounded-xl text-xs md:text-sm focus:ring-4 focus:ring-blue-50 outline-none font-bold"
                    value={editMed.quantity} 
                    onChange={(e) => setEditMed({...editMed, quantity: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Cost Price</label>
                  <input 
                    type="number" required
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 md:p-3.5 rounded-xl text-xs md:text-sm focus:ring-4 focus:ring-blue-50 outline-none font-bold"
                    value={editMed.purchasePrice || ""} 
                    onChange={(e) => setEditMed({...editMed, purchasePrice: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">MRP Price</label>
                  <input 
                    type="number" required
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 md:p-3.5 rounded-xl text-xs md:text-sm focus:ring-4 focus:ring-blue-50 outline-none font-bold"
                    value={editMed.mrp} 
                    onChange={(e) => setEditMed({...editMed, mrp: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isUpdating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-base font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center mt-2"
              >
                {isUpdating ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : "Confirm Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🔥 THE FINAL MASTER FIX: 2-column barcode print layout update */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', overflow: 'hidden' }}>
        <div ref={printRef}>
          <style type="text/css" media="print">
            {`
              @page { 
                size: 102mm 25mm; 
                margin: 0mm !important; 
              }
              body { 
                margin: 0mm !important; 
                padding: 0mm !important; 
              }
              .labels-row {
                width: 102mm !important;
                height: 25mm !important;
                display: flex;
                justify-content: space-between;
                align-items: center;
                page-break-after: always;
                page-break-inside: avoid;
                box-sizing: border-box;
                padding: 0;
                background-color: white;
                overflow: hidden;
              }
              .labels-row:last-child {
                page-break-after: auto;
              }
              .thermal-label {
                width: 50mm !important; 
                height: 25mm !important; 
                display: flex;
                flex-direction: column; 
                justify-content: center; 
                align-items: center;
                box-sizing: border-box; 
                background-color: white;
                overflow: hidden !important; 
                padding: 1mm 2mm; 
              }
              
              .barcode-wrapper {
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              
              .barcode-wrapper svg {
                max-width: 100% !important; 
                max-height: 16mm !important; 
                object-fit: contain;
              }

              .text-wrapper {
                width: 100%;
                text-align: center;
                margin-top: 1px; 
              }
            `}
          </style>

          {(() => {
            const chunkedQueue = [];
            for (let i = 0; i < printQueue.length; i += 2) {
              chunkedQueue.push(printQueue.slice(i, i + 2));
            }
            
            return chunkedQueue.map((pair, rowIndex) => (
              <div key={`row-${rowIndex}`} className="labels-row">
                {pair.map((item, index) => (
                  <div key={`${item._id}-${rowIndex}-${index}`} className="thermal-label">
                    <div className="barcode-wrapper">
                      <Barcode 
                        value={item.barcodeId} 
                        format="CODE128"
                        renderer="svg"     
                        width={1.4}        
                        height={28}        
                        fontSize={8}      
                        margin={0}         
                        textMargin={1}     
                        background="#ffffff" 
                        lineColor="#000000" 
                        displayValue={barcodeConfig.showBarcodeText} 
                      />
                    </div>

                    <div className="text-wrapper flex flex-col items-center leading-none mt-1 space-y-0.5 w-full text-center">
                      {barcodeConfig.showName && (
                        <p className="text-[9px] font-black text-black uppercase tracking-tight leading-none truncate max-w-full" style={{ fontFamily: 'sans-serif', margin: 0 }}>
                          {item.name}
                        </p>
                      )}
                      <p className="text-[7px] font-bold text-black uppercase tracking-tight leading-none" style={{ fontFamily: 'sans-serif', margin: 0 }}>
                        {[
                          barcodeConfig.showBatch && `B: ${item.batch}`,
                          barcodeConfig.showExpiry && `E: ${formatExpiryDate(item.expiryDate)}`
                        ].filter(Boolean).join(" | ")}
                      </p>
                      <p className="text-[7px] font-bold text-black uppercase tracking-tight leading-none" style={{ fontFamily: 'sans-serif', margin: 0 }}>
                        {[
                          barcodeConfig.showPrice && `₹${item.mrp}`,
                          barcodeConfig.showBillNo && `BILL: ${item.billNumber}`,
                          barcodeConfig.showPurchaseDate && `PUR: ${formatDate(item.purchaseDate)}`
                        ].filter(Boolean).join(" | ")}
                      </p>
                    </div>
                  </div>
                ))}
                {pair.length === 1 && (
                  <div className="thermal-label empty-label" style={{ visibility: 'hidden' }} />
                )}
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}