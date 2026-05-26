import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
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
    
    let userObjectId = null;
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        userObjectId = new mongoose.Types.ObjectId(userId);
      }
    } catch (e) {
      console.error("Invalid ObjectId format:", userId);
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const expiryMonths = parseInt(searchParams.get("expiryMonths")) || 3;
    const lowStockThreshold = parseInt(searchParams.get("lowStockThreshold")) || 10;

    const expiryLimitDate = new Date();
    expiryLimitDate.setMonth(expiryLimitDate.getMonth() + expiryMonths);

    const selectedDateStr = searchParams.get("selectedDate");
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    const startOfToday = new Date();
    const endOfToday = new Date();

    if (startDateStr && endDateStr) {
      const pStart = new Date(startDateStr);
      const pEnd = new Date(endDateStr);
      if (!isNaN(pStart.getTime()) && !isNaN(pEnd.getTime())) {
        startOfToday.setTime(pStart.getTime());
        endOfToday.setTime(pEnd.getTime());
      }
    } else if (selectedDateStr) {
      const parsedDate = new Date(selectedDateStr);
      if (!isNaN(parsedDate.getTime())) {
        startOfToday.setTime(parsedDate.getTime());
        endOfToday.setTime(parsedDate.getTime());
      }
    }

    startOfToday.setHours(0, 0, 0, 0);
    endOfToday.setHours(23, 59, 59, 999);

    const matchUserQuery = { $in: [userObjectId, userId].filter(Boolean) };

    const [
      expiringSoon,
      lowStock,
      distributorStock,
      distributorPerformance,
      todaysSales,
      salesTrend,
      stockValuationQuery,
      alreadyExpired,
      outOfStock
    ] = await Promise.all([
      Medicine.find({
        userId: matchUserQuery,
        expiryDate: { $lte: expiryLimitDate },
        quantity: { $gt: 0 } 
      }).sort({ expiryDate: 1 }).lean(), 

      Medicine.find({
        userId: matchUserQuery,
        quantity: { $lt: lowStockThreshold, $gt: 0 }
      }).sort({ quantity: 1 }).lean(), 

      Medicine.aggregate([
        { $match: { userId: matchUserQuery } },
        {
          $group: {
            _id: "$distributor", 
            totalQuantity: { $sum: { $toDouble: { $ifNull: [ "$quantity", 0 ] } } },
            totalItems: { $sum: 1 } 
          }
        }
      ]),

      Sale.aggregate([
        { $match: { userId: matchUserQuery, date: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } } }, // 🚀 SPEED OPTIMIZATION: Limit to 30 days
        { $unwind: "$items" },
        {
          $lookup: {
            from: "medicines", 
            localField: "items.medicineId",
            foreignField: "_id",
            as: "medicineDetails"
          }
        },
        { $unwind: "$medicineDetails" },
        {
          $group: {
            _id: "$medicineDetails.distributor",
            soldQuantity: { $sum: { $toDouble: { $ifNull: [ "$items.quantity", 0 ] } } }, 
            revenueGenerated: { $sum: { $toDouble: { $ifNull: [ "$items.total", 0 ] } } } 
          }
        }
      ]),

      Sale.find({
        userId: matchUserQuery,
        date: { $gte: startOfToday, $lte: endOfToday }
      }).lean(),

      Sale.aggregate([
        { $match: { userId: matchUserQuery, date: { $gte: startOfToday, $lte: endOfToday } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            revenue: { $sum: { $toDouble: { $ifNull: [ "$totalAmount", 0 ] } } }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      Medicine.aggregate([
        { $match: { userId: matchUserQuery, quantity: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            totalValuation: { 
              $sum: { 
                $multiply: [ 
                  { $toDouble: { $ifNull: [ "$quantity", 0 ] } }, 
                  { $toDouble: { $ifNull: [ "$mrp", 0 ] } } 
                ] 
              } 
            }
          }
        }
      ]),

      Medicine.find({
        userId: matchUserQuery,
        expiryDate: { $lt: new Date() },
        quantity: { $gt: 0 }
      }).sort({ expiryDate: 1 }).lean(),

      Medicine.find({
        userId: matchUserQuery,
        quantity: 0
      }).sort({ name: 1 }).lean()
    ]);

    const completeDistributorData = distributorStock.map(stock => {
      const perf = distributorPerformance.find(p => p._id === stock._id);
      return {
        _id: stock._id,
        totalQuantity: stock.totalQuantity,
        totalItems: stock.totalItems,
        soldQuantity: perf ? perf.soldQuantity : 0,
        revenueGenerated: perf ? perf.revenueGenerated : 0
      };
    }).sort((a, b) => b.revenueGenerated - a.revenueGenerated);

    let todayRevenue = 0;
    let todayCogs = 0;
    let todayItemsSold = 0;
    let soldItemsMap = {};
    const transactions = [];
    const paymentBreakdown = { Cash: 0, UPI: 0, Card: 0, CashCount: 0, UPICount: 0, CardCount: 0 };

    todaysSales.forEach(sale => {
      todayRevenue += sale.totalAmount;
      
      const method = sale.paymentMethod || "Cash";
      if (paymentBreakdown[method] !== undefined) {
        paymentBreakdown[method] += sale.totalAmount;
        paymentBreakdown[method + "Count"] += 1;
      }

      sale.items.forEach(item => {
        todayItemsSold += item.quantity;
        
        // COGS calculation: fallback to 70% of MRP if purchasePrice is missing
        const itemCost = item.purchasePrice || (item.mrp * 0.7);
        todayCogs += item.quantity * itemCost;

        if (soldItemsMap[item.medicineId]) {
            soldItemsMap[item.medicineId].quantity += item.quantity;
            soldItemsMap[item.medicineId].total += item.total;
        } else {
            soldItemsMap[item.medicineId] = {
                name: item.name,
                quantity: item.quantity,
                total: item.total
            };
        }

        transactions.push({
          saleId: sale._id.toString(),
          name: item.name,
          quantity: item.quantity,
          total: item.total,
          mrp: item.mrp,
          date: sale.date || sale.createdAt,
          paymentMethod: sale.paymentMethod || "Cash",
          billNumber: sale._id ? sale._id.toString().slice(-6).toUpperCase() : "N/A"
        });
      });
    });

    const todayProfit = todayRevenue - todayCogs;
    const profitMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0;

    // Sort transactions by date descending (latest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const todaySoldItemsList = Object.values(soldItemsMap).sort((a, b) => b.quantity - a.quantity);

    const todayOverview = {
        revenue: todayRevenue,
        profit: todayProfit,
        margin: profitMargin,
        cogs: todayCogs,
        itemsSold: todayItemsSold,
        billsGenerated: todaysSales.length,
        sales: todaysSales,
        soldItems: todaySoldItemsList,
        transactions: transactions,
        paymentBreakdown: paymentBreakdown
    };

    // Format daily sales trend for Charting
    const salesChartData = salesTrend.map(item => {
      const parts = item._id.split("-"); // YYYY-MM-DD
      const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
      const formattedDate = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      return {
        date: formattedDate,
        Revenue: item.revenue
      };
    });

    const stockVal = stockValuationQuery[0]?.totalValuation || 0;

    return NextResponse.json({
      success: true,
      expiringSoon,
      lowStock,
      distributorStock: completeDistributorData,
      todayOverview,
      salesChartData,
      stockValuation: stockVal,
      alreadyExpired,
      outOfStock
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}