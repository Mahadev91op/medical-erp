import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectToDatabase();
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ success: false, error: "Username and password are required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username: username.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ success: false, error: "Username already exists" }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      username: username.toLowerCase().trim(),
      password: hashedPassword,
      role: "admin" // Give each newly registered user admin role by default so they can add/edit/delete their own data
    });

    await newUser.save();

    return NextResponse.json({ success: true, message: "User registered successfully!" }, { status: 201 });
  } catch (error) {
    console.error("Signup API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
