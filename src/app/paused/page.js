"use client";
import { signOut, useSession } from "next-auth/react";
import { Lock, ShieldAlert, LogOut, MessageSquare } from "lucide-react";

export default function Paused() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-[0_2px_24px_-4px_rgba(0,0,0,0.04)] border border-slate-100 p-8 text-center space-y-6">
        
        {/* Animated Icon Area */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-3xl flex items-center justify-center text-rose-500 shadow-lg shadow-rose-50 animate-bounce">
            <Lock className="w-10 h-10" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Subscription <span className="text-rose-500">Suspended</span>
          </h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">
            Aapka account temporary pause kar diya gaya hai
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 text-left space-y-3">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-slate-700">Aapki subscription khatam ho chuki hai!</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Naye billing, inventory aur reports update karne ke liye active subscription hona jaroori hai. Aapka data puri tarah se safe hai, kuch bhi delete nahi kiya gaya hai.
              </p>
            </div>
          </div>
          {session?.user?.subscriptionEnd && (
            <div className="border-t border-slate-200/50 pt-2.5 flex justify-between items-center text-xs">
              <span className="font-bold text-slate-400">EXPIRY DATE</span>
              <span className="font-extrabold text-rose-600">
                {new Date(session.user.subscriptionEnd).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </span>
            </div>
          )}
        </div>

        {/* Contact/Support Info */}
        <div className="text-slate-500 text-sm font-semibold">
          Kripya subscription renew karwane ke liye Super Admin se sampark karein.
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <a
            href="mailto:admin@pharmaerp.com?subject=PharmaERP Subscription Renewal Request"
            className="flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-md shadow-slate-200 gap-2 text-sm"
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            Contact Super Admin
          </a>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-100 font-bold px-6 py-3.5 rounded-xl transition-all gap-2 text-sm"
          >
            <LogOut className="w-4 h-4" />
            Log Out Account
          </button>
        </div>

      </div>
    </div>
  );
}
