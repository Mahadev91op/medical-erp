"use client";

import Link from "next/link";
import { Activity, Mail, Phone, MapPin, Clock, ShieldCheck, FileText, CheckCircle2 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 font-sans border-t border-slate-800">
      {/* Top Banner / Trust Badges */}
      <div className="border-b border-slate-800/80 bg-slate-950/60 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase text-white tracking-wider">100% Secure Payments</h4>
              <p className="text-[11px] text-slate-400">Encrypted via Razorpay SSL</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase text-white tracking-wider">Instant SaaS Activation</h4>
              <p className="text-[11px] text-slate-400">Digital Credentials via Email</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase text-white tracking-wider">Dedicated Support</h4>
              <p className="text-[11px] text-slate-400">Mon-Sat (10:00 AM - 7:00 PM IST)</p>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold uppercase text-white tracking-wider">7-Day Free Trial</h4>
              <p className="text-[11px] text-slate-400">No Credit Card Required</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/30">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-black text-white tracking-tight">PharmaERP</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              PharmaERP is a next-generation Medical ERP and Pharmacy Inventory Management SaaS application developed by <strong>DevSamp Technologies</strong>. Streamline billing, GST compliance, stock expiry, and thermal barcode printing.
            </p>
            <div className="text-xs font-bold text-slate-300">
              Developed & Owned by: <span className="text-blue-400 font-extrabold">DevSamp Technologies</span>
            </div>
          </div>

          {/* Quick Links Column */}
          <div className="md:col-span-2 space-y-3">
            <h3 className="text-xs font-extrabold uppercase text-white tracking-widest text-slate-200">Company</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-blue-400 transition-colors">Home / Dashboard</Link>
              </li>
              <li>
                <Link href="/about-us" className="hover:text-blue-400 transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/contact-us" className="hover:text-blue-400 transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-blue-400 transition-colors">Client Login</Link>
              </li>
              <li>
                <Link href="/signup" className="hover:text-blue-400 transition-colors">Start Free Trial</Link>
              </li>
            </ul>
          </div>

          {/* Mandatory Razorpay Legal Policies Column */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-extrabold uppercase text-white tracking-widest text-slate-200">Legal Policies</h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/privacy-policy" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>Privacy Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>Terms & Conditions</span>
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>Refund & Cancellation Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/shipping-policy" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>Shipping & Delivery Policy</span>
                </Link>
              </li>
              <li>
                <Link href="/legal" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>Full Legal Directory</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Official Business Contact Column (Razorpay Requirement) */}
          <div className="md:col-span-3 space-y-3">
            <h3 className="text-xs font-extrabold uppercase text-white tracking-widest text-slate-200">Business Details</h3>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span><strong>DevSamp Technologies</strong><br />Plot No. 12, Tech Park Sector 5,<br />New Delhi - 110001, India</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="mailto:support@devsamp.com" className="hover:text-white transition-colors">support@devsamp.com</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <a href="tel:+919876543210" className="hover:text-white transition-colors">+91 98765 43210</a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Mon – Sat: 10:00 AM – 7:00 PM IST</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} <strong>DevSamp Technologies</strong>. All rights reserved. PharmaERP™ is a registered software product.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
            <span>•</span>
            <Link href="/terms-and-conditions" className="hover:text-white transition-colors">Terms</Link>
            <span>•</span>
            <Link href="/refund-policy" className="hover:text-white transition-colors">Refunds</Link>
            <span>•</span>
            <Link href="/shipping-policy" className="hover:text-white transition-colors">Shipping</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
