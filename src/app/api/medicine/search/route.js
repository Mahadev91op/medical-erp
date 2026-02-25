import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const barcodeId = searchParams.get("barcode");

    // 🚀 SPEED OPTIMIZATION: Used .lean()
    const medicine = await Medicine.findOne({ barcodeId }).lean();
    if (!medicine) return NextResponse.json({ success: false, error: "Not Found" }, { status: 404 });

    // Ab hum stock 0 hone par yahan se error nahi bhejenge, 
    // balki frontend par details dikhayenge aur wahan block karenge.

    return NextResponse.json({ success: true, medicine });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}