"use client";
import { useParams } from "next/navigation";
import { useRef } from "react";
import Link from "next/link";
import { legalData } from "@/lib/legalData";
import { Activity, ArrowLeft, Printer, AlertTriangle, Home } from "lucide-react";
import { useReactToPrint } from "react-to-print";

export default function IndividualPolicyPage() {
  const params = useParams();
  const slug = params.slug;
  const policy = legalData.find((p) => p.id === slug);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: policy ? `PharmaERP_${policy.id}` : "Legal_Document",
  });

  if (!policy) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
        <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-3xl flex items-center justify-center text-rose-500 mb-4 animate-bounce">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">Policy Document Not Found</h1>
        <p className="text-slate-500 text-sm mt-1 max-w-sm">The policy document matching the requested URL parameters could not be located in our directory.</p>
        <Link
          href="/legal"
          className="mt-6 bg-slate-850 hover:bg-slate-900 text-white font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-md"
        >
          View Legal Center
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-slate-100/50 to-blue-50/30 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Hidden printable target container */}
      <div className="hidden">
        <div ref={printRef} className="p-12 text-slate-800 space-y-6">
          <div className="flex items-center gap-3 border-b pb-4 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">P</div>
            <div>
              <h1 className="text-2xl font-black">PharmaERP Legal Documents</h1>
              <p className="text-xs text-slate-400 font-semibold">DevSamp Technologies | Policy Agreement</p>
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{policy.title}</h2>
            <p className="text-xs text-slate-400 font-semibold uppercase mb-4">Effective Date: {policy.effectiveDate} | Last Updated: {policy.lastUpdated}</p>
            <div 
              className="prose prose-sm max-w-none text-slate-650 leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: policy.content }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
        
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-[24px] border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <Link 
              href="/legal"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors flex items-center justify-center shrink-0"
              title="Back to Legal Directory"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
              <Activity className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-800 tracking-tight leading-tight capitalize">{policy.id.replace('-', ' ')}</h1>
              <p className="text-slate-400 text-[10px] font-semibold">DevSamp Policy Ledger</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-3 py-2 rounded-lg text-[10px] uppercase tracking-wide transition-all shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-blue-200" /> Print Policy
            </button>
            <Link
              href="/"
              className="bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-3 py-2 rounded-lg text-[10px] uppercase tracking-wide transition-all shadow-sm flex items-center gap-1"
            >
              Home
            </Link>
          </div>
        </div>

        {/* Policy Content Card */}
        <div className="bg-white p-6 md:p-10 rounded-[32px] border border-slate-200/50 shadow-sm space-y-6">
          <div className="border-b border-slate-150 pb-4">
            <div className="flex items-center gap-2 text-2xl font-black text-slate-850">
              <span>{policy.emoji}</span>
              <h2>{policy.title}</h2>
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2 flex gap-4">
              <span>Effective: {policy.effectiveDate}</span>
              <span>Updated: {policy.lastUpdated}</span>
            </div>
          </div>

          <div 
            className="prose prose-sm max-w-none text-slate-650 leading-relaxed space-y-4 pt-2 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-slate-850 [&>h3]:mt-6 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:list-inside [&>ul]:space-y-1 [&>ul]:text-slate-650"
            dangerouslySetInnerHTML={{ __html: policy.content }}
          />

          <div className="border-t border-slate-100 pt-6 mt-8 flex justify-between items-center text-xs font-semibold text-slate-400">
            <span>DevSamp Technologies</span>
            <Link href="/legal" className="text-blue-500 hover:underline">
              Back to Policies Index
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
