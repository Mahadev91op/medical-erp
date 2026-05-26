import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Check if requester is superadmin
async function isSuperAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "superadmin";
}

export async function GET(req) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    await connectToDatabase();

    if (!userId) {
      // 🚀 Full System Backup (except env superadmin)
      const [users, medicines, sales] = await Promise.all([
        User.find({ role: { $ne: "superadmin" } }).lean(),
        Medicine.find({}).lean(),
        Sale.find({}).lean()
      ]);

      const backupData = {
        isFullSystemBackup: true,
        users,
        medicines,
        sales,
        exportedAt: new Date().toISOString(),
        exportedBy: "SuperAdmin"
      };

      return NextResponse.json({
        success: true,
        filename: `backup_full_system_${Date.now()}.json`,
        backupData
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Fetch user-specific data
    const [medicines, sales] = await Promise.all([
      Medicine.find({ userId }).lean(),
      Sale.find({ userId }).lean()
    ]);

    const backupData = {
      username: user.username,
      userId: user._id.toString(),
      medicines,
      sales,
      exportedAt: new Date().toISOString(),
      exportedBy: "SuperAdmin"
    };

    return NextResponse.json({
      success: true,
      filename: `backup_${user.username.toLowerCase()}_superadmin.json`,
      backupData
    });

  } catch (error) {
    console.error("SuperAdmin Backup API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
