"use client";
import React, { useRef, useEffect } from "react";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import { Toaster } from "react-hot-toast";
import { formatDate, formatExpiryDate } from "@/lib/formatDate";
import { Loader2, X, Printer, Edit } from "lucide-react";
import useInventory from "@/hooks/useInventory";
import InventoryFilters from "@/components/inventory/InventoryFilters";
import InventoryTable from "@/components/inventory/InventoryTable";

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
  const {
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
    startSpeechRecognition,
    fetchMedicines,
    handleRefresh,
    handleDelete,
    handleBulkDelete,
    handleUpdate,
    toggleSelection,
    generateBulkQueue,
    handleSinglePrint
  } = useInventory();

  const printRef = useRef(null);
  
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
  }, [printQueue, handlePrintFn]);

  if (loading && medicines.length === 0) {
    return <InventorySkeleton />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
      <Toaster position="top-center" />
      
      <InventoryFilters
        handleRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        selectedMeds={selectedMeds}
        handleBulkDelete={handleBulkDelete}
        setShowBulkModal={setShowBulkModal}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        startSpeechRecognition={startSpeechRecognition}
        isListening={isListening}
      />

      {medicines.length === 0 ? (
        <div className="bg-white rounded-2xl md:rounded-3xl p-10 md:p-20 text-center border border-dashed border-slate-300">
          <svg className="w-12 h-12 md:w-16 md:h-16 text-slate-200 mx-auto mb-3 md:mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-base md:text-lg font-bold text-slate-600">No medicines found</h3>
          <p className="text-xs md:text-sm text-slate-400 mt-1">Try a different search term or add a new entry.</p>
        </div>
      ) : (
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/45 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-3xl" style={{ minHeight: '300px' }}>
              <div className="bg-white/90 p-4 rounded-full shadow-md border border-slate-100/80 flex items-center justify-center animate-in fade-in zoom-in duration-200">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            </div>
          )}
          
          <InventoryTable
            medicines={medicines}
            selectedMeds={selectedMeds}
            toggleSelection={toggleSelection}
            setEditMed={setEditMed}
            handleDelete={handleDelete}
            handleSinglePrint={handleSinglePrint}
            formatExpiryDate={formatExpiryDate}
            formatDate={formatDate}
          />
        </div>
      )}

      {/* Premium Pagination Controls */}
      {medicines.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm mt-4 animate-in fade-in duration-200">
          <p className="text-xs md:text-sm text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-800">{medicines.length}</span> of{" "}
            <span className="font-bold text-slate-800">{totalItems.toLocaleString("en-IN")}</span> medicines
          </p>
          
          <div className="flex items-center gap-1.5 select-none font-sans">
            <button
              onClick={() => fetchMedicines(false, searchTerm, 1)}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              title="First Page"
            >
              First
            </button>
            <button
              onClick={() => fetchMedicines(false, searchTerm, currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              title="Previous Page"
            >
              Prev
            </button>
            <span className="px-3.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs font-black tracking-wide shrink-0">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => fetchMedicines(false, searchTerm, currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              title="Next Page"
            >
              Next
            </button>
            <button
              onClick={() => fetchMedicines(false, searchTerm, totalPages)}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              title="Last Page"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Bulk Print Setup Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[24px] md:rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-slate-800 p-4 md:p-6 flex justify-between items-center text-white">
              <div className="flex items-center">
                <Printer className="w-4 h-4 md:w-5 md:h-5 mr-2 md:mr-3 text-blue-400" />
                <h2 className="text-base md:text-lg font-bold tracking-tight">Bulk Print Setup</h2>
              </div>
              <button onClick={() => setShowBulkModal(false)} className="bg-white/10 hover:bg-white/20 p-1.5 md:p-2 rounded-full transition-colors cursor-pointer">
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
                    <div key={id} className="flex items-center justify-between bg-white p-3 md:p-4 rounded-xl md:rounded-2xl border border-slate-200 shadow-sm font-sans">
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

            <div className="p-4 md:p-6 bg-white border-t border-slate-100 flex gap-3 md:gap-4 font-sans">
              <button 
                onClick={() => setShowBulkModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={generateBulkQueue}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center cursor-pointer"
              >
                <Printer className="w-4 h-4 mr-1.5 md:mr-2" /> Start Print
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Details Modal */}
      {editMed && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-[24px] md:rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 p-4 md:p-6 flex justify-between items-center text-white">
              <div className="flex items-center">
                <Printer className="w-4 h-4 md:w-5 h-5 mr-2 md:mr-3" />
                <h2 className="text-base md:text-lg font-bold tracking-tight">Update Details</h2>
              </div>
              <button onClick={() => setEditMed(null)} className="bg-white/20 hover:bg-white/30 p-1.5 md:p-2 rounded-full transition-colors cursor-pointer">
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-5 md:p-8 space-y-4 md:space-y-5 font-sans">
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
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-base font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center mt-2 cursor-pointer"
              >
                {isUpdating ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : "Confirm Changes"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hidden printable container for 2-column barcode label printing */}
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