import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

async function isAdmin() {
    const session = await getServerSession(authOptions);
    return session?.user?.role === "admin";
}

export async function GET(req) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 100; // Limit lazmi hai
        const search = searchParams.get("search") || "";
        const skip = (page - 1) * limit;

        // 🔥 SERVER-SIDE SEARCH FOR LAKHS OF DATA
        const query = { quantity: { $gt: 0 } };
        
        // Agar user ne kuch search kiya hai, toh database usay fast search karega
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { batch: { $regex: search, $options: "i" } },
                { barcodeId: { $regex: search, $options: "i" } }
            ];
        }

        const [medicines, total] = await Promise.all([
            Medicine.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            Medicine.countDocuments(query)
        ]);

        return NextResponse.json({
            success: true,
            medicines,
            pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    try {
        await connectToDatabase();
        const data = await req.json();
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
        const updated = await Medicine.findByIdAndUpdate(id, updateData, { new: true }).lean();
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