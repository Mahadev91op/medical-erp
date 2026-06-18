import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
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

    await connectToDatabase();
    
    // Fetch all medicines with active stock that are expired or expiring within 90 days
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

    const medicines = await Medicine.find({
      userId,
      quantity: { $gt: 0 },
      expiryDate: { $lte: ninetyDaysFromNow }
    }).sort({ expiryDate: 1 }).lean();

    // Group by distributor
    const grouped = {};
    medicines.forEach(med => {
      const dist = med.distributor || "Unknown Distributor";
      if (!grouped[dist]) {
        grouped[dist] = [];
      }
      grouped[dist].push(med);
    });

    return NextResponse.json({ success: true, groupedReturns: grouped });
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

    const { items } = await req.json(); // Array of { medicineId, returnQty }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items selected for return" }, { status: 400 });
    }

    await connectToDatabase();

    const results = [];
    for (const item of items) {
      const { medicineId, returnQty } = item;
      const qty = parseInt(returnQty);
      if (isNaN(qty) || qty <= 0) continue;

      const med = await Medicine.findOne({ _id: medicineId, userId });
      if (med) {
        // Decrement stock or clamp to 0
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

    return NextResponse.json({ success: true, processed: results });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
