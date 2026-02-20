import { ShieldCheck } from "lucide-react";

export default function DashboardHeader() {
  return (
    <div className="flex flex-row items-center justify-between bg-white md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-none">
      <div>
        <h1 className="text-lg md:text-2xl font-bold text-slate-800 leading-tight">Dashboard Overview</h1>
        <p className="text-slate-500 text-[10px] md:text-sm mt-0.5 font-medium">Aaj ka stock aur alerts check karein.</p>
      </div>
      <div className="bg-emerald-50 text-emerald-700 px-2 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-sm font-semibold flex items-center border border-emerald-100 w-fit shrink-0">
        <ShieldCheck className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
        <span className="hidden sm:inline">System Active</span>
        <span className="sm:hidden">Active</span>
      </div>
    </div>
  );
}