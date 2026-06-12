import { NextResponse } from "next/server";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }
    const userId = session.user.id;

    let months = 6;
    let cleanSoldOut = true;
    let cleanExpired = true;
    let cleanSales = true;

    try {
      const body = await req.json();
      if (body) {
        if (body.months !== undefined) months = parseInt(body.months) || 6;
        if (body.cleanSoldOut !== undefined) cleanSoldOut = !!body.cleanSoldOut;
        if (body.cleanExpired !== undefined) cleanExpired = !!body.cleanExpired;
        if (body.cleanSales !== undefined) cleanSales = !!body.cleanSales;
      }
    } catch (e) {
      // Body may not exist, use defaults
    }

    await connectToDatabase();

    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() - months);

    let deletedSold = { deletedCount: 0 };
    let deletedExpired = { deletedCount: 0 };
    let deletedSales = { deletedCount: 0 };

    // 1. Delete sold-out medicines (quantity <= 0) and updated older than threshold
    if (cleanSoldOut) {
      deletedSold = await Medicine.deleteMany({
        userId,
        quantity: { $lte: 0 },
        updatedAt: { $lt: thresholdDate }
      });
    }

    // 2. Delete expired medicines (expiryDate older than threshold)
    if (cleanExpired) {
      deletedExpired = await Medicine.deleteMany({
        userId,
        expiryDate: { $lt: thresholdDate }
      });
    }

    // 3. Delete old sales logs older than threshold
    if (cleanSales) {
      deletedSales = await Sale.deleteMany({
        userId,
        date: { $lt: thresholdDate }
      });
    }

    let summaryParts = [];
    if (cleanSoldOut) summaryParts.push(`${deletedSold.deletedCount} sold-out inventory items`);
    if (cleanExpired) summaryParts.push(`${deletedExpired.deletedCount} expired medicine batches`);
    if (cleanSales) summaryParts.push(`${deletedSales.deletedCount} transaction invoices`);

    const summaryMessage = summaryParts.length > 0 
      ? `Successfully purged: ${summaryParts.join(", ")} older than ${months} months.`
      : "No cleanup actions selected.";

    return NextResponse.json({
      success: true,
      message: `Database cleanup execution complete. ${summaryMessage}`
    });

  } catch (error) {
    console.error("Cleanup API Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Database cleanup execution failed! Server error.",
      details: error.message
    }, { status: 500 });
  }
}
