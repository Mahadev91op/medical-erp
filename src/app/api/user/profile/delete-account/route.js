import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import ActiveSession from "@/models/ActiveSession";
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
      return NextResponse.json({ success: false, error: "Superadmin cannot be deleted." }, { status: 400 });
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

    // 🚀 FULL PURGE
    await Promise.all([
      Medicine.deleteMany({ userId }),
      Sale.deleteMany({ userId }),
      ActiveSession.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);

    // Consume/Delete the OTP record
    await Otp.deleteOne({ _id: otpRecord._id });

    return NextResponse.json({ success: true, message: "🎉 Your account and all associated datasets have been permanently erased from our servers." });
  } catch (error) {
    console.error("Delete Account API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
