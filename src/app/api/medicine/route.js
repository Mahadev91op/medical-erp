import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyUser } from "@/lib/verifyUser";

export const dynamic = 'force-dynamic'; 

const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export async function GET(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;
        const verification = await verifyUser(userId, session.user.role);
        if (!verification.success) {
            return NextResponse.json({ error: verification.error }, { status: 403 });
        }

        await connectToDatabase();
        const { searchParams } = new URL(req.url);

        if (searchParams.get("getDistributors") === "true") {
            const distributors = await Medicine.distinct("distributor", { userId });
            return NextResponse.json({ success: true, distributors });
        }

        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 100; 
        const search = searchParams.get("search") || "";
        const skip = (page - 1) * limit;

        const includeAll = searchParams.get("all") === "true";
        const query = { userId };
        if (!includeAll) {
            query.quantity = { $gt: 0 };
        }
        
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
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;
        const verification = await verifyUser(userId, session.user.role);
        if (!verification.success) {
            return NextResponse.json({ error: verification.error }, { status: 403 });
        }

        await connectToDatabase();
        const data = await req.json();
        const uniqueBarcode = `MED-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
        const newMedicine = new Medicine({
            ...data,
            userId,
            barcodeId: uniqueBarcode,
            quantity: Number(data.quantity),
            mrp: Number(data.mrp),
            purchasePrice: Number(data.purchasePrice || data.mrp)
        });
        await newMedicine.save();
        return NextResponse.json({ success: true, medicine: newMedicine }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;
        const verification = await verifyUser(userId, session.user.role);
        if (!verification.success) {
            return NextResponse.json({ error: verification.error }, { status: 403 });
        }

        await connectToDatabase();
        const { id, ...updateData } = await req.json();
        const updated = await Medicine.findOneAndUpdate({ _id: id, userId }, updateData, { new: true }).lean();
        if (!updated) {
            return NextResponse.json({ success: false, error: "Medicine not found or unauthorized" }, { status: 404 });
        }
        return NextResponse.json({ success: true, medicine: updated });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;
        const verification = await verifyUser(userId, session.user.role);
        if (!verification.success) {
            return NextResponse.json({ error: verification.error }, { status: 403 });
        }

        await connectToDatabase();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");
        if (!id) {
            return NextResponse.json({ success: false, error: "ID parameter is required" }, { status: 400 });
        }
        if (id.includes(",")) {
            const ids = id.split(",").filter(Boolean);
            await Medicine.deleteMany({ _id: { $in: ids }, userId });
        } else {
            const deleted = await Medicine.findOneAndDelete({ _id: id, userId });
            if (!deleted) {
                return NextResponse.json({ success: false, error: "Medicine not found or unauthorized" }, { status: 404 });
            }
        }
        return NextResponse.json({ success: true, message: "Deleted successfully" });
    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}