"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  LayoutDashboard
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

const Sidebar = () => {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAuthOrPausedOrNotFound = ["/login", "/signup", "/paused"].includes(pathname) || !["/", "/inventory", "/purchase", "/sell", "/lookup", "/reports", "/distributors", "/profile", "/superadmin"].includes(pathname);
  
  useEffect(() => {
    if (session?.error === "disabled") {
      signOut({ callbackUrl: "/login" });
    }
  }, [session]);

  if (isAuthOrPausedOrNotFound) return null;

  // Navigation Links definition
  const navLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['superadmin', 'admin', 'staff'] },
    { name: 'Inventory', icon: Package, path: '/inventory', roles: ['admin'] },
    { name: 'Purchase Entry', icon: PackagePlus, path: '/purchase', roles: ['admin'] },
    { name: 'Quick Sell', icon: ScanBarcode, path: '/sell', roles: ['admin', 'staff'] },
    { name: 'Medicine Lookup', icon: Search, path: '/lookup', roles: ['admin', 'staff'] },
    { name: 'Reports', icon: BarChart3, path: '/reports', roles: ['admin'] },
    { name: 'Distributors', icon: Truck, path: '/distributors', roles: ['admin'] },
    { name: 'Profile Settings', icon: UserCog, path: '/profile', roles: ['superadmin', 'admin', 'staff'] },
  ];

  // Filter links based on user role
  const filteredLinks = navLinks.filter(link => 
    link.roles.includes(session?.user?.role)
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-100 hidden lg:flex flex-col z-[60]">
      <div className="p-8 flex flex-col flex-1 min-h-0 pb-4">
        <div className="flex items-center space-x-3 mb-10 shrink-0">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <PackagePlus className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-500 bg-clip-text text-transparent">
            MedERP
          </span>
        </div>

        <nav className="space-y-1.5 flex-1 overflow-y-auto pr-1 select-none">
          {filteredLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.path;
            
            return (
              <Link
                key={link.path}
                href={link.path}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 font-bold' 
                    : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`} />
                <span className="text-sm tracking-wide">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-8 border-t border-slate-50 space-y-4 shrink-0 bg-white">
        <div className="bg-slate-50 p-4 rounded-2xl">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Logged in as</p>
          <p className="text-sm font-bold text-slate-700 truncate">{session?.user?.name || 'User'}</p>
          <p className="text-[10px] text-blue-600 font-extrabold uppercase">{session?.user?.role}</p>
        </div>

        <button 
          onClick={async () => {
            await signOut({ redirect: false });
            window.location.href = "/login";
          }}
          className="flex items-center space-x-3 px-4 py-3 w-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all duration-200 font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;