import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Otp from "@/models/Otp";

export async function POST(req) {
  try {
    await connectToDatabase();
    const { email, emailOtp, phoneOtp, type = "signup" } = await req.json();

    if (!email || !emailOtp) {
      return NextResponse.json({ success: false, error: "Email and Email OTP are required." }, { status: 400 });
    }

    const otpRecord = await Otp.findOne({ email: email.toLowerCase().trim() });
    if (!otpRecord) {
      return NextResponse.json({ success: false, error: "OTP expired or not found. Please request a new one." }, { status: 400 });
    }

    // Verify email OTP
    if (otpRecord.emailOtp !== emailOtp.trim()) {
      return NextResponse.json({ success: false, error: "Invalid Email OTP." }, { status: 400 });
    }

    // For signup, verify phone OTP as well
    if (type === "signup") {
      if (!phoneOtp) {
        return NextResponse.json({ success: false, error: "Phone OTP is required for signup verification." }, { status: 400 });
      }
      if (otpRecord.phoneOtp !== phoneOtp.trim()) {
        return NextResponse.json({ success: false, error: "Invalid Phone OTP." }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, message: "OTPs verified successfully!" });

  } catch (error) {
    console.error("OTP Verify API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
