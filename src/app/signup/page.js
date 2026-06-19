"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Activity, Lock, User, Loader2, ArrowRight, Phone, Mail, MapPin, Store, BadgeHelp, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        confirmPassword: "",
        name: "",
        shopName: "",
        address: "",
        phoneNumber: "",
        email: "",
        emailOtp: "",
        phoneOtp: ""
    });

    const [otpSent, setOtpSent] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [debugOtps, setDebugOtps] = useState(null);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const handleSendOtp = async () => {
        if (!formData.email || !formData.phoneNumber) {
            toast.error("Please enter both Email and Phone Number to request OTPs!");
            return;
        }

        setSendingOtp(true);
        setError("");
        setDebugOtps(null);

        try {
            const res = await fetch("/api/auth/otp/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    phone: formData.phoneNumber,
                    type: "signup"
                })
            });

            const data = await res.json();
            if (data.success) {
                setOtpSent(true);
                toast.success("Verification OTPs sent successfully!");
                if (data.debug) {
                    setDebugOtps(data.debug);
                }
            } else {
                setError(data.error || "Failed to send verification codes.");
                toast.error(data.error || "Failed to send OTPs.");
            }
        } catch (err) {
            setError("Failed to connect to the server for OTP delivery.");
            toast.error("Connection error.");
        } finally {
            setSendingOtp(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!otpSent) {
            setError("Please send and verify OTP codes first!");
            setLoading(false);
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            setLoading(false);
            return;
        }

        if (formData.password.length < 4) {
            setError("Password must be at least 4 characters long.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                    name: formData.name,
                    shopName: formData.shopName,
                    address: formData.address,
                    phoneNumber: formData.phoneNumber,
                    email: formData.email,
                    emailOtp: formData.emailOtp,
                    phoneOtp: formData.phoneOtp
                })
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.error || "Registration failed.");
                setLoading(false);
            } else {
                toast.success("Account created successfully! Welcome to PharmaERP.");
                router.push("/login");
            }
        } catch (err) {
            setError("Failed to connect to the server.");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 py-12">
            <div className="w-full max-w-lg bg-white rounded-3xl shadow-[0_2px_24px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-8">

                {/* Logo Area */}
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100 mb-4">
                        <Activity className="text-white w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Pharma<span className="text-blue-500">ERP</span></h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Register your Pharmacy Owner Account</p>
                </div>

                {error && (
                    <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-semibold mb-6 text-center border border-rose-100">
                        {error}
                    </div>
                )}

                {/* Developer debug notification */}
                {debugOtps && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 text-xs text-amber-800 space-y-2">
                        <div className="flex items-center gap-1.5 font-bold">
                            <BadgeHelp className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Developer Notice (Free Mock Delivery Mode):</span>
                        </div>
                        <p className="font-semibold">
                            SMTP details are not configured in your <code>.env</code> file. To help you test easily and for free, use these OTP codes:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 font-extrabold">
                            <li>Email OTP: <span className="underline text-slate-800">{debugOtps.emailOtp}</span></li>
                            <li>Phone OTP: <span className="underline text-slate-800">{debugOtps.phoneOtp}</span></li>
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Section 1: Pharmacy Details */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">1. Pharmacy & Owner Details</h3>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Owner Full Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Full Name"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-sm"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                    <User className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Shop/Pharmacy Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        required
                                        placeholder="Shop Name"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-sm"
                                        value={formData.shopName}
                                        onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                                    />
                                    <Store className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Shop Address</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    placeholder="Complete Shop Address"
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-sm"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                />
                                <MapPin className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Contact & OTP Verification */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">2. Contact Verification</h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        required
                                        disabled={otpSent}
                                        placeholder="Phone Number"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-sm disabled:opacity-70"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    />
                                    <Phone className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        required
                                        disabled={otpSent}
                                        placeholder="Email Address"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-sm disabled:opacity-70"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                    <Mail className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                                </div>
                            </div>
                        </div>

                        {!otpSent ? (
                            <button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={sendingOtp || !formData.email || !formData.phoneNumber}
                                className="w-full bg-slate-800 hover:bg-slate-900 disabled:bg-slate-200 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                            >
                                {sendingOtp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Verification OTPs"}
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-2 text-[11px] text-blue-800 font-bold">
                                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span>Verification OTP codes sent. Enter them below:</span>
                                    <button 
                                        type="button" 
                                        onClick={() => setOtpSent(false)} 
                                        className="ml-auto underline text-slate-500 hover:text-slate-700 font-semibold"
                                    >
                                        Change details
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email OTP</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            placeholder="6-digit code"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-center focus:outline-none focus:border-blue-400 font-bold text-base tracking-wider"
                                            value={formData.emailOtp}
                                            onChange={(e) => setFormData({ ...formData, emailOtp: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Phone OTP</label>
                                        <input
                                            type="text"
                                            required
                                            maxLength={6}
                                            placeholder="6-digit code"
                                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 text-center focus:outline-none focus:border-blue-400 font-bold text-base tracking-wider"
                                            value={formData.phoneOtp}
                                            onChange={(e) => setFormData({ ...formData, phoneOtp: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Credentials */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">3. Login Credentials</h3>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Username</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    placeholder="Choose a username"
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-sm"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                                <User className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        placeholder="Create password"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-sm"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <Lock className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirm Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        required
                                        placeholder="Repeat password"
                                        className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-sm"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                    <Lock className="absolute left-3.5 top-3.5 text-slate-400 w-4 h-4" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Terms and Conditions Checkbox */}
                    <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 select-none">
                        <input
                            id="terms-checkbox"
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="w-4 h-4 text-blue-600 border-slate-350 rounded focus:ring-blue-500 mt-0.5 cursor-pointer"
                        />
                        <label htmlFor="terms-checkbox" className="text-xs text-slate-500 font-semibold leading-relaxed cursor-pointer">
                            I verify that I have read, understood, and agree to the 
                            <Link href="/legal/terms-conditions" className="text-blue-500 hover:underline font-extrabold mx-1">Terms & Conditions</Link>, 
                            <Link href="/legal/privacy-policy" className="text-blue-500 hover:underline font-extrabold mx-1">Privacy Policy</Link>, 
                            and other regulations in the 
                            <Link href="/legal" className="text-blue-500 hover:underline font-extrabold mx-1">Legal Hub</Link>.
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !otpSent || !agreedToTerms}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-150 disabled:text-slate-400 text-white font-bold text-base px-4 py-4 rounded-xl transition-all shadow-lg shadow-blue-100 flex items-center justify-center mt-2 disabled:shadow-none"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Register Account"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500 font-medium">
                    Already have an account?{" "}
                    <Link href="/login" className="text-blue-500 hover:text-blue-600 font-bold inline-flex items-center">
                        Login here <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
