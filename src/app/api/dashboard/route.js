import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import ActiveSession from "@/models/ActiveSession";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserDataSize, formatBytes } from "@/lib/storageHelper";

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
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user session identity format" }, { status: 400 });
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);

    await connectToDatabase();

    let userTerms = { termsAccepted: true, termsVersion: "v1.0" };
    if (userId !== "000000000000000000000000") {
      const dbUser = await User.findById(userId).select("termsAccepted termsVersion").lean();
      if (dbUser) userTerms = dbUser;
    }

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
      stockAggregation,
      expiringMedicines,
      rawSalesData,
      todaysSalesRaw,
      reorderList,
      activeSessions
    ] = await Promise.all([
      // 1. Consolidated Aggregation Query for counts and stock valuation
      Medicine.aggregate([
        { $match: { userId: userObjectId } },
        {
          $group: {
            _id: null,
            totalActive: {
              $sum: {
                $cond: [
                  { $and: [ { $gt: ["$quantity", 0] }, { $gt: ["$expiryDate", today] } ] },
                  1,
                  0
                ]
              }
            },
            lowStock: {
              $sum: {
                $cond: [
                  { $and: [ { $lt: ["$quantity", 10] }, { $gt: ["$quantity", 0] }, { $gt: ["$expiryDate", today] } ] },
                  1,
                  0
                ]
              }
            },
            expiring: {
              $sum: {
                $cond: [
                  { $and: [ { $lte: ["$expiryDate", ninetyDaysFromNow] }, { $gt: ["$expiryDate", today] }, { $gt: ["$quantity", 0] } ] },
                  1,
                  0
                ]
              }
            },
            outOfStock: {
              $sum: {
                $cond: [
                  { $eq: ["$quantity", 0] },
                  1,
                  0
                ]
              }
            },
            expired: {
              $sum: {
                $cond: [
                  { $and: [ { $lt: ["$expiryDate", today] }, { $gt: ["$quantity", 0] } ] },
                  1,
                  0
                ]
              }
            },
            totalStockValue: {
              $sum: {
                $cond: [
                  { $and: [ { $gt: ["$quantity", 0] }, { $gt: ["$expiryDate", today] } ] },
                  { $multiply: ["$quantity", "$mrp"] },
                  0
                ]
              }
            },
            totalUnits: {
              $sum: {
                $cond: [
                  { $and: [ { $gt: ["$quantity", 0] }, { $gt: ["$expiryDate", today] } ] },
                  "$quantity",
                  0
                ]
              }
            }
          }
        }
      ]),

      // 2. Expiring Medicines
      Medicine.find({ userId: userObjectId, expiryDate: { $lte: ninetyDaysFromNow, $gt: today }, quantity: { $gt: 0 } })
              .select("name batch expiryDate quantity mrp barcodeId distributor")
              .sort({ expiryDate: 1 })
              .limit(6)
              .lean(), 
              
      // 3. Weekly Sales
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

      // 4. Today's Sales
      Sale.find({ userId: userObjectId, date: { $gte: startOfToday } })
          .select("totalAmount paymentMethod items")
          .lean(),

      // 5. Reorder List (Out of stock)
      Medicine.find({ userId: userObjectId, quantity: 0 })
              .select("name batch expiryDate quantity mrp barcodeId distributor")
              .sort({ name: 1 })
              .limit(5)
              .lean(),

      // 6. Active Login Sessions
      ActiveSession.find({
        userId: userObjectId
      }).sort({ lastActive: -1 }).lean()
    ]);

    const statsResult = stockAggregation[0] || {
      totalActive: 0,
      lowStock: 0,
      expiring: 0,
      outOfStock: 0,
      expired: 0,
      totalStockValue: 0,
      totalUnits: 0
    };

    const totalMedicines = statsResult.totalActive;
    const lowStockCount = statsResult.lowStock;
    const expiringCount = statsResult.expiring;
    const outOfStockCount = statsResult.outOfStock;
    const expiredCount = statsResult.expired;
    const totalStockValue = statsResult.totalStockValue;
    const totalUnits = statsResult.totalUnits;

    // Calculate database user storage dynamically to bypass getUserDataSize call
    const totalMedsCount = totalMedicines + outOfStockCount + expiredCount;
    const sessionCount = activeSessions.length;
    const saleCount = await Sale.countDocuments({ userId: userObjectId });

    const dataSizeBytes = 
      (totalMedsCount * 350) +
      (saleCount * 450) +
      (sessionCount * 150) +
      300;

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
      termsAccepted: userTerms.termsAccepted || false,
      termsVersion: userTerms.termsVersion || "0.0",
      stats: { 
        totalMedicines, 
        totalUnits, 
        totalStockValue, 
        lowStockCount, 
        expiringCount, 
        todayRevenue,
        outOfStockCount,
        expiredCount,
        todayPaymentBreakdown,
        dataSize: dataSizeBytes,
        dataSizeFormatted: formatBytes(dataSizeBytes)
      },
      expiringMedicines,
      salesData,
      topSellingToday,
      reorderList,
      activeSessions: activeSessions.map(s => {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        return {
          os: s.os,
          browser: s.browser,
          deviceType: s.deviceType,
          ipAddress: s.ipAddress,
          deviceSessionId: s.deviceSessionId,
          lastActive: s.lastActive,
          isOnline: new Date(s.lastActive) >= fiveMinutesAgo
        };
      })
    });

  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}