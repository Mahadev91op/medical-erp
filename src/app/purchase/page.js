"use client";
import { useState, useRef, useEffect } from "react";
import Barcode from "react-barcode";
import { PackagePlus, Printer, CheckCircle2, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast"; 
import { formatDate } from "@/lib/formatDate";
import { useReactToPrint } from "react-to-print";

const getTodayInputString = () => {
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const year = String(today.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
};

const formatPurchaseDateInput = (value) => {
  let clean = value.replace(/\D/g, "");
  if (clean.length > 6) clean = clean.slice(0, 6);
  
  if (clean.length <= 2) {
    return clean;
  }
  if (clean.length <= 4) {
    return `${clean.slice(0, 2)}/${clean.slice(2)}`;
  }
  return `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4)}`;
};

const formatExpiryDateInput = (value) => {
  let clean = value.replace(/\D/g, "");
  if (clean.length > 4) clean = clean.slice(0, 4);
  
  if (clean.length <= 2) {
    return clean;
  }
  return `${clean.slice(0, 2)}/${clean.slice(2)}`;
};

export default function PurchaseEntry() {
  const [formData, setFormData] = useState({
    name: "", batch: "", expiryDate: "", quantity: "", distributor: "", mrp: "", billNumber: "", purchaseDate: ""
  });
  const [purchaseDateInput, setPurchaseDateInput] = useState(getTodayInputString());
  const [expiryDateInput, setExpiryDateInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedMed, setSavedMed] = useState(null);
  
  const printRef = useRef(null);
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Barcode_Label",
  });
  
  const [distributors, setDistributors] = useState([]);
  
  const nameInputRef = useRef(null); 

  useEffect(() => {
    const fetchDistributors = async () => {
      try {
        // 🔥 OPTIMIZED: 1000s of data load karne ki jagah ab directly chota array load hoga backend se
        const res = await fetch("/api/medicine?getDistributors=true");
        const data = await res.json();
        if (data.success) {
          setDistributors(data.distributors);
        }
      } catch (error) {
        console.error("Error fetching distributors:", error);
      }
    };
    fetchDistributors();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Parse purchaseDate (DD/MM/YY)
    const purchaseParts = purchaseDateInput.split("/");
    if (purchaseParts.length !== 3 || purchaseDateInput.length !== 8) {
      toast.error("Please enter a valid Purchase Date in DD/MM/YY format!");
      return;
    }
    const [pDay, pMonth, pYear] = purchaseParts.map(Number);
    const fullPYear = 2000 + pYear;
    const parsedPurchaseDate = `${fullPYear}-${String(pMonth).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`;
    const pDateObj = new Date(parsedPurchaseDate);
    if (isNaN(pDateObj.getTime()) || pMonth < 1 || pMonth > 12 || pDay < 1 || pDay > 31) {
      toast.error("Invalid Purchase Date!");
      return;
    }

    // Parse expiryDate (MM/YY)
    const expiryParts = expiryDateInput.split("/");
    if (expiryParts.length !== 2 || expiryDateInput.length !== 5) {
      toast.error("Please enter a valid Expiry Date in MM/YY format!");
      return;
    }
    const [eMonth, eYear] = expiryParts.map(Number);
    const fullEYear = 2000 + eYear;
    const lastDay = new Date(fullEYear, eMonth, 0).getDate();
    const parsedExpiryDate = `${fullEYear}-${String(eMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const eDateObj = new Date(parsedExpiryDate);
    if (isNaN(eDateObj.getTime()) || eMonth < 1 || eMonth > 12) {
      toast.error("Invalid Expiry Date!");
      return;
    }

    // Expiry Date Validation (Past date not allowed for Expiry)
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    
    if (eDateObj <= today) {
      toast.error("Expiry date cannot be today or in the past!");
      return;
    }

    setLoading(true);
    
    try {
      const payload = {
        ...formData,
        purchaseDate: parsedPurchaseDate,
        expiryDate: parsedExpiryDate
      };

      const res = await fetch("/api/medicine", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" }
      });
      
      const data = await res.json();
      if (data.success) {
        setSavedMed(data.medicine);
        toast.success(`${data.medicine.name} saved to database successfully!`); 

        if (formData.distributor && !distributors.includes(formData.distributor)) {
          setDistributors([...distributors, formData.distributor]);
        }
        
        setFormData(prev => ({
          name: "",
          batch: "",
          expiryDate: "",
          quantity: "",
          distributor: "",
          mrp: "",
          billNumber: prev.billNumber,
          purchaseDate: ""
        }));
        // Keep the previous purchase date input value instead of resetting it
        setExpiryDateInput("");
        
        nameInputRef.current?.focus();
      } else {
        toast.error("Error: " + data.error);
      }
    } catch (error) {
      toast.error("Something went wrong! Please check your network.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6">
      <Toaster position="top-center" reverseOrder={false} /> 
      
      <div className="flex items-center">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 md:mr-4 border border-emerald-100 shrink-0">
          <PackagePlus className="w-5 h-5 md:w-6 md:h-6" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">Smart Purchase Entry</h1>
          <p className="text-slate-500 text-[10px] md:text-sm font-medium mt-0.5">Enter new stock and generate barcodes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
        
        <div className="bg-white p-4 md:p-6 lg:p-8 rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            
            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Medicine Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Paracetamol 500mg"
                ref={nameInputRef}
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm md:text-base font-medium"
                value={formData.name} 
                onChange={(e) => setFormData({...formData, name: e.target.value})} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-5">
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Batch No.</label>
                <input type="text" required placeholder="e.g. B-1029"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm md:text-base font-medium"
                  value={formData.batch} onChange={(e) => setFormData({...formData, batch: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Quantity</label>
                <input type="number" required placeholder="0" min="1"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm md:text-base font-medium"
                  value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-5">
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Dist. Bill Number</label>
                <input type="text" required placeholder="e.g. INV-1002"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm md:text-base font-medium"
                  value={formData.billNumber} onChange={(e) => setFormData({...formData, billNumber: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Purchase Date (DD/MM/YY)</label>
                <input type="text" required placeholder="DD/MM/YY"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm md:text-base font-medium"
                  value={purchaseDateInput} onChange={(e) => setPurchaseDateInput(formatPurchaseDateInput(e.target.value))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:gap-5">
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">MRP ₹</label>
                <input type="number" required placeholder="0.00" min="0" step="0.01"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm md:text-base font-medium"
                  value={formData.mrp} onChange={(e) => setFormData({...formData, mrp: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Expiry Date (MM/YY)</label>
                <input type="text" required placeholder="MM/YY"
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm md:text-base font-medium"
                  value={expiryDateInput} onChange={(e) => setExpiryDateInput(formatExpiryDateInput(e.target.value))} />
              </div>
            </div>

            <div>
              <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 md:mb-2">Distributor / Agency</label>
              <input 
                type="text" required placeholder="e.g. Cipla / SunPharma"
                list="distributor-suggestions"
                autoComplete="off"
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl px-3 md:px-4 py-2.5 md:py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all text-sm md:text-base font-medium"
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
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs md:text-sm px-4 py-3.5 md:py-4 rounded-xl md:rounded-2xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed mt-2 md:mt-4">
              {loading ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin" /> : "Save Entry & Generate Barcode"}
            </button>
          </form>
        </div>

        <div className="bg-slate-100/50 p-6 md:p-8 rounded-[24px] md:rounded-3xl border border-slate-100 flex flex-col items-center justify-center min-h-[250px] md:min-h-[400px]">
          
          {!savedMed ? (
            <div className="text-center text-slate-400">
              <Printer className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-2 md:mb-3 opacity-30" />
              <p className="font-medium text-xs md:text-base">Submit the form to view the barcode.</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <div className="flex items-center text-emerald-600 font-bold mb-4 md:mb-6 bg-emerald-50 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-emerald-100 text-[10px] md:text-sm">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2" />
                Entry Saved Successfully!
              </div>
              
              <div className="bg-white shadow-xl shadow-slate-200 rounded-lg md:rounded-xl p-3 md:p-4 mb-4 md:mb-6 scale-[0.85] md:scale-100 origin-center">
                <div className="bg-white flex flex-col items-center justify-center overflow-hidden" style={{ width: '50mm', height: '25mm', padding: '2mm' }}>
                  <Barcode value={savedMed.barcodeId} width={1.2} height={32} fontSize={10} margin={0} background="#ffffff" lineColor="#000000" displayValue={true} />
                  
                  <div className="w-full text-center mt-1">
                    <p className="text-[8px] font-bold text-black uppercase tracking-tight leading-tight truncate">
                      BILL: {savedMed.billNumber} | PUR: {formatDate(savedMed.purchaseDate)}
                    </p>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handlePrint}
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs md:text-sm px-5 py-3 rounded-xl md:rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] w-full max-w-[200px]"
              >
                <Printer className="w-4 h-4 text-emerald-400" /> Print Label
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Hidden printable container for barcode label */}
      <div style={{ position: 'absolute', top: '-10000px', left: '-10000px', overflow: 'hidden' }}>
        <div ref={printRef}>
          <style type="text/css" media="print">
            {`
              @page { 
                size: 50mm 25mm; 
                margin: 0mm !important; 
              }
              body { 
                margin: 0mm !important; 
                padding: 0mm !important; 
              }
              .thermal-label {
                width: 50mm !important; 
                height: 25mm !important; 
                page-break-after: always; 
                page-break-inside: avoid;
                display: flex;
                flex-direction: column; 
                justify-content: center; 
                align-items: center;
                box-sizing: border-box; 
                background-color: white;
                overflow: hidden !important; 
                padding: 1mm 3mm; 
              }
              
              .barcode-wrapper {
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
              }
              
              .barcode-wrapper svg {
                max-width: 100% !important; 
                max-height: 20mm !important; 
                object-fit: contain;
              }

              .text-wrapper {
                width: 100%;
                text-align: center;
                margin-top: 1px; 
              }

              .thermal-label:last-child { 
                page-break-after: auto; 
              }
            `}
          </style>

          {savedMed && (
            <div className="thermal-label">
              <div className="barcode-wrapper">
                <Barcode 
                  value={savedMed.barcodeId} 
                  format="CODE128"
                  renderer="svg"     
                  width={1.5}        
                  height={40}        
                  fontSize={10}      
                  margin={0}         
                  textMargin={1}     
                  background="#ffffff" 
                  lineColor="#000000" 
                  displayValue={true} 
                />
              </div>

              <div className="text-wrapper">
                <p className="text-[8px] font-bold text-black uppercase tracking-tight leading-tight truncate" style={{ fontFamily: 'sans-serif' }}>
                  BILL: {savedMed.billNumber} | PUR: {formatDate(savedMed.purchaseDate)}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}