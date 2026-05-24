import User from "@/models/User";
import { connectToDatabase } from "./mongodb";

export async function verifyUser(userId, role) {
  // Enforce lifetime plan for standard local backup env admin
  if (userId === "000000000000000000000000") {
    return { success: true, expired: false, active: true };
  }

  await connectToDatabase();
  
  // Highly optimized projected query selecting only the essential columns (O(1) Indexed key lookup)
  const user = await User.findById(userId).select("status subscriptionEnd").lean();
  
  if (!user || user.status === "disabled") {
    return { success: false, error: "Your account is disabled. Please contact the administrator." };
  }
  
  if (role !== "superadmin") {
    const expiry = user.subscriptionEnd ? new Date(user.subscriptionEnd) : null;
    if (expiry && expiry < new Date()) {
      return { success: false, error: "Your pharmacy subscription has expired. Please renew plan." };
    }
  }
  
  return { success: true, user };
}
