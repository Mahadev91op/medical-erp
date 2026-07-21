"use client";

import PublicNavbar from "@/components/PublicNavbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import { Activity, ShieldCheck, Zap, Database, BarChart3, CheckCircle2, ArrowRight, Building2, Users } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between">
      <PublicNavbar />

      <main className="grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-16">
        
        {/* Hero Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" /> About DevSamp Technologies
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
            Empowering Modern Pharmacies with Next-Gen Medical ERP
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            <strong>PharmaERP</strong> is a cloud-native and offline-capable Medical ERP SaaS application built specifically for retail chemists, pharmacy chains, and pharmaceutical distributors across India.
          </p>
        </div>

        {/* Company Overview & Mission Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
            <h2 className="text-2xl font-black text-slate-900">Who We Are</h2>
            <p className="text-xs sm:text-sm text-slate-650 leading-relaxed">
              Developed and owned by <strong>DevSamp Technologies</strong>, PharmaERP was born out of a mission to replace slow, outdated desktop billing software with a lightning-fast, secure, and modern SaaS platform.
            </p>
            <p className="text-xs sm:text-sm text-slate-650 leading-relaxed">
              Whether running a single retail pharmacy shop or managing a multi-counter medical store, PharmaERP simplifies inventory batch tracking, expiry date alerts, thermal barcode printing, and GST compliance — all accessible from laptops, tablets, and mobile devices.
            </p>

            <div className="pt-2 flex flex-wrap gap-4 text-xs font-bold text-slate-800">
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>100% Tax Compliant</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Offline PWA Billing</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Thermal Barcode Engine</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-blue-600 text-white p-6 rounded-3xl space-y-3 shadow-lg shadow-blue-500/20">
              <Zap className="w-8 h-8 text-blue-200" />
              <h3 className="text-lg font-extrabold">Instant POS Billing</h3>
              <p className="text-xs text-blue-100 leading-relaxed">
                Scan barcodes, auto-calculate GST rates, and print 50x25mm thermal receipts in seconds.
              </p>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3 shadow-lg">
              <Database className="w-8 h-8 text-emerald-400" />
              <h3 className="text-lg font-extrabold">Automated Cloud Backups</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Daily cloud snapshots and instant JSON data exports guarantee zero data loss.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-3 shadow-xs">
              <ShieldCheck className="w-8 h-8 text-purple-600" />
              <h3 className="text-lg font-extrabold text-slate-900">Drug Expiry Alerts</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Proactive alerts notify pharmacists 3 to 6 months before medicines expire to minimize waste.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 space-y-3 shadow-xs">
              <BarChart3 className="w-8 h-8 text-amber-500" />
              <h3 className="text-lg font-extrabold text-slate-900">Sales & Khata Analytics</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Real-time dashboard reporting tracks distributor payments, profit margins, and credit ledgers.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing & Business Model Section */}
        <div className="bg-gradient-to-tr from-slate-900 via-slate-850 to-blue-950 text-white rounded-3xl p-8 sm:p-12 space-y-8">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black">Transparent Subscription Pricing</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Simple, affordable pricing with zero hidden fees. Evaluate the platform free for 7 days.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 space-y-4">
              <div className="text-xs font-extrabold uppercase text-blue-300 tracking-wider">Evaluation Plan</div>
              <div className="text-3xl font-black">7-Day Free Trial</div>
              <p className="text-xs text-slate-300">Full access to all inventory, billing, thermal barcode, and analytics tools for 7 days.</p>
              <Link 
                href="/signup" 
                className="inline-flex items-center justify-center w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
              >
                Start Free Trial Now
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 space-y-4">
              <div className="text-xs font-extrabold uppercase text-emerald-300 tracking-wider">Standard SaaS License</div>
              <div className="text-3xl font-black">₹499 <span className="text-xs font-normal text-slate-300">/ month</span></div>
              <p className="text-xs text-slate-300">Includes unlimited inventory entries, WhatsApp receipt integration, daily cloud backups, and dedicated support.</p>
              <Link 
                href="/contact-us" 
                className="inline-flex items-center justify-center w-full py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md"
              >
                Contact Sales Team
              </Link>
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
