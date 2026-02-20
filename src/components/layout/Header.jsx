"use client";
import { Bell, Search, UserCircle, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();

  // Agar login page par hain, toh Header mat dikhao
  if (!session) return null;

  return (
    <header className="h-16 md:h-20 bg-white/70 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      
      {/* Search Bar */}
      <div className="flex flex-1 md:flex-none items-center bg-slate-50/80 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl md:w-[400px] border border-slate-200/60 transition-all duration-300 mr-4">
        <Search className="w-4 h-4 text-slate-400 mr-2 md:mr-3 shrink-0" />
        <input 
          type="text" 
          placeholder="Search..." 
          className="bg-transparent border-none outline-none w-full text-xs md:text-sm text-slate-600 placeholder-slate-400 font-medium"
        />
      </div>

      {/* Profile, Alerts & Logout */}
      <div className="flex items-center space-x-3 md:space-x-6 shrink-0">
        <button className="relative text-slate-400 hover:text-emerald-600 p-1.5 md:p-2 rounded-full hover:bg-emerald-50">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-rose-400 rounded-full border-2 border-white animate-pulse"></span>
        </button>
        
        <div className="flex items-center space-x-3 md:border-l pl-0 md:pl-6 border-slate-100">
          <div className="bg-emerald-50 p-1.5 md:p-2 rounded-xl border border-emerald-100/50">
            <UserCircle className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
          </div>
          <div className="hidden md:block">
            {/* Dynamic User Name & Role */}
            <p className="text-sm font-bold text-slate-700 capitalize">{session?.user?.name}</p>
            <p className="text-xs text-slate-400 font-medium capitalize">{session?.user?.role}</p>
          </div>
          
          {/* Logout Button */}
          <button 
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="ml-2 p-2 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}