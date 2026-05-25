import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Otp from "@/models/Otp";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET API to fetch user profile details
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    if (userId === "000000000000000000000000") {
      // Return hardcoded dev superadmin values
      return NextResponse.json({
        success: true,
        user: {
          username: session.user.name,
          name: "Super Admin",
          shopName: "Central Admin Pharmacy",
          address: "ERP Server Environment",
          phoneNumber: "9999999999",
          email: "admin@system.local",
          role: "superadmin",
          status: "active"
        }
      });
    }

    await connectToDatabase();
    const user = await User.findById(userId).select("-password").lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Profile GET Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT API to update user profile details with OTP verification
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Super admin from .env doesn't exist in the DB, so they can't change profile this way
    if (userId === "000000000000000000000000") {
      return NextResponse.json({ success: false, error: "Default admin details cannot be changed from the UI. Please update your .env file." }, { status: 400 });
    }

    const { 
      name, 
      shopName, 
      address, 
      phoneNumber, 
      email, 
      newPassword, 
      otp 
    } = await req.json();

    if (!otp) {
      return NextResponse.json({ success: false, error: "Security verification OTP is required to make any changes." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // 1. Verify OTP against current email stored in the database
    const currentEmail = user.email || "";
    const otpRecord = await Otp.findOne({ email: currentEmail.toLowerCase().trim() });
    if (!otpRecord) {
      return NextResponse.json({ success: false, error: "OTP has expired or not found. Please request a new OTP code." }, { status: 400 });
    }

    if (otpRecord.emailOtp !== otp.trim()) {
      return NextResponse.json({ success: false, error: "Invalid OTP code entered." }, { status: 400 });
    }

    // 2. Validate email uniqueness if they are changing email
    if (email && email.toLowerCase().trim() !== currentEmail.toLowerCase().trim()) {
      const emailExists = await User.findOne({ email: email.toLowerCase().trim() });
      if (emailExists) {
        return NextResponse.json({ success: false, error: "The new email address is already registered by another account." }, { status: 400 });
      }
      user.email = email.toLowerCase().trim();
    }

    // 3. Apply profile updates
    if (name) user.name = name.trim();
    if (shopName) user.shopName = shopName.trim();
    if (address) user.address = address.trim();
    if (phoneNumber) user.phoneNumber = phoneNumber.trim();

    // 4. Hash and update password if provided
    if (newPassword) {
      if (newPassword.length < 4) {
        return NextResponse.json({ success: false, error: "Password must be at least 4 characters long" }, { status: 400 });
      }
      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    // 5. Delete OTP record after successful update
    await Otp.deleteOne({ _id: otpRecord._id });

    return NextResponse.json({ success: true, message: "Profile updated successfully!" });
  } catch (error) {
    console.error("Profile PUT Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
