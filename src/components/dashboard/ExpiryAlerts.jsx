import { AlertCircle, ArrowRight } from "lucide-react";

export default function ExpiryAlerts() {
  return (
    <div className="bg-white rounded-[24px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 p-4 md:p-6 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h2 className="text-sm md:text-lg font-bold text-slate-700 flex items-center">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-rose-400 mr-2 md:mr-3 animate-pulse"></span>
          Urgent Expiry Alerts
        </h2>
        <button className="text-[10px] md:text-sm text-emerald-600 font-bold hover:text-emerald-700 flex items-center group bg-emerald-50 px-2 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl transition-colors shrink-0">
          View All <ArrowRight className="w-3 h-3 md:w-4 md:h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
      
      <div className="space-y-2.5 md:space-y-3 flex-1">
        {/* List Item 1 */}
        <div className="flex justify-between items-center p-3 md:p-4 bg-rose-50/40 rounded-xl md:rounded-2xl border border-rose-100/60 hover:bg-rose-50 transition-colors cursor-pointer group">
          <div className="flex-1 pr-2 min-w-0">
            <span className="text-xs md:text-base font-bold text-slate-800 block group-hover:text-rose-600 transition-colors truncate">Paracetamol 500mg</span>
            <span className="text-[9px] md:text-xs font-semibold text-slate-500 block mt-0.5">Batch: B-1029</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] md:text-sm text-rose-600 font-bold block">12 Nov 2026</span>
            <span className="text-[8px] md:text-xs font-semibold text-rose-500 bg-rose-100/50 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-md md:rounded-lg mt-0.5 md:mt-1 inline-block">14 Days left</span>
          </div>
        </div>
        
        {/* List Item 2 */}
        <div className="flex justify-between items-center p-3 md:p-4 bg-rose-50/40 rounded-xl md:rounded-2xl border border-rose-100/60 hover:bg-rose-50 transition-colors cursor-pointer group">
          <div className="flex-1 pr-2 min-w-0">
            <span className="text-xs md:text-base font-bold text-slate-800 block group-hover:text-rose-600 transition-colors truncate">Azithromycin 250mg</span>
            <span className="text-[9px] md:text-xs font-semibold text-slate-500 block mt-0.5">Batch: AZ-992</span>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] md:text-sm text-rose-600 font-bold block">18 Nov 2026</span>
            <span className="text-[8px] md:text-xs font-semibold text-rose-500 bg-rose-100/50 px-1.5 py-0.5 md:px-2 md:py-0.5 rounded-md md:rounded-lg mt-0.5 md:mt-1 inline-block">20 Days left</span>
          </div>
        </div>
      </div>
    </div>
  );
}