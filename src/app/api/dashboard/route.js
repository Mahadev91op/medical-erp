import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import ActiveSession from "@/models/ActiveSession";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

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
      todaysSalesRaw,
      outOfStockCount,
      expiredCount,
      reorderList,
      activeSessions
    ] = await Promise.all([
      Medicine.countDocuments({ userId: userObjectId, quantity: { $gt: 0 } }),
      
      Medicine.aggregate([
        { $match: { userId: userObjectId, quantity: { $gt: 0 } } },
        { $project: { totalValue: { $multiply: ["$quantity", "$mrp"] }, quantity: 1 } },
        { $group: { _id: null, totalStockValue: { $sum: "$totalValue" }, totalUnits: { $sum: "$quantity" } } }
      ]),
      
      Medicine.countDocuments({ userId: userObjectId, quantity: { $lt: 10, $gt: 0 } }),
      
      Medicine.countDocuments({ userId: userObjectId, expiryDate: { $lte: ninetyDaysFromNow }, quantity: { $gt: 0 } }),
      
      Medicine.find({ userId: userObjectId, expiryDate: { $lte: ninetyDaysFromNow }, quantity: { $gt: 0 } })
              .sort({ expiryDate: 1 })
              .limit(6)
              .lean(), 
              
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

      Sale.find({ userId: userObjectId, date: { $gte: startOfToday } }).lean(),

      Medicine.countDocuments({ userId: userObjectId, quantity: 0 }),

      Medicine.countDocuments({ userId: userObjectId, expiryDate: { $lt: today }, quantity: { $gt: 0 } }),

      Medicine.find({ userId: userObjectId, quantity: 0 }).sort({ name: 1 }).limit(5).lean(),

      ActiveSession.find({
        userId: userObjectId,
        lastActive: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // past 5 mins
      }).sort({ lastActive: -1 }).lean()
    ]);

    const totalStockValue = stockAggregation[0]?.totalStockValue || 0;
    const totalUnits = stockAggregation[0]?.totalUnits || 0;

    let todayRevenue = 0;
    const todayPaymentBreakdown = { Cash: 0, UPI: 0, Card: 0 };
    const todaySellingMap = {};

    todaysSalesRaw.forEach(sale => {
      todayRevenue += sale.totalAmount;
      const method = sale.paymentMethod || "Cash";
      if (todayPaymentBreakdown[method] !== undefined) {
        todayPaymentBreakdown[method] += sale.totalAmount;
      }
      
      sale.items.forEach(item => {
        if (todaySellingMap[item.name]) {
          todaySellingMap[item.name].quantity += item.quantity;
          todaySellingMap[item.name].revenue += item.total;
        } else {
          todaySellingMap[item.name] = {
            name: item.name,
            quantity: item.quantity,
            revenue: item.total
          };
        }
      });
    });

    const topSellingToday = Object.values(todaySellingMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

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
      stats: { 
        totalMedicines, 
        totalUnits, 
        totalStockValue, 
        lowStockCount, 
        expiringCount, 
        todayRevenue,
        outOfStockCount,
        expiredCount,
        todayPaymentBreakdown
      },
      expiringMedicines,
      salesData,
      topSellingToday,
      reorderList,
      activeSessions: activeSessions.map(s => ({
        os: s.os,
        browser: s.browser,
        deviceType: s.deviceType,
        ipAddress: s.ipAddress,
        deviceSessionId: s.deviceSessionId,
        lastActive: s.lastActive
      }))
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}