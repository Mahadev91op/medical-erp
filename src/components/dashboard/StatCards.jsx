import { Package, AlertCircle, TrendingDown } from "lucide-react";

export default function StatCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
      
      {/* Total Stock */}
      <div className="bg-white p-3.5 md:p-6 rounded-[20px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col-reverse md:flex-row md:items-center justify-between group hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        <div className="mt-2 md:mt-0">
          <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Stock</p>
          <h3 className="text-xl md:text-4xl font-extrabold text-slate-700 mt-0.5 md:mt-2 group-hover:text-emerald-600 transition-colors">1,245</h3>
        </div>
        <div className="w-8 h-8 md:w-14 md:h-14 bg-emerald-50 text-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center self-end md:self-auto">
          <Package className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>

      {/* Expiry Alerts */}
      <div className="bg-white p-3.5 md:p-6 rounded-[20px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-col-reverse md:flex-row md:items-center justify-between group hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        <div className="mt-2 md:mt-0">
          <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Expiring</p>
          <h3 className="text-xl md:text-4xl font-extrabold text-rose-500 mt-0.5 md:mt-2">14</h3>
        </div>
        <div className="w-8 h-8 md:w-14 md:h-14 bg-rose-50 text-rose-500 rounded-xl md:rounded-2xl flex items-center justify-center self-end md:self-auto">
          <AlertCircle className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>

      {/* Low Stock (Mobile par full width lega, PC par single column) */}
      <div className="col-span-2 lg:col-span-1 bg-white p-3.5 md:p-6 rounded-[20px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 flex flex-row md:flex-row items-center justify-between group hover:-translate-y-1 transition-all duration-300 cursor-pointer">
        <div>
          <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Low Stock</p>
          <h3 className="text-xl md:text-4xl font-extrabold text-amber-500 mt-0.5 md:mt-2">8</h3>
        </div>
        <div className="w-8 h-8 md:w-14 md:h-14 bg-amber-50 text-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center">
          <TrendingDown className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>

    </div>
  );
}