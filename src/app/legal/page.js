"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import { legalData } from "@/lib/legalData";
import { Activity, ArrowLeft, Printer, FileText, Download, Check } from "lucide-react";
import { useReactToPrint } from "react-to-print";

export default function LegalPortal() {
  const [selectedPolicy, setSelectedPolicy] = useState("all");
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: selectedPolicy === "all" ? "PharmaERP_Consolidated_Legal_Policies" : `PharmaERP_${selectedPolicy}`,
  });

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-slate-100/50 to-blue-50/30 py-8 px-4 sm:px-6 lg:px-8 font-sans select-none">
      
      {/* Printable Area Wrapper (Hidden from screen during printing via CSS but formatted for printer) */}
      <div className="hidden">
        <div ref={printRef} className="p-12 text-slate-800 space-y-8 print-document">
          <div className="flex items-center gap-3 border-b pb-4 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">P</div>
            <div>
              <h1 className="text-2xl font-black">PharmaERP Legal Document Center</h1>
              <p className="text-xs text-slate-400 font-semibold">DevSamp Technologies | Official Terms & Policy Agreements</p>
            </div>
          </div>
          
          {selectedPolicy === "all" ? (
            legalData.map((policy) => (
              <div key={policy.id} className="page-break-after border-b pb-8 mb-8">
                <h2 className="text-xl font-bold text-slate-900 mb-2">{policy.title}</h2>
                <div className="text-xs text-slate-400 font-bold uppercase mb-4">Effective Date: {policy.effectiveDate}</div>
                <div 
                  className="prose prose-sm max-w-none text-slate-650 leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: policy.content }}
                />
              </div>
            ))
          ) : (
            <div>
              {legalData.filter(p => p.id === selectedPolicy).map((policy) => (
                <div key={policy.id}>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">{policy.title}</h2>
                  <div className="text-xs text-slate-400 font-bold uppercase mb-4">Effective Date: {policy.effectiveDate}</div>
                  <div 
                    className="prose prose-sm max-w-none text-slate-650 leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{ __html: policy.content }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-slate-200/60 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <Link 
              href="/"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors flex items-center justify-center shrink-0"
              title="Go Back to Home/Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-800 leading-tight">PharmaERP Legal & Policies</h1>
              <p className="text-slate-400 text-xs font-semibold">Official Business License & Operational Policies</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wide transition-all shadow-md shadow-blue-500/10 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-blue-200" /> Print / Download PDF
            </button>
            
            <Link
              href="/"
              className="hidden sm:inline-flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold px-4 py-2.5 rounded-xl text-xs uppercase tracking-wide transition-all shadow-sm"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Main Content Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Left Column: Vertical Policy Selector (Table of Contents) */}
          <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-200/50 shadow-sm space-y-3">
            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest px-1">Agreements Directory</div>
            
            <div className="space-y-1">
              <button
                onClick={() => setSelectedPolicy("all")}
                className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-between ${
                  selectedPolicy === "all"
                    ? "bg-slate-800 text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                }`}
              >
                <span>📦 Consolidated (All 13)</span>
                {selectedPolicy === "all" && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>

              {legalData.map((policy) => (
                <button
                  key={policy.id}
                  onClick={() => setSelectedPolicy(policy.id)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-bold transition-all uppercase tracking-wider flex items-center justify-between ${
                    selectedPolicy === policy.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-850"
                  }`}
                >
                  <span className="truncate">{policy.emoji} {policy.title.replace(/^\d+\.\s*/, '')}</span>
                  {selectedPolicy === policy.id && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: Policies display area */}
          <div className="lg:col-span-3 space-y-6">
            
            {selectedPolicy === "all" ? (
              <div className="space-y-8">
                {legalData.map((policy) => (
                  <div 
                    key={policy.id} 
                    id={policy.id} 
                    className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/50 shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h2 className="text-lg md:text-xl font-bold text-slate-800">{policy.title}</h2>
                      <div className="flex items-center gap-1.5">
                        <Link 
                          href={`/legal/${policy.id}`}
                          className="text-[10px] font-bold text-blue-500 hover:text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100"
                        >
                          Separate Page
                        </Link>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase flex gap-4">
                      <span>Effective: {policy.effectiveDate}</span>
                      <span>Last Updated: {policy.lastUpdated}</span>
                    </div>
                    <div 
                      className="prose prose-sm max-w-none text-slate-600 leading-relaxed space-y-4 pt-2 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-slate-800 [&>h3]:mt-6 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:list-inside [&>ul]:space-y-1 [&>ul]:text-slate-650"
                      dangerouslySetInnerHTML={{ __html: policy.content }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {legalData.filter(p => p.id === selectedPolicy).map((policy) => (
                  <div 
                    key={policy.id} 
                    className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/50 shadow-sm space-y-4 animate-in fade-in duration-300"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <h2 className="text-lg md:text-xl font-bold text-slate-800">{policy.title}</h2>
                      <div className="flex items-center gap-2">
                        <Link 
                          href={`/legal/${policy.id}`}
                          className="text-[10px] font-bold text-blue-500 hover:text-blue-600 bg-blue-50/80 px-2.5 py-1 rounded-lg border border-blue-100"
                        >
                          View Separate Page
                        </Link>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase flex gap-4">
                      <span>Effective: {policy.effectiveDate}</span>
                      <span>Last Updated: {policy.lastUpdated}</span>
                    </div>
                    <div 
                      className="prose prose-sm max-w-none text-slate-600 leading-relaxed space-y-4 pt-2 [&>h3]:text-sm [&>h3]:font-bold [&>h3]:text-slate-800 [&>h3]:mt-6 [&>h3]:mb-2 [&>ul]:list-disc [&>ul]:list-inside [&>ul]:space-y-1 [&>ul]:text-slate-650"
                      dangerouslySetInnerHTML={{ __html: policy.content }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
