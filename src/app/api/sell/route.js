import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale"; // Sale model import kiya

export async function POST(req) {
  try {
    await connectToDatabase();
    const { cartItems, paymentMethod = "Cash" } = await req.json();

    let calculatedTotal = 0;
    const saleItems = [];

    // Loop chala kar pehle stock check karo aur minus karo
    for (let item of cartItems) {
      const med = await Medicine.findById(item._id);
      
      if (!med) {
        throw new Error(`${item.name} database me nahi mili!`);
      }
      if (med.quantity < item.sellQuantity) {
        throw new Error(`${item.name} ka stock kam hai! Available: ${med.quantity}`);
      }

      // Stock minus karo
      med.quantity -= item.sellQuantity;
      await med.save();

      // Sale item record prepare karo
      const itemTotal = item.sellQuantity * (item.mrp || 0); // agar purani item me mrp nahi hai toh 0
      calculatedTotal += itemTotal;

      saleItems.push({
        medicineId: med._id,
        name: med.name,
        quantity: item.sellQuantity,
        mrp: item.mrp || 0,
        total: itemTotal
      });
    }

    // Sale (Invoice) Database me save karo
    const newSale = new Sale({
      items: saleItems,
      totalAmount: calculatedTotal,
      paymentMethod: paymentMethod
    });
    await newSale.save();

    return NextResponse.json({ 
      success: true, 
      message: "Sale Complete! Bill saved.", 
      saleId: newSale._id,
      totalAmount: calculatedTotal
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}