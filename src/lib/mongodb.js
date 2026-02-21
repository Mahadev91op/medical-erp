import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

/**
 * Next.js runs in a serverless environment, so we create a global variable 
 * to prevent creating new connections repeatedly during development.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  // If a connection already exists, return it (Fast response)
  if (cached.conn) {
    return cached.conn;
  }

  // If there is no connection, create a new one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Prevents Mongoose from buffering queries
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB Connected Successfully!");
      return mongoose;
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}