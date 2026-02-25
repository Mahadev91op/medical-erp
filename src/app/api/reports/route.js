import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Expiry Report (Agle 60 din mein expire hone wali dawaiyan)
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const expiringSoon = await Medicine.find({
      expiryDate: { $lte: sixtyDaysFromNow },
      quantity: { $gt: 0 } 
    }).sort({ expiryDate: 1 }); 

    // 2. Low Stock Report (Jinki quantity 10 ya usse kam hai)
    const lowStock = await Medicine.find({
      quantity: { $lt: 10, $gt: 0 }
    }).sort({ quantity: 1 });

    // 3. Current Stock grouped by Distributor (Kitna bacha hai)
    const distributorStock = await Medicine.aggregate([
      {
        $group: {
          _id: "$distributor", 
          totalQuantity: { $sum: "$quantity" },
          totalItems: { $sum: 1 } 
        }
      }
    ]);

    // 4. Sales Performance grouped by Distributor (Kitna bika aur kitna paisa aaya)
    const distributorPerformance = await Sale.aggregate([
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
    ]);

    // 5. Merge Dono Data (Stock + Sales) & Sort by Top Revenue
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

    // -------------------------------------------------------------
    // 6. TODAY'S SALES & OVERVIEW (Naya Feature: Aaj ka Hisaab)
    // -------------------------------------------------------------
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaysSales = await Sale.find({
      date: { $gte: startOfToday, $lte: endOfToday }
    });

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

    // Object ko Array mein convert karo aur sabse zyada bikne wali dawai upar rakho
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