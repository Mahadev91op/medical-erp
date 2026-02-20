import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import AuthProvider from "@/components/AuthProvider";

export const metadata = {
  title: "Pharma ERP System",
  description: "Smart billing and inventory for pharmacy",
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning lagane se browser extension wale error aana band ho jayenge
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 font-sans flex h-screen overflow-hidden" suppressHydrationWarning>
        <AuthProvider>
          <div className="hidden md:block">
            <Sidebar />
          </div>
          
          <div className="flex-1 flex flex-col md:ml-64 pb-16 md:pb-0 h-screen overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
              {children}
            </main>
          </div>

          <MobileNav />
        </AuthProvider>
      </body>
    </html>
  );
}