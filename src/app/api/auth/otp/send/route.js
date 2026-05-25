import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Otp from "@/models/Otp";
import User from "@/models/User";
import { sendOtpEmail } from "@/lib/mailer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// Function to generate a random 6-digit numeric OTP
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json().catch(() => ({}));
    const { email: rawEmail, phone, type = "signup" } = body;

    let email = rawEmail?.toLowerCase().trim();

    // Generate random 6-digit OTPs
    const emailOtp = generateOtp();
    const phoneOtp = generateOtp();

    if (type === "signup") {
      if (!email) {
        return NextResponse.json({ success: false, error: "Email is required for signup verification." }, { status: 400 });
      }

      // Check if email already registered
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return NextResponse.json({ success: false, error: "Email is already registered. Please login or use a different email." }, { status: 400 });
      }

      // Save OTP record to database (will overwrite any existing active OTP for this email)
      await Otp.findOneAndDelete({ email });
      const newOtpRecord = new Otp({
        email,
        phone: phone || "",
        emailOtp,
        phoneOtp,
      });
      await newOtpRecord.save();

      // Send OTPs
      const mailRes = await sendOtpEmail(email, emailOtp, phoneOtp, "signup");

      return NextResponse.json({
        success: true,
        message: "OTPs sent successfully!",
        // Return OTPs in response ONLY in development mode for easy developer testing without setting SMTP
        ...(process.env.NODE_ENV === "development" ? { debug: { emailOtp, phoneOtp } } : {})
      });
    }

    if (type === "profile") {
      // Profile update OTP requires a logged in session
      const session = await getServerSession(authOptions);
      if (!session || !session.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const userId = session.user.id;
      if (userId === "000000000000000000000000") {
        return NextResponse.json({ success: false, error: "Superadmin credentials are managed in environmental variables." }, { status: 400 });
      }

      const dbUser = await User.findById(userId);
      if (!dbUser) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
      }

      const userEmail = dbUser.email;
      if (!userEmail) {
        return NextResponse.json({ success: false, error: "No email address registered to this account. Please contact admin." }, { status: 400 });
      }

      // Save OTP record to database (using dummy phoneOtp for schema conformity)
      await Otp.findOneAndDelete({ email: userEmail });
      const newOtpRecord = new Otp({
        email: userEmail,
        phone: dbUser.phoneNumber || "",
        emailOtp,
        phoneOtp: "000000",
      });
      await newOtpRecord.save();

      // Send OTP to user's registered email
      const mailRes = await sendOtpEmail(userEmail, emailOtp, null, "profile");

      return NextResponse.json({
        success: true,
        message: "Verification OTP sent to your registered email!",
        ...(process.env.NODE_ENV === "development" ? { debug: { emailOtp } } : {})
      });
    }

    return NextResponse.json({ success: false, error: "Invalid type specified" }, { status: 400 });

  } catch (error) {
    console.error("OTP Send API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
