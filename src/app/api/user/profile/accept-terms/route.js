import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
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
      // Super admin is from .env and doesn't exist in MongoDB, skip database write.
      return NextResponse.json({ success: true, message: "Super admin configuration bypassed." });
    }

    await connectToDatabase();
    // Get client IP address dynamically
    const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const primaryIp = ipAddress.split(',')[0].trim();

    const user = await User.findByIdAndUpdate(userId, {
      termsAccepted: true,
      termsVersion: "v1.0", // The current system terms version
      consentTimestamp: new Date(),
      consentIP: primaryIp
    }, { new: true });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Terms and conditions accepted and logged successfully!" });
  } catch (error) {
    console.error("Terms Acceptance API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
