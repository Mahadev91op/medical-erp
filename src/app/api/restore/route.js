import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = session.user.id;
        const username = session.user.name;

        const backupBaseDir = process.env.BACKUP_DIR || path.join(process.cwd(), "backups");
        const filePath = path.join(backupBaseDir, `backup_${username.toLowerCase()}.json`);

        if (!fs.existsSync(filePath)) {
             return NextResponse.json({ 
                 success: false, 
                 error: `Backup file not found at ${filePath}! Please save a backup first.` 
             }, { status: 404 });
        }

        // Read and parse backup file
        const fileContent = fs.readFileSync(filePath, "utf8");
        const backupData = JSON.parse(fileContent);

        // Security check: Make sure this backup belongs to this user
        if (backupData.username?.toLowerCase() !== username.toLowerCase()) {
            return NextResponse.json({ 
                success: false, 
                error: "Backup file username mismatch! Cannot restore data from another user."
            }, { status: 403 });
        }

        await connectToDatabase();

        // Wiping only this user's current data
        await Promise.all([
            Medicine.deleteMany({ userId }),
            Sale.deleteMany({ userId })
        ]);

        // Restoring medicines
        if (backupData.medicines && backupData.medicines.length > 0) {
            const medicinesToInsert = backupData.medicines.map(med => ({
                ...med,
                userId: userId // Enforce current userId in case it changed
            }));
            await Medicine.insertMany(medicinesToInsert);
        }

        // Restoring sales
        if (backupData.sales && backupData.sales.length > 0) {
            const salesToInsert = backupData.sales.map(sale => ({
                ...sale,
                userId: userId // Enforce current userId
            }));
            await Sale.insertMany(salesToInsert);
        }

        return NextResponse.json({ 
            success: true, 
            message: `🎉 Success! Only your data has been restored from ${path.basename(filePath)}.`
        });

    } catch (error) {
        console.error("Restore API Error:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Restore failed! Server error.",
            details: error.message
        }, { status: 500 });
    }
}