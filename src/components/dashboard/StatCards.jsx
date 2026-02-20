import { Package, AlertCircle, TrendingDown } from "lucide-react";

export default function StatCards() {
  return (
    // Tablet (sm) me 2 card aayenge, Phone me 1, aur PC (lg) me 3
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      
      {/* Total Stock */}
      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        <div>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Stock</p>
          <h3 className="text-3xl md:text-4xl font-extrabold text-slate-700 mt-1 md:mt-2 group-hover:text-emerald-600 transition-colors">1,245</h3>
        </div>
        <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-50 text-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center">
          <Package className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      </div>

      {/* Expiry Alerts */}
      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        <div>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Expiring Soon</p>
          <h3 className="text-3xl md:text-4xl font-extrabold text-rose-500 mt-1 md:mt-2">14</h3>
        </div>
        <div className="w-12 h-12 md:w-14 md:h-14 bg-rose-50 text-rose-500 rounded-xl md:rounded-2xl flex items-center justify-center">
          <AlertCircle className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      </div>

      {/* Low Stock */}
      <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex items-center justify-between group hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        <div>
          <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock</p>
          <h3 className="text-3xl md:text-4xl font-extrabold text-amber-500 mt-1 md:mt-2">8</h3>
        </div>
        <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-50 text-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center">
          <TrendingDown className="w-5 h-5 md:w-6 md:h-6" />
        </div>
      </div>

    </div>
  );
}