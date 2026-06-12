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
 * Calculates the total size of all documents owned by a specific client in MongoDB.
 * Optimized to use fast, index-backed document counts multiplied by average document sizes,
 * avoiding expensive collection scans across hundreds of thousands of records.
 */
export async function getUserDataSize(userId) {
  try {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const [medCount, saleCount, sessionCount] = await Promise.all([
      Medicine.countDocuments({ userId: userObjectId }),
      Sale.countDocuments({ userId: userObjectId }),
      ActiveSession.countDocuments({ userId: userObjectId })
    ]);

    // Fast, realistic estimation of database storage space in bytes
    // Average document sizes: Medicine ~350B, Sale ~450B, ActiveSession ~150B, User ~300B
    const total = 
      (medCount * 350) +
      (saleCount * 450) +
      (sessionCount * 150) +
      300;

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
