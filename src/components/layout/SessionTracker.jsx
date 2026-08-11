"use client";
import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { safeStorage } from "@/lib/safeStorage";

export default function SessionTracker() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    let deviceSessionId = safeStorage.getItem("device_session_id");
    if (!deviceSessionId) {
      deviceSessionId = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      safeStorage.setItem("device_session_id", deviceSessionId);
    }

    const sendHeartbeat = async () => {
      try {
        const res = await fetch("/api/user/session-heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deviceSessionId })
        });
        const data = await res.json();
        if (res.status === 401 || data.status === "revoked") {
          await signOut({ redirect: false });
          window.location.href = "/login?error=revoked";
        }
      } catch (err) {
        console.error("Heartbeat error:", err);
      }
    };

    const initialTimeout = setTimeout(sendHeartbeat, 3000); // Delay initial heartbeat by 3 seconds
    const interval = setInterval(sendHeartbeat, 60000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [session]);

  return null;
}
