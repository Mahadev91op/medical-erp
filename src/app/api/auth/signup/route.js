import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Otp from "@/models/Otp";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectToDatabase();
    const { 
      username, 
      password, 
      name, 
      shopName, 
      address, 
      phoneNumber, 
      email, 
      emailOtp, 
      phoneOtp 
    } = await req.json();

    if (!username || !password || !name || !shopName || !address || !phoneNumber || !email) {
      return NextResponse.json({ success: false, error: "All fields are required" }, { status: 400 });
    }

    if (!emailOtp || !phoneOtp) {
      return NextResponse.json({ success: false, error: "OTP verification codes are required" }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    // 1. Verify OTP codes against database
    const otpRecord = await Otp.findOne({ email: cleanEmail });
    if (!otpRecord) {
      return NextResponse.json({ success: false, error: "OTP expired or not found. Please request a new OTP code." }, { status: 400 });
    }

    if (otpRecord.emailOtp !== emailOtp.trim()) {
      return NextResponse.json({ success: false, error: "Invalid Email OTP." }, { status: 400 });
    }

    if (otpRecord.phoneOtp !== phoneOtp.trim()) {
      return NextResponse.json({ success: false, error: "Invalid Phone OTP." }, { status: 400 });
    }

    // 2. Check if username already exists
    const existingUser = await User.findOne({ username: cleanUsername });
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Username already exists" }, { status: 400 });
    }

    // 3. Check if email already exists
    const existingEmail = await User.findOne({ email: cleanEmail });
    if (existingEmail) {
      return NextResponse.json({ success: false, error: "Email is already registered" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      username: cleanUsername,
      password: hashedPassword,
      name: name.trim(),
      shopName: shopName.trim(),
      address: address.trim(),
      phoneNumber: phoneNumber.trim(),
      email: cleanEmail,
      role: "admin", // Give newly registered users the 'admin' role
      status: "active"
    });

    await newUser.save();

    // Clean up OTP record after successful registration
    await Otp.deleteOne({ _id: otpRecord._id });

    return NextResponse.json({ success: true, message: "User registered successfully!" }, { status: 201 });
  } catch (error) {
    console.error("Signup API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
