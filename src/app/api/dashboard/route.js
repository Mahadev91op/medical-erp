import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const revalidate = 60; // 🚀 SPEED OPTIMIZATION: Cache for 60 seconds

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "superadmin") {
      const expiry = session.user.subscriptionEnd ? new Date(session.user.subscriptionEnd) : null;
      if (expiry && expiry < new Date()) {
        return NextResponse.json({ error: "Subscription expired" }, { status: 403 });
      }
    }
    const userId = session.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await connectToDatabase();

    const today = new Date();
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(today.getDate() + 90);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0); // 7 din pehle ka start time

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
      Medicine.countDocuments({ userId, quantity: { $gt: 0 } }),
      
      Medicine.aggregate([
        { $match: { userId: userObjectId, quantity: { $gt: 0 } } },
        { $project: { totalValue: { $multiply: ["$quantity", "$mrp"] }, quantity: 1 } },
        { $group: { _id: null, totalStockValue: { $sum: "$totalValue" }, totalUnits: { $sum: "$quantity" } } }
      ]),
      
      Medicine.countDocuments({ userId, quantity: { $lt: 10, $gt: 0 } }),
      
      Medicine.countDocuments({ userId, expiryDate: { $lte: ninetyDaysFromNow }, quantity: { $gt: 0 } }),
      
      Medicine.find({ userId, expiryDate: { $lte: ninetyDaysFromNow }, quantity: { $gt: 0 } })
              .sort({ expiryDate: 1 })
              .limit(6)
              .lean(), 
              
      // 🚀 BUG FIX: Timezone hata diya gaya hai. Ab date "YYYY-MM-DD" format me aayegi jo kabhi fail nahi hogi
      Sale.aggregate([
        { $match: { userId: userObjectId, date: { $gte: sevenDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, 
            revenue: { $sum: "$totalAmount" }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      Sale.aggregate([
        { $match: { userId: userObjectId, date: { $gte: startOfToday } } },
        { $group: { _id: null, todayRevenue: { $sum: "$totalAmount" } } }
      ])
    ]);

    const totalStockValue = stockAggregation[0]?.totalStockValue || 0;
    const totalUnits = stockAggregation[0]?.totalUnits || 0;
    const todayRevenue = todaysSales[0]?.todayRevenue || 0;

    // 🚀 BUG FIX: JavaScript ke andar date format ko "05 Mar" jaisa set kar diya graph ke liye
    const salesData = rawSalesData.map(item => {
      const dateObj = new Date(item._id);
      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      return {
        date: formattedDate,
        Revenue: item.revenue
      };
    });

    return NextResponse.json({
      success: true,
      stats: { totalMedicines, totalUnits, totalStockValue, lowStockCount, expiringCount, todayRevenue },
      expiringMedicines,
      salesData
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}