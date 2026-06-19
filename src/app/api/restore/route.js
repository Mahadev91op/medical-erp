import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = 'force-dynamic';

// GET API: Restore backup file saved on the server (Legacy compatibility)
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
                 error: `Backup file not found on server at ${filePath}! Please save a backup first.` 
             }, { status: 404 });
        }

        // Read and parse backup file
        const fileContent = fs.readFileSync(filePath, "utf8");
        const rawFileData = JSON.parse(fileContent);

        const { decrypt } = await import("@/lib/encryption");
        let backupData = rawFileData;
        if (rawFileData.isEncrypted) {
            const decryptedString = decrypt(rawFileData.payload);
            backupData = JSON.parse(decryptedString);
        }

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

        // Restoring medicines with proper casting to ObjectId
        if (backupData.medicines && backupData.medicines.length > 0) {
            const medicinesToInsert = backupData.medicines.map(med => ({
                ...med,
                _id: new mongoose.Types.ObjectId(med._id),
                userId: new mongoose.Types.ObjectId(userId)
            }));
            await Medicine.insertMany(medicinesToInsert);
        }

        // Restoring sales with proper casting to ObjectId
        if (backupData.sales && backupData.sales.length > 0) {
            const salesToInsert = backupData.sales.map(sale => ({
                ...sale,
                _id: new mongoose.Types.ObjectId(sale._id),
                userId: new mongoose.Types.ObjectId(userId),
                items: sale.items.map(item => ({
                  ...item,
                  medicineId: new mongoose.Types.ObjectId(item.medicineId)
                }))
            }));
            await Sale.insertMany(salesToInsert);
        }

        return NextResponse.json({ 
            success: true, 
            message: `🎉 Success! Only your data has been restored from server backup.`
        });

    } catch (error) {
        console.error("Restore GET API Error:", error);
        return NextResponse.json({ 
            success: false, 
            error: "Restore failed! Server error.",
            details: error.message
        }, { status: 500 });
    }
}

// POST API: Restore uploaded JSON file from the client browser local PC
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const username = session.user.name;
    const role = session.user.role;

    const { backupData: rawBackupData } = await req.json();

    if (!rawBackupData) {
      return NextResponse.json({ success: false, error: "Invalid upload: No backup data found." }, { status: 400 });
    }

    const { decrypt } = await import("@/lib/encryption");
    let backupData = rawBackupData;
    if (rawBackupData.isEncrypted) {
      try {
        const decryptedString = decrypt(rawBackupData.payload);
        backupData = JSON.parse(decryptedString);
      } catch (decErr) {
        return NextResponse.json({ success: false, error: "Backup decryption failed. The backup file is corrupted or password secret is mismatch." }, { status: 400 });
      }
    }

    await connectToDatabase();

    // CASE 1: Full System Restore (SuperAdmin ONLY)
    if (backupData.isFullSystemBackup) {
      if (role !== "superadmin") {
        return NextResponse.json({ success: false, error: "Unauthorized: Only superadmin is allowed to perform a full system database restore." }, { status: 403 });
      }

      // Purge all user databases (except superadmin credentials)
      await Promise.all([
        User.deleteMany({ role: { $ne: "superadmin" } }),
        Medicine.deleteMany({}),
        Sale.deleteMany({})
      ]);

      // Restore Users
      if (backupData.users && backupData.users.length > 0) {
        const usersToInsert = backupData.users.map(u => ({
          ...u,
          _id: new mongoose.Types.ObjectId(u._id)
        }));
        await User.insertMany(usersToInsert);
      }

      // Restore Medicines
      if (backupData.medicines && backupData.medicines.length > 0) {
        const medicinesToInsert = backupData.medicines.map(med => ({
          ...med,
          _id: new mongoose.Types.ObjectId(med._id),
          userId: new mongoose.Types.ObjectId(med.userId)
        }));
        await Medicine.insertMany(medicinesToInsert);
      }

      // Restore Sales
      if (backupData.sales && backupData.sales.length > 0) {
        const salesToInsert = backupData.sales.map(sale => ({
          ...sale,
          _id: new mongoose.Types.ObjectId(sale._id),
          userId: new mongoose.Types.ObjectId(sale.userId),
          items: sale.items.map(item => ({
            ...item,
            medicineId: new mongoose.Types.ObjectId(item.medicineId)
          }))
        }));
        await Sale.insertMany(salesToInsert);
      }

      return NextResponse.json({
        success: true,
        message: "🎉 Full system data restore complete! All accounts, medicines, and bill records successfully recovered."
      });
    }

    // CASE 2: Single User Data Restore (User or SuperAdmin)
    let targetUserId = userId;
    let targetUsername = username;

    if (role === "superadmin") {
      // In superadmin view, read target userId from backup file
      if (!backupData.userId) {
        return NextResponse.json({ success: false, error: "Invalid backup: Missing target User ID data." }, { status: 400 });
      }
      if (!mongoose.Types.ObjectId.isValid(backupData.userId)) {
        return NextResponse.json({ success: false, error: "Invalid target User ID format in backup file." }, { status: 400 });
      }
      targetUserId = backupData.userId;
      targetUsername = backupData.username || "Selected User";

      // Verify that this user exists
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return NextResponse.json({ success: false, error: `Client account "${targetUsername}" not found in current database.` }, { status: 400 });
      }
    } else {
      // Standard client: check file ownership
      if (backupData.username && backupData.username.toLowerCase() !== username.toLowerCase()) {
        return NextResponse.json({ 
          success: false, 
          error: `Backup ownership mismatch! You can only restore backups belonging to your account: "${username}".`
        }, { status: 403 });
      }
    }

    // Purge target user's records
    await Promise.all([
      Medicine.deleteMany({ userId: targetUserId }),
      Sale.deleteMany({ userId: targetUserId })
    ]);

    // Restore medicines
    if (backupData.medicines && backupData.medicines.length > 0) {
      const medicinesToInsert = backupData.medicines.map(med => ({
        ...med,
        _id: new mongoose.Types.ObjectId(med._id),
        userId: new mongoose.Types.ObjectId(targetUserId)
      }));
      await Medicine.insertMany(medicinesToInsert);
    }

    // Restore sales
    if (backupData.sales && backupData.sales.length > 0) {
      const salesToInsert = backupData.sales.map(sale => ({
        ...sale,
        _id: new mongoose.Types.ObjectId(sale._id),
        userId: new mongoose.Types.ObjectId(targetUserId),
        items: sale.items.map(item => ({
          ...item,
          medicineId: new mongoose.Types.ObjectId(item.medicineId)
        }))
      }));
      await Sale.insertMany(salesToInsert);
    }

    return NextResponse.json({ 
      success: true, 
      message: `🎉 Data successfully restored for account: ${targetUsername}.`
    });

  } catch (error) {
    console.error("Restore POST API Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Restore failed! Server error.",
      details: error.message
    }, { status: 500 });
  }
}