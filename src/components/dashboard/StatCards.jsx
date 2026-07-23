import { Package, AlertCircle, IndianRupee, Database, AlertOctagon, PackageX, ExternalLink } from "lucide-react";

export default function StatCards({ stats, onCardClick }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
      
      {/* 1. Today's Revenue */}
      <div 
        onClick={() => onCardClick && onCardClick("todayRevenue")}
        className="bg-white p-3.5 md:p-6 rounded-[20px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-blue-200 flex flex-col-reverse md:flex-row md:items-center justify-between group hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
      >
        <div className="mt-2 md:mt-0">
          <div className="flex items-center gap-1">
            <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Today&apos;s Revenue</p>
            <ExternalLink className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="text-xl md:text-3xl font-extrabold text-blue-600 mt-0.5 md:mt-2">₹{(stats.todayRevenue || 0).toLocaleString('en-IN')}</h3>
          <p className="text-[9px] text-slate-400 font-semibold mt-1 group-hover:text-blue-500 transition-colors">Click for details →</p>
        </div>
        <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-50 text-blue-500 rounded-xl md:rounded-2xl flex items-center justify-center self-end md:self-auto group-hover:scale-110 transition-transform">
          <IndianRupee className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>

      {/* 2. Total Stock Value (MRP) */}
      <div 
        onClick={() => onCardClick && onCardClick("stockValue")}
        className="bg-white p-3.5 md:p-6 rounded-[20px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-blue-200 flex flex-col-reverse md:flex-row md:items-center justify-between group hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
      >
        <div className="mt-2 md:mt-0">
          <div className="flex items-center gap-1">
            <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Value (MRP)</p>
            <ExternalLink className="w-3 h-3 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="text-xl md:text-3xl font-extrabold text-slate-700 mt-0.5 md:mt-2 group-hover:text-blue-600 transition-colors">₹{(stats.totalStockValue || 0).toLocaleString('en-IN')}</h3>
          <p className="text-[9px] text-slate-400 font-semibold mt-1 group-hover:text-blue-500 transition-colors">Click for valuation →</p>
        </div>
        <div className="w-8 h-8 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center self-end md:self-auto group-hover:scale-110 transition-transform">
          <Database className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>

      {/* 3. Total Units Stock */}
      <div 
        onClick={() => onCardClick && onCardClick("totalUnits")}
        className="bg-white p-3.5 md:p-6 rounded-[20px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-indigo-200 flex flex-col-reverse md:flex-row md:items-center justify-between group hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
      >
        <div className="mt-2 md:mt-0">
          <div className="flex items-center gap-1">
            <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Total Units</p>
            <ExternalLink className="w-3 h-3 text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="text-xl md:text-3xl font-extrabold text-slate-700 mt-0.5 md:mt-2 group-hover:text-indigo-600 transition-colors">{(stats.totalUnits || 0).toLocaleString('en-IN')}</h3>
          <p className="text-[9px] text-slate-400 font-semibold mt-1 group-hover:text-indigo-500 transition-colors">Click for stock list →</p>
        </div>
        <div className="w-8 h-8 md:w-12 md:h-12 bg-indigo-50 text-indigo-500 rounded-xl md:rounded-2xl flex items-center justify-center self-end md:self-auto group-hover:scale-110 transition-transform">
          <Package className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>

      {/* 4. Expiry Alerts */}
      <div 
        onClick={() => onCardClick && onCardClick("expiring")}
        className="bg-white p-3.5 md:p-6 rounded-[20px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-rose-200 flex flex-col-reverse md:flex-row md:items-center justify-between group hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
      >
        <div className="mt-2 md:mt-0">
          <div className="flex items-center gap-1">
            <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Expiring (90 Days)</p>
            <ExternalLink className="w-3 h-3 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="text-xl md:text-3xl font-extrabold text-rose-500 mt-0.5 md:mt-2">{stats.expiringCount || 0}</h3>
          <p className="text-[9px] text-slate-400 font-semibold mt-1 group-hover:text-rose-500 transition-colors">Click to view items →</p>
        </div>
        <div className="w-8 h-8 md:w-12 md:h-12 bg-rose-50 text-rose-500 rounded-xl md:rounded-2xl flex items-center justify-center self-end md:self-auto group-hover:scale-110 transition-transform">
          <AlertCircle className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>

      {/* 5. Already Expired Stock */}
      <div 
        onClick={() => onCardClick && onCardClick("expired")}
        className="bg-white p-3.5 md:p-6 rounded-[20px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-rose-300 flex flex-col-reverse md:flex-row md:items-center justify-between group hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
      >
        <div className="mt-2 md:mt-0">
          <div className="flex items-center gap-1">
            <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Already Expired</p>
            <ExternalLink className="w-3 h-3 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="text-xl md:text-3xl font-extrabold text-rose-700 mt-0.5 md:mt-2">{stats.expiredCount || 0}</h3>
          <p className="text-[9px] text-slate-400 font-semibold mt-1 group-hover:text-rose-600 transition-colors">Click to clear expired →</p>
        </div>
        <div className="w-8 h-8 md:w-12 md:h-12 bg-rose-50 text-rose-700 rounded-xl md:rounded-2xl flex items-center justify-center self-end md:self-auto group-hover:scale-110 transition-transform">
          <AlertOctagon className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>

      {/* 6. Out of Stock (Reorder Alert) */}
      <div 
        onClick={() => onCardClick && onCardClick("outOfStock")}
        className="bg-white p-3.5 md:p-6 rounded-[20px] md:rounded-3xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.03)] border border-slate-100 hover:border-amber-200 flex flex-col-reverse md:flex-row md:items-center justify-between group hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
      >
        <div className="mt-2 md:mt-0">
          <div className="flex items-center gap-1">
            <p className="text-[9px] md:text-xs font-bold text-slate-400 uppercase tracking-wider">Out of Stock</p>
            <ExternalLink className="w-3 h-3 text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <h3 className="text-xl md:text-3xl font-extrabold text-amber-500 mt-0.5 md:mt-2">{stats.outOfStockCount || 0}</h3>
          <p className="text-[9px] text-slate-400 font-semibold mt-1 group-hover:text-amber-500 transition-colors">Click for reorder list →</p>
        </div>
        <div className="w-8 h-8 md:w-12 md:h-12 bg-amber-50 text-amber-500 rounded-xl md:rounded-2xl flex items-center justify-center self-end md:self-auto group-hover:scale-110 transition-transform">
          <PackageX className="w-4 h-4 md:w-6 md:h-6" />
        </div>
      </div>

    </div>
  );
}