import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

export async function POST(req) {
  try {
    await connectToDatabase();
    const data = await req.json();
    
    const uniqueBarcode = `MED-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`;
    
    const newMedicine = new Medicine({
      name: data.name,
      batch: data.batch,
      expiryDate: data.expiryDate,
      quantity: Number(data.quantity),
      mrp: Number(data.mrp),
      distributor: data.distributor,
      barcodeId: uniqueBarcode,
    });

    await newMedicine.save();
    
    return NextResponse.json({ success: true, medicine: newMedicine }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}