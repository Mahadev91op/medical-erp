import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// Cache disable karne ke liye
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDatabase();

    // 1. Basic Stats
    const totalMedicines = await Medicine.countDocuments();
    
    // Total Stock Value Calculate karna (Quantity * MRP)
    const stockAggregation = await Medicine.aggregate([
      { $project: { totalValue: { $multiply: ["$quantity", "$mrp"] } } },
      { $group: { _id: null, totalStockValue: { $sum: "$totalValue" } } }
    ]);
    const totalStockValue = stockAggregation[0]?.totalStockValue || 0;

    const lowStockCount = await Medicine.countDocuments({ quantity: { $lt: 10 } });

    // 2. Expiring Medicines (Agle 90 din mein expire hone wali dawaiyan)
    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);

    const expiringMedicines = await Medicine.find({
      expiryDate: { $lte: ninetyDaysFromNow }
    }).sort({ expiryDate: 1 }).limit(6); // Sirf top 6 dikhayenge

    // 3. Sales Data for Graph (Pichle 7 din ki sales)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const rawSalesData = await Sale.aggregate([
      { $match: { date: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%d %b", date: "$date" } }, // Example: 24 Oct
          revenue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Graph ke liye data format karna
    const salesData = rawSalesData.map(item => ({
      date: item._id,
      Revenue: item.revenue
    }));

    return NextResponse.json({
      success: true,
      stats: { totalMedicines, totalStockValue, lowStockCount },
      expiringMedicines,
      salesData
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}