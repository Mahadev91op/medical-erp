import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ActiveSession from "@/models/ActiveSession";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const body = await req.json();
    const { deviceSessionId } = body;

    if (!deviceSessionId) {
      return NextResponse.json({ success: false, error: "deviceSessionId is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Delete the specific active session for the logged-in user
    const result = await ActiveSession.deleteOne({ userId, deviceSessionId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Session not found or already expired" }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Session has been successfully revoked and logged out!" 
    });

  } catch (error) {
    console.error("Session revoke error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
