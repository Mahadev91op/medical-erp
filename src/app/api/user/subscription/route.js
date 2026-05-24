import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const history = searchParams.get("history") === "true";
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // Default env admin has lifetime
    if (userId === "000000000000000000000000") {
      return NextResponse.json({
        success: true,
        status: "active",
        subscriptionEnd: new Date("9999-12-31").toISOString(),
        subscriptionHistory: []
      });
    }

    await connectToDatabase();

    const projection = history ? "status subscriptionEnd subscriptionHistory" : "status subscriptionEnd";
    const user = await User.findById(userId).select(projection).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const responseData = {
      success: true,
      status: user.status,
      subscriptionEnd: user.subscriptionEnd ? new Date(user.subscriptionEnd).toISOString() : null
    };

    if (history) {
      responseData.subscriptionHistory = user.subscriptionHistory || [];
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Subscription API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
