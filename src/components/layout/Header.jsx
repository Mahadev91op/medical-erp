"use client";
import { useState, useEffect, useRef } from "react";
import { Search, UserCircle, LogOut, Package, IndianRupee, X, AlertTriangle, TrendingDown } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();

  // Live Indian Time State and Effect
  const [indianTime, setIndianTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const options = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      const dateOptions = {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
      };
      const now = new Date();
      const timeFormatter = new Intl.DateTimeFormat("en-IN", options);
      const dateFormatter = new Intl.DateTimeFormat("en-IN", dateOptions);
      setIndianTime(`${dateFormatter.format(now)} | ${timeFormatter.format(now)}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Real-time account check (disable and subscription expiry watchdog)
  useEffect(() => {
    if (session?.error === "disabled") {
      signOut({ callbackUrl: "/login" });
      return;
    }

    if (!session || session.user.role === "superadmin") return;

    const checkSubscriptionLive = async () => {
      try {
        const res = await fetch("/api/user/subscription");
        const data = await res.json();
        if (data.success) {
          if (data.status === "disabled") {
            signOut({ callbackUrl: "/login" });
            return;
          }
          if (data.subscriptionEnd) {
            const expiry = new Date(data.subscriptionEnd);
            if (expiry < new Date()) {
              const currentPath = window.location.pathname;
              const isAllowedPath = 
                currentPath === "/paused" || 
                currentPath === "/profile" ||
                currentPath.startsWith("/api/auth");
              
              if (!isAllowedPath) {
                router.push("/paused");
              }
            }
          }
        }
      } catch (error) {
        console.error("Subscription watchdog error:", error);
      }
    };

    checkSubscriptionLive();
    const interval = setInterval(checkSubscriptionLive, 4000); // Poll every 4 seconds
    return () => clearInterval(interval);
  }, [session, router]);
  
  // Real-time Expiry & Low Stock warnings in Header
  const [alerts, setAlerts] = useState({ lowStock: 0, expiring: 0 });

  useEffect(() => {
    if (!session || session.user.role === "superadmin") return;

    const fetchAlerts = async () => {
      try {
        const res = await fetch("/api/reports?expiryMonths=3&lowStockThreshold=10");
        const data = await res.json();
        if (data.success) {
          setAlerts({
            lowStock: data.lowStock?.length || 0,
            expiring: data.expiringSoon?.length || 0
          });
        }
      } catch (err) {
        console.error("Failed to fetch header alerts:", err);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000); 
    return () => clearInterval(interval);
  }, [session]);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Real-time Search Logic with Debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.trim().length > 1) {
        setIsSearching(true);
        try {
          const res = await fetch('/api/medicine?limit=200');
          const data = await res.json();
          if (data.success) {
            // Filter by name and get top 5 results
            const found = data.medicines.filter(m => 
              m.name.toLowerCase().includes(searchTerm.toLowerCase())
            ).slice(0, 5); 
            
            setResults(found);
            setShowDropdown(true);
          }
        } catch (error) {
          console.error("Search error", error);
        }
        setIsSearching(false);
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 400); // 400ms delay to prevent too many API calls

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Agar login nahi hai, toh Header mat dikhao
  if (!session) return null;

  return (
    <header className="h-16 md:h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-50">
      
      {/* 1. Global Quick Search Bar */}
      <div ref={searchRef} className="relative flex flex-1 md:flex-none items-center bg-slate-50 hover:bg-slate-100 px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl md:w-[400px] border border-slate-200/60 transition-all duration-300 mr-4 group focus-within:ring-4 focus-within:ring-emerald-50 focus-within:border-emerald-200">
        <Search className={`w-4 h-4 mr-2 md:mr-3 shrink-0 ${isSearching ? 'text-emerald-500 animate-pulse' : 'text-slate-400 group-focus-within:text-emerald-500'}`} />
        <input 
          type="text" 
          placeholder="Quick search medicine stock..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.trim().length > 1 && setShowDropdown(true)}
          className="bg-transparent border-none outline-none w-full text-xs md:text-sm text-slate-800 placeholder-slate-400 font-bold"
        />
        {searchTerm && (
          <button onClick={() => {setSearchTerm(""); setShowDropdown(false);}} className="text-slate-400 hover:text-rose-500 ml-2 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Live Search Results Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] border border-slate-100 overflow-hidden z-50">
            {results.length > 0 ? (
              <div className="p-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-2 pt-1 border-b border-slate-50 mb-1">Live Stock Check</p>
                {results.map(med => (
                  <div 
                    key={med._id} 
                    onClick={() => { router.push('/inventory'); setShowDropdown(false); }} 
                    className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-100 group/item"
                  >
                    <div>
                      <p className="font-bold text-slate-800 text-sm group-hover/item:text-emerald-600 transition-colors">{med.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Batch: {med.batch}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-extrabold ${med.quantity < 10 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {med.quantity} <span className="text-[10px] font-semibold opacity-70">in stock</span>
                      </p>
                      <p className="text-xs font-bold text-slate-500 flex items-center justify-end mt-0.5">
                        <IndianRupee className="w-3 h-3 mr-0.5"/> {med.mrp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-sm text-slate-500 font-bold bg-slate-50/50">
                Koi dawai stock mein nahi mili.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Quick Actions & Profile */}
      <div className="flex items-center space-x-3 md:space-x-6 shrink-0">
        
        {/* Live IST Clock */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200/60 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-sm shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-400 font-semibold">IST:</span>
          <span className="font-extrabold font-mono text-slate-700 tracking-tight">{indianTime || "Loading..."}</span>
        </div>

        {/* Live Warnings/Badges */}
        {session?.user?.role !== "superadmin" && (alerts.lowStock > 0 || alerts.expiring > 0) && (
          <div className="hidden sm:flex items-center gap-2">
            {/* Expiring Soon */}
            {alerts.expiring > 0 && (
              <button 
                onClick={() => router.push('/reports')}
                className="flex items-center bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 px-2.5 py-1.5 rounded-xl text-xs font-bold gap-1 shadow-sm transition-all cursor-pointer"
                title={`${alerts.expiring} items expiring soon`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                <span>{alerts.expiring} Expiring</span>
              </button>
            )}
            
            {/* Low Stock */}
            {alerts.lowStock > 0 && (
              <button 
                onClick={() => router.push('/reports')}
                className="flex items-center bg-amber-50 border border-amber-100 hover:bg-amber-100 text-amber-700 px-2.5 py-1.5 rounded-xl text-xs font-bold gap-1 shadow-sm transition-all cursor-pointer"
                title={`${alerts.lowStock} items low in stock`}
              >
                <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                <span>{alerts.lowStock} Low Stock</span>
              </button>
            )}
          </div>
        )}

        {/* New Sale Quick Button (Useful addition) */}
        <button 
          onClick={() => router.push('/sell')} 
          className="hidden lg:flex items-center bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-slate-200"
        >
          <Package className="w-4 h-4 mr-2 text-emerald-400" /> New Sale
        </button>
        
        <div className="flex items-center space-x-3 md:border-l pl-0 md:pl-6 border-slate-100">
          <div className="bg-slate-50 p-1.5 md:p-2 rounded-xl border border-slate-200/60 hidden md:block">
            <UserCircle className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-slate-700 capitalize">{session?.user?.name}</p>
            <p className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5 inline-block">
              {session?.user?.role}
            </p>
          </div>
          
          {/* Logout Button */}
          <button 
            onClick={async () => {
              await signOut({ redirect: false });
              window.location.href = "/login";
            }}
            className="ml-2 p-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}