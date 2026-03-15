import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const barcodeId = searchParams.get("barcode");

    // Agar empty scan hua toh error bhej do
    if (!barcodeId || barcodeId.trim() === "") {
        return NextResponse.json({ success: false, error: "Empty Barcode" }, { status: 400 });
    }

    // 🚀 BUG FIX: Clean barcode aur Regex use kiya gaya hai taaki extra spaces ya case mismatch problem na karein
    const cleanBarcode = barcodeId.trim();

    const medicine = await Medicine.findOne({ 
        // Case-insensitive aur exact match smart search
        barcodeId: { $regex: new RegExp(`^${cleanBarcode}$`, "i") } 
    }).lean();

    if (!medicine) {
        return NextResponse.json({ success: false, error: "Medicine Not Found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, medicine });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}