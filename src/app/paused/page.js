"use client";
import { signOut, useSession } from "next-auth/react";
import { Lock, ShieldAlert, LogOut, MessageSquare, HelpCircle } from "lucide-react";

export default function Paused() {
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-50 via-slate-100/50 to-blue-50/30 flex flex-col justify-center items-center p-6 relative overflow-hidden select-none">
      
      {/* Background visual details */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-100/30 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-rose-100/20 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-xl bg-white/80 backdrop-blur-xl rounded-[32px] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border border-slate-200/80 p-8 md:p-10 text-center space-y-8 relative z-10 animate-in fade-in zoom-in-95 duration-500">
        
        {/* Animated Icon Area */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-rose-500/10 rounded-3xl blur-xl animate-pulse"></div>
            <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-3xl flex items-center justify-center text-rose-500 shadow-lg shadow-rose-100/40 relative z-10 animate-bounce duration-1000">
              <Lock className="w-10 h-10" />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2.5">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">
            Subscription <span className="bg-gradient-to-r from-rose-500 to-rose-600 bg-clip-text text-transparent">Suspended</span>
          </h1>
          <p className="text-slate-400 text-xs font-extrabold uppercase tracking-widest">
            Temporary Licensing Restriction
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 text-left space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2 bg-rose-50 rounded-xl border border-rose-100 shrink-0 text-rose-500">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">License expired or usage paused</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-medium">
                An active subscription is required to perform billing, check out-of-stock items, process sales, and download reports. Your pharmacy&apos;s database and data records are safe and secure.
              </p>
            </div>
          </div>
          
          {session?.user?.subscriptionEnd && (
            <div className="border-t border-slate-200/60 pt-3.5 flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-400 tracking-wider">PREVIOUS EXPIRY DATE</span>
              <span className="font-extrabold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100/50">
                {new Date(session.user.subscriptionEnd).toLocaleDateString("en-US", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })}
              </span>
            </div>
          )}
        </div>

        {/* renewal guide */}
        <div className="space-y-4 p-5 rounded-2xl bg-blue-50/40 border border-blue-100/50 text-left">
          <div className="flex items-center gap-2 text-blue-700">
            <HelpCircle className="w-4 h-4 shrink-0" />
            <h4 className="text-xs font-extrabold uppercase tracking-wide">Renewal Steps</h4>
          </div>
          <ol className="text-xs text-slate-500 space-y-2 list-decimal list-inside font-medium leading-relaxed font-semibold">
            <li>Contact the system Super Administrator for invoice details.</li>
            <li>Submit payment and mention your registered account username: <strong className="text-slate-700 font-bold bg-slate-150/80 px-1.5 py-0.5 rounded">{session?.user?.name || "N/A"}</strong>.</li>
            <li>The subscription will be instantly refreshed on your dashboard.</li>
          </ol>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3.5 justify-center pt-2">
          <a
            href="mailto:admin@pharmaerp.com?subject=PharmaERP Subscription Renewal Request"
            className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-4 rounded-2xl transition-all shadow-lg shadow-blue-100 hover:shadow-blue-200 gap-2 text-sm select-none"
          >
            <MessageSquare className="w-4 h-4 text-white" />
            Contact Super Admin
          </a>

          <button
            onClick={handleSignOut}
            className="flex items-center justify-center bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 font-bold px-6 py-4 rounded-2xl transition-all gap-2 text-sm select-none"
          >
            <LogOut className="w-4 h-4" />
            Log Out Account
          </button>
        </div>

      </div>
    </div>
  );
}
