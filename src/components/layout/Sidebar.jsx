"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PackagePlus, ShoppingCart, AlertTriangle, Settings, Activity } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/" },
    { name: "Purchase Entry", icon: PackagePlus, path: "/purchase" },
    { name: "Quick Sell", icon: ShoppingCart, path: "/sell" },
    { name: "Reports & Alerts", icon: AlertTriangle, path: "/reports" },
  ];

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0 shadow-[4px_0_24px_rgba(0,0,0,0.01)]">
      {/* Premium Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-slate-50">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-xl flex items-center justify-center mr-3 shadow-md shadow-emerald-100">
          <Activity className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-slate-700 tracking-tight">
            Pharma<span className="text-emerald-500 font-bold">ERP</span>
          </h1>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link key={item.name} href={item.path}
              className={`flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
                isActive 
                  ? "bg-emerald-50/70 text-emerald-700 font-semibold border border-emerald-100/50 shadow-sm" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-emerald-600"
              }`}
            >
              <item.icon className={`w-5 h-5 mr-3 transition-transform duration-300 ${
                isActive ? "text-emerald-600" : "text-slate-400 group-hover:scale-110 group-hover:text-emerald-500"
              }`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Settings */}
      <div className="p-4 mb-2">
        <Link href="/settings" className="flex items-center px-4 py-3.5 text-slate-500 hover:bg-slate-50 hover:text-emerald-600 rounded-2xl transition-all duration-300 group">
          <Settings className="w-5 h-5 mr-3 text-slate-400 group-hover:rotate-90 transition-transform duration-500" />
          <span className="font-medium">Settings</span>
        </Link>
      </div>
    </div>
  );
}