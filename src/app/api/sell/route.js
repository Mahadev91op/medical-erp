import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req) {
  // API Security Check
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDatabase();
    
    // Mongoose Transaction Start (Stock & Bill ek sath save honge ya fail honge)
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
      const { cartItems, paymentMethod = "Cash" } = await req.json();

      let calculatedTotal = 0;
      const saleItems = [];

      for (let item of cartItems) {
        const med = await Medicine.findById(item._id).session(dbSession);
        
        if (!med) throw new Error(`${item.name} database me nahi mili!`);
        if (med.quantity < item.sellQuantity) throw new Error(`${item.name} ka stock kam hai! Available: ${med.quantity}`);

        med.quantity -= item.sellQuantity;
        await med.save({ session: dbSession }); // Update with session

        const itemTotal = item.sellQuantity * (item.mrp || 0);
        calculatedTotal += itemTotal;

        saleItems.push({
          medicineId: med._id,
          name: med.name,
          quantity: item.sellQuantity,
          mrp: item.mrp || 0,
          total: itemTotal
        });
      }

      const newSale = new Sale({
        items: saleItems,
        totalAmount: calculatedTotal,
        paymentMethod
      });
      await newSale.save({ session: dbSession });

      // Agar sab sahi raha toh database me final save karo
      await dbSession.commitTransaction();
      dbSession.endSession();

      return NextResponse.json({ 
        success: true, 
        message: "Sale Complete! Bill saved.", 
        saleId: newSale._id,
        totalAmount: calculatedTotal
      });

    } catch (transactionError) {
      // Agar error aaya, toh saare changes revert kar do
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw transactionError; 
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}