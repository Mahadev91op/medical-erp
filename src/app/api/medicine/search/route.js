import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const barcodeId = searchParams.get("barcode");
    const allowEmpty = searchParams.get("allowEmpty") === "true";

    // 🚀 SPEED OPTIMIZATION: Used .lean() for faster memory allocation
    const medicine = await Medicine.findOne({ barcodeId }).lean();
    if (!medicine) return NextResponse.json({ success: false, error: "Not Found" }, { status: 404 });

    if (!allowEmpty && medicine.quantity <= 0) {
      return NextResponse.json({ success: false, error: "Out of Stock!" }, { status: 400 });
    }

    return NextResponse.json({ success: true, medicine });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}