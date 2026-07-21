"use client";

import { useState } from "react";
import PublicNavbar from "@/components/PublicNavbar";
import Footer from "@/components/Footer";
import { Mail, Phone, MapPin, Clock, Send, ShieldCheck, CheckCircle2, MessageSquare } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function ContactUs() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    pharmacyName: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success("Thank you! Your message has been received. Our support team will respond within 2-4 hours.");
      setFormData({ name: "", email: "", phone: "", pharmacyName: "", message: "" });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between">
      <Toaster position="top-right" />
      <PublicNavbar />

      <main className="grow py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
        {/* Header Title Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider">
            <MessageSquare className="w-3.5 h-3.5" /> Official Business Helpdesk
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Contact Us & Technical Support
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Have questions about <strong>PharmaERP</strong>, subscription activation, custom features, or thermal printer setup? Reach out to our dedicated team at <strong>DevSamp Technologies</strong>.
          </p>
        </div>

        {/* Contact Info Cards + Form Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Business Contact Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Card 1: Registered Company Details */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Registered Office Address</h3>
                  <p className="text-xs text-slate-500 font-semibold">DevSamp Technologies (Parent Company)</p>
                </div>
              </div>
              <div className="text-xs text-slate-650 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium">
                <strong>DevSamp Technologies</strong><br />
                Plot No. 12, Tech Park Sector 5,<br />
                New Delhi - 110001, India
              </div>
            </div>

            {/* Card 2: Email & Support Phone */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Email & Direct Helpline</h3>
                  <p className="text-xs text-slate-500 font-semibold">Fast Response Guarantee</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-700 font-medium">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">Official Email:</span>
                  <a href="mailto:support@devsamp.com" className="font-extrabold text-blue-600 hover:underline">
                    support@devsamp.com
                  </a>
                </div>
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">Phone Hotline:</span>
                  <a href="tel:+919876543210" className="font-extrabold text-blue-600 hover:underline">
                    +91 98765 43210
                  </a>
                </div>
              </div>
            </div>

            {/* Card 3: Operating Hours */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-100">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">Support Hours</h3>
                  <p className="text-xs text-slate-500 font-semibold">India Standard Time (IST)</p>
                </div>
              </div>
              <div className="text-xs text-slate-650 space-y-1.5 font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between">
                  <span>Monday – Saturday:</span>
                  <span className="font-bold text-slate-900">10:00 AM – 7:00 PM IST</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sunday & Public Holidays:</span>
                  <span className="font-bold">Closed (Emergency Monitoring Only)</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-7 bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Send Us a Direct Message</h2>
              <p className="text-xs text-slate-500 mt-1">Fill out the form below and our customer support engineer will connect with you.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Your Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. rahul@example.com"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Phone / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. +91 9876543210"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Pharmacy / Business Name</label>
                  <input
                    type="text"
                    value={formData.pharmacyName}
                    onChange={(e) => setFormData({ ...formData, pharmacyName: e.target.value })}
                    placeholder="e.g. LifeCare Chemist"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">How Can We Help You? *</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your query or setup request..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}
