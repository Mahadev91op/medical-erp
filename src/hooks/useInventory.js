import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

export default function useInventory() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isListening, setIsListening] = useState(false);
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
  const [printQueue, setPrintQueue] = useState([]); 
  
  const isActionActive = useRef(false);
  const [barcodeConfig, setBarcodeConfig] = useState(() => {
    if (typeof window !== "undefined") {
      const savedBarcode = localStorage.getItem("super_barcode_config");
      if (savedBarcode) {
        try { return JSON.parse(savedBarcode); } catch(e) {}
      }
    }
    return {
      showName: true, showPrice: true, showExpiry: true, showBatch: true, showBillNo: true, showPurchaseDate: true, showBarcodeText: true
    };
  });

  useEffect(() => {
    isActionActive.current = showBulkModal || !!editMed;
  }, [showBulkModal, editMed]);

  const startSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "hi-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Listening... Dawa ka naam ya batch bolein");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setSearchTerm(text);
      toast.success(`Searching: "${text}"`);
    };

    recognition.start();
  };

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMedicines(true, searchTerm, currentPage);
    setTimeout(() => setIsRefreshing(false), 500);
  };

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

  return {
    medicines,
    loading,
    searchTerm,
    setSearchTerm,
    isListening,
    editMed,
    setEditMed,
    isUpdating,
    isRefreshing,
    currentPage,
    setCurrentPage,
    totalPages,
    totalItems,
    selectedMeds,
    setSelectedMeds,
    selectedMedsData,
    setSelectedMedsData,
    showBulkModal,
    setShowBulkModal,
    printCopies,
    setPrintCopies,
    printQueue,
    setPrintQueue,
    barcodeConfig,
    setBarcodeConfig,
    startSpeechRecognition,
    fetchMedicines,
    handleRefresh,
    handleDelete,
    handleBulkDelete,
    handleUpdate,
    toggleSelection,
    generateBulkQueue,
    handleSinglePrint
  };
}
