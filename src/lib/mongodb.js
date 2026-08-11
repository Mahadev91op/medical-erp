import mongoose from "mongoose";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("🚨 Please define the MONGODB_URI environment variable inside .env");
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    console.log("⚡ Purana MongoDB connection use ho raha hai.");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    };

    console.log("⏳ MongoDB se connect ho raha hai...");
    
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((m) => {
        console.log("✅ MongoDB Connected Successfully!");
        return m;
      })
      .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
        cached.promise = null;
        throw err;
      });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}