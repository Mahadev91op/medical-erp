"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PackagePlus, ShoppingCart, AlertTriangle } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Home", icon: LayoutDashboard, path: "/" },
    { name: "Inward", icon: PackagePlus, path: "/purchase" },
    { name: "Sell", icon: ShoppingCart, path: "/sell" },
    { name: "Alerts", icon: AlertTriangle, path: "/reports" },
  ];

  return (
    // md:hidden ka matlab hai Tablet/PC par ye gayab ho jayega, sirf Phone par dikhega
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 flex justify-around items-center h-16 z-50 px-2 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] pb-safe">
      {menuItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link key={item.name} href={item.path} className="flex flex-col items-center justify-center w-full h-full relative">
            {isActive && (
              <span className="absolute top-0 w-8 h-1 bg-emerald-500 rounded-b-full"></span>
            )}
            <item.icon className={`w-5 h-5 mb-1 transition-all duration-300 ${
              isActive ? "text-emerald-600 scale-110" : "text-slate-400"
            }`} />
            <span className={`text-[10px] font-semibold transition-colors duration-300 ${
              isActive ? "text-emerald-700" : "text-slate-400"
            }`}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}