"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, Lock, User, Loader2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({ username: "", password: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password
                })
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.error || "Something went wrong.");
                setLoading(false);
            } else {
                toast.success("Account created successfully! Please login.");
                router.push("/login");
            }
        } catch (err) {
            setError("Failed to connect to the server.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_2px_24px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-8">

                {/* Logo Area */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 mb-4">
                        <Activity className="text-white w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Pharma<span className="text-emerald-500">ERP</span></h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Create your ERP Account</p>
                </div>

                {error && (
                    <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-semibold mb-6 text-center border border-rose-100">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                        <div className="relative">
                            <input
                                type="text"
                                required
                                placeholder="Choose a username"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
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
                                placeholder="Create a password"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                            <Lock className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm Password</label>
                        <div className="relative">
                            <input
                                type="password"
                                required
                                placeholder="Repeat your password"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 transition-all font-medium"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            />
                            <Lock className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-base px-4 py-4 rounded-xl transition-all shadow-lg shadow-emerald-200 flex items-center justify-center mt-2 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Register Account"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500 font-medium">
                    Already have an account?{" "}
                    <Link href="/login" className="text-emerald-500 hover:text-emerald-600 font-bold inline-flex items-center">
                        Login here <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
