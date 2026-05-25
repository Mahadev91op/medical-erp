import mongoose from "mongoose";

const OtpSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  emailOtp: { type: String, required: true },
  phoneOtp: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // TTL index: auto-deletes after 10 minutes (600 seconds)
}, {
  versionKey: false
});

export default mongoose.models.Otp || mongoose.model("Otp", OtpSchema);
