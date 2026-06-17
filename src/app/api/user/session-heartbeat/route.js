import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ActiveSession from "@/models/ActiveSession";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

function parseUserAgent(userAgent) {
  let os = "Unknown OS";
  let browser = "Unknown Browser";
  let deviceType = "Desktop";

  if (!userAgent) return { os, browser, deviceType };

  if (userAgent.includes("Windows")) os = "Windows";
  else if (userAgent.includes("Macintosh")) os = "macOS";
  else if (userAgent.includes("iPhone")) { os = "iOS"; deviceType = "Mobile"; }
  else if (userAgent.includes("iPad")) { os = "iPadOS"; deviceType = "Tablet"; }
  else if (userAgent.includes("Android")) { os = "Android"; deviceType = "Mobile"; }
  else if (userAgent.includes("Linux")) os = "Linux";

  if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Chrome") && !userAgent.includes("Chromium") && !userAgent.includes("Edg")) browser = "Chrome";
  else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
  else if (userAgent.includes("Edg")) browser = "Edge";
  else if (userAgent.includes("Opera") || userAgent.includes("OPR")) browser = "Opera";

  return { os, browser, deviceType };
}

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

    const existingSession = await ActiveSession.findOne({ userId, deviceSessionId }).lean();
    if (existingSession && existingSession.status === "revoked") {
      return NextResponse.json({ success: false, status: "revoked", error: "Session has been revoked" }, { status: 401 });
    }

    const userAgentRaw = req.headers.get("user-agent") || "";
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    const { os, browser, deviceType } = parseUserAgent(userAgentRaw);

    // Update active session
    await ActiveSession.findOneAndUpdate(
      { userId, deviceSessionId },
      { 
        ipAddress, 
        userAgentRaw, 
        os, 
        browser, 
        deviceType, 
        lastActive: new Date(),
        status: "active" // Reset status to active
      },
      { upsert: true, new: true }
    );

    // Fetch all active sessions for this user (last active in past 5 mins, active status only)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    const activeSessions = await ActiveSession.find({
      userId,
      status: "active",
      lastActive: { $gte: fiveMinutesAgo }
    }).sort({ lastActive: -1 }).lean();

    return NextResponse.json({
      success: true,
      activeSessions: activeSessions.map(s => ({
        deviceSessionId: s.deviceSessionId,
        os: s.os,
        browser: s.browser,
        deviceType: s.deviceType,
        ipAddress: s.ipAddress,
        isCurrent: s.deviceSessionId === deviceSessionId,
        lastActive: s.lastActive
      }))
    });
  } catch (error) {
    console.error("Session heartbeat error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
