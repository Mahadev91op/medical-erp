import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

export async function GET(req) {
  try {
    await connectToDatabase();
    
    // URL se barcode nikalna (e.g., ?barcode=MED-123456)
    const { searchParams } = new URL(req.url);
    const barcodeId = searchParams.get("barcode");

    if (!barcodeId) {
      return NextResponse.json({ success: false, error: "Barcode missing" }, { status: 400 });
    }

    // Database me dawai dhundhna
    const medicine = await Medicine.findOne({ barcodeId });

    if (!medicine) {
      return NextResponse.json({ success: false, error: "Ye barcode database me nahi hai!" }, { status: 404 });
    }

    if (medicine.quantity <= 0) {
      return NextResponse.json({ success: false, error: "Is dawai ka stock khatam ho chuka hai!" }, { status: 400 });
    }

    return NextResponse.json({ success: true, medicine });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}