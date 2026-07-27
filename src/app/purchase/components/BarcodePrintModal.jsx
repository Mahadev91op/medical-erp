"use client";

import React, { useRef } from "react";
import Barcode from "react-barcode";
import { X, Printer, CheckCircle2 } from "lucide-react";
import { useReactToPrint } from "react-to-print";

export default function BarcodePrintModal({
  isOpen,
  onClose,
  items = []
}) {
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Barcode_Stickers_${Date.now()}`,
  });

  if (!isOpen || !items || items.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full flex flex-col max-h-[90vh] shadow-2xl border border-slate-100 font-sans">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center font-black">
              🏷️
            </div>
            <div>
              <h3 className="font-extrabold text-base md:text-lg text-white">
                Thermal Barcode Sticker Printing ({items.length} Items)
              </h3>
              <p className="text-xs text-slate-400">
                Print barcode stickers for medicine boxes / strips
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl border-none cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Barcodes Container */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-2xl text-xs text-amber-900 font-semibold flex items-center justify-between">
            <span>
              💡 Printed on standard thermal label sticker rolls (50mm x 25mm or 38mm x 25mm).
            </span>
            <span className="font-extrabold">{items.length} Stickers Ready</span>
          </div>

          {/* Printable Element */}
          <div ref={printRef} className="p-4 bg-white grid grid-cols-2 sm:grid-cols-3 gap-4 print:grid-cols-2 print:gap-2">
            {items.map((item, idx) => {
              const barcodeValue =
                item.barcodeId || `MED-${(Date.now() + idx).toString().slice(-6)}`;
              const expFormatted = item.expiryDate
                ? (typeof item.expiryDate === "string"
                    ? item.expiryDate
                    : new Date(item.expiryDate).toLocaleDateString("en-IN", {
                        month: "2-digit",
                        year: "2-digit",
                      }))
                : "12/26";

              return (
                <div
                  key={idx}
                  className="border-2 border-dashed border-slate-300 p-3 rounded-2xl text-center space-y-1 bg-white print:border print:border-black print:p-2 print:break-inside-avoid"
                >
                  <p className="text-[11px] font-black uppercase text-slate-900 truncate tracking-tight">
                    {item.name}
                  </p>
                  
                  <div className="flex justify-between items-center text-[10px] font-bold text-slate-700 px-1">
                    <span>B: {item.batch || "GEN"}</span>
                    <span>EXP: {expFormatted}</span>
                  </div>

                  <div className="flex justify-center py-1 overflow-hidden scale-90 sm:scale-100">
                    <Barcode
                      value={barcodeValue}
                      width={1.2}
                      height={35}
                      fontSize={9}
                      margin={2}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] font-black text-slate-900 border-t border-slate-200 pt-1">
                    <span>MRP: ₹{Number(item.mrp || 0).toFixed(2)}</span>
                    <span className="text-[9px] font-extrabold text-blue-700">
                      {item.rackNumber ? `R: ${item.rackNumber}` : "RETAIL"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 flex justify-between items-center bg-slate-50 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-extrabold text-slate-600 hover:bg-slate-200 px-4 py-2.5 rounded-xl border border-slate-300 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs md:text-sm px-6 py-3 rounded-xl shadow-lg shadow-blue-200 flex items-center gap-2 cursor-pointer border-none"
          >
            <Printer className="w-4 h-4" />
            Print Barcode Stickers Now
          </button>
        </div>
      </div>
    </div>
  );
}
