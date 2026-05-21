import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

export const dynamic = 'force-dynamic'; 

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

async function isAdmin() {
    const session = await getServerSession(authOptions);
    return session?.user?.role === "admin";
}

const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export async function GET(req) {
    try {
        await connectToDatabase();
        const { searchParams } = new URL(req.url);

        if (searchParams.get("getDistributors") === "true") {
            const distributors = await Medicine.distinct("distributor");
            return NextResponse.json({ success: true, distributors });
        }

        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 100; 
        const search = searchParams.get("search") || "";
        const skip = (page - 1) * limit;

        const query = { quantity: { $gt: 0 } };
        
        if (search) {
            const escapedSearch = escapeRegex(search);
            query.$or = [
                { name: { $regex: escapedSearch, $options: "i" } },
                { batch: { $regex: escapedSearch, $options: "i" } },
                { barcodeId: { $regex: escapedSearch, $options: "i" } }
            ];
        }

        // 🚀 SPEED OPTIMIZATION: Count queries use active indexes (like quantity & search parameters) for fast lookup
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