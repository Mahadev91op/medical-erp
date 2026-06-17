import mongoose from "mongoose";

const ActiveSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceSessionId: { type: String, required: true },
  ipAddress: { type: String },
  userAgentRaw: { type: String },
  os: { type: String, default: "Unknown OS" },
  browser: { type: String, default: "Unknown Browser" },
  deviceType: { type: String, default: "Desktop" },
  lastActive: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'revoked'], default: 'active' }
}, { 
  timestamps: true,
  versionKey: false
});

ActiveSessionSchema.index({ userId: 1 });
ActiveSessionSchema.index({ userId: 1, deviceSessionId: 1 }, { unique: true });
ActiveSessionSchema.index({ lastActive: -1 });

export default mongoose.models.ActiveSession || mongoose.model("ActiveSession", ActiveSessionSchema);
