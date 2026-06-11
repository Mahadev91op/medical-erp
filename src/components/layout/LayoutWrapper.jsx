"use client";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileNav from "./MobileNav";

const validDashboardPaths = ["/", "/inventory", "/purchase", "/sell", "/lookup", "/reports", "/distributors", "/profile", "/superadmin"];

export default function LayoutWrapper({ children }) {
  const pathname = usePathname();
  
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
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Header />
        <main className="flex-1 p-4 md:p-8 lg:p-10 pb-28 lg:pb-10 transition-all duration-300">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
