"use client";
import { useState, useEffect, useRef } from "react";
import { 
  RotateCcw, Search, Truck, Calendar, AlertTriangle, 
  Printer, X, ChevronRight, CheckSquare, Square, Loader2,
  Phone, MapPin, UserCheck, Package, Receipt, RefreshCw,
  ChevronDown, ChevronUp, Edit, Save, Trash2, BarChart3,
  Coins, TrendingUp, ArrowLeft
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
  const [activeSubTab, setActiveSubTab] = useState("returns"); // "returns" or "directory"
  const [loading, setLoading] = useState(true);
  const [shopInfo, setShopInfo] = useState(null);

  // -------------------------------------------------------------
  // STATES - EXPIRY RETURNS
  // -------------------------------------------------------------
  const [groupedReturnsCount, setGroupedReturnsCount] = useState({});
  const [selectedDist, setSelectedDist] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // distributor name search in returns list
  
  // Paginated items inside the selected distributor
  const [medicines, setMedicines] = useState([]);
  const [medSearchInput, setMedSearchInput] = useState(""); // local typing search
  const [medSearchTerm, setMedSearchTerm] = useState("");   // debounced search query
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [medsLoading, setMedsLoading] = useState(false);

  // Selections
  const [selectAllDistributor, setSelectAllDistributor] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]); // List of selected IDs (when selectAllDistributor is false)
  const [excludeItems, setExcludeItems] = useState([]); // List of deselected IDs (when selectAllDistributor is true)
  const [returnQtys, setReturnQtys] = useState({}); // mapping: medicineId => return quantity
  const [processing, setProcessing] = useState(false);

  // Print references
  const printRef = useRef(null);
  const [printData, setPrintData] = useState(null);

  // -------------------------------------------------------------
  // STATES - DISTRIBUTOR DIRECTORY
  // -------------------------------------------------------------
  const [distributors, setDistributors] = useState([]);
  const [dirSearchTerm, setDirSearchTerm] = useState("");
  const [expandedDist, setExpandedDist] = useState(null);
  const [distItems, setDistItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [isRefreshingDirectory, setIsRefreshingDirectory] = useState(false);
  const [directoryLoading, setDirectoryLoading] = useState(false);

  // Contact editor states
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ phone: "", address: "" });
  const [contacts, setContacts] = useState({});

  // Advanced delete & analysis states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingDist, setDeletingDist] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisDistName, setAnalysisDistName] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisSearchTerm, setAnalysisSearchTerm] = useState("");
  const [analysisFilterStatus, setAnalysisFilterStatus] = useState("all");

  // -------------------------------------------------------------
  // INITIAL LIFECYCLE
  // -------------------------------------------------------------
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      
      // Load persisted distributor contact details from localStorage
      const savedContacts = localStorage.getItem("distributor_contacts");
      if (savedContacts) {
        try {
          setContacts(JSON.parse(savedContacts));
        } catch (err) {
          console.error("Failed to load local contacts:", err);
        }
      }

      await Promise.all([
        fetchReturns(true),
        fetchShopInfo(),
        fetchContactsFromDb(),
        fetchDistributorData(true)
      ]);
      setLoading(false);
    };
    initData();
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

  // -------------------------------------------------------------
  // METHOD: EXPIRY RETURNS BACKEND TRIGGERS
  // -------------------------------------------------------------
  const fetchReturns = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/returns");
      const data = await res.json();
      if (data.success) {
        setGroupedReturnsCount(data.groupedReturnsCount);
        
        if (selectedDist && !data.groupedReturnsCount[selectedDist]) {
          setSelectedDist("");
          setSelectedItems([]);
          setExcludeItems([]);
          setReturnQtys({});
        }
      }
    } catch (e) {
      toast.error("Failed to load return data");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Fetch paginated medicines for selected distributor
  const fetchMedsForDistributor = async (distName, currentPage = 1, currentSearch = "") => {
    if (!distName) return;
    setMedsLoading(true);
    try {
      const res = await fetch(`/api/returns?distributor=${encodeURIComponent(distName)}&page=${currentPage}&limit=${limit}&search=${encodeURIComponent(currentSearch)}`);
      const data = await res.json();
      if (data.success) {
        setMedicines(data.medicines);
        setTotalCount(data.total);
        setTotalPages(data.pages);
        setPage(data.page);
        
        // Auto initialize quantity for selected items on the current page
        setReturnQtys(prev => {
          const copy = { ...prev };
          let updated = false;
          data.medicines.forEach(med => {
            const id = med._id.toString();
            const isSelected = selectAllDistributor ? !excludeItems.includes(id) : selectedItems.includes(id);
            if (isSelected && copy[id] === undefined) {
              copy[id] = med.quantity;
              updated = true;
            }
          });
          return updated ? copy : prev;
        });
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load medicines list");
    } finally {
      setMedsLoading(false);
    }
  };

  // Reset parameters when a new distributor is chosen
  useEffect(() => {
    if (selectedDist) {
      setMedicines([]);
      setPage(1);
      setMedSearchInput("");
      setMedSearchTerm("");
      setSelectAllDistributor(false);
      setSelectedItems([]);
      setExcludeItems([]);
      setReturnQtys({});
      fetchMedsForDistributor(selectedDist, 1, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDist]);

  // DEBOUNCE EFFECT: Only debounce search input, NOT pagination clicks
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setMedSearchTerm(medSearchInput);
      setPage(1); // Reset page on text search
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [medSearchInput]);

  // INSTANT EFFECT: Fetch immediately on page index shift or debounced term changes
  useEffect(() => {
    if (selectedDist) {
      fetchMedsForDistributor(selectedDist, page, medSearchTerm);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, medSearchTerm]);

  const handleMedSearchChange = (val) => {
    setMedSearchInput(val);
  };

  // -------------------------------------------------------------
  // METHOD: DISTRIBUTORS DIRECTORY BACKEND TRIGGERS
  // -------------------------------------------------------------
  const fetchContactsFromDb = async () => {
    try {
      const res = await fetch("/api/distributor");
      const data = await res.json();
      if (data.success && data.contacts) {
        const contactMap = {};
        data.contacts.forEach(c => {
          contactMap[c.name] = { phone: c.phone, address: c.address };
        });
        setContacts(prev => {
          const merged = { ...prev, ...contactMap };
          localStorage.setItem("distributor_contacts", JSON.stringify(merged));
          return merged;
        });
      }
    } catch (err) {
      console.error("Failed to load DB contacts:", err);
    }
  };

  const fetchDistributorData = async (isSilent = false) => {
    if (!isSilent) setDirectoryLoading(true);
    try {
      const res = await fetch("/api/reports?expiryMonths=3&lowStockThreshold=10");
      const data = await res.json();
      if (data.success) {
        setDistributors(data.distributorStock || []);
      }
    } catch (err) {
      toast.error("Failed to fetch distributor data!");
    } finally {
      if (!isSilent) setDirectoryLoading(false);
    }
  };

  const handleRefreshDirectory = async () => {
    setIsRefreshingDirectory(true);
    await fetchDistributorData(true);
    setTimeout(() => setIsRefreshingDirectory(false), 500);
  };

  const fetchDistributorItems = async (distName) => {
    setItemsLoading(true);
    setDistItems([]);
    try {
      const res = await fetch(`/api/medicine?all=true&limit=1000&distributor=${encodeURIComponent(distName)}`);
      const data = await res.json();
      if (data.success) {
        setDistItems(data.medicines);
      }
    } catch (error) {
      toast.error("Failed to load distributor brands!");
    } finally {
      setItemsLoading(false);
    }
  };

  const toggleExpand = (distName) => {
    if (expandedDist === distName) {
      setExpandedDist(null);
    } else {
      setExpandedDist(distName);
      fetchDistributorItems(distName);
    }
  };

  const startEdit = (distName, currentContact) => {
    setEditingId(distName);
    setEditForm({
      phone: currentContact?.phone || "",
      address: currentContact?.address || ""
    });
  };

  const saveContact = async (distName) => {
    const updated = {
      ...contacts,
      [distName]: { ...editForm }
    };
    setContacts(updated);
    localStorage.setItem("distributor_contacts", JSON.stringify(updated));
    setEditingId(null);
    
    try {
      const res = await fetch("/api/distributor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: distName, phone: editForm.phone, address: editForm.address })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Distributor contacts saved successfully!");
      } else {
        toast.error("Database sync failed!");
      }
    } catch (err) {
      toast.error("Server error syncing contacts!");
    }
  };

  const startDelete = (distName) => {
    setDeletingDist(distName);
    setDeleteConfirmText("");
    setShowDeleteModal(true);
  };

  const executeDelete = async (e) => {
    e.preventDefault();
    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm!");
      return;
    }
    setDeleteLoading(true);
    const toastId = toast.loading(`Deleting distributor '${deletingDist}' and all supplied medicines...`);
    try {
      const res = await fetch(`/api/distributor?name=${encodeURIComponent(deletingDist)}`, {
        method: "DELETE"
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success(resData.message || "Distributor and all associated medicines deleted!", { id: toastId });
        setShowDeleteModal(false);
        setDeletingDist(null);
        setDeleteConfirmText("");
        
        // Refresh both listings
        await fetchDistributorData(true);
        await fetchReturns(true);
      } else {
        toast.error(resData.error || "Failed to delete distributor", { id: toastId });
      }
    } catch (err) {
      toast.error("Server error occurred during deletion", { id: toastId });
    } finally {
      setDeleteLoading(false);
    }
  };

  const openAnalysis = async (distName) => {
    setAnalysisDistName(distName);
    setShowAnalysisModal(true);
    setAnalysisLoading(true);
    setAnalysisData(null);
    setAnalysisSearchTerm("");
    setAnalysisFilterStatus("all");
    try {
      const res = await fetch(`/api/distributor?name=${encodeURIComponent(distName)}`);
      const resData = await res.json();
      if (resData.success) {
        setAnalysisData(resData);
      } else {
        toast.error(resData.error || "Failed to load distributor analysis");
        setShowAnalysisModal(false);
      }
    } catch (err) {
      toast.error("Server error loading distributor analysis");
      setShowAnalysisModal(false);
    } finally {
      setAnalysisLoading(false);
    }
  };

  // -------------------------------------------------------------
  // PRINT & PROCESS MEMO
  // -------------------------------------------------------------
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Debit_Note_${selectedDist}`,
    onAfterPrint: () => {
      setPrintData(null);
    }
  });

  const triggerPrintDebitNote = async () => {
    const count = getSelectedCount();
    if (count === 0) {
      toast.error("Please select at least one item to print!");
      return;
    }

    const toastId = toast.loading("Fetching claim records for Debit Note...");
    try {
      const res = await fetch(`/api/returns?distributor=${encodeURIComponent(selectedDist)}&all=true`);
      const data = await res.json();
      if (data.success) {
        toast.dismiss(toastId);
        
        const allMeds = data.medicines || [];
        const itemsToPrint = allMeds
          .filter(med => {
            const id = med._id.toString();
            return selectAllDistributor ? !excludeItems.includes(id) : selectedItems.includes(id);
          })
          .map(med => ({
            ...med,
            returnQty: returnQtys[med._id.toString()] !== undefined ? returnQtys[med._id.toString()] : med.quantity
          }));

        if (itemsToPrint.length === 0) {
          toast.error("No selected items found to print!");
          return;
        }

        setPrintData({
          distributor: selectedDist,
          date: new Date(),
          items: itemsToPrint
        });
      } else {
        toast.error(data.error || "Failed to load print records", { id: toastId });
      }
    } catch (e) {
      toast.error("Network error preparing print", { id: toastId });
    }
  };

  const handleProcessReturn = async () => {
    const count = getSelectedCount();
    if (count === 0) {
      toast.error("Please select at least one item to return!");
      return;
    }

    if (!window.confirm(`Are you sure you want to process returns for ${count} selected items? This will subtract their quantities from stock.`)) {
      return;
    }

    setProcessing(true);
    const toastId = toast.loading("Processing returns...");
    try {
      let payload = {};
      if (selectAllDistributor) {
        payload = {
          selectAll: true,
          distributor: selectedDist,
          excludeIds: excludeItems,
          customQtys: returnQtys
        };
      } else {
        const itemsToReturn = selectedItems.map(id => {
          const med = medicines.find(m => m._id.toString() === id);
          const returnQty = returnQtys[id] !== undefined ? returnQtys[id] : (med ? med.quantity : 0);
          return {
            medicineId: id,
            returnQty
          };
        }).filter(item => item.returnQty > 0);

        payload = {
          selectAll: false,
          items: itemsToReturn
        };
      }

      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Returns processed successfully!", { id: toastId });
        // Reset selections
        setSelectedItems([]);
        setExcludeItems([]);
        setReturnQtys({});
        setSelectAllDistributor(false);
        // Refresh page listings and count
        await fetchReturns(true);
        if (selectedDist) {
          await fetchMedsForDistributor(selectedDist, page, medSearchTerm);
        }
      } else {
        toast.error(data.error || "Failed to process returns", { id: toastId });
      }
    } catch (e) {
      console.error(e);
      toast.error("Server error processing returns", { id: toastId });
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (printData) {
      setTimeout(() => {
        handlePrint();
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [printData]);

  // -------------------------------------------------------------
  // SELECTION HELPERS
  // -------------------------------------------------------------
  const toggleItemSelection = (med) => {
    const id = med._id.toString();
    if (selectAllDistributor) {
      if (excludeItems.includes(id)) {
        setExcludeItems(excludeItems.filter(itemId => itemId !== id));
        setReturnQtys(prev => ({ ...prev, [id]: med.quantity }));
      } else {
        setExcludeItems([...excludeItems, id]);
        setReturnQtys(prev => {
          const copy = { ...prev };
          delete copy[id];
          return copy;
        });
      }
    } else {
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
    }
  };

  const isItemChecked = (id) => {
    if (selectAllDistributor) {
      return !excludeItems.includes(id);
    }
    return selectedItems.includes(id);
  };

  const getSelectedCount = () => {
    if (selectAllDistributor) {
      return totalCount - excludeItems.length;
    }
    return selectedItems.length;
  };

  const isAllPageSelected = () => {
    if (medicines.length === 0) return false;
    if (selectAllDistributor) {
      return medicines.every(med => !excludeItems.includes(med._id.toString()));
    }
    return medicines.every(med => selectedItems.includes(med._id.toString()));
  };

  const togglePageSelection = () => {
    if (isAllPageSelected()) {
      const pageIds = medicines.map(med => med._id.toString());
      if (selectAllDistributor) {
        const newExclusions = [...new Set([...excludeItems, ...pageIds])];
        setExcludeItems(newExclusions);
        setReturnQtys(prev => {
          const copy = { ...prev };
          pageIds.forEach(id => delete copy[id]);
          return copy;
        });
      } else {
        setSelectedItems(selectedItems.filter(id => !pageIds.includes(id)));
        setReturnQtys(prev => {
          const copy = { ...prev };
          pageIds.forEach(id => delete copy[id]);
          return copy;
        });
      }
    } else {
      const pageIds = medicines.map(med => med._id.toString());
      if (selectAllDistributor) {
        setExcludeItems(excludeItems.filter(id => !pageIds.includes(id)));
        setReturnQtys(prev => {
          const copy = { ...prev };
          medicines.forEach(med => {
            const id = med._id.toString();
            copy[id] = med.quantity;
          });
          return copy;
        });
      } else {
        const newSelected = [...new Set([...selectedItems, ...pageIds])];
        setSelectedItems(newSelected);
        setReturnQtys(prev => {
          const copy = { ...prev };
          medicines.forEach(med => {
            const id = med._id.toString();
            copy[id] = med.quantity;
          });
          return copy;
        });
      }
    }
  };

  // -------------------------------------------------------------
  // LIST FILTERS
  // -------------------------------------------------------------
  const distributorsList = Object.keys(groupedReturnsCount);
  const filteredDistributorsForReturns = distributorsList.filter(d => 
    d.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredDistributorsForDir = distributors.filter(d => 
    d._id?.toLowerCase().includes(dirSearchTerm.toLowerCase())
  );

  if (loading) return <ReturnsSkeleton />;

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 select-none">
      <Toaster position="top-center" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-50 text-rose-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 border border-rose-100 shadow-sm shrink-0">
            {activeSubTab === "returns" ? (
              <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
            ) : (
              <Truck className="w-5 h-5 md:w-6 md:h-6" />
            )}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight leading-tight">
              {activeSubTab === "returns" ? "Distributor Returns Tracker" : "Distributors Directory Ledger"}
            </h1>
            <p className="text-slate-500 text-[10px] md:text-sm font-medium mt-0.5">
              {activeSubTab === "returns" 
                ? "Manage expired stock listings, build Debit Note templates, and process batch return adjustments." 
                : "Monitor wholesale suppliers info, review brand metrics, earnings, and update local directories."
              }
            </p>
          </div>
        </div>

        {/* Dynamic header button if directory subtab is active */}
        {activeSubTab === "directory" && (
          <button 
            onClick={handleRefreshDirectory}
            disabled={isRefreshingDirectory}
            className="flex items-center justify-center bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold shadow-sm hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 transition-all shrink-0 w-full md:w-auto"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingDirectory ? 'animate-spin text-rose-500' : ''}`} />
            {isRefreshingDirectory ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>

      {/* Sub-tab Pill Toggle Switches (Consolidated Navigation Layout) */}
      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl w-full sm:w-[420px] shadow-inner select-none">
        <button
          onClick={() => setActiveSubTab("returns")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
            activeSubTab === "returns"
              ? "bg-white text-rose-600 shadow-sm font-black"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <RotateCcw className="w-4 h-4 shrink-0" />
          Expiry Returns
        </button>
        <button
          onClick={() => setActiveSubTab("directory")}
          className={`flex-1 py-3 px-4 rounded-xl text-xs uppercase font-extrabold tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
            activeSubTab === "directory"
              ? "bg-white text-rose-600 shadow-sm font-black"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Truck className="w-4 h-4 shrink-0" />
          Suppliers Directory
        </button>
      </div>

      {/* SUBTAB 1: EXPIRY RETURNS TRACKER */}
      {activeSubTab === "returns" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          
          {/* Left: Distributors list with expiry counts */}
          <div className={`lg:col-span-1 bg-white p-4 md:p-5 rounded-[24px] md:rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] space-y-4 flex-col max-h-[70vh] ${selectedDist ? 'hidden lg:flex' : 'flex'}`}>
            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Search Distributor</label>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search Agency..." 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl pl-10 pr-4 py-2.5 md:py-3 focus:outline-none focus:border-rose-450 focus:ring-4 focus:ring-rose-50 transition-all text-xs md:text-sm font-semibold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {filteredDistributorsForReturns.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-10 font-medium">No expired items found</p>
              ) : (
                filteredDistributorsForReturns.map(d => {
                  const count = groupedReturnsCount[d] || 0;
                  const isActive = selectedDist === d;
                  return (
                    <div 
                      key={d} 
                      onClick={() => setSelectedDist(d)}
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

          {/* Right: Expired medicines table details */}
          <div className={`lg:col-span-2 space-y-6 ${selectedDist ? 'block' : 'hidden lg:block'}`}>
            {!selectedDist ? (
              <div className="bg-slate-50 border border-dashed border-slate-300 p-12 md:p-24 rounded-[24px] md:rounded-3xl text-center h-full flex flex-col justify-center items-center">
                <Truck className="w-12 h-12 md:w-16 md:h-16 text-slate-200 mx-auto mb-3 opacity-60" />
                <h3 className="text-base md:text-lg font-bold text-slate-600">Select a Distributor</h3>
                <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xs mx-auto">Select a supplier from the left list to view expired items, generate debit adjustment invoices, and sync database records.</p>
              </div>
            ) : (
              <div className="bg-white p-5 md:p-6 rounded-[24px] md:rounded-3xl border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] space-y-6 animate-in fade-in duration-200">
                
                {/* Header actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-50 pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button 
                      onClick={() => setSelectedDist("")}
                      className="lg:hidden p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-xl border border-slate-150 transition-colors mr-1 flex items-center justify-center shrink-0"
                      title="Back to Distributors List"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                      <h3 className="font-extrabold text-lg text-slate-800 capitalize leading-tight">{selectedDist}</h3>
                      <p className="text-[10px] text-slate-400 font-bold block uppercase mt-0.5">Expired Inventory ({getSelectedCount()} selected / {totalCount} total)</p>
                    </div>
                  </div>

                  <div className="flex gap-2.5 w-full sm:w-auto">
                    <button 
                      onClick={triggerPrintDebitNote}
                      disabled={getSelectedCount() === 0}
                      className="flex-1 sm:flex-none bg-slate-800 hover:bg-slate-900 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-blue-400" /> Print Debit Note
                    </button>
                    <button 
                      onClick={handleProcessReturn}
                      disabled={getSelectedCount() === 0 || processing}
                      className="flex-1 sm:flex-none bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-500/10 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4 text-rose-200" />} Confirm Return
                    </button>
                  </div>
                </div>

                {/* Medicine filter inside Returns */}
                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Filter distributor stock..."
                    value={medSearchInput}
                    onChange={(e) => handleMedSearchChange(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs font-bold w-full text-slate-700 placeholder-slate-400"
                  />
                  {medSearchInput && (
                    <button onClick={() => handleMedSearchChange("")} className="text-slate-400 hover:text-rose-500">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Selection helper banner */}
                {isAllPageSelected() && (
                  <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-3 text-xs text-rose-700 flex items-center justify-between animate-in slide-in-from-top-2 duration-200">
                    <span className="font-semibold">
                      {selectAllDistributor 
                        ? `All ${getSelectedCount()} items of ${selectedDist} are selected.` 
                        : `All ${medicines.length} items on this page are selected.`
                      }
                    </span>
                    {!selectAllDistributor && totalCount > medicines.length && (
                      <button 
                        onClick={() => setSelectAllDistributor(true)}
                        className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1 rounded-lg font-bold text-[10px] uppercase transition-all shadow-sm cursor-pointer"
                      >
                        Select all {totalCount} items of {selectedDist}
                      </button>
                    )}
                    {selectAllDistributor && (
                      <button 
                        onClick={() => {
                          setSelectAllDistributor(false);
                          setSelectedItems([]);
                          setExcludeItems([]);
                          setReturnQtys({});
                        }}
                        className="text-rose-600 underline font-bold focus:outline-none"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                )}

                {/* Items List Table */}
                <div className="overflow-x-auto relative">
                  {medsLoading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
                    </div>
                  )}
                  
                  <table className="w-full text-left border-collapse bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[10px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                        <th className="p-3 font-bold w-12 text-center">
                          <button 
                            type="button"
                            onClick={togglePageSelection} 
                            className="focus:outline-none"
                            title="Toggle all on page"
                          >
                            {isAllPageSelected() ? 
                              <CheckSquare className="w-4 h-4 text-rose-600 mx-auto" /> : 
                              <Square className="w-4 h-4 text-slate-350 hover:text-rose-400 transition-colors mx-auto" />
                            }
                          </button>
                        </th>
                        <th className="p-3 font-bold">Medicine Name</th>
                        <th className="p-3 font-bold text-center">Batch</th>
                        <th className="p-3 font-bold text-center">Expiry</th>
                        <th className="p-3 font-bold text-center">Return Qty</th>
                        <th className="p-3 font-bold text-right">Unit MRP</th>
                        <th className="p-3 font-bold text-right">Total MRP</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs md:text-sm">
                      {medicines.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-10 text-center font-bold text-slate-400 text-xs">
                            No expired/near-expiry products found matching filter.
                          </td>
                        </tr>
                      ) : (
                        medicines.map((med) => {
                          const isSelected = isItemChecked(med._id.toString());
                          const returnVal = returnQtys[med._id.toString()] !== undefined ? returnQtys[med._id.toString()] : med.quantity;
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
                                    setReturnQtys({ ...returnQtys, [med._id.toString()]: val });
                                  }}
                                  className="w-16 bg-slate-50 border border-slate-200 px-1.5 py-1 rounded-md text-center text-xs font-bold focus:outline-none focus:border-rose-450 disabled:opacity-50"
                                />
                              </td>
                              <td className="p-3 text-right font-semibold text-slate-500">₹{med.mrp}</td>
                              <td className="p-3 text-right font-black text-rose-600">₹{isSelected ? lineTotal.toFixed(2) : "0.00"}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4 text-[10px] md:text-xs">
                    <span className="font-semibold text-slate-400">
                      Showing page {page} of {totalPages} ({totalCount} total items)
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 font-bold disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

                {/* Total claim info */}
                {getSelectedCount() > 0 && (
                  <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4 flex justify-between items-center flex-wrap gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide">Total Return Claim Summary</p>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">{getSelectedCount()} products selected for return.</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-bold">Estimated Total Claim</p>
                      <p className="text-lg font-black text-rose-600">
                        ₹{(() => {
                          let sum = 0;
                          Object.keys(returnQtys).forEach(id => {
                            const med = medicines.find(m => m._id.toString() === id);
                            if (med) {
                              sum += (returnQtys[id] || 0) * med.mrp;
                            }
                          });
                          return sum.toFixed(2);
                        })()}
                      </p>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

        </div>
      )}

      {/* SUBTAB 2: DISTRIBUTORS DIRECTORY */}
      {activeSubTab === "directory" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Search Header */}
          <div className="bg-white p-4 md:p-5 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)] border border-slate-100 flex items-center bg-slate-50/30">
            <div className="relative flex flex-1 items-center bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 focus-within:ring-4 focus-within:ring-rose-50 focus-within:border-rose-200 transition-all shadow-sm">
              <Search className="w-4 h-4 mr-2.5 text-slate-400 shrink-0" />
              <input 
                type="text" 
                placeholder="Search agency listings..." 
                value={dirSearchTerm}
                onChange={(e) => setDirSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-xs md:text-sm text-slate-700 font-bold"
              />
            </div>
          </div>

          {/* Directory lists */}
          {directoryLoading && distributors.length === 0 ? (
            <div className="text-center py-10 flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-rose-600 animate-spin" />
              <span className="text-xs text-slate-450 font-bold">Loading suppliers directory...</span>
            </div>
          ) : filteredDistributorsForDir.length === 0 ? (
            <div className="bg-white border border-slate-100 p-12 text-center rounded-[24px]">
              <Truck className="w-12 h-12 text-slate-200 mx-auto mb-2 opacity-50" />
              <p className="text-slate-400 font-semibold text-sm">No agency matched search.</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-6">
              {filteredDistributorsForDir.map((dist) => {
                const isExpanded = expandedDist === dist._id;
                const contact = contacts[dist._id] || {};
                const isEditing = editingId === dist._id;

                return (
                  <div 
                    key={dist._id} 
                    className={`bg-white rounded-2xl md:rounded-3xl border shadow-sm transition-all duration-300 overflow-hidden ${isExpanded ? 'border-rose-200 shadow-md' : 'border-slate-100'}`}
                  >
                    {/* Header */}
                    <div className="p-4 md:p-6 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
                      
                      {/* Left Side */}
                      <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-rose-50/50 border border-rose-100 rounded-xl md:rounded-2xl flex items-center justify-center text-rose-600 shrink-0 font-extrabold uppercase text-xs md:text-sm">
                          {dist._id.slice(0, 2)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-extrabold text-slate-800 text-sm md:text-lg leading-tight truncate capitalize">{dist._id}</h3>
                          
                          {/* Contacts info */}
                          <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] md:text-xs text-slate-400 font-semibold">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 shrink-0" />
                              {contact.phone || <em className="opacity-60 font-medium">No contact saved</em>}
                            </span>
                            <span className="flex items-center gap-1 max-w-[200px] truncate" title={contact.address}>
                              <MapPin className="w-3.5 h-3.5 shrink-0" />
                              {contact.address || <em className="opacity-60 font-medium">No address saved</em>}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle stats */}
                      <div className="flex items-center justify-start md:justify-center gap-4 border-t border-b md:border-t-0 md:border-b-0 border-slate-50 py-3 md:py-0 shrink-0">
                        <div className="text-left md:text-center">
                          <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">30d Revenue</p>
                          <p className="text-xs md:text-base font-extrabold text-rose-600">₹{(dist.revenueGenerated || 0).toLocaleString("en-IN")}</p>
                        </div>
                        
                        <div className="w-px h-6 bg-slate-150" />
                        
                        <div className="text-left md:text-center">
                          <p className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Inventory Stock</p>
                          <p className="text-xs md:text-base font-extrabold text-slate-700">{dist.totalQuantity || 0} <span className="text-[8px] md:text-[10px] font-bold text-slate-400">({dist.totalItems || 0} items)</span></p>
                        </div>
                      </div>

                      {/* Right actions */}
                      <div className="flex items-center justify-end gap-1.5 shrink-0">
                        <button 
                          onClick={() => openAnalysis(dist._id)}
                          className="p-2 hover:bg-rose-55 border border-slate-200 hover:border-rose-200 text-slate-450 hover:text-rose-600 rounded-xl shadow-sm transition-all cursor-pointer bg-white"
                          title="Performance Analysis"
                        >
                          <BarChart3 className="w-4 h-4" />
                        </button>

                        {/* Local contact editor triggers */}
                        {isEditing ? (
                          <div className="flex gap-1 animate-in fade-in zoom-in duration-200">
                            <button 
                              onClick={() => saveContact(dist._id)}
                              className="p-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm transition-colors cursor-pointer"
                              title="Save Contacts"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-xl transition-colors cursor-pointer"
                              title="Cancel"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => startEdit(dist._id, contact)}
                            className="p-2 hover:bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-700 rounded-xl shadow-sm transition-all cursor-pointer bg-white"
                            title="Edit Contact details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        <button 
                          onClick={() => startDelete(dist._id)}
                          className="p-2 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl shadow-sm transition-all cursor-pointer bg-white"
                          title="Purge Supplier stock"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        {/* Expanded details expander toggle */}
                        <button 
                          onClick={() => toggleExpand(dist._id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${isExpanded ? 'bg-rose-50 border-rose-100 text-rose-600' : 'hover:bg-slate-50 border-slate-200 text-slate-400 bg-white'}`}
                          title="View items batch catalog"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Editor Form inputs */}
                    {isEditing && (
                      <div className="px-4 pb-4 md:px-6 md:pb-6 pt-0 animate-in slide-in-from-top duration-200 border-t border-slate-50 bg-slate-50/50 p-4">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Edit Contact details</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Mobile No</label>
                            <input 
                              type="text" 
                              placeholder="Phone/Mobile details"
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-rose-400 shadow-sm text-slate-700"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Office / Depot Address</label>
                            <input 
                              type="text" 
                              placeholder="Physical Address details"
                              value={editForm.address}
                              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-rose-400 shadow-sm text-slate-700"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Expand Catalog (Supplied brands table) */}
                    {isExpanded && (
                      <div className="px-4 pb-4 md:px-6 md:pb-6 border-t border-slate-100 bg-slate-50/30 animate-in fade-in duration-300">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-4 pb-3 flex items-center">
                          <Package className="w-3.5 h-3.5 mr-1.5 text-rose-500" /> Supplied Batches & Brands catalog
                        </h4>
                        
                        {itemsLoading ? (
                          <div className="py-10 text-center text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin text-rose-600" />
                            <span className="font-semibold text-xs">Loading supplied items...</span>
                          </div>
                        ) : distItems.length === 0 ? (
                          <p className="text-center text-slate-400 py-6 text-xs font-medium">No items found in stock.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm">
                              <thead>
                                <tr className="bg-slate-50 text-[9px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                                  <th className="p-3 font-bold">Brand/Medicine Name</th>
                                  <th className="p-3 font-bold">Batch No.</th>
                                  <th className="p-3 font-bold text-center">MRP</th>
                                  <th className="p-3 font-bold text-center">Remaining Stock</th>
                                  <th className="p-3 font-bold text-right">Expiration</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                                {distItems.map((item) => {
                                  const isOutOfStock = item.quantity <= 0;
                                  return (
                                    <tr key={item._id} className="hover:bg-slate-50/10 transition-colors">
                                      <td className="p-3 font-extrabold text-slate-700 capitalize">{item.name}</td>
                                      <td className="p-3 font-semibold text-slate-500">{item.batch}</td>
                                      <td className="p-3 text-center font-bold text-rose-600">₹{item.mrp}</td>
                                      <td className="p-3 text-center">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-lg font-extrabold text-[10px] ${isOutOfStock ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-700'}`}>
                                          {isOutOfStock ? "Finished" : `${item.quantity} units`}
                                        </span>
                                      </td>
                                      <td className="p-3 text-right font-bold text-slate-600">{formatExpiryDate(item.expiryDate)}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* HIDDEN PRINTABLE DEBIT NOTE TEMPLATE */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}>
        <div ref={printRef} className="p-10 text-black text-xs bg-white w-[210mm] font-sans" style={{ boxSizing: 'border-box' }}>
          {printData && (
            <div className="space-y-6">
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

              <div className="border border-black p-3 rounded-lg bg-slate-50/50">
                <p className="font-bold text-[10px] uppercase text-slate-500">To Distributor:</p>
                <h3 className="font-extrabold text-sm capitalize mt-0.5">{printData.distributor}</h3>
                <p className="text-[10px] mt-0.5">Please accept the following expired/short-expiry medicines for credit note adjustment or refund claims.</p>
              </div>

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

      {/* MODAL: PURGE DELETE DISTRIBUTOR */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-rose-50/50">
              <h2 className="text-base md:text-lg font-bold text-rose-800 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-rose-500 animate-pulse" />
                Purge Distributor Inventory
              </h2>
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={executeDelete} className="p-6 space-y-5">
              <div className="bg-rose-50/55 border border-rose-100 rounded-2xl p-4 text-rose-700 text-xs font-semibold leading-relaxed">
                🚨 WARNING: Deleting supplier <strong className="capitalize text-slate-800">{deletingDist}</strong> will permanently remove **ALL** medicines and batches supplied by them from your inventory. This action cannot be undone!
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Type <strong className="text-rose-600 select-all">DELETE</strong> to confirm</label>
                <input
                  type="text"
                  required
                  placeholder="Type DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full bg-slate-50 border border-rose-200 text-slate-700 rounded-xl px-3.5 py-3 focus:outline-none focus:border-rose-400 font-bold"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteConfirmText !== "DELETE" || deleteLoading}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-100 flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer text-xs uppercase"
                >
                  {deleteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Confirm Purge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DISTRIBUTOR PERFORMANCE ANALYSIS */}
      {showAnalysisModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[24px] md:rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h2 className="text-base md:text-lg font-bold text-slate-800 flex items-center capitalize">
                <BarChart3 className="w-5 h-5 mr-2 text-rose-500 animate-pulse" />
                {analysisDistName} - Performance & Stock Analysis
              </h2>
              <button 
                onClick={() => setShowAnalysisModal(false)}
                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors bg-white border border-slate-200 shadow-sm cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {analysisLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin text-rose-600 mb-4" />
                <p className="font-semibold text-xs uppercase tracking-wide">Aggregating inventory metrics...</p>
              </div>
            ) : !analysisData ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-slate-400">
                <p className="font-semibold text-xs">No analysis details found.</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Stats */}
                <div className="p-5 md:p-6 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50/20 border-b border-slate-100 shrink-0">
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unique Brands</p>
                    <p className="text-xl font-extrabold text-slate-700">{analysisData.summary.totalItems}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Total distinct models</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Stock Left</p>
                    <p className="text-xl font-extrabold text-slate-700">{analysisData.summary.totalQuantity} <span className="text-xs font-semibold text-slate-400">units</span></p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Across {analysisData.summary.activeBatchesCount} batches</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">MRP Inventory Value</p>
                    <p className="text-xl font-extrabold text-rose-600">₹{analysisData.summary.stockValuation.toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Cost Valuation: ₹{analysisData.summary.purchaseValuation.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">All-Time Sales</p>
                    <p className="text-xl font-extrabold text-emerald-600">₹{(analysisData.summary.revenueGenerated || 0).toLocaleString("en-IN")}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">{analysisData.summary.soldQuantity || 0} units sold ({analysisData.summary.salesCount || 0} bills)</p>
                  </div>
                </div>

                {/* Batch status */}
                <div className="px-5 py-3 md:px-6 bg-slate-50 border-b border-slate-150 flex flex-wrap gap-3 items-center justify-between shrink-0">
                  <div className="flex flex-wrap gap-2 text-[10px] md:text-xs font-bold">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg">
                      Active: {analysisData.summary.activeBatchesCount} batches
                    </span>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg">
                      Expiring &lt; 3M: {analysisData.summary.expiringSoonCount}
                    </span>
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg">
                      Expired: {analysisData.summary.expiredMedsCount}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-650 border border-slate-200 rounded-lg">
                      Out of Stock: {analysisData.summary.outOfStockCount}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={analysisFilterStatus}
                      onChange={(e) => setAnalysisFilterStatus(e.target.value)}
                      className="bg-white border border-slate-200 text-slate-655 text-[10px] md:text-xs font-extrabold px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
                    >
                      <option value="all">All Batches</option>
                      <option value="active">Active Only</option>
                      <option value="lowStock">Low Stock (&lt; 10)</option>
                      <option value="expiringSoon">Expiring Soon</option>
                      <option value="expired">Expired Only</option>
                      <option value="outOfStock">Out of Stock</option>
                    </select>
                  </div>
                </div>

                {/* Search */}
                <div className="p-4 bg-white border-b border-slate-100 shrink-0">
                  <div className="relative flex items-center bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 focus-within:ring-4 focus-within:ring-rose-50 focus-within:border-rose-200 transition-all shadow-sm">
                    <Search className="w-4 h-4 mr-2 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Search supplied stock..."
                      value={analysisSearchTerm}
                      onChange={(e) => setAnalysisSearchTerm(e.target.value)}
                      className="bg-transparent border-none outline-none w-full text-xs font-semibold text-slate-700"
                    />
                  </div>
                </div>

                {/* scroll table */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-slate-50/10">
                  {(() => {
                    const filtered = (analysisData.medicines || []).filter(m => {
                      const matchSearch = m.name?.toLowerCase().includes(analysisSearchTerm.toLowerCase()) || m.batch?.toLowerCase().includes(analysisSearchTerm.toLowerCase());
                      
                      let matchFilter = true;
                      const exp = new Date(m.expiryDate);
                      const nowTime = new Date();
                      const threeM = new Date();
                      threeM.setMonth(threeM.getMonth() + 3);

                      if (analysisFilterStatus === "active") matchFilter = m.quantity > 0;
                      else if (analysisFilterStatus === "lowStock") matchFilter = m.quantity > 0 && m.quantity < 10;
                      else if (analysisFilterStatus === "expired") matchFilter = m.quantity > 0 && exp < nowTime;
                      else if (analysisFilterStatus === "expiringSoon") {
                        matchFilter = m.quantity > 0 && exp >= nowTime && exp <= threeM;
                      }
                      else if (analysisFilterStatus === "outOfStock") matchFilter = m.quantity === 0;

                      return matchSearch && matchFilter;
                    });

                    if (filtered.length === 0) {
                      return <p className="text-center text-slate-400 py-12 text-xs font-semibold">No medicines found matching filters.</p>;
                    }

                    return (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse bg-white rounded-xl border border-slate-150 overflow-hidden shadow-sm">
                          <thead>
                            <tr className="bg-slate-50 text-[9px] md:text-xs text-slate-500 uppercase tracking-wider border-b border-slate-150">
                              <th className="p-3 font-bold">Brand/Medicine Name</th>
                              <th className="p-3 font-bold">Batch No.</th>
                              <th className="p-3 font-bold text-center">MRP / Purchase</th>
                              <th className="p-3 font-bold text-center">Remaining Stock</th>
                              <th className="p-3 font-bold text-right">Expiration</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-xs md:text-sm">
                            {filtered.map((item) => {
                              const isOutOfStock = item.quantity <= 0;
                              const isExp = new Date(item.expiryDate) < new Date();
                              const threeM = new Date();
                              threeM.setMonth(threeM.getMonth() + 3);
                              const isNearExp = !isExp && new Date(item.expiryDate) <= threeM;
                              return (
                                <tr key={item._id} className="hover:bg-slate-50/10 transition-colors">
                                  <td className="p-3 font-extrabold text-slate-700 capitalize">
                                    <p>{item.name}</p>
                                    <p className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Barcode: {item.barcodeId}</p>
                                  </td>
                                  <td className="p-3 font-semibold text-slate-500">{item.batch}</td>
                                  <td className="p-3 text-center">
                                    <p className="font-bold text-rose-600">MRP: ₹{item.mrp}</p>
                                    <p className="text-[9px] text-slate-400 mt-0.5">Cost: ₹{item.purchasePrice || 0}</p>
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-lg font-extrabold text-[10px] ${isOutOfStock ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-700'}`}>
                                      {isOutOfStock ? "Out of Stock" : `${item.quantity} units`}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <p className={`font-bold ${isExp ? 'text-rose-500' : isNearExp ? 'text-amber-500' : 'text-slate-650'}`}>
                                      {new Date(item.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                    <p className="text-[9px] font-bold mt-0.5">
                                      {isExp ? (
                                        <span className="text-rose-500 uppercase tracking-widest text-[8px]">🔴 Expired</span>
                                      ) : isNearExp ? (
                                        <span className="text-amber-500 uppercase tracking-widest text-[8px]">⚠️ Expiring soon</span>
                                      ) : (
                                        <span className="text-slate-400 uppercase tracking-widest text-[8px]">🟢 Safe</span>
                                      )}
                                    </p>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
