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
  ChevronRight
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';

const MobileNav = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [showMore, setShowMore] = useState(false);

  const isAuthOrPausedOrNotFound = ["/login", "/signup", "/paused"].includes(pathname) || !["/", "/inventory", "/purchase", "/sell", "/lookup", "/reports", "/distributors", "/profile", "/superadmin", "/khata", "/returns"].includes(pathname);
  
  useEffect(() => {
    if (session?.error === "disabled") {
      signOut({ callbackUrl: "/login" });
    }
  }, [session]);

  if (isAuthOrPausedOrNotFound) return null;

  // Re-ordered navigation links: Billing, Inventory, Lookup are prioritized
  const navLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['superadmin', 'admin', 'staff'] },
    { name: 'Billing', icon: ScanBarcode, path: '/sell', roles: ['admin', 'staff'] },
    { name: 'Inventory', icon: Package, path: '/inventory', roles: ['admin'] },
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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-2.5 flex justify-between items-center z-[80] shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] pb-safe">
        {primaryLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.path;
          return (
            <Link key={link.path} href={link.path} className="flex flex-col items-center space-y-1 flex-1">
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-blue-600' : 'text-slate-400'}`}>
                {link.name}
              </span>
            </Link>
          );
        })}

        {isMoreNeeded ? (
          <button 
            onClick={() => setShowMore(true)} 
            className="flex flex-col items-center space-y-1 flex-1 text-slate-400 focus:outline-none"
          >
            <div className={`p-2 rounded-xl transition-all ${showMore ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>
              <Menu className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold ${showMore ? 'text-slate-800' : 'text-slate-400'}`}>
              More
            </span>
          </button>
        ) : (
          <Link 
            href="/profile"
            className="flex flex-col items-center space-y-1 flex-1 text-slate-400 focus:outline-none"
          >
            <div className={`p-2 rounded-xl transition-all ${pathname === '/profile' ? 'bg-blue-600 text-white' : 'text-slate-400 bg-slate-50'}`}>
              <UserCog className="w-5 h-5" />
            </div>
            <span className={`text-[10px] font-bold ${pathname === '/profile' ? 'text-blue-600' : 'text-slate-400'}`}>
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
            className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] border-t border-slate-100 p-6 z-[100] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out transform pb-12 ${showMore ? 'translate-y-0' : 'translate-y-full'}`}
          >
            {/* Grabber indicator bar (Native mobile look) */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setShowMore(false)} />
            
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 px-2">More Dashboard Actions</h3>

            {/* Clickable Profile Card */}
            <Link
              href="/profile"
              onClick={() => setShowMore(false)}
              className="flex items-center space-x-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-slate-100/80 transition-all mb-4"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                {(session?.user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Logged in as</p>
                <p className="text-sm font-bold text-slate-800 truncate">{session?.user?.name || 'User'}</p>
                <p className="text-[10px] text-blue-600 font-extrabold uppercase">{session?.user?.role}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
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
                    className={`flex items-center space-x-3 p-3.5 rounded-2xl border transition-all ${isActive ? 'bg-blue-600 border-blue-600 text-white font-bold shadow-md shadow-blue-100' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold">{link.name}</span>
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