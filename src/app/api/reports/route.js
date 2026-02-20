import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

export async function GET() {
  try {
    await connectToDatabase();

    // 1. Expiry Report (Agle 60 din mein expire hone wali dawaiyan)
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const expiringSoon = await Medicine.find({
      expiryDate: { $lte: sixtyDaysFromNow },
      quantity: { $gt: 0 } // Jo stock me bachi hain sirf wahi
    }).sort({ expiryDate: 1 }); // Jo sabse jaldi expire hogi wo upar aayegi

    // 2. Low Stock Report (Jinki quantity 10 ya usse kam hai)
    const lowStock = await Medicine.find({
      quantity: { $lt: 10, $gt: 0 }
    }).sort({ quantity: 1 });

    // 3. Distributor-Wise Stock (MongoDB Aggregation)
    const distributorStock = await Medicine.aggregate([
      {
        $group: {
          _id: "$distributor", // A ya B
          totalQuantity: { $sum: "$quantity" },
          totalItems: { $sum: 1 } // Kitni alag-alag dawaiyan hain
        }
      }
    ]);

    return NextResponse.json({
      success: true,
      expiringSoon,
      lowStock,
      distributorStock
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}