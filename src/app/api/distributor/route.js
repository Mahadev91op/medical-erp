import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import Distributor from "@/models/Distributor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyUser } from "@/lib/verifyUser";
import mongoose from "mongoose";

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

    const { searchParams } = new URL(req.url);
    const distName = searchParams.get("name");
    
    await connectToDatabase();

    if (!distName) {
      const contacts = await Distributor.find({ userId }).lean();
      return NextResponse.json({ success: true, contacts });
    }
    
    let userObjectId = null;
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        userObjectId = new mongoose.Types.ObjectId(userId);
      }
    } catch (e) {
      console.error("Invalid ObjectId format:", userId);
    }
    const matchUserQuery = { $in: [userObjectId, userId].filter(Boolean) };

    // 1. Gather all medicine batches for this distributor
    // Using regex exact match case insensitive to handle legacy string data safely
    const escName = distName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const medicines = await Medicine.find({
      userId: matchUserQuery,
      distributor: { $regex: new RegExp("^" + escName + "$", "i") }
    }).sort({ name: 1, expiryDate: 1 }).lean();

    // 2. Perform summary calculations
    let totalItems = medicines.length;
    let totalQuantity = 0;
    let stockValuation = 0;
    let purchaseValuation = 0;
    let activeBatchesCount = 0;
    let expiredMedsCount = 0;
    let expiringSoonCount = 0;
    let outOfStockCount = 0;

    const now = new Date();
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    medicines.forEach(med => {
      const q = med.quantity || 0;
      totalQuantity += q;
      stockValuation += q * (med.mrp || 0);
      purchaseValuation += q * (med.purchasePrice || 0);

      if (q > 0) {
        activeBatchesCount++;
        const expDate = new Date(med.expiryDate);
        if (expDate < now) {
          expiredMedsCount++;
        } else if (expDate <= threeMonthsFromNow) {
          expiringSoonCount++;
        }
      } else {
        outOfStockCount++;
      }
    });

    // 3. Aggregate sales performance for this distributor's medicines
    const medicineIds = medicines.map(m => m._id);
    const salesPerformance = await Sale.aggregate([
      { $match: { userId: matchUserQuery } },
      { $unwind: "$items" },
      { $match: { "items.medicineId": { $in: medicineIds } } },
      {
        $group: {
          _id: null,
          soldQuantity: { $sum: { $toDouble: { $ifNull: [ "$items.quantity", 0 ] } } },
          revenueGenerated: { $sum: { $toDouble: { $ifNull: [ "$items.total", 0 ] } } },
          salesCount: { $sum: 1 }
        }
      }
    ]);

    const perf = salesPerformance[0] || { soldQuantity: 0, revenueGenerated: 0, salesCount: 0 };

    return NextResponse.json({
      success: true,
      summary: {
        distributor: distName,
        totalItems,
        totalQuantity,
        stockValuation,
        purchaseValuation,
        activeBatchesCount,
        expiredMedsCount,
        expiringSoonCount,
        outOfStockCount,
        soldQuantity: perf.soldQuantity,
        revenueGenerated: perf.revenueGenerated,
        salesCount: perf.salesCount
      },
      medicines
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
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

    const { searchParams } = new URL(req.url);
    const distName = searchParams.get("name");
    if (!distName) {
      return NextResponse.json({ error: "Distributor name is required" }, { status: 400 });
    }

    await connectToDatabase();
    
    let userObjectId = null;
    try {
      if (mongoose.Types.ObjectId.isValid(userId)) {
        userObjectId = new mongoose.Types.ObjectId(userId);
      }
    } catch (e) {
      console.error("Invalid ObjectId format:", userId);
    }
    const matchUserQuery = { $in: [userObjectId, userId].filter(Boolean) };

    // Delete all medicines under this user and matching this distributor name
    const escName = distName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const deleteResult = await Medicine.deleteMany({
      userId: matchUserQuery,
      distributor: { $regex: new RegExp("^" + escName + "$", "i") }
    });

    return NextResponse.json({
      success: true,
      message: `Successfully deleted distributor '${distName}' and purged ${deleteResult.deletedCount} associated medicines.`,
      deletedCount: deleteResult.deletedCount
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
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

    await connectToDatabase();
    const { name, phone = "", address = "" } = await req.json();
    if (!name) {
      return NextResponse.json({ error: "Distributor name is required" }, { status: 400 });
    }

    const escName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const updated = await Distributor.findOneAndUpdate(
      { userId, name: { $regex: new RegExp("^" + escName + "$", "i") } },
      { name, phone, address, userId },
      { upsert: true, new: true }
    ).lean();

    return NextResponse.json({ success: true, distributor: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
