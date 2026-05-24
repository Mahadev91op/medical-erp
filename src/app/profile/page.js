"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { 
  Lock, 
  User, 
  KeyRound, 
  Loader2, 
  CalendarClock, 
  ShieldAlert, 
  History, 
  CalendarDays,
  Sparkles,
  CheckCircle2,
  Clock,
  Award,
  ShieldCheck
} from "lucide-react";
import toast from "react-hot-toast";

export default function Profile() {
  const { data: session } = useSession();
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [subDetails, setSubDetails] = useState({ subscriptionEnd: null, subscriptionHistory: [] });
  const [subLoading, setSubLoading] = useState(true);

  const fetchSubscriptionDetails = async () => {
    try {
      const res = await fetch("/api/user/subscription?history=true");
      const data = await res.json();
      if (data.success) {
        setSubDetails(data);
      }
    } catch (error) {
      console.error("Failed to load subscription details:", error);
    } finally {
      setSubLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionDetails();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: passwords.newPassword,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Password updated successfully!");
        setPasswords({ newPassword: "", confirmPassword: "" });
      } else {
        toast.error(data.error || "Failed to update password.");
      }
    } catch (error) {
      toast.error("Server or Network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Detailed subscription analysis
  const getSubscriptionInfo = () => {
    if (session?.user?.role === "superadmin") {
      return {
        planName: "Lifetime Enterprise Admin",
        daysLeft: "Unlimited",
        percentLeft: 100,
        badgeColor: "bg-purple-50 text-purple-600 border-purple-200",
        statusText: "Active (Lifetime)",
        expiryText: "Never Expires",
        icon: <Award className="w-5 h-5 text-purple-500" />
      };
    }

    if (!subDetails.subscriptionEnd) {
      return {
        planName: "No Active Plan",
        daysLeft: 0,
        percentLeft: 0,
        badgeColor: "bg-rose-50 text-rose-600 border-rose-200",
        statusText: "Suspended",
        expiryText: "N/A",
        icon: <ShieldAlert className="w-5 h-5 text-rose-500" />
      };
    }

    const expiry = new Date(subDetails.subscriptionEnd);
    const today = new Date();
    const diffTime = expiry - today;
    const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    
    let planName = "Standard Trial Plan";
    let cycleDuration = 30; // Default trial is 30 days
    
    if (subDetails.subscriptionHistory && subDetails.subscriptionHistory.length > 0) {
      const lastExtension = subDetails.subscriptionHistory[subDetails.subscriptionHistory.length - 1];
      const months = lastExtension.addedMonths;
      cycleDuration = months * 30;
      
      if (months === 1) planName = "Monthly Premium Plan";
      else if (months === 3) planName = "Quarterly Premium Plan";
      else if (months === 6) planName = "Half-Yearly Premium Plan";
      else if (months === 12) planName = "Annual Enterprise Plan";
      else planName = `Custom Premium (${months} Months)`;
    }

    let badgeColor = "bg-emerald-50 text-emerald-600 border-emerald-200";
    let statusText = "Active";
    let icon = <ShieldCheck className="w-5 h-5 text-emerald-500" />;

    if (daysLeft === 0) {
      badgeColor = "bg-rose-50 text-rose-600 border-rose-200";
      statusText = "Expired";
      icon = <ShieldAlert className="w-5 h-5 text-rose-500" />;
    } else if (daysLeft <= 5) {
      badgeColor = "bg-amber-50 text-amber-600 border-amber-200 animate-pulse";
      statusText = "Expiring Soon";
      icon = <Clock className="w-5 h-5 text-amber-500" />;
    }

    const percentLeft = Math.min(100, Math.max(0, (daysLeft / cycleDuration) * 100));
    const expiryText = expiry.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    return {
      planName,
      daysLeft,
      percentLeft,
      badgeColor,
      statusText,
      expiryText,
      icon
    };
  };

  const subInfo = getSubscriptionInfo();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 leading-tight">Profile & Subscription Panel</h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">Manage your account credentials, status logs, and ERP license details.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account Details & Password Reset */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* User Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 mb-4">
                <User className="text-white w-10 h-10" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 capitalize leading-none mb-1">{session?.user?.name}</h2>
              <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${subInfo.badgeColor} mt-2`}>
                {subInfo.statusText}
              </span>
            </div>

            <div className="border-t border-slate-50 mt-6 pt-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">{session?.user?.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Role Access</p>
                <p className="text-sm font-bold text-slate-700 mt-0.5">
                  {session?.user?.role === "superadmin" ? "Super Administrator" : session?.user?.role === "admin" ? "Pharmacy Owner" : "Staff Member"}
                </p>
              </div>
            </div>
          </div>

          {/* Password Reset */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm md:text-base font-bold text-slate-800 flex items-center mb-5">
              <KeyRound className="w-4 h-4 text-emerald-500 mr-2 shrink-0" />
              Reset Account Password
            </h3>

            {session?.user?.id === "000000000000000000000000" ? (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-700 text-xs font-semibold flex gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500 mt-0.5" />
                <p>Default env-based admin credentials cannot be changed from the UI. Please update your <code>.env</code> file directly.</p>
              </div>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="Enter new password"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-semibold text-sm"
                      value={passwords.newPassword}
                      onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    />
                    <Lock className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder="Repeat new password"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-semibold text-sm"
                      value={passwords.confirmPassword}
                      onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                    />
                    <Lock className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition-all shadow-md shadow-emerald-100 flex items-center justify-center gap-2 disabled:opacity-75 text-xs uppercase tracking-wider"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save New Password"}
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Right Column: Detailed Subscription & Billing History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Detailed Subscription Card */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-150">
                  {subInfo.icon}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active ERP License</p>
                  <h3 className="text-base md:text-lg font-bold text-slate-800">{subInfo.planName}</h3>
                </div>
              </div>
              <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full border ${subInfo.badgeColor}`}>
                {subInfo.statusText}
              </span>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>Cycle Duration Remaining</span>
                  <span className="text-slate-850 font-extrabold">{subInfo.daysLeft} {typeof subInfo.daysLeft === "number" ? "Days" : ""}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${subInfo.percentLeft}%` }}
                  />
                </div>
                <p className="text-[10px] font-bold text-slate-400">Time remaining before automatic account access lock and dashboard suspension.</p>
              </div>

              <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-slate-400" /> Plan Expiry
                  </span>
                  <span className="font-extrabold text-slate-700">{subInfo.expiryText}</span>
                </div>
                {session?.user?.role !== "superadmin" && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-400 flex items-center gap-1.5">
                      <History className="w-4 h-4 text-slate-400" /> Renewals Logged
                    </span>
                    <span className="font-extrabold text-slate-700">{(subDetails.subscriptionHistory || []).length} Updates</span>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Subscription History Section (Visible only for non-superadmin) */}
          {session?.user?.role !== "superadmin" && (
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.02)]">
              <h3 className="text-base font-bold text-slate-800 flex items-center mb-6">
                <History className="w-5 h-5 text-emerald-500 mr-2.5 shrink-0" />
                Plan Renewal & Addition Log History
              </h3>

              {subLoading ? (
                <div className="py-8 flex justify-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500 mr-2" /> Loading plan history...
                </div>
              ) : !subDetails.subscriptionHistory || subDetails.subscriptionHistory.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm font-semibold bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
                  No billing history found. Standard trial active. 📦
                </div>
              ) : (
                <div className="relative border-l border-slate-100 ml-4 pl-6 space-y-6">
                  {subDetails.subscriptionHistory.slice().reverse().map((item, index) => {
                    let additionLabel = `${item.addedMonths} Month extension`;
                    if (item.addedMonths === 1) additionLabel = "Monthly Subscription Added";
                    else if (item.addedMonths === 12) additionLabel = "Annual Subscription Renewal";
                    else if (item.addedMonths === 3) additionLabel = "Quarterly Subscription Renewal";
                    else if (item.addedMonths === 6) additionLabel = "Half-Yearly Renewal";

                    return (
                      <div key={index} className="relative group">
                        
                        {/* Timeline Bullet */}
                        <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-4 border-white group-hover:scale-110 transition-transform shadow-md" />
                        
                        <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 hover:border-slate-200 transition-colors shadow-[0_2px_10px_-4px_rgba(0,0,0,0.01)]">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                              <p className="font-extrabold text-slate-800 text-sm">{additionLabel}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 flex items-center gap-1">
                                <CalendarClock className="w-3.5 h-3.5" /> Added On: {new Date(item.addedAt).toLocaleDateString("en-IN", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </p>
                            </div>
                            <div className="sm:text-right">
                              <span className="inline-block bg-emerald-50 border border-emerald-100 text-emerald-600 px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase">
                                +{item.addedMonths} Months
                              </span>
                              <p className="text-[10px] text-slate-500 font-semibold mt-1">
                                Expired date extended to <strong className="text-slate-700">{new Date(item.newExpirationDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong>
                              </p>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
