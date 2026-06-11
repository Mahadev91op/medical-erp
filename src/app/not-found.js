"use client";
import Link from "next/link";
import { MoveLeft, HelpCircle, PackageOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-slate-100/50 to-blue-50/30 flex flex-col justify-center items-center p-6 relative overflow-hidden select-none">
      
      {/* Background glowing accents */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-100/30 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-100/20 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-slate-200/80 p-8 md:p-10 text-center space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Animated Visual Area */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
            <div className="w-24 h-24 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-lg shadow-blue-100/40 relative z-10 animate-bounce duration-[2000ms]">
              <PackageOpen className="w-12 h-12 text-blue-500" />
            </div>
          </div>
        </div>

        {/* Text Details */}
        <div className="space-y-3">
          <h1 className="text-6xl md:text-7xl font-black text-slate-800 tracking-tight select-all">
            404
          </h1>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 leading-tight">
            Page Not Found
          </h2>
          <p className="text-slate-400 text-xs md:text-sm font-semibold max-w-sm mx-auto leading-relaxed">
            The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
          </p>
        </div>

        {/* Help Banner */}
        <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-100 flex items-start gap-3 text-left">
          <HelpCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-700">Need help finding your way?</p>
            <p className="text-[11px] text-slate-400 font-semibold leading-relaxed">
              Verify the URL path input, or click the button below to return back to your dashboard inventory controller.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex justify-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-4 rounded-2xl transition-all shadow-lg shadow-blue-100 hover:shadow-blue-200 gap-2.5 text-sm select-none"
          >
            <MoveLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
