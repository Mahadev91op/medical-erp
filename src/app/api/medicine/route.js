import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

export async function POST(req) {
  try {
    await connectToDatabase();
    const data = await req.json();
    
    // Unique Barcode Generate karna (MED + Last 6 digits of timestamp + 2 random numbers)
    const uniqueBarcode = `MED-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
    
    // Data Database me save karna
    const newMedicine = new Medicine({
      name: data.name,
      batch: data.batch,
      expiryDate: data.expiryDate,
      quantity: Number(data.quantity),
      distributor: data.distributor,
      barcodeId: uniqueBarcode,
    });

    await newMedicine.save();
    
    return NextResponse.json({ success: true, medicine: newMedicine }, { status: 201 });
  } catch (error) {
    console.error("Error saving medicine:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}