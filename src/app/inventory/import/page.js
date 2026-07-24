"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RedirectToImportHub() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new tab inside Profile settings page
    router.replace("/profile");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bold text-slate-500">
      Redirecting to Software Sync Hub in Settings...
    </div>
  );
}
