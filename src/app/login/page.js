"use client";
import { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { Activity, Lock, User, Loader2, ArrowRight } from "lucide-react";

export default function Login() {
    const { status } = useSession();
    const [formData, setFormData] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Agar user pehle se logged in hai toh seedha dashboard par redirect karo
    useEffect(() => {
        if (status === "authenticated") {
            window.location.replace("/");
        }
    }, [status]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const trimmedUsername = formData.username.trim();
            const res = await signIn("credentials", {
                redirect: false,
                username: trimmedUsername,
                password: formData.password,
            });

            if (!res || res.error || !res.ok) {
                let errorMsg = res?.error || "Login failed. Please check your credentials.";
                if (errorMsg === "CredentialsSignin" || errorMsg.includes("CredentialsSignin")) {
                    errorMsg = "Invalid username or password. Please try again.";
                }
                setError(errorMsg);
                setLoading(false);
            } else {
                // Success: Full page reload to ensure fresh session cookies are loaded immediately
                window.location.replace("/");
            }
        } catch (err) {
            console.error("Login submission error:", err);
            setError(err?.message || "An unexpected network error occurred. Please try again.");
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_2px_24px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-8">

                {/* Logo Area */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 mb-4">
                        <Activity className="text-white w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Med<span className="text-blue-500">ERP</span></h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Staff & Admin Login Portal</p>
                </div>

                {error && (
                    <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-semibold mb-6 text-center border border-rose-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                autoComplete="off"
                                placeholder="Enter username"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                            <User className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                required
                                autoComplete="new-password"
                                placeholder="Enter password"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <Lock className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-base px-4 py-4 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center mt-2 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Secure Login"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500 font-medium">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-blue-500 hover:text-blue-600 font-bold inline-flex items-center">
                        Register here <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>

                <div className="mt-6 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider space-x-2 select-none">
                    <Link href="/legal/terms-conditions" className="hover:text-blue-500 hover:underline">Terms</Link>
                    <span>•</span>
                    <Link href="/legal/privacy-policy" className="hover:text-blue-500 hover:underline">Privacy</Link>
                    <span>•</span>
                    <Link href="/legal" className="hover:text-blue-500 hover:underline">Legal Hub</Link>
                </div>

                <div className="mt-6 text-center text-xs text-slate-400 font-medium flex items-center justify-center">
                    <Lock className="w-3 h-3 mr-1" /> Secure & Encrypted Login
                </div>
            </div>
        </div>
    );
}