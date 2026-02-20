import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

export async function POST(req) {
  try {
    await connectToDatabase();
    const { cartItems } = await req.json(); // cartItems me un dawaiyon ki list hogi jo bechi ja rahi hain

    // Har dawai ka stock minus karna
    for (let item of cartItems) {
      await Medicine.findByIdAndUpdate(item._id, {
        $inc: { quantity: -item.sellQuantity } // Stock kam (minus) kar rahe hain
      });
    }

    return NextResponse.json({ success: true, message: "Sale Complete! Stock updated." });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}