import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav"; // Naya import

export const metadata = {
  title: "Medical ERP System",
  description: "Smart billing and inventory for pharmacy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 font-sans flex h-screen overflow-hidden">
        
        {/* Sidebar ab sirf Tablet/PC par dikhegi */}
        <div className="hidden md:block">
          <Sidebar />
        </div>
        
        {/* Main Content Area - Mobile par pb-16 (padding-bottom) lagaya taaki bottom nav fit ho sake */}
        <div className="flex-1 flex flex-col md:ml-64 pb-16 md:pb-0 h-screen overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 md:p-8">
            {children}
          </main>
        </div>

        {/* Mobile Nav - Sirf phone par dikhega */}
        <MobileNav />

      </body>
    </html>
  );
}