import React from "react";
import { RefreshCw, Trash2, Printer, Search, Mic } from "lucide-react";

export default function InventoryFilters({
  handleRefresh,
  isRefreshing,
  selectedMeds,
  handleBulkDelete,
  setShowBulkModal,
  searchTerm,
  setSearchTerm,
  startSpeechRecognition,
  isListening
}) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div className="flex items-center">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mr-3 md:mr-4 border border-blue-100 shadow-sm shrink-0">
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
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
          className="flex items-center justify-center bg-white border border-slate-200 text-slate-600 px-3 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold shadow-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0 cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>

        {selectedMeds.length > 0 && (
          <>
            <button 
              onClick={handleBulkDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center justify-center transition-all shadow-md shrink-0 animate-in fade-in cursor-pointer"
            >
              <Trash2 className="w-4 h-4 md:w-5 md:h-5 mr-2 text-rose-200" />
              Delete ({selectedMeds.length})
            </button>
            
            <button 
              onClick={() => setShowBulkModal(true)}
              className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-3 md:py-3.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold flex items-center justify-center transition-all shadow-md shrink-0 animate-in fade-in cursor-pointer"
            >
              <Printer className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-400" />
              Print ({selectedMeds.length})
            </button>
          </>
        )}

        <div className="relative w-full sm:w-80 group flex items-center">
          <input 
            type="text" 
            placeholder="Search Name, Batch or Barcode..." 
            className="w-full bg-white border border-slate-200 text-slate-700 rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-12 py-3 md:py-3.5 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all text-sm md:text-base font-medium shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-3.5 md:left-4 top-3 md:top-4.5 text-slate-400 w-4 h-4 md:w-5 md:h-5 group-focus-within:text-blue-500 transition-colors" />
          <button
            type="button"
            onClick={startSpeechRecognition}
            className={`absolute right-3.5 p-1.5 rounded-full transition-all cursor-pointer ${isListening ? 'text-rose-500 animate-pulse bg-rose-100' : 'text-slate-400 hover:text-blue-600'}`}
            title="Voice Search"
          >
            <Mic className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
