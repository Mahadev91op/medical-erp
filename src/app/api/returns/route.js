import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
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
    const distributor = searchParams.get("distributor");
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 50;
    const all = searchParams.get("all") === "true";

    await connectToDatabase();
    
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    // If no distributor is selected, fetch counts grouped by distributor using aggregation
    if (!distributor) {
      const userObjId = new mongoose.Types.ObjectId(userId);
      const distributorCounts = await Medicine.aggregate([
        {
          $match: {
            userId: userObjId,
            quantity: { $gt: 0 },
            expiryDate: { $lte: ninetyDaysFromNow }
          }
        },
        {
          $group: {
            _id: { $ifNull: ["$distributor", "Unknown Distributor"] },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);

      const groupedCount = {};
      distributorCounts.forEach(item => {
        groupedCount[item._id] = item.count;
      });

      return NextResponse.json({ success: true, groupedReturnsCount: groupedCount });
    }

    // If distributor is selected, query expired items for that distributor
    const query = {
      userId,
      distributor,
      quantity: { $gt: 0 },
      expiryDate: { $lte: ninetyDaysFromNow }
    };

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (all) {
      // Fetch all matched items without pagination limits (used for print debit notes)
      const medicines = await Medicine.find(query).sort({ expiryDate: 1 }).lean();
      return NextResponse.json({ success: true, medicines });
    }

    // Otherwise, perform paginated search
    const total = await Medicine.countDocuments(query);
    const medicines = await Medicine.find(query)
      .sort({ expiryDate: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({ 
      success: true, 
      medicines,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
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

    const { items, selectAll, distributor, excludeIds = [], customQtys = {} } = await req.json();
    
    await connectToDatabase();
    const results = [];

    if (selectAll) {
      if (!distributor) {
        return NextResponse.json({ error: "Distributor name is required for bulk select return" }, { status: 400 });
      }

      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

      const query = {
        userId,
        distributor,
        quantity: { $gt: 0 },
        expiryDate: { $lte: ninetyDaysFromNow }
      };

      const medicines = await Medicine.find(query);
      for (const med of medicines) {
        const idStr = med._id.toString();
        if (excludeIds.includes(idStr)) continue;

        let qtyToReturn = med.quantity;
        if (customQtys[idStr] !== undefined) {
          qtyToReturn = Math.max(0, Math.min(med.quantity, parseInt(customQtys[idStr]) || 0));
        }

        if (qtyToReturn <= 0) continue;

        const oldQty = med.quantity;
        const newQty = Math.max(0, oldQty - qtyToReturn);
        med.quantity = newQty;
        await med.save();

        results.push({
          medicineId: med._id,
          name: med.name,
          batch: med.batch,
          returnedQty: oldQty - newQty
        });
      }
    } else {
      if (!items || !Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ error: "No items selected for return" }, { status: 400 });
      }

      for (const item of items) {
        const { medicineId, returnQty } = item;
        const qty = parseInt(returnQty);
        if (isNaN(qty) || qty <= 0) continue;

        const med = await Medicine.findOne({ _id: medicineId, userId });
        if (med) {
          const oldQty = med.quantity;
          const newQty = Math.max(0, oldQty - qty);
          med.quantity = newQty;
          await med.save();
          results.push({
            medicineId,
            name: med.name,
            batch: med.batch,
            returnedQty: oldQty - newQty
          });
        }
      }
    }

    return NextResponse.json({ success: true, processed: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
