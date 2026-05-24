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

        await connectToDatabase();

        // 1. Fetch user-specific data
        const [medicines, sales] = await Promise.all([
            Medicine.find({ userId }).lean(),
            Sale.find({ userId }).lean()
        ]);

        const backupData = {
            username,
            userId,
            medicines,
            sales,
            exportedAt: new Date().toISOString()
        };

        // 2. Save backup file on the server's backup directory (e.g. project workspace backups directory)
        const backupBaseDir = process.env.BACKUP_DIR || path.join(process.cwd(), "backups");
        
        try {
            if (!fs.existsSync(backupBaseDir)) {
                fs.mkdirSync(backupBaseDir, { recursive: true });
            }
            const filePath = path.join(backupBaseDir, `backup_${username.toLowerCase()}.json`);
            fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), "utf8");
        } catch (fsError) {
            console.error("FS Backup Write Failed (Continuing with browser download):", fsError);
        }

        // Return the backup data so the frontend can trigger a browser-level download
        return NextResponse.json({ 
            success: true, 
            message: `🎉 Backup Successful! Saved to server and ready for download.`,
            filename: `backup_${username.toLowerCase()}_${Date.now()}.json`,
            backupData
        });

    } catch (error) {
        console.error("Backup API Error:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Backup failed!",
            details: error.message
        }, { status: 500 });
    }
}