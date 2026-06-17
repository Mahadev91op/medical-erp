"use client";
import { useEffect } from "react";
import { signOut, useSession } from "next-auth/react";

export default function SessionTracker() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    let deviceSessionId = localStorage.getItem("device_session_id");
    if (!deviceSessionId) {
      deviceSessionId = "sess_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("device_session_id", deviceSessionId);
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

    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, 60000);

    return () => clearInterval(interval);
  }, [session]);

  return null;
}
