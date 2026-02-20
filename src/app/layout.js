import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Medical ERP - Smart Pharmacy Management",
  description: "Advanced medicine inventory and billing system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar for Desktop */}
            <Sidebar />

            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <Header />

              {/* Main Content Area */}
              {/* FIX: Mobile par pb-28 add kiya hai taaki content Bottom Nav ke piche na chhup jaye */}
              <main className="flex-1 p-4 md:p-8 lg:p-10 pb-28 lg:pb-10 transition-all duration-300">
                {children}
              </main>

              {/* Mobile Navigation (Fixed at bottom) */}
              <MobileNav />
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}