"use client";

import PublicNavbar from "@/components/PublicNavbar";
import Footer from "@/components/Footer";
import { legalData } from "@/lib/legalData";
import { FileText } from "lucide-react";

export default function TermsAndConditionsPage() {
  const policy = legalData.find((p) => p.id === "terms-conditions") || legalData[0];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between">
      <PublicNavbar />

      <main className="grow py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{policy.title}</h1>
              <p className="text-xs text-slate-500 font-semibold">DevSamp Technologies | Official Terms of Service</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 border-t border-slate-100 pt-4 uppercase">
            <span>Effective Date: {policy.effectiveDate}</span>
            <span>•</span>
            <span>Last Updated: {policy.lastUpdated}</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
          <div 
            className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-xs sm:text-sm space-y-4 [&>h3]:text-base [&>h3]:font-black [&>h3]:text-slate-900 [&>h3]:mt-6 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:list-inside [&>ul]:space-y-1.5 [&>ul]:text-slate-650"
            dangerouslySetInnerHTML={{ __html: policy.content }}
          />

          <div className="pt-6 border-t border-slate-100 text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div>
              Questions regarding Terms: <a href="mailto:support@devsamp.com" className="font-extrabold text-blue-600 hover:underline">support@devsamp.com</a>
            </div>
            <div className="font-bold text-slate-700">
              © {new Date().getFullYear()} DevSamp Technologies
            </div>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  );
}
