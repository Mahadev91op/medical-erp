import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const medicineId = searchParams.get("medicineId");

    if (!medicineId) {
      return NextResponse.json({ success: false, error: "Medicine ID is required" }, { status: 400 });
    }

    // Find all sales that contain this medicine for the logged-in user
    const sales = await Sale.find({
      userId,
      "items.medicineId": medicineId
    }).sort({ date: -1 }).lean();

    // Map sales to only transaction history for that medicine
    const history = [];
    sales.forEach(sale => {
      const targetItem = sale.items.find(item => item.medicineId.toString() === medicineId);
      if (targetItem) {
        history.push({
          billNumber: sale._id.toString().slice(-6).toUpperCase(),
          date: sale.date || sale.createdAt,
          quantity: targetItem.quantity,
          mrp: targetItem.mrp,
          total: targetItem.total,
          paymentMethod: sale.paymentMethod
        });
      }
    });

    return NextResponse.json({
      success: true,
      history
    });
  } catch (error) {
    console.error("Medicine History API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
