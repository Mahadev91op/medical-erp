import mongoose from "mongoose";

const ReorderSchema = new mongoose.Schema({
  medicineName: { type: String, required: true, trim: true },
  quantity: { type: String, default: "1 Strip", trim: true },
  distributor: { type: String, default: "", trim: true },
  customerName: { type: String, default: "", trim: true },
  customerPhone: { type: String, default: "", trim: true },
  urgency: { type: String, enum: ["Urgent", "Normal"], default: "Urgent" },
  status: { type: String, enum: ["Pending", "Ordered", "Received"], default: "Pending" },
  note: { type: String, default: "", trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { 
  timestamps: true, 
  versionKey: false 
});

ReorderSchema.index({ userId: 1, status: 1 });
ReorderSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.Reorder || mongoose.model("Reorder", ReorderSchema);
