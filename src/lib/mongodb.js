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
      serverSelectionTimeoutMS: 5000, // 5 second me timeout hoga, website infinite load nahi hogi
    };

    console.log("⏳ MongoDB se connect ho raha hai...");
    
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then(async (m) => {
        console.log("✅ MongoDB Connected Successfully!");
        try {
          await Promise.all([
            Medicine.updateMany({ userId: { $exists: false } }, { $set: { userId: new m.Types.ObjectId("000000000000000000000000") } }),
            Sale.updateMany({ userId: { $exists: false } }, { $set: { userId: new m.Types.ObjectId("000000000000000000000000") } })
          ]);
        } catch (migErr) {
          console.error("⚠️ Legacy migration warning:", migErr.message);
        }
        return m;
      })
      .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err.message);
        throw err;
      });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}