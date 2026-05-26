import mongoose from "mongoose";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import ActiveSession from "@/models/ActiveSession";
import User from "@/models/User";

/**
 * Formats a number of bytes into a human-readable size string (Bytes, KB, MB, GB).
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes === 0) {
    return '0 Bytes';
  }
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Calculates the total size of all documents owned by a specific client in MongoDB
 * using the aggregation framework with the $bsonSize operator.
 */
export async function getUserDataSize(userId) {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const [medSize, saleSize, sessionSize, userDocSize] = await Promise.all([
      Medicine.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, totalSize: { $sum: { $bsonSize: "$$ROOT" } } } }
      ]),
      Sale.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, totalSize: { $sum: { $bsonSize: "$$ROOT" } } } }
      ]),
      ActiveSession.aggregate([
        { $match: { userId: userObjectId } },
        { $group: { _id: null, totalSize: { $sum: { $bsonSize: "$$ROOT" } } } }
      ]),
      User.aggregate([
        { $match: { _id: userObjectId } },
        { $group: { _id: null, totalSize: { $sum: { $bsonSize: "$$ROOT" } } } }
      ])
    ]);

    const total = 
      (medSize[0]?.totalSize || 0) +
      (saleSize[0]?.totalSize || 0) +
      (sessionSize[0]?.totalSize || 0) +
      (userDocSize[0]?.totalSize || 0);

    return total;
  } catch (err) {
    console.error("Error calculating user database data size:", err);
    return 0;
  }
}

/**
 * Retrieves the total database dataSize statistic from the active MongoDB connection.
 */
export async function getTotalDatabaseSize() {
  try {
    if (mongoose.connection.readyState !== 1) {
      return 0;
    }
    const dbStats = await mongoose.connection.db.stats();
    return dbStats.dataSize || 0;
  } catch (err) {
    console.error("Failed to fetch database total stats:", err);
    return 0;
  }
}
