"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileNav from "./MobileNav";

const validDashboardPaths = ["/", "/inventory", "/purchase", "/sell", "/lookup", "/reports", "/distributors", "/profile", "/superadmin"];

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  const toggleCollapse = () => {
    const nextVal = !isCollapsed;
    setIsCollapsed(nextVal);
    localStorage.setItem("sidebar_collapsed", String(nextVal));
  };
  
  // Hide layout for auth routes, paused route, or any route not matching valid dashboard pages
  const isAuthOrPausedOrNotFound = ["/login", "/signup", "/paused"].includes(pathname) || !validDashboardPaths.includes(pathname);

  if (isAuthOrPausedOrNotFound) {
    return (
      <div className="min-h-screen bg-slate-50 w-full flex flex-col">
        <main className="flex-1 transition-all duration-300">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isCollapsed={isCollapsed} toggleCollapse={toggleCollapse} />
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isCollapsed ? "lg:ml-20" : "lg:ml-64"}`}>
        <Header />
        <main className="flex-1 p-4 md:p-8 lg:p-10 pb-28 lg:pb-10 transition-all duration-300">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
