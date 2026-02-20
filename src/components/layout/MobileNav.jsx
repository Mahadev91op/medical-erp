"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  PackagePlus, 
  ScanBarcode, 
  BarChart3, 
  Package,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { useSession } from 'next-auth/react';

const MobileNav = () => {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  // Navigation Links - Inhe Sidebar ke sath match kiya gaya hai
  const navLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin'] },
    { name: 'Inventory', icon: Package, path: '/inventory', roles: ['admin'] },
    { name: 'Purchase', icon: PackagePlus, path: '/purchase', roles: ['admin'] },
    { name: 'Billing', icon: ScanBarcode, path: '/sell', roles: ['admin', 'staff'] },
    { name: 'Reports', icon: BarChart3, path: '/reports', roles: ['admin'] },
  ];

  const filteredLinks = navLinks.filter(link => 
    link.roles.includes(session?.user?.role)
  );

  return (
    <div className="lg:hidden">
      {/* Bottom Navigation Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
        {filteredLinks.slice(0, 4).map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.path;
          return (
            <Link key={link.path} href={link.path} className="flex flex-col items-center space-y-1">
              <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'text-slate-400'}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                {link.name}
              </span>
            </Link>
          );
        })}
        
        {/* Menu Button for extra links */}
        <button onClick={() => setIsOpen(true)} className="flex flex-col items-center space-y-1 text-slate-400">
          <div className="p-2 rounded-xl">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold">More</span>
        </button>
      </div>

      {/* Full Screen Menu Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] animate-in fade-in duration-200">
          <div className="absolute right-0 top-0 bottom-0 w-3/4 bg-white shadow-2xl p-8 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-xl font-bold text-slate-800">Menu</h2>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-slate-50 text-slate-500 rounded-full">
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="space-y-4">
              {filteredLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.path;
                return (
                  <Link 
                    key={link.path} 
                    href={link.path} 
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-4 p-4 rounded-2xl transition-all ${isActive ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-600'}`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="font-bold">{link.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileNav;