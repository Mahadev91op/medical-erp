import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Super admin from .env doesn't exist in the DB, so they can't change password this way
    if (userId === "000000000000000000000000") {
      return NextResponse.json({ success: false, error: "Default admin password cannot be changed from the UI. Please update your .env file." }, { status: 400 });
    }

    const { newPassword } = await req.json();

    if (!newPassword) {
      return NextResponse.json({ success: false, error: "New password is required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Hash and save new password
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return NextResponse.json({ success: true, message: "Password updated successfully!" });
  } catch (error) {
    console.error("Profile API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
