import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "admin";
}

export async function GET() {
  try {
    await connectToDatabase();
    const medicines = await Medicine.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, medicines });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    await connectToDatabase();
    const data = await req.json();
    
    // Standard Barcode ID format (stable for all entries)
    const uniqueBarcode = `MED-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
    
    const newMedicine = new Medicine({
      ...data,
      barcodeId: uniqueBarcode,
      quantity: Number(data.quantity),
      mrp: Number(data.mrp)
    });
    
    await newMedicine.save();
    return NextResponse.json({ success: true, medicine: newMedicine }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    await connectToDatabase();
    const { id, ...updateData } = await req.json();
    const updated = await Medicine.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ success: true, medicine: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await Medicine.findByIdAndDelete(id);
    return NextResponse.json({ success: true, message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}