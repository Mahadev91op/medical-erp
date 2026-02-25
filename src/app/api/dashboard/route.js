import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

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

    // Aaj ki date ka start time (aaj ki total kamai nikalne ke liye)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalMedicines,
      stockAggregation,
      lowStockCount,
      expiringCount,
      expiringMedicines,
      rawSalesData,
      todaysSales
    ] = await Promise.all([
      Medicine.countDocuments({ quantity: { $gt: 0 } }),
      
      Medicine.aggregate([
        { $match: { quantity: { $gt: 0 } } },
        { $project: { totalValue: { $multiply: ["$quantity", "$mrp"] }, quantity: 1 } },
        { $group: { _id: null, totalStockValue: { $sum: "$totalValue" }, totalUnits: { $sum: "$quantity" } } }
      ]),
      
      Medicine.countDocuments({ quantity: { $lt: 10, $gt: 0 } }),
      
      Medicine.countDocuments({ expiryDate: { $lte: ninetyDaysFromNow }, quantity: { $gt: 0 } }),
      
      Medicine.find({ expiryDate: { $lte: ninetyDaysFromNow }, quantity: { $gt: 0 } })
              .sort({ expiryDate: 1 })
              .limit(6)
              .lean(), 
              
      Sale.aggregate([
        { $match: { date: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%d %b", date: "$date", timezone: "Asia/Kolkata" } }, 
            revenue: { $sum: "$totalAmount" }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      Sale.aggregate([
        { $match: { date: { $gte: startOfToday } } },
        { $group: { _id: null, todayRevenue: { $sum: "$totalAmount" } } }
      ])
    ]);

    const totalStockValue = stockAggregation[0]?.totalStockValue || 0;
    const totalUnits = stockAggregation[0]?.totalUnits || 0;
    const todayRevenue = todaysSales[0]?.todayRevenue || 0;

    const salesData = rawSalesData.map(item => ({
      date: item._id,
      Revenue: item.revenue
    }));

    return NextResponse.json({
      success: true,
      stats: { totalMedicines, totalUnits, totalStockValue, lowStockCount, expiringCount, todayRevenue },
      expiringMedicines,
      salesData
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}