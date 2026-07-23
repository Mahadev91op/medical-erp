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
        const distributor = searchParams.get("distributor") || "";
        const skip = (page - 1) * limit;

        const includeAll = searchParams.get("all") === "true";
        const query = { userId };
        if (!includeAll) {
            query.quantity = { $gt: 0 };
            query.expiryDate = { $gt: new Date() };
        }

        if (distributor) {
            query.distributor = { $regex: `^${escapeRegex(distributor)}$`, $options: "i" };
        }
        
        let medicines = [];
        let total = 0;

        if (search) {
            const escapedSearch = escapeRegex(search);
            
            if (skip === 0) {
                // 🚀 PREFIX-FIRST PERFORMANCE PATH (O(1) billing autocompletion)
                const prefixQuery = { 
                    ...query, 
                    $or: [
                        { name: { $regex: `^${escapedSearch}`, $options: "i" } },
                        { batch: { $regex: `^${escapedSearch}`, $options: "i" } },
                        { barcodeId: { $regex: `^${escapedSearch}`, $options: "i" } }
                    ]
                };

                // Fetch prefix matches first (uses indexes directly)
                medicines = await Medicine.find(prefixQuery).sort({ createdAt: -1 }).limit(limit).lean();

                // If we need more items to fill the limit, fallback to wildcard search
                if (medicines.length < limit) {
                    const remainingLimit = limit - medicines.length;
                    const foundIds = medicines.map(m => m._id);
                    const wildcardQuery = {
                        ...query,
                        _id: { $nin: foundIds },
                        $or: [
                            { name: { $regex: escapedSearch, $options: "i" } },
                            { batch: { $regex: escapedSearch, $options: "i" } },
                            { barcodeId: { $regex: escapedSearch, $options: "i" } }
                        ]
                    };

                    const additionalMeds = await Medicine.find(wildcardQuery)
                        .sort({ createdAt: -1 })
                        .limit(remainingLimit)
                        .lean();

                    medicines = medicines.concat(additionalMeds);
                    total = medicines.length;
                } else {
                    total = medicines.length;
                }
            } else {
                // STANDARD WILD-CARD PATH FOR PAGINATED SEARCHES (skip > 0)
                const wildcardQuery = {
                    ...query,
                    $or: [
                        { name: { $regex: escapedSearch, $options: "i" } },
                        { batch: { $regex: escapedSearch, $options: "i" } },
                        { barcodeId: { $regex: escapedSearch, $options: "i" } }
                    ]
                };
                [medicines, total] = await Promise.all([
                    Medicine.find(wildcardQuery).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
                    Medicine.countDocuments(wildcardQuery)
                ]);
            }
        } else {
            // Fetch all without search
            [medicines, total] = await Promise.all([
                Medicine.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
                Medicine.countDocuments(query)
            ]);
        }

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

        // 🚀 BULK INSERTION PATH FOR CSV/EXCEL IMPORTS
        if (Array.isArray(data)) {
            const medicinesToSave = data.map((item, idx) => {
                // Ensure unique barcodes even when created rapidly in bulk
                const uniqueBarcode = `MED-${(Date.now() + idx).toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
                return {
                    ...item,
                    userId,
                    barcodeId: item.barcodeId || uniqueBarcode,
                    quantity: Number(item.quantity),
                    mrp: Number(item.mrp),
                    purchasePrice: Number(item.purchasePrice || item.mrp)
                };
            });
            const inserted = await Medicine.insertMany(medicinesToSave);
            return NextResponse.json({ success: true, count: inserted.length }, { status: 201 });
        }

        // 📝 SINGLE INSERTION PATH
        const uniqueBarcode = `MED-${Date.now().toString().slice(-6)}${Math.floor(10 + Math.random() * 90)}`;
        
        let saveQty = Number(data.quantity);
        let saveMrp = Number(data.mrp);
        let savePurchasePrice = Number(data.purchasePrice || data.mrp || 0);
        let stripMrp = Number(data.stripMrp || data.mrp || 0);
        let tabletsPerStrip = Number(data.tabletsPerStrip || 1);
        
        if (data.isLoose && tabletsPerStrip > 1) {
            saveQty = Number(data.quantity) * tabletsPerStrip;
            saveMrp = Number(data.stripMrp) / tabletsPerStrip;
            savePurchasePrice = Number(data.purchasePrice || data.stripMrp || 0) / tabletsPerStrip;
        } else {
            stripMrp = saveMrp;
            tabletsPerStrip = 1;
        }

        const newMedicine = new Medicine({
            ...data,
            userId,
            barcodeId: uniqueBarcode,
            quantity: saveQty,
            mrp: saveMrp,
            purchasePrice: savePurchasePrice,
            stripMrp,
            tabletsPerStrip,
            isLoose: Boolean(data.isLoose)
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
        
        if (updateData.isLoose && Number(updateData.tabletsPerStrip) > 1) {
            if (updateData.stripMrp && updateData.tabletsPerStrip) {
                updateData.mrp = Number(updateData.stripMrp) / Number(updateData.tabletsPerStrip);
            }
            if (updateData.stripPurchasePrice && updateData.tabletsPerStrip) {
                updateData.purchasePrice = Number(updateData.stripPurchasePrice) / Number(updateData.tabletsPerStrip);
            }
        }
        
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
        if (id === "all-expired") {
            const today = new Date();
            const result = await Medicine.deleteMany({ userId, expiryDate: { $lt: today } });
            return NextResponse.json({ success: true, message: `Successfully deleted ${result.deletedCount} expired items.` });
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