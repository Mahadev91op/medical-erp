import { AlertCircle, ArrowRight } from "lucide-react";

export default function ExpiryAlerts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 p-6 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-700 flex items-center">
            <span className="w-2 h-2 rounded-full bg-rose-400 mr-3 animate-pulse"></span>
            Urgent Expiry Alerts
          </h2>
          <button className="text-sm text-emerald-600 font-bold hover:text-emerald-700 flex items-center group bg-emerald-50 px-3 py-1.5 rounded-xl transition-colors">
            View All <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="space-y-3">
          {/* List Item 1 */}
          <div className="flex justify-between items-center p-4 bg-rose-50/40 rounded-2xl border border-rose-100/60 hover:bg-rose-50 transition-colors cursor-pointer group">
            <div>
              <span className="font-bold text-slate-800 block group-hover:text-rose-600 transition-colors">Paracetamol 500mg</span>
              <span className="text-xs font-semibold text-slate-500 block mt-0.5">Batch: B-1029</span>
            </div>
            <div className="text-right">
              <span className="text-rose-600 font-bold block">12 Nov 2026</span>
              <span className="text-xs font-semibold text-rose-500 bg-rose-100/50 px-2 py-0.5 rounded-lg mt-1 inline-block">14 Days left</span>
            </div>
          </div>
          
          {/* List Item 2 */}
          <div className="flex justify-between items-center p-4 bg-rose-50/40 rounded-2xl border border-rose-100/60 hover:bg-rose-50 transition-colors cursor-pointer group">
            <div>
              <span className="font-bold text-slate-800 block group-hover:text-rose-600 transition-colors">Azithromycin 250mg</span>
              <span className="text-xs font-semibold text-slate-500 block mt-0.5">Batch: AZ-992</span>
            </div>
            <div className="text-right">
              <span className="text-rose-600 font-bold block">18 Nov 2026</span>
              <span className="text-xs font-semibold text-rose-500 bg-rose-100/50 px-2 py-0.5 rounded-lg mt-1 inline-block">20 Days left</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}