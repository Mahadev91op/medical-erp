import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import ActiveSession from "@/models/ActiveSession";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserDataSize, getTotalDatabaseSize, formatBytes } from "@/lib/storageHelper";

// Secure Admin Panel checks
async function isSuperAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.role === "superadmin";
}

export async function GET(req) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 15;
    const search = searchParams.get("search") || "";
    const filter = searchParams.get("filter") || "all";
    const skip = (page - 1) * limit;

    await connectToDatabase();

    const query = { role: { $ne: "superadmin" } };
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { shopName: { $regex: search, $options: "i" } },
        { phoneNumber: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ];
    }

    if (filter === "active") {
      query.status = "active";
      query.subscriptionEnd = { $gte: new Date() };
    } else if (filter === "expired") {
      query.status = "active";
      query.subscriptionEnd = { $lt: new Date() };
    } else if (filter === "disabled") {
      query.status = "disabled";
    }

    // Run parallel count operations for global metrics and list pagination
    const [total, users, totalClients, activeCount, disabledCount, expiredCount] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
          .select("-password")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
      User.countDocuments({ role: { $ne: "superadmin" } }),
      User.countDocuments({ role: { $ne: "superadmin" }, status: "active", subscriptionEnd: { $gte: new Date() } }),
      User.countDocuments({ role: { $ne: "superadmin" }, status: "disabled" }),
      User.countDocuments({ role: { $ne: "superadmin" }, status: "active", subscriptionEnd: { $lt: new Date() } })
    ]);

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const usersWithCounts = await Promise.all(users.map(async (user) => {
      const [medicinesCount, salesCount, activeSessions] = await Promise.all([
        Medicine.countDocuments({ userId: user._id }),
        Sale.countDocuments({ userId: user._id }),
        ActiveSession.find({
          userId: user._id
        }).select("deviceSessionId lastActive os browser deviceType ipAddress").lean()
      ]);

      // Calculate storage metrics in-memory directly to save database calls
      const activeSessionCount = activeSessions.length;
      const dataSizeBytes = 
        (medicinesCount * 350) +
        (salesCount * 450) +
        (activeSessionCount * 150) +
        300;

      return {
        ...user,
        medicinesCount,
        salesCount,
        dataSize: dataSizeBytes,
        dataSizeFormatted: formatBytes(dataSizeBytes),
        isOnline: activeSessions.some(s => s.lastActive >= fiveMinutesAgo),
        activeSessions: activeSessions.map(s => ({
          deviceSessionId: s.deviceSessionId,
          os: s.os,
          browser: s.browser,
          deviceType: s.deviceType,
          ipAddress: s.ipAddress,
          lastActive: s.lastActive,
          isOnline: s.lastActive >= fiveMinutesAgo
        }))
      };
    }));

    const totalDatabaseSizeBytes = await getTotalDatabaseSize();

    return NextResponse.json({
      success: true,
      users: usersWithCounts,
      stats: {
        totalClients,
        activeCount,
        disabledCount,
        expiredCount,
        totalDatabaseSize: totalDatabaseSizeBytes,
        totalDatabaseSizeFormatted: formatBytes(totalDatabaseSizeBytes)
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const body = await req.json();
    const { userId, action, status, password, subscriptionMonths } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    if (action === "toggleStatus") {
      user.status = status;
      await user.save();
      return NextResponse.json({ success: true, message: `Account status updated to ${status}!` });
    }

    if (action === "changePassword") {
      if (!password || password.trim().length < 4) {
        return NextResponse.json({ success: false, error: "Password must be at least 4 characters long" }, { status: 400 });
      }
      user.password = await bcrypt.hash(password, 10);
      await user.save();
      return NextResponse.json({ success: true, message: "Password updated successfully!" });
    }

    if (action === "addSubscription") {
      const months = parseInt(subscriptionMonths);
      if (isNaN(months) || months <= 0) {
        return NextResponse.json({ success: false, error: "Invalid subscription months" }, { status: 400 });
      }

      let currentEnd = user.subscriptionEnd ? new Date(user.subscriptionEnd) : new Date();
      // If it's already expired, start extending from today
      if (currentEnd < new Date()) {
        currentEnd = new Date();
      }

      currentEnd.setMonth(currentEnd.getMonth() + months);
      user.subscriptionEnd = currentEnd;

      // Log to subscriptionHistory array
      if (!user.subscriptionHistory) {
        user.subscriptionHistory = [];
      }
      user.subscriptionHistory.push({
        addedMonths: months,
        addedAt: new Date(),
        newExpirationDate: currentEnd
      });

      await user.save();

      return NextResponse.json({ 
        success: true, 
        message: `Subscription successfully extended by ${months} months!`,
        subscriptionEnd: currentEnd.toISOString()
      });
    }

    if (action === "endSubscription") {
      const expiredTime = new Date();
      expiredTime.setSeconds(expiredTime.getSeconds() - 10); // 10 seconds ago to ensure it is in the past
      user.subscriptionEnd = expiredTime;

      // Log to subscriptionHistory array with 0 months to show termination
      if (!user.subscriptionHistory) {
        user.subscriptionHistory = [];
      }
      user.subscriptionHistory.push({
        addedMonths: 0,
        addedAt: new Date(),
        newExpirationDate: expiredTime
      });

      await user.save();

      return NextResponse.json({ 
        success: true, 
        message: `Subscription for ${user.username} has been terminated immediately!`,
        subscriptionEnd: expiredTime.toISOString()
      });
    }

    if (action === "updateDetails") {
      const { username, name, shopName, address, phoneNumber, email } = body;

      if (username && username.toLowerCase().trim() !== user.username) {
        const existing = await User.findOne({ username: username.toLowerCase().trim() });
        if (existing) {
          return NextResponse.json({ success: false, error: "Username is already taken" }, { status: 400 });
        }
        user.username = username.toLowerCase().trim();
      }

      if (email && email.toLowerCase().trim() !== (user.email || "")) {
        const existingEmail = await User.findOne({ email: email.toLowerCase().trim() });
        if (existingEmail) {
          return NextResponse.json({ success: false, error: "Email address is already registered to another user" }, { status: 400 });
        }
        user.email = email.toLowerCase().trim();
      }

      if (name !== undefined) user.name = name.trim();
      if (shopName !== undefined) user.shopName = shopName.trim();
      if (address !== undefined) user.address = address.trim();
      if (phoneNumber !== undefined) user.phoneNumber = phoneNumber.trim();

      await user.save();
      return NextResponse.json({ success: true, message: "Client details updated successfully!" });
    }

    return NextResponse.json({ success: false, error: "Invalid action specified" }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // 🚀 FULL PURGE: Delete user account AND all associated tenant data
    await Promise.all([
      Medicine.deleteMany({ userId }),
      Sale.deleteMany({ userId }),
      User.findByIdAndDelete(userId)
    ]);

    return NextResponse.json({ success: true, message: "User account and all associated data completely deleted!" });

  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
