"use client";

import React from "react";
import { MessageSquare, ShieldCheck, CalendarClock } from "lucide-react";

export default function BillReconciliationCard({
  items = [],
  paperBillTotalInput = "",
  setPaperBillTotalInput = () => {},
  paymentStatus = "unpaid",
  setPaymentStatus = () => {},
  paymentTermsDays = 15,
  setPaymentTermsDays = () => {},
  distributorName = "",
  billNumber = "",
  getItemQty = (item) => Number(item.quantity) || 0,
  getItemFreeQty = (item) => Number(item.freeQty) || 0,
  getItemCost = (item) => Number(item.purchasePrice) || 0,
  getItemMrp = (item) => Number(item.mrp) || 0,
  getItemGst = (item) => Number(item.gstPercent) || 0,
}) {
  if (!items || items.length === 0) return null;

  const totals = items.reduce(
    (acc, item) => {
      const qty = getItemQty(item);
      const freeQty = getItemFreeQty(item);
      const cost = getItemCost(item);
      const mrp = getItemMrp(item);
      const gstPct = getItemGst(item);

      const totalPacks = qty + freeQty;

      const itemCostTotal = qty * cost;
      const itemGstAmt = itemCostTotal * (gstPct / 100);
      const itemGrandTotal = itemCostTotal + itemGstAmt;
      const itemMrpTotal = totalPacks * mrp;

      return {
        itemCount: acc.itemCount + 1,
        totalBilledQty: acc.totalBilledQty + qty,
        totalFreeQty: acc.totalFreeQty + freeQty,
        totalPacks: acc.totalPacks + totalPacks,
        taxableCost: acc.taxableCost + itemCostTotal,
        gstAmount: acc.gstAmount + itemGstAmt,
        grandTotal: acc.grandTotal + itemGrandTotal,
        mrpTotal: acc.mrpTotal + itemMrpTotal,
      };
    },
    {
      itemCount: 0,
      totalBilledQty: 0,
      totalFreeQty: 0,
      totalPacks: 0,
      taxableCost: 0,
      gstAmount: 0,
      grandTotal: 0,
      mrpTotal: 0,
    }
  );

  const paperTotalNum = Number(paperBillTotalInput) || 0;
  const billDiff = paperTotalNum > 0 ? totals.grandTotal - paperTotalNum : 0;
  const isTallyMatched = paperTotalNum > 0 && Math.abs(billDiff) < 0.5;

  // Average Retail Profit Margin %
  const avgMarginPct =
    totals.mrpTotal > 0
      ? ((totals.mrpTotal - totals.taxableCost) / totals.mrpTotal) * 100
      : 0;

  // Calculate Due Date based on Payment Terms
  const dueDateObj = new Date();
  dueDateObj.setDate(dueDateObj.getDate() + Number(paymentTermsDays || 15));
  const dueDateStr = dueDateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // WhatsApp Message Generator
  const handleSendWhatsAppReceipt = () => {
    const message = `*INVOICE PURCHASE VERIFICATION RECEIPT*%0A----------------------------------%0A*Distributor:* ${distributorName || "Wholesale Agency"}%0A*Bill Number:* ${billNumber || "N/A"}%0A*Items Count:* ${totals.itemCount} Medicines (%2B${totals.totalFreeQty} Scheme Free Packs)%0A*Taxable Subtotal:* ₹${totals.taxableCost.toFixed(2)}%0A*GST Tax (ITC Eligible):* ₹${totals.gstAmount.toFixed(2)}%0A*Grand Total:* ₹${totals.grandTotal.toFixed(2)}%0A*Payment Status:* ${paymentStatus.toUpperCase()} (Credit Due: ${dueDateStr})%0A----------------------------------%0A_Verified & Entered in Medical ERP Software._`;

    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  return (
    <div className="bg-slate-900 text-white p-4 md:p-5 rounded-3xl border border-slate-800 space-y-4 shadow-xl font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center font-black text-xl border border-blue-500/30 shrink-0">
            🧾
          </div>
          <div>
            <h4 className="font-extrabold text-sm md:text-base text-white flex items-center gap-2">
              Bill Total Tally, GST ITC & Khata Ledger Summary
            </h4>
            <p className="text-xs text-slate-400">
              Match software grand total against distributor paper bill invoice
            </p>
          </div>
        </div>

        {/* Paper Bill Input Box */}
        <div className="flex items-center gap-2 bg-slate-800/90 p-1.5 rounded-xl border border-slate-700">
          <label className="text-xs font-extrabold text-slate-300 uppercase px-2 shrink-0">
            Paper Bill Total ₹
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="e.g. 4500.00"
            className="w-32 md:w-40 bg-slate-950 border border-slate-700 text-white font-extrabold text-xs md:text-sm px-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-400 text-right"
            value={paperBillTotalInput}
            onChange={(e) => setPaperBillTotalInput(e.target.value)}
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-xs">
        <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-750">
          <p className="text-slate-400 font-bold uppercase text-[10px]">
            Medicines & Free Schemes
          </p>
          <p className="text-xs md:text-sm font-extrabold text-white mt-0.5">
            {totals.itemCount} Items ({totals.totalBilledQty} +{" "}
            <span className="text-emerald-400 font-black">
              {totals.totalFreeQty} Free
            </span>)
          </p>
        </div>

        <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-750">
          <p className="text-slate-400 font-bold uppercase text-[10px]">
            Taxable Cost Subtotal
          </p>
          <p className="text-xs md:text-sm font-extrabold text-slate-200 mt-0.5">
            ₹
            {totals.taxableCost.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        {/* 📑 GST Input Tax Credit (ITC) */}
        <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-750">
          <p className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            GST Input Credit (ITC)
          </p>
          <p className="text-xs md:text-sm font-extrabold text-amber-400 mt-0.5">
            +₹
            {totals.gstAmount.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-750">
          <p className="text-slate-400 font-bold uppercase text-[10px]">
            Avg Retail Margin
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`text-xs md:text-sm font-black px-2 py-0.5 rounded-lg border ${
                avgMarginPct >= 15
                  ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                  : avgMarginPct >= 10
                  ? "bg-amber-950 text-amber-400 border-amber-800"
                  : "bg-rose-950 text-rose-400 border-rose-800 animate-pulse"
              }`}
            >
              {avgMarginPct.toFixed(1)}%
            </span>
            <span className="text-[10px] text-slate-400">
              {avgMarginPct >= 15 ? "🟢 Good" : avgMarginPct >= 10 ? "🟡 Normal" : "🔴 Low"}
            </span>
          </div>
        </div>

        {/* 💳 Distributor Payment Status & Due Date */}
        <div className="bg-slate-800/70 p-3 rounded-2xl border border-slate-750 col-span-2 sm:col-span-1">
          <p className="text-slate-400 font-bold uppercase text-[10px] flex items-center gap-1">
            <CalendarClock className="w-3 h-3 text-amber-400" />
            Payment Status & Credit
          </p>
          <div className="flex items-center gap-2 mt-1">
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="bg-slate-950 text-white font-bold text-xs px-2 py-1 rounded-md border border-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="unpaid">Unpaid (Credit)</option>
              <option value="paid">Paid</option>
              <option value="partial">Partial</option>
            </select>
          </div>
          {paymentStatus === "unpaid" && (
            <p className="text-[9px] text-amber-300 font-semibold mt-1">
              Due: {dueDateStr} ({paymentTermsDays} Days)
            </p>
          )}
        </div>

        <div className="bg-blue-950/80 p-3 rounded-2xl border border-blue-800/60 col-span-2 sm:col-span-1">
          <p className="text-blue-300 font-bold uppercase text-[10px]">
            Grand Software Total
          </p>
          <p className="text-base md:text-lg font-black text-emerald-400 mt-0.5">
            ₹
            {totals.grandTotal.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>
      </div>

      {/* Tally & WhatsApp Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
        {paperTotalNum > 0 ? (
          <div
            className={`flex-1 p-2.5 rounded-xl flex items-center justify-between text-xs font-extrabold border ${
              isTallyMatched
                ? "bg-emerald-950/90 text-emerald-300 border-emerald-800"
                : "bg-rose-950/90 text-rose-300 border-rose-800"
            }`}
          >
            <span className="flex items-center gap-2">
              {isTallyMatched ? "✓" : "⚠️"}
              {isTallyMatched
                ? "Bill Tally Matched Perfectly!"
                : "Bill Discrepancy Found!"}
            </span>
            <span>
              {isTallyMatched
                ? "0.00 Difference"
                : `Diff: ₹${Math.abs(billDiff).toFixed(2)} (${
                    billDiff > 0 ? "Software is Higher" : "Paper Bill is Higher"
                  })`}
            </span>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 font-medium">
            💡 Type Paper Bill Total ₹ in top box to instantly tally with distributor's invoice.
          </div>
        )}

        {/* 📲 1-Click WhatsApp Receipt Button */}
        <button
          type="button"
          onClick={handleSendWhatsAppReceipt}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl border border-emerald-500 shadow-md flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <MessageSquare className="w-4 h-4 fill-white" />
          📲 Send WhatsApp Receipt to Distributor
        </button>
      </div>
    </div>
  );
}
