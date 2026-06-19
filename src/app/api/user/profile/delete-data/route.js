import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import Otp from "@/models/Otp";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    if (userId === "000000000000000000000000") {
      return NextResponse.json({ success: false, error: "Superadmin cannot wipe system settings via profile API." }, { status: 400 });
    }

    const { otp } = await req.json().catch(() => ({}));
    if (!otp) {
      return NextResponse.json({ success: false, error: "Verification OTP code is required." }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User profile not found." }, { status: 404 });
    }

    const userEmail = user.email;
    if (!userEmail) {
      return NextResponse.json({ success: false, error: "No email address registered to this account." }, { status: 400 });
    }

    // Verify OTP
    const otpRecord = await Otp.findOne({ email: userEmail });
    if (!otpRecord) {
      return NextResponse.json({ success: false, error: "OTP has expired or was not requested. Please request a new code." }, { status: 400 });
    }

    if (otpRecord.emailOtp !== otp.trim()) {
      return NextResponse.json({ success: false, error: "Invalid verification code. Please check and try again." }, { status: 400 });
    }

    // 🚀 PURGE ALL STORE DATA (Medicines, Sales/Invoices)
    await Promise.all([
      Medicine.deleteMany({ userId }),
      Sale.deleteMany({ userId })
    ]);

    // Consume/Delete the OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    return NextResponse.json({ success: true, message: "🎉 All inventory stocks, medicines, and sales invoice history have been permanently purged." });
  } catch (error) {
    console.error("Purge Data API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
