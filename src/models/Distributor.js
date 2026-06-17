import mongoose from "mongoose";

const DistributorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, default: "" },
  address: { type: String, default: "" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, {
  timestamps: true,
  versionKey: false
});

// Composite index to ensure quick distributor searches by user, names are unique per user
DistributorSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.models.Distributor || mongoose.model("Distributor", DistributorSchema);
