import { ShieldCheck } from "lucide-react";

export default function DashboardHeader() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-slate-500 text-xs md:text-sm mt-1 font-medium">Aaj ka stock aur alerts check karein.</p>
      </div>
      <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 md:px-4 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-semibold flex items-center border border-emerald-100 w-fit">
        <ShieldCheck className="w-4 h-4 mr-1.5 md:mr-2" />
        System Active
      </div>
    </div>
  );
}