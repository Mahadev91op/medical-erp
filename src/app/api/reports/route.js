import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";

export const revalidate = 60; // 🚀 SPEED OPTIMIZATION: Cache for 60 seconds 

export async function GET() {
  try {
    await connectToDatabase();

    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [
      expiringSoon,
      lowStock,
      distributorStock,
      distributorPerformance,
      todaysSales
    ] = await Promise.all([
      Medicine.find({
        expiryDate: { $lte: sixtyDaysFromNow },
        quantity: { $gt: 0 } 
      }).sort({ expiryDate: 1 }).lean(), 

      Medicine.find({
        quantity: { $lt: 10, $gt: 0 }
      }).sort({ quantity: 1 }).lean(), 

      Medicine.aggregate([
        {
          $group: {
            _id: "$distributor", 
            totalQuantity: { $sum: "$quantity" },
            totalItems: { $sum: 1 } 
          }
        }
      ]),

      Sale.aggregate([
        { $match: { date: { $gte: new Date(new Date().setDate(new Date().getDate() - 30)) } } }, // 🚀 SPEED OPTIMIZATION: Limit to 30 days
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
            soldQuantity: { $sum: "$items.quantity" }, 
            revenueGenerated: { $sum: "$items.total" } 
          }
        }
      ]),

      Sale.find({
        date: { $gte: startOfToday, $lte: endOfToday }
      }).lean() 
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
    let todayItemsSold = 0;
    let soldItemsMap = {};

    todaysSales.forEach(sale => {
      todayRevenue += sale.totalAmount;
      sale.items.forEach(item => {
        todayItemsSold += item.quantity;
        
        if(soldItemsMap[item.medicineId]) {
            soldItemsMap[item.medicineId].quantity += item.quantity;
            soldItemsMap[item.medicineId].total += item.total;
        } else {
            soldItemsMap[item.medicineId] = {
                name: item.name,
                quantity: item.quantity,
                total: item.total
            };
        }
      });
    });

    const todaySoldItemsList = Object.values(soldItemsMap).sort((a, b) => b.quantity - a.quantity);

    const todayOverview = {
        revenue: todayRevenue,
        itemsSold: todayItemsSold,
        billsGenerated: todaysSales.length,
        soldItems: todaySoldItemsList
    };

    return NextResponse.json({
      success: true,
      expiringSoon,
      lowStock,
      distributorStock: completeDistributorData,
      todayOverview 
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}