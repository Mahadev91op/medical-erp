import { NextResponse } from "next/server";
import mongoose from "mongoose";
import * as XLSX from "xlsx";
import { connectToDatabase } from "@/lib/mongodb";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyUser } from "@/lib/verifyUser";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const verification = await verifyUser(userId, session.user.role);
    if (!verification.success) {
      return NextResponse.json({ error: verification.error }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    let startDate = new Date();
    let endDate = new Date();

    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
    } else {
      // Default to current month
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
      endDate = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    let userObjectId = null;
    if (mongoose.Types.ObjectId.isValid(userId)) {
      userObjectId = new mongoose.Types.ObjectId(userId);
    }

    const sales = await Sale.find({
      userId: { $in: [userObjectId, userId].filter(Boolean) },
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: 1 }).lean();

    // 1. SHEET 1: GSTR-1 B2C Sales Register Data
    const gstr1Rows = sales.map((sale) => {
      let totalTaxable = 0;
      let totalDiscount = 0;
      let totalTax = 0;

      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const qty = item.quantity || item.sellQuantity || 1;
          const mrp = item.mrp || 0;
          const discPercent = item.discountPercent || 0;
          const gstPercent = item.gstPercent || 0;

          const origTotal = mrp * qty;
          const discTotal = origTotal * (1 - discPercent / 100);
          const taxable = discTotal / (1 + gstPercent / 100);
          const tax = discTotal - taxable;

          totalTaxable += taxable;
          totalDiscount += origTotal - discTotal;
          totalTax += tax;
        });
      }

      const billNo = sale._id ? sale._id.toString().slice(-6).toUpperCase() : "N/A";
      const cgst = totalTax / 2;
      const sgst = totalTax / 2;

      return {
        "Invoice Number": `#${billNo}`,
        "Invoice Date": sale.date ? new Date(sale.date).toISOString().split('T')[0] : "",
        "Customer Name": sale.customerName || "Walk-in Customer",
        "Customer Mobile": sale.customerPhone || "N/A",
        "Payment Mode": sale.paymentMethod || "Cash",
        "Total Items": sale.items ? sale.items.length : 0,
        "Taxable Amount (₹)": Number(totalTaxable.toFixed(2)),
        "CGST Amount (₹)": Number(cgst.toFixed(2)),
        "SGST Amount (₹)": Number(sgst.toFixed(2)),
        "Total Tax (₹)": Number(totalTax.toFixed(2)),
        "Total Discount (₹)": Number(totalDiscount.toFixed(2)),
        "Grand Total Invoice Value (₹)": Number((sale.totalAmount || 0).toFixed(2))
      };
    });

    // 2. SHEET 2: GSTR-3B Tax Summary
    let aggTaxable = 0;
    let aggDiscount = 0;
    let aggTax = 0;
    let aggGrandTotal = 0;

    gstr1Rows.forEach(row => {
      aggTaxable += row["Taxable Amount (₹)"];
      aggTax += row["Total Tax (₹)"];
      aggDiscount += row["Total Discount (₹)"];
      aggGrandTotal += row["Grand Total Invoice Value (₹)"];
    });

    const gstr3bRows = [
      {
        "GSTR-3B Parameter": "3.1 (a) Outward Taxable Supplies (Other than Zero Rated / Nil / Exempted)",
        "Total Taxable Value (₹)": Number(aggTaxable.toFixed(2)),
        "Integrated Tax (IGST) (₹)": 0,
        "Central Tax (CGST) (₹)": Number((aggTax / 2).toFixed(2)),
        "State/UT Tax (SGST) (₹)": Number((aggTax / 2).toFixed(2)),
        "Total Tax Collected (₹)": Number(aggTax.toFixed(2)),
        "Total Invoice Value (₹)": Number(aggGrandTotal.toFixed(2))
      },
      {
        "GSTR-3B Parameter": "Total Discount Savings Provided to Patients",
        "Total Taxable Value (₹)": Number(aggDiscount.toFixed(2)),
        "Integrated Tax (IGST) (₹)": 0,
        "Central Tax (CGST) (₹)": 0,
        "State/UT Tax (SGST) (₹)": 0,
        "Total Tax Collected (₹)": 0,
        "Total Invoice Value (₹)": Number(aggDiscount.toFixed(2))
      }
    ];

    // 3. SHEET 3: Itemized Medicine HSN Summary
    const itemRows = [];
    sales.forEach(sale => {
      const billNo = sale._id ? sale._id.toString().slice(-6).toUpperCase() : "N/A";
      const dateStr = sale.date ? new Date(sale.date).toISOString().split('T')[0] : "";

      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const qty = item.quantity || item.sellQuantity || 1;
          const mrp = item.mrp || 0;
          const discPercent = item.discountPercent || 0;
          const gstPercent = item.gstPercent || 0;

          const origTotal = mrp * qty;
          const discTotal = origTotal * (1 - discPercent / 100);
          const taxable = discTotal / (1 + gstPercent / 100);
          const tax = discTotal - taxable;

          itemRows.push({
            "Invoice No": `#${billNo}`,
            "Date": dateStr,
            "Medicine Name": item.name || "N/A",
            "Batch No": item.batch || "N/A",
            "Quantity Sold": qty,
            "MRP (₹)": mrp,
            "Discount (%)": discPercent,
            "GST Rate (%)": gstPercent,
            "Taxable Amount (₹)": Number(taxable.toFixed(2)),
            "CGST (₹)": Number((tax / 2).toFixed(2)),
            "SGST (₹)": Number((tax / 2).toFixed(2)),
            "Item Total Amount (₹)": Number(discTotal.toFixed(2))
          });
        });
      }
    });

    // Create Excel Workbook
    const workbook = XLSX.utils.book_new();

    const sheet1 = XLSX.utils.json_to_sheet(gstr1Rows.length > 0 ? gstr1Rows : [{ "Status": "No sales records found for selected period" }]);
    const sheet2 = XLSX.utils.json_to_sheet(gstr3bRows);
    const sheet3 = XLSX.utils.json_to_sheet(itemRows.length > 0 ? itemRows : [{ "Status": "No items sold in selected period" }]);

    XLSX.utils.book_append_sheet(workbook, sheet1, "GSTR-1 B2C Sales");
    XLSX.utils.book_append_sheet(workbook, sheet2, "GSTR-3B Summary");
    XLSX.utils.book_append_sheet(workbook, sheet3, "Itemized HSN Sales");

    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const monthName = startDate.toLocaleString('en-IN', { month: 'short', year: 'numeric' }).replace(/\s+/g, '_');
    const filename = `GST_Return_Export_${monthName}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    console.error("GST Export API error:", error);
    return NextResponse.json({ error: "Failed to generate GST export file" }, { status: 500 });
  }
}
