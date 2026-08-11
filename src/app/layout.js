import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNav from "@/components/layout/MobileNav";
import AuthProvider from "@/components/AuthProvider";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

// Viewport configuration for Native App feel & iOS Notch/Safe Area support
export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata = {
  title: "Medical ERP - Smart Pharmacy Management",
  description: "Advanced medicine inventory and billing system",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MedERP",
    startupImage: "/icon-512x512.png",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/apple-icon.png",
  },
};

import SessionTracker from "@/components/layout/SessionTracker";
import LayoutWrapper from "@/components/layout/LayoutWrapper";

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <SessionTracker />
          <LayoutWrapper>
            {children}
          </LayoutWrapper>
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}