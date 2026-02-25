import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDatabase();
    
    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    let calculatedTotal = 0;
    let newSaleId = null; 

    try {
      const { cartItems, paymentMethod = "Cash" } = await req.json();

      const saleItems = [];
      const savePromises = []; // 🚀 SPEED OPTIMIZATION: Database save process parallel karne ke liye array

      // 🚀 SPEED OPTIMIZATION: Loop me ek-ek karke fetch karne ke bajay saari medicines 1 hi baar me le aao
      const itemIds = cartItems.map(item => item._id);
      const medicinesInDb = await Medicine.find({ _id: { $in: itemIds } }).session(dbSession);

      // Fast ID lookup ke liye ek Map object banayenge
      const medMap = {};
      medicinesInDb.forEach(med => { medMap[med._id.toString()] = med; });

      for (let item of cartItems) {
        const med = medMap[item._id.toString()];
        
        if (!med) throw new Error(`${item.name} database me nahi mili!`);
        if (med.quantity < item.sellQuantity) throw new Error(`${item.name} ka stock kam hai! Available: ${med.quantity}`);

        med.quantity -= item.sellQuantity;
        
        // 🚀 Pehle await yahan tha (slow). Ab hum ise promise list me daal denge
        savePromises.push(med.save({ session: dbSession }));

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
      
      savePromises.push(newSale.save({ session: dbSession }));

      // 🚀 SPEED OPTIMIZATION: Saari dawaiyan aur bill ek hi bar me, ek hi second me parallel database me update ho jayenge
      await Promise.all(savePromises);
      newSaleId = newSale._id; 

      await dbSession.commitTransaction();
      dbSession.endSession();

      return NextResponse.json({ 
        success: true, 
        message: "Sale Complete! Bill saved.", 
        saleId: newSaleId,
        totalAmount: calculatedTotal
      });

    } catch (transactionError) {
      await dbSession.abortTransaction();
      dbSession.endSession();
      throw transactionError; 
    }

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}