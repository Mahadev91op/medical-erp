import { Bell, Search, UserCircle } from "lucide-react";

export default function Header() {
  return (
    <header className="h-16 md:h-20 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      
      {/* Search Bar - Phone par thoda chota, PC par bada */}
      <div className="flex flex-1 md:flex-none items-center bg-slate-50/80 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl md:w-[400px] border border-slate-200/60 focus-within:border-emerald-300 focus-within:ring-4 focus-within:ring-emerald-50 focus-within:bg-white transition-all duration-300 mr-4">
        <Search className="w-4 h-4 text-slate-400 mr-2 md:mr-3 shrink-0" />
        <input 
          type="text" 
          placeholder="Search..." 
          className="bg-transparent border-none outline-none w-full text-xs md:text-sm text-slate-600 placeholder-slate-400 font-medium"
        />
      </div>

      {/* Profile & Alerts */}
      <div className="flex items-center space-x-3 md:space-x-6 shrink-0">
        <button className="relative text-slate-400 hover:text-emerald-600 p-1.5 md:p-2 rounded-full hover:bg-emerald-50">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 md:top-1.5 right-1 md:right-1.5 w-2 h-2 md:w-2.5 md:h-2.5 bg-rose-400 rounded-full border-2 border-white animate-pulse"></span>
        </button>
        
        <div className="flex items-center space-x-3 md:border-l pl-0 md:pl-6 border-slate-100 cursor-pointer">
          <div className="bg-emerald-50 p-1.5 md:p-2 rounded-xl md:rounded-2xl border border-emerald-100/50">
            <UserCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
          </div>
          {/* Phone par text gayab, sirf icon dikhega */}
          <div className="hidden md:block">
            <p className="text-sm font-bold text-slate-700">Admin User</p>
            <p className="text-xs text-slate-400 font-medium">Store Owner</p>
          </div>
        </div>
      </div>
    </header>
  );
}