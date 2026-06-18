"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  PackagePlus, 
  ScanBarcode, 
  BarChart3, 
  LogOut,
  Package,
  ShieldCheck,
  UserCog,
  Truck,
  Search,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  RotateCcw
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

const Sidebar = ({ isCollapsed = false, toggleCollapse }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const isAuthOrPausedOrNotFound = ["/login", "/signup", "/paused"].includes(pathname) || !["/", "/inventory", "/purchase", "/sell", "/lookup", "/reports", "/distributors", "/profile", "/superadmin", "/khata", "/returns"].includes(pathname);
  
  useEffect(() => {
    if (session?.error === "disabled") {
      signOut({ callbackUrl: "/login" });
    }
  }, [session]);

  // Navigation Links definition
  const navLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['superadmin', 'admin', 'staff'] },
    { name: 'Inventory', icon: Package, path: '/inventory', roles: ['admin'] },
    { name: 'Purchase Entry', icon: PackagePlus, path: '/purchase', roles: ['admin'] },
    { name: 'Quick Sell', icon: ScanBarcode, path: '/sell', roles: ['admin', 'staff'] },
    { name: 'Medicine Lookup', icon: Search, path: '/lookup', roles: ['admin', 'staff'] },
    { name: 'Credit Book', icon: BookOpen, path: '/khata', roles: ['admin', 'staff'] },
    { name: 'Distributor Returns', icon: RotateCcw, path: '/returns', roles: ['admin'] },
    { name: 'Reports', icon: BarChart3, path: '/reports', roles: ['admin'] },
  ];

  // Filter links based on user role
  const filteredLinks = navLinks.filter(link => 
    link.roles.includes(session?.user?.role)
  );

  // Prefetch all valid links for this user's role to make tab switching instant
  useEffect(() => {
    filteredLinks.forEach(link => {
      router.prefetch(link.path);
    });
  }, [router, filteredLinks]);

  if (isAuthOrPausedOrNotFound) return null;

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-white border-r border-slate-100 hidden lg:flex flex-col z-[60] transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`${isCollapsed ? 'p-3' : 'p-8'} flex flex-col flex-1 min-h-0 pb-4 transition-all duration-300`}>
        <div className={`flex ${isCollapsed ? 'flex-col items-center gap-4' : 'items-center justify-between'} mb-10 shrink-0`}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
              <PackagePlus className="text-white w-6 h-6" />
            </div>
            {!isCollapsed && (
              <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent animate-in fade-in duration-200">
                MedERP
              </span>
            )}
          </div>
          <button 
            onClick={toggleCollapse} 
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1 select-none">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.path;
            
            return (
              <Link
                key={link.path}
                href={link.path}
                title={isCollapsed ? link.name : undefined}
                className={`flex items-center rounded-2xl transition-all duration-200 group relative ${
                  isCollapsed ? 'justify-center p-3' : 'space-x-3 px-4 py-3.5'
                } ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold' 
                    : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                {!isCollapsed && <span className="text-sm tracking-wide animate-in fade-in duration-200">{link.name}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className={`${isCollapsed ? 'p-3' : 'p-8'} border-t border-slate-50 space-y-4 shrink-0 bg-white transition-all duration-300`}>
        {isCollapsed ? (
          <Link
            href="/profile"
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 mx-auto cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors flex"
            title={`${session?.user?.name || 'User'} (${session?.user?.role}) - Click for Profile Settings`}
          >
            {(session?.user?.name || 'U').charAt(0).toUpperCase()}
          </Link>
        ) : (
          <Link 
            href="/profile" 
            className="block bg-slate-50 p-4 rounded-2xl animate-in fade-in duration-200 hover:bg-slate-100/80 cursor-pointer border border-transparent hover:border-slate-200/50 transition-all"
            title="Click for Profile Settings"
          >
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Logged in as</p>
            <p className="text-sm font-bold text-slate-700 truncate">{session?.user?.name || 'User'}</p>
            <p className="text-[10px] text-blue-600 font-extrabold uppercase">{session?.user?.role}</p>
          </Link>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;