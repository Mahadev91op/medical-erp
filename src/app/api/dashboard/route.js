import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// To disable caching
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDatabase();

    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 🚀 SPEED OPTIMIZATION: Executing all 5 database queries concurrently
    const [
      totalMedicines,
      stockAggregation,
      lowStockCount,
      expiringMedicines,
      rawSalesData
    ] = await Promise.all([
      Medicine.countDocuments(),
      
      // Calculate Total Stock Value (Quantity * MRP)
      Medicine.aggregate([
        { $project: { totalValue: { $multiply: ["$quantity", "$mrp"] } } },
        { $group: { _id: null, totalStockValue: { $sum: "$totalValue" } } }
      ]),
      
      Medicine.countDocuments({ quantity: { $lt: 10 } }),
      
      // Medicines expiring in the next 90 days (Showing top 6 only)
      Medicine.find({ expiryDate: { $lte: ninetyDaysFromNow } })
              .sort({ expiryDate: 1 })
              .limit(6)
              .lean(), 
              
      // Sales Data for Graph (Last 7 days)
      Sale.aggregate([
        { $match: { date: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%d %b", date: "$date" } }, 
            revenue: { $sum: "$totalAmount" }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const totalStockValue = stockAggregation[0]?.totalStockValue || 0;

    // Format data for the graph
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