"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  PackagePlus, 
  ScanBarcode, 
  BarChart3, 
  Package,
  ShieldCheck,
  UserCog,
  Truck,
  Search,
  Menu,
  LogOut,
  LayoutDashboard,
  BookOpen,
  RotateCcw,
  ChevronRight,
  ClipboardList
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

import { useRouter } from 'next/navigation';

const MobileNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const [showMore, setShowMore] = useState(false);

  const isAuthOrPausedOrNotFound = ["/login", "/signup", "/paused"].includes(pathname) || !["/", "/inventory", "/inventory/import", "/purchase", "/sell", "/lookup", "/reports", "/distributors", "/profile", "/superadmin", "/khata", "/returns", "/reorder"].includes(pathname);
  
  useEffect(() => {
    if (session?.error === "disabled") {
      signOut({ callbackUrl: "/login" });
    }
  }, [session]);

  // Prefetch all links for instant mobile tab navigation
  useEffect(() => {
    const validPaths = ["/", "/sell", "/inventory", "/inventory/import", "/lookup", "/khata", "/returns", "/purchase", "/reports", "/profile", "/reorder"];
    validPaths.forEach(path => {
      router.prefetch(path);
    });
  }, [router]);

  if (isAuthOrPausedOrNotFound) return null;

  // Re-ordered navigation links: Billing, Inventory, Lookup are prioritized
  const navLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['superadmin', 'admin', 'staff'] },
    { name: 'Billing', icon: ScanBarcode, path: '/sell', roles: ['admin', 'staff'] },
    { name: 'Inventory', icon: Package, path: '/inventory', roles: ['admin'] },
    { name: 'Shortages', icon: ClipboardList, path: '/reorder', roles: ['admin', 'staff'] },
    { name: 'Lookup', icon: Search, path: '/lookup', roles: ['admin', 'staff'] },
    { name: 'Credit Book', icon: BookOpen, path: '/khata', roles: ['admin', 'staff'] },
    { name: 'Returns', icon: RotateCcw, path: '/returns', roles: ['admin'] },
    { name: 'Purchase', icon: PackagePlus, path: '/purchase', roles: ['admin'] },
    { name: 'Reports', icon: BarChart3, path: '/reports', roles: ['admin'] },
  ];

  const filteredLinks = navLinks.filter(link => 
    link.roles.includes(session?.user?.role)
  );

  const isMoreNeeded = filteredLinks.length > 4;
  const primaryLinks = isMoreNeeded ? filteredLinks.slice(0, 3) : filteredLinks;
  const secondaryLinks = isMoreNeeded ? filteredLinks.slice(3) : [];

  return (
    <div className="lg:hidden">
      {/* Bottom Navigation Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-100/80 px-2 sm:px-4 py-2 flex justify-between items-center z-[80] shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.08)] pb-safe">
        {primaryLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.path;
          return (
            <Link key={link.path} href={link.path} className="flex flex-col items-center space-y-1 flex-1 touch-active py-0.5">
              <div className={`p-2 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md shadow-blue-300 scale-105' : 'text-slate-400 hover:text-slate-600'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold tracking-tight ${isActive ? 'text-blue-600 font-extrabold' : 'text-slate-400'}`}>
                {link.name}
              </span>
            </Link>
          );
        })}

        {isMoreNeeded ? (
          <button 
            onClick={() => setShowMore(true)} 
            className="flex flex-col items-center space-y-1 flex-1 text-slate-400 focus:outline-none touch-active py-0.5 cursor-pointer"
          >
            <div className={`p-2 rounded-xl transition-all duration-200 ${showMore ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
              <Menu className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold tracking-tight ${showMore ? 'text-slate-800 font-extrabold' : 'text-slate-400'}`}>
              More
            </span>
          </button>
        ) : (
          <Link 
            href="/profile"
            className="flex flex-col items-center space-y-1 flex-1 text-slate-400 focus:outline-none touch-active py-0.5"
          >
            <div className={`p-2 rounded-xl transition-all duration-200 ${pathname === '/profile' ? 'bg-blue-600 text-white shadow-md shadow-blue-300 scale-105' : 'text-slate-400 bg-slate-50'}`}>
              <UserCog className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold tracking-tight ${pathname === '/profile' ? 'text-blue-600 font-extrabold' : 'text-slate-400'}`}>
              Profile
            </span>
          </Link>
        )}
      </div>

      {/* Slide-Up Bottom Sheet Drawer */}
      {isMoreNeeded && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setShowMore(false)}
            className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] transition-opacity duration-300 ${showMore ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          />
          
          {/* Bottom Sheet Card */}
          <div 
            className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] border-t border-slate-100 p-5 sm:p-6 z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] transition-transform duration-300 ease-out transform pb-12 ${showMore ? 'translate-y-0' : 'translate-y-full'}`}
          >
            {/* Grabber indicator bar (Native mobile look) */}
            <div className="w-12 h-1.5 bg-slate-200 hover:bg-slate-300 rounded-full mx-auto mb-5 cursor-pointer touch-active" onClick={() => setShowMore(false)} />
            
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">More Dashboard Actions</h3>
              <button onClick={() => setShowMore(false)} className="text-xs text-slate-400 font-bold hover:text-slate-600">Close</button>
            </div>

            {/* Clickable Profile Card */}
            <Link
              href="/profile"
              onClick={() => setShowMore(false)}
              className="flex items-center space-x-3 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-all mb-4 touch-active"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                {(session?.user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Logged in as</p>
                <p className="text-sm font-bold text-slate-800 truncate">{session?.user?.name || 'User'}</p>
                <p className="text-[10px] text-blue-600 font-extrabold uppercase">{session?.user?.role}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </Link>
            
            <div className="grid grid-cols-2 gap-3">
              {secondaryLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.path;
                return (
                  <Link 
                    key={link.path} 
                    href={link.path}
                    onClick={() => setShowMore(false)}
                    className={`flex items-center space-x-3 p-3.5 rounded-2xl border transition-all touch-active ${isActive ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-md shadow-blue-100' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100'}`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold truncate">{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MobileNav;