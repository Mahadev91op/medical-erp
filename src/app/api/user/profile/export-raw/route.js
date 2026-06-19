import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import User from "@/models/User";
import Customer from "@/models/Customer";
import Distributor from "@/models/Distributor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;

        await connectToDatabase();

        const [user, medicines, sales, customers, distributors] = await Promise.all([
            User.findById(userId).select("-password").lean(),
            Medicine.find({ userId }).sort({ name: 1 }).lean(),
            Sale.find({ userId }).sort({ date: -1 }).lean(),
            Customer.find({ userId }).sort({ name: 1 }).lean(),
            Distributor.find({ userId }).sort({ name: 1 }).lean()
        ]);

        if (!user) {
            return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user,
            medicines,
            sales,
            customers,
            distributors
        });

    } catch (error) {
        console.error("Export Raw API Error:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
