import { NextResponse } from "next/server";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    // Calculate the date 6 months ago
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // 1. Delete sold-out medicines (quantity <= 0) and updated older than 6 months
    const deletedSold = await Medicine.deleteMany({
      userId,
      quantity: { $lte: 0 },
      updatedAt: { $lt: sixMonthsAgo }
    });

    // 2. Delete expired medicines (expiryDate older than 6 months)
    const deletedExpired = await Medicine.deleteMany({
      userId,
      expiryDate: { $lt: sixMonthsAgo }
    });

    // 3. Delete old sales logs older than 6 months
    const deletedSales = await Sale.deleteMany({
      userId,
      date: { $lt: sixMonthsAgo }
    });

    return NextResponse.json({
      success: true,
      message: `Storage cleanup completed successfully! Removed ${deletedSold.deletedCount} sold-out entries, ${deletedExpired.deletedCount} expired batch entries, and ${deletedSales.deletedCount} transaction sales history logs older than 6 months.`
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
