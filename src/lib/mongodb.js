import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

/**
 * Next.js serverless environment me chalta hai, isliye hum ek global variable 
 * banate hain taaki development ke time baar-baar naye connection na bane.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  // Agar pehle se connection hai, toh wahi return kardo (Fast response)
  if (cached.conn) {
    return cached.conn;
  }

  // Agar connection nahi hai, toh naya connection banao
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Mongoose ko queries buffer karne se rokta hai
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB Connected Successfully!");
      return mongoose;
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}