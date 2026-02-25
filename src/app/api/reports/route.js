import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale"; // Sale model import zaroori hai

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Expiry Report
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const expiringSoon = await Medicine.find({
      expiryDate: { $lte: sixtyDaysFromNow },
      quantity: { $gt: 0 } 
    }).sort({ expiryDate: 1 }); 

    // 2. Low Stock Report
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
          from: "medicines", // Medicine model ka collection name 'medicines' hota hai
          localField: "items.medicineId",
          foreignField: "_id",
          as: "medicineDetails"
        }
      },
      { $unwind: "$medicineDetails" },
      {
        $group: {
          _id: "$medicineDetails.distributor",
          soldQuantity: { $sum: "$items.quantity" }, // Kitne item bike
          revenueGenerated: { $sum: "$items.total" } // Kitna total profit/revenue aaya
        }
      }
    ]);

    // 5. Merge Dono Data (Stock + Sales) & Sort by Top Revenue
    const completeDistributorData = distributorStock.map(stock => {
      // Find sales performance for this specific distributor
      const perf = distributorPerformance.find(p => p._id === stock._id);
      return {
        _id: stock._id,
        totalQuantity: stock.totalQuantity,
        totalItems: stock.totalItems,
        soldQuantity: perf ? perf.soldQuantity : 0,
        revenueGenerated: perf ? perf.revenueGenerated : 0
      };
    }).sort((a, b) => b.revenueGenerated - a.revenueGenerated); // Jiska revenue jyada wo Top par

    return NextResponse.json({
      success: true,
      expiringSoon,
      lowStock,
      distributorStock: completeDistributorData
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}