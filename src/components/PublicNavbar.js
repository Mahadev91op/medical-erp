"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, ShieldCheck, PhoneCall, ArrowRight, User, Menu, X } from "lucide-react";

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-md shadow-blue-500/20">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black text-slate-800 tracking-tight leading-none">PharmaERP</span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">by DevSamp</span>
          </div>
        </Link>

        {/* Center Nav Links - Desktop */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-650">
          <Link href="/about-us" className="hover:text-blue-600 transition-colors">
            About Us
          </Link>
          <Link href="/contact-us" className="hover:text-blue-600 transition-colors">
            Contact Us
          </Link>
          <Link href="/privacy-policy" className="hover:text-blue-600 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms-and-conditions" className="hover:text-blue-600 transition-colors">
            Terms
          </Link>
          <Link href="/refund-policy" className="hover:text-blue-600 transition-colors">
            Refund Policy
          </Link>
          <Link href="/shipping-policy" className="hover:text-blue-600 transition-colors">
            Digital Delivery
          </Link>
        </nav>

        {/* Action Buttons & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link 
            href="/login"
            className="text-xs font-bold text-slate-700 hover:text-blue-600 px-2.5 sm:px-3.5 py-2 rounded-xl hover:bg-slate-100/60 transition-all flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Client</span> Login
          </Link>
          <Link
            href="/signup"
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-extrabold px-3 sm:px-4 py-2 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-1.5"
          >
            <span>Free Trial</span>
            <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
          </Link>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-xl">
          <nav className="flex flex-col space-y-2 text-sm font-bold text-slate-700">
            <Link 
              href="/about-us" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              About Us
            </Link>
            <Link 
              href="/contact-us" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              Contact Us
            </Link>
            <Link 
              href="/privacy-policy" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/terms-and-conditions" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              Terms & Conditions
            </Link>
            <Link 
              href="/refund-policy" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              Refund Policy
            </Link>
            <Link 
              href="/shipping-policy" 
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors"
            >
              Digital Delivery
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
