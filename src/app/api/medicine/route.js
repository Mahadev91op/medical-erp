import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";

export const dynamic = 'force-dynamic'; 

async function isAdmin() {
    // Local database aur testing ke liye temporarily sabko admin maan rahe hain 
    // taaki "Unauthorized" error aaye bina medicines easily add/edit ho sakein.
    return true; 
}

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