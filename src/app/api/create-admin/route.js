import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET() {
    try {
        await connectToDatabase();

        // Pehle check karte hain ki kya admin pehle se bana hua hai
        const existingUser = await User.findOne({ email: "admin@gmail.com" });
        if (existingUser) {
            return NextResponse.json({ 
                success: false, 
                message: "Bhai, Admin user pehle se bana hua hai! Aap sidha login kar sakte ho." 
            });
        }

        // Password ko encrypt (hash) kar rahe hain taaki database me safe rahe
        const hashedPassword = await bcrypt.hash("admin123", 10);

        // Naya user create kar rahe hain (Yahan humne username add kar diya hai)
        const newAdmin = new User({
            name: "Shop Admin",
            username: "admin", // 🔥 FIX: Ye missing tha jiski wajah se error aaya
            email: "admin@gmail.com",
            password: hashedPassword,
            role: "admin"
        });

        await newAdmin.save();

        return NextResponse.json({
            success: true,
            message: "🎉 BINGO! Admin user successfully ban gaya hai! Ab login page par jao. Email: admin@gmail.com | Username: admin | Password: admin123"
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}