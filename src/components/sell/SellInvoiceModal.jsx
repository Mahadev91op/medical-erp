import React from "react";
import { Printer, X } from "lucide-react";

export default function SellInvoiceModal({
  completedInvoice,
  setCompletedInvoice,
  shopInfo,
  waPhone,
  setWaPhone,
  triggerWhatsAppSend,
  handlePrintInvoice,
  invoiceCalculations
}) {
  if (!completedInvoice) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
      <div className="bg-white rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-800 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm md:text-base font-bold">Billing Completed</h2>
          </div>
          <button 
            onClick={() => setCompletedInvoice(null)} 
            className="bg-white/10 hover:bg-white/20 p-1.5 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Scrollable Receipt Preview */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50 flex flex-col items-center">
          <p className="text-xs text-slate-500 font-medium mb-4">Receipt generated. You can print a thermal ticket below.</p>
          
          {/* Receipt Ticket Box */}
          <div className="bg-white shadow-md border border-slate-200 rounded-xl p-4 w-[280px] text-slate-800 text-xs font-mono">
            <div className="text-center border-b border-dashed border-slate-300 pb-3 mb-3">
              <h3 className="font-extrabold text-sm uppercase">{shopInfo?.shopName || "MedERP Pharmacy"}</h3>
              {shopInfo?.address && <p className="text-[10px] text-slate-500 mt-1">{shopInfo.address}</p>}
              {shopInfo?.phoneNumber && <p className="text-[10px] text-slate-500 mt-0.5">Phone: {shopInfo.phoneNumber}</p>}
              <p className="text-[9px] text-slate-400 mt-1">Date: {new Date(completedInvoice.date).toLocaleString('en-IN')}</p>
            </div>
            
            <div className="space-y-1 pb-3 mb-3 border-b border-dashed border-slate-300">
              <p className="text-[10px]"><span className="text-slate-400">Invoice:</span> #{completedInvoice.billNumber}</p>
              <p className="text-[10px]"><span className="text-slate-400">Pay Mode:</span> {completedInvoice.paymentMethod}</p>
              {completedInvoice.customerName && <p className="text-[10px]"><span className="text-slate-400">Customer:</span> {completedInvoice.customerName}</p>}
              {completedInvoice.customerPhone && <p className="text-[10px]"><span className="text-slate-400">Phone:</span> {completedInvoice.customerPhone}</p>}
              {completedInvoice.prescriptionDetail?.doctorName && (
                <div className="text-[9px] text-indigo-650 bg-indigo-50/50 p-1.5 rounded mt-1.5 border border-indigo-100/30">
                  <p className="font-bold">Rx details (Schedule H)</p>
                  <p>Dr: {completedInvoice.prescriptionDetail.doctorName} {completedInvoice.prescriptionDetail.doctorRegNo ? `(Reg: ${completedInvoice.prescriptionDetail.doctorRegNo})` : ""}</p>
                  <p>Patient: {completedInvoice.prescriptionDetail.patientAge ? `${completedInvoice.prescriptionDetail.patientAge}y/` : ""}{completedInvoice.prescriptionDetail.patientGender}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-2 pb-3 mb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-bold text-[9px] text-slate-400 border-b border-dashed border-slate-200 pb-1">
                <span>Item Name</span>
                <span>Qty x Price</span>
              </div>
              {completedInvoice.items.map((item, i) => {
                const discount = item.discountPercent || 0;
                const gst = item.gstPercent || 0;
                const itemMrp = item.sellMrp || item.mrp || 0;
                const itemUnitTotal = itemMrp * (1 - discount / 100);
                return (
                  <div key={i} className="text-[10px] leading-tight space-y-0.5">
                    <div className="flex justify-between">
                      <span className="truncate max-w-[150px] font-bold">
                        {item.name.includes('(Strip)') || item.name.includes('(Tab)') || item.name.includes('(Str)')
                          ? item.name
                          : `${item.name} ${item.sellUnit === 'strip' ? '(Str)' : '(Tab)'}`}
                      </span>
                      <span>{item.sellQuantity} x ₹{itemMrp}</span>
                    </div>
                    {(discount > 0 || gst > 0) && (
                      <div className="flex justify-between text-[8px] text-slate-400 font-semibold pl-2">
                        <span>{discount > 0 ? `Disc: ${discount}%` : ""} {gst > 0 ? `GST: ${gst}%` : ""}</span>
                        <span>Net: ₹{itemUnitTotal.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Split Tax / Discount Summary */}
            {(() => {
              const cal = invoiceCalculations(completedInvoice);
              return (
                <div className="space-y-1 pb-3 mb-3 border-b border-dashed border-slate-300 text-[10px]">
                  {cal.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Discount Saved:</span>
                      <span>-₹{cal.totalDiscount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Taxable Value:</span>
                    <span>₹{cal.totalTaxable}</span>
                  </div>
                  {cal.totalCGST > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span>CGST:</span>
                        <span>₹{cal.totalCGST}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST:</span>
                        <span>₹{cal.totalSGST}</span>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}
            
            <div className="flex justify-between font-extrabold text-xs">
              <span>Grand Total:</span>
              <span>₹{completedInvoice.totalAmount}</span>
            </div>
            
            <div className="text-center text-[8px] text-slate-400 mt-5 border-t border-slate-100 pt-3">
              Thank you! Get well soon.<br/>
              *Medicines once sold cannot be returned.*
            </div>
          </div>

          {/* WhatsApp Box */}
          <div className="w-[280px] bg-white border border-slate-200 rounded-xl p-4 mt-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <span className="text-emerald-500">💬</span> Send Invoice via WhatsApp
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">WhatsApp Phone Number</label>
                <input 
                  type="tel"
                  placeholder="Enter 10-digit number"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-semibold"
                />
              </div>
              <button 
                onClick={() => triggerWhatsAppSend(completedInvoice, waPhone)}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Send via WhatsApp</span>
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white border-t border-slate-100 flex gap-3">
          <button 
            onClick={() => setCompletedInvoice(null)}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
          <button 
            onClick={handlePrintInvoice}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer font-extrabold"
          >
            <Printer className="w-4 h-4 text-blue-100" /> Print Receipt
          </button>
        </div>
      </div>
    </div>
  );
}
