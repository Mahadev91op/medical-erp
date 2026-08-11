import React from "react";
import Barcode from "react-barcode";
import { Edit, Trash2, Printer, AlertCircle, X, CheckSquare, Square } from "lucide-react";

export default function InventoryTable({
  medicines,
  selectedMeds,
  toggleSelection,
  setEditMed,
  handleDelete,
  handleSinglePrint,
  formatExpiryDate,
  formatDate
}) {
  // eslint-disable-next-line react-hooks/purity
  const thresholdDate = React.useMemo(() => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {medicines.map((med) => {
        const isSelected = selectedMeds.includes(med._id);
        const isExpired = med.expiryDate && new Date(med.expiryDate) < new Date();
        const isOutOfStock = med.quantity <= 0;
        const isExpiringSoon = !isExpired && med.expiryDate && new Date(med.expiryDate) <= thresholdDate;
        const isLowStock = !isOutOfStock && med.quantity < 10;
        
        let statusColor = "border-slate-100 hover:border-slate-200";
        let statusBg = "bg-white";
        let statusBadge = null;
        
        if (isExpired) {
          statusColor = "border-rose-200 hover:border-rose-400 ring-rose-50/20";
          statusBg = "bg-rose-50/10";
          statusBadge = <span className="bg-rose-100 text-rose-700 border border-rose-200 text-[8px] font-black px-2 py-0.5 rounded-full select-none">EXPIRED</span>;
        } else if (isOutOfStock) {
          statusColor = "border-rose-200 hover:border-rose-400 ring-rose-50/20";
          statusBg = "bg-rose-50/10";
          statusBadge = <span className="bg-rose-100 text-rose-700 border border-rose-200 text-[8px] font-black px-2 py-0.5 rounded-full select-none">OUT OF STOCK</span>;
        } else if (isExpiringSoon) {
          statusColor = "border-amber-200 hover:border-amber-400 ring-amber-50/20";
          statusBg = "bg-amber-50/10";
          statusBadge = <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[8px] font-black px-2 py-0.5 rounded-full select-none">EXPIRING SOON</span>;
        } else if (isLowStock) {
          statusColor = "border-amber-200 hover:border-amber-400 ring-amber-50/20";
          statusBg = "bg-amber-50/10";
          statusBadge = <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[8px] font-black px-2 py-0.5 rounded-full select-none">LOW STOCK</span>;
        } else {
          statusColor = "border-emerald-200 hover:border-emerald-300 ring-emerald-50/20";
          statusBg = "bg-emerald-50/10";
          statusBadge = <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[8px] font-black px-2 py-0.5 rounded-full select-none">SAFE</span>;
        }

        return (
          <div 
            key={med._id} 
            className={`rounded-2xl md:rounded-3xl border shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] hover:shadow-xl hover:shadow-blue-500/5 transition-all duration-300 overflow-hidden group ${isSelected ? 'border-blue-400 ring-2 ring-blue-50 bg-blue-50/5' : `${statusColor} ${statusBg}`}`}
          >
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-start gap-4 mb-3 md:mb-4">
                <div className="flex items-start gap-2.5 md:gap-3 flex-1 min-w-0">
                  <button onClick={() => toggleSelection(med)} className="mt-0.5 md:mt-1 focus:outline-none shrink-0 cursor-pointer">
                    {isSelected ? 
                      <CheckSquare className="w-4 h-4 md:w-5 md:h-5 text-blue-500" /> : 
                      <Square className="w-4 h-4 md:w-5 md:h-5 text-slate-300 hover:text-blue-400 transition-colors" />
                    }
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <h3 className="font-bold text-sm md:text-lg text-slate-800 group-hover:text-blue-600 transition-colors leading-tight truncate max-w-[130px] md:max-w-[160px]" title={med.name}>{med.name}</h3>
                      {statusBadge}
                    </div>
                    <span className="text-[8px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-0.5 md:mt-1">ID: {med.barcodeId}</span>
                  </div>
                </div>
                
                <div className="flex space-x-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button 
                    onClick={() => setEditMed(med)}
                    className="p-1.5 md:p-2 bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg md:rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(med._id)}
                    className="p-1.5 md:p-2 bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-600 rounded-lg md:rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 md:gap-3 mb-4 md:mb-5 pl-7 md:pl-8">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 tracking-wider">
                    {med.isLoose ? "Stock (Str/Tab)" : "Stock Qty"}
                  </p>
                  {med.isLoose ? (
                    <div>
                      <p className={`text-xs md:text-sm font-extrabold ${med.quantity < 10 ? 'text-rose-500' : 'text-slate-800'}`}>
                        {Math.floor(med.quantity / (med.tabletsPerStrip || 1))} Str {med.quantity % (med.tabletsPerStrip || 1) > 0 ? `+ ${med.quantity % (med.tabletsPerStrip || 1)} Tab` : ''}
                      </p>
                      <p className="text-[9px] font-bold text-slate-400">{med.quantity} Tabs Total</p>
                    </div>
                  ) : (
                    <p className={`text-sm md:text-base font-extrabold ${med.quantity < 10 ? 'text-rose-500' : 'text-slate-700'}`}>
                      {med.quantity} <span className="text-[8px] font-medium text-slate-400">Pcs</span>
                    </p>
                  )}
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 tracking-wider">Cost Price</p>
                  <p className="text-sm md:text-base font-extrabold text-slate-700">
                    ₹{med.purchasePrice ? (med.isLoose ? (med.purchasePrice * (med.tabletsPerStrip || 1)).toFixed(2) + '/Str' : med.purchasePrice) : 0}
                  </p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <p className="text-[8px] font-bold text-slate-400 uppercase mb-0.5 tracking-wider">MRP</p>
                  {med.isLoose ? (
                    <div>
                      <p className="text-xs md:text-sm font-extrabold text-blue-600">
                        ₹{med.stripMrp || (med.mrp * (med.tabletsPerStrip || 1)).toFixed(2)}/Str
                      </p>
                      <p className="text-[9px] font-bold text-emerald-600">₹{med.mrp.toFixed(2)}/Tab</p>
                    </div>
                  ) : (
                    <p className="text-sm md:text-base font-extrabold text-blue-600">
                      ₹{med.mrp}
                    </p>
                  )}
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
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[10px] md:text-xs font-bold flex items-center justify-center transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1.5 md:mr-2" /> Print Single Label
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
