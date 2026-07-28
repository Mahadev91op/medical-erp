"use client";
import { useState, useEffect, useRef } from "react";
import { 
  Search, Package, PackagePlus, IndianRupee, X, AlertTriangle, TrendingDown, Sparkles,
  Plus, ShoppingCart, ClipboardList, RotateCcw, Users, BarChart3, ChevronDown
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Live Indian Time State and Effect
  const [indianTime, setIndianTime] = useState("");
  const [expiryWarning, setExpiryWarning] = useState(null);

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

    if (!session || session?.user?.role === "superadmin") return;

    const handleSubscriptionData = (data) => {
      if (data.status === "disabled") {
        signOut({ callbackUrl: "/login" });
        return;
      }
      if (data.subscriptionEnd) {
        const expiry = new Date(data.subscriptionEnd);
        const today = new Date();
        const diffTime = expiry - today;
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (expiry < today) {
          setExpiryWarning(null);
          const currentPath = window.location.pathname;
          const isAllowedPath = 
            currentPath === "/paused" || 
            currentPath === "/profile" ||
            currentPath.startsWith("/api/auth");
          
          if (!isAllowedPath) {
            router.push("/paused");
          }
        } else {
          // Redirect back to home if they are active but currently stuck on the pause screen
          const currentPath = window.location.pathname;
          if (currentPath === "/paused") {
            router.push("/");
          }

          if (daysLeft >= 0 && daysLeft <= 5) {
            setExpiryWarning(daysLeft);
          } else {
            setExpiryWarning(null);
          }
        }
      }
    };

    const checkSubscriptionLive = async () => {
      const now = Date.now();
      const cachedVal = localStorage.getItem("sub_status");
      const cachedTime = localStorage.getItem("sub_status_time");

      if (cachedVal && cachedTime && (now - Number(cachedTime)) < 120000) {
        handleSubscriptionData(JSON.parse(cachedVal));
        return;
      }

      try {
        const res = await fetch("/api/user/subscription");
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("sub_status", JSON.stringify(data));
          localStorage.setItem("sub_status_time", String(now));
          handleSubscriptionData(data);
        }
      } catch (error) {
        console.error("Subscription watchdog error:", error);
      }
    };

    const initialTimeout = setTimeout(checkSubscriptionLive, 2000); // Delay initial check
    const interval = setInterval(checkSubscriptionLive, 30000); // Poll every 30 seconds
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [session, router]);
  
  // Real-time Low Stock warning in Header
  const [alerts, setAlerts] = useState({ lowStock: 0 });

  useEffect(() => {
    if (!session || session?.user?.role === "superadmin") return;

    const fetchAlerts = async () => {
      const now = Date.now();
      const cachedVal = localStorage.getItem("header_alerts");
      const cachedTime = localStorage.getItem("header_alerts_time");

      if (cachedVal && cachedTime && (now - Number(cachedTime)) < 60000) {
        setAlerts(JSON.parse(cachedVal));
        return;
      }

      try {
        const res = await fetch("/api/reports?expiryMonths=3&lowStockThreshold=10&onlyAlerts=true");
        const data = await res.json();
        if (data.success) {
          const newAlerts = {
            lowStock: data.lowStock?.length || 0
          };
          localStorage.setItem("header_alerts", JSON.stringify(newAlerts));
          localStorage.setItem("header_alerts_time", String(now));
          setAlerts(newAlerts);
        }
      } catch (err) {
        console.error("Failed to fetch header alerts:", err);
      }
    };

    const initialTimeout = setTimeout(fetchAlerts, 1500); // Delay initial fetch
    const interval = setInterval(fetchAlerts, 60000); 
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [session]);
  
  // Search State & Quick Menu Dropdown State
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const searchRef = useRef(null);
  const quickMenuRef = useRef(null);

  // Click outside to close search and quick menu dropdowns
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
      if (quickMenuRef.current && !quickMenuRef.current.contains(event.target)) {
        setShowQuickMenu(false);
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
          const res = await fetch(`/api/medicine?search=${encodeURIComponent(searchTerm.trim())}&limit=5`);
          const data = await res.json();
          if (data.success) {
            setResults(data.medicines || []);
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

  const isAuthOrPausedOrNotFound = ["/login", "/signup", "/paused"].includes(pathname) || !["/", "/inventory", "/inventory/import", "/purchase", "/sell", "/lookup", "/reports", "/distributors", "/profile", "/superadmin", "/khata", "/returns", "/reorder"].includes(pathname);

  // Agar login nahi hai ya role superadmin hai, toh Header mat dikhao
  if (!session || session?.user?.role === "superadmin" || isAuthOrPausedOrNotFound) return null;

  return (
    <div className="sticky top-0 z-50 w-full flex flex-col">
      {/* Expiry Warning Banner */}
      {expiryWarning !== null && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white px-4 py-2.5 text-center text-xs font-bold flex items-center justify-center gap-2 shadow-sm animate-in slide-in-from-top duration-300">
          <AlertTriangle className="w-4 h-4 text-white animate-bounce shrink-0" />
          <span>
            Attention: Your pharmacy ERP subscription is expiring in <strong className="underline decoration-2">{expiryWarning === 0 ? "today" : `${expiryWarning} ${expiryWarning === 1 ? 'day' : 'days'}`}</strong>. Please contact administrator for renewal.
          </span>
          <button 
            onClick={() => router.push('/profile')} 
            className="ml-3 bg-white/20 hover:bg-white/35 text-white border border-white/25 px-2.5 py-1 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer"
          >
            Renew Info
          </button>
        </div>
      )}
      
      <header className="h-16 md:h-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-3 sm:px-4 md:px-8 gap-2 md:gap-4">
      
      {/* Mobile Brand Logo */}
      <div 
        onClick={() => router.push('/')}
        className="lg:hidden flex items-center gap-1.5 shrink-0 cursor-pointer touch-active mr-1" 
        title="MedERP Home"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-200">
          <PackagePlus className="text-white w-4 h-4" />
        </div>
      </div>

      {/* 1. Global Quick Search Bar */}
      <div ref={searchRef} className="relative flex flex-1 md:flex-none items-center bg-slate-50 hover:bg-slate-100 px-2.5 sm:px-3 md:px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl md:w-[260px] lg:w-[360px] border border-slate-200/60 transition-all duration-300 group focus-within:ring-2 md:focus-within:ring-4 focus-within:ring-blue-50 focus-within:border-blue-200">
        <Search className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 md:mr-3 shrink-0 ${isSearching ? 'text-blue-500 animate-pulse' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
        <input 
          type="text" 
          placeholder="Search medicine..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.trim().length > 1 && setShowDropdown(true)}
          className="bg-transparent border-none outline-none w-full text-xs md:text-sm text-slate-800 placeholder-slate-400 font-bold"
        />
        {searchTerm && (
          <button onClick={() => {setSearchTerm(""); setShowDropdown(false);}} className="text-slate-400 hover:text-rose-500 ml-1.5 transition-colors p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Live Search Results Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-100 overflow-hidden z-50 min-w-[280px]">
            {results.length > 0 ? (
              <div className="p-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 pb-2 pt-1 border-b border-slate-50 mb-1">Live Stock Check</p>
                {results.map(med => (
                  <div 
                    key={med._id} 
                    onClick={() => { router.push('/inventory'); setShowDropdown(false); }} 
                    className="flex justify-between items-center p-2.5 sm:p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors border border-transparent hover:border-slate-100 group/item"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-800 text-xs sm:text-sm group-hover/item:text-blue-600 transition-colors truncate">{med.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-wider">Batch: {med.batch}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-xs sm:text-sm font-extrabold ${med.quantity < 10 ? 'text-rose-500' : 'text-blue-500'}`}>
                        {med.quantity} <span className="text-[9px] sm:text-[10px] font-semibold opacity-70">in stock</span>
                      </p>
                      <p className="text-[11px] sm:text-xs font-bold text-slate-500 flex items-center justify-end mt-0.5">
                        <IndianRupee className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5"/> {med.mrp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs sm:text-sm text-slate-500 font-bold bg-slate-50/50">
                No medicines found in stock.
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Quick Actions & Profile */}
      <div className="flex items-center space-x-2.5 md:space-x-4 shrink-0">
        
        {/* MedERP AI Assistant Button */}
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chatbot'))}
          className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl text-xs font-bold transition-all border border-blue-100/50 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm shadow-blue-100/20"
          title="Ask MedERP AI Assistant"
        >
          <Sparkles className="w-4 h-4 text-blue-500 animate-pulse shrink-0" />
          <span className="hidden sm:inline">MedERP AI</span>
        </button>

        {/* Live IST Clock */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200/60 text-slate-700 px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-sm shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          <span className="text-slate-400 font-semibold">IST:</span>
          <span className="font-extrabold font-mono text-slate-700 tracking-tight">{indianTime || "Loading..."}</span>
        </div>

        {/* Live Warnings/Badges (Low Stock) */}
        {session?.user?.role !== "superadmin" && alerts.lowStock > 0 && (
          <div className="hidden md:flex items-center gap-2">
            <button 
              onClick={() => router.push('/reports')}
              className="flex items-center bg-amber-50 border border-amber-100 hover:bg-amber-100 text-amber-700 px-2.5 py-1.5 rounded-xl text-xs font-bold gap-1 shadow-sm transition-all cursor-pointer"
              title={`${alerts.lowStock} items low in stock`}
            >
              <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
              <span>{alerts.lowStock} Low Stock</span>
            </button>
          </div>
        )}

        {/* ➕ Quick Shortcuts Dropdown (+) Button */}
        <div ref={quickMenuRef} className="relative">
          <button 
            onClick={() => setShowQuickMenu(prev => !prev)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-3 py-2 md:px-3.5 md:py-2.5 rounded-xl md:rounded-2xl text-xs font-extrabold transition-all shadow-md shadow-blue-500/20 active:scale-95 cursor-pointer"
            title="Quick Shortcuts Menu"
          >
            <Plus className={`w-4 h-4 md:w-4.5 md:h-4.5 transition-transform duration-200 ${showQuickMenu ? 'rotate-45' : ''}`} />
            <span className="hidden sm:inline text-xs font-extrabold">Shortcuts</span>
            <ChevronDown className={`w-3.5 h-3.5 opacity-70 hidden sm:inline transition-transform duration-200 ${showQuickMenu ? 'rotate-180' : ''}`} />
          </button>

          {showQuickMenu && (
            <div className="absolute right-0 top-full mt-3 w-64 md:w-72 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.18)] border border-slate-100 overflow-hidden z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-1 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Quick Shortcuts</span>
                <span className="text-[9px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">1-Click Navigation</span>
              </div>

              <div className="space-y-0.5">
                <button
                  onClick={() => { router.push('/sell'); setShowQuickMenu(false); }}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-all group text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">New Sale (Billing)</p>
                    <p className="text-[10px] text-slate-400 font-medium">Create counter bill</p>
                  </div>
                </button>

                <button
                  onClick={() => { router.push('/purchase'); setShowQuickMenu(false); }}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-all group text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-colors shrink-0">
                    <PackagePlus className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Add Purchase Intake</p>
                    <p className="text-[10px] text-slate-400 font-medium">Stock intake & bills</p>
                  </div>
                </button>

                <button
                  onClick={() => { router.push('/reorder'); setShowQuickMenu(false); }}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-all group text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors shrink-0">
                    <ClipboardList className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Shortage / Reorder</p>
                    <p className="text-[10px] text-slate-400 font-medium">Shortage notebook</p>
                  </div>
                </button>

                <button
                  onClick={() => { router.push('/returns'); setShowQuickMenu(false); }}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-all group text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors shrink-0">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Returns & Expiry</p>
                    <p className="text-[10px] text-slate-400 font-medium">Distributor returns</p>
                  </div>
                </button>

                <button
                  onClick={() => { router.push('/inventory'); setShowQuickMenu(false); }}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-all group text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Inventory Stock</p>
                    <p className="text-[10px] text-slate-400 font-medium">View & edit medicines</p>
                  </div>
                </button>

                <button
                  onClick={() => { router.push('/khata'); setShowQuickMenu(false); }}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-all group text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Customer Khata</p>
                    <p className="text-[10px] text-slate-400 font-medium">Udhar & ledger</p>
                  </div>
                </button>

                <button
                  onClick={() => { router.push('/reports'); setShowQuickMenu(false); }}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl transition-all group text-left cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-600 flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-colors shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">Reports & Analytics</p>
                    <p className="text-[10px] text-slate-400 font-medium">Sales & profit reports</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </header>
    </div>
  );
}