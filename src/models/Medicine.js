import mongoose from "mongoose";

const MedicineSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Medicine name is required"] },
    batch: { type: String, required: [true, "Batch number is required"] },
    expiryDate: { type: Date, required: [true, "Expiry date is required"] },
    quantity: { type: Number, required: [true, "Quantity is required"], min: [0, "Quantity cannot be less than 0"] },
    mrp: { type: Number, required: [true, "MRP is required"] },
    distributor: { type: String, required: true },

    // Naye Fields
    billNumber: { type: String, required: [true, "Bill number is required"] },
    purchaseDate: { type: Date, required: [true, "Purchase date is required"] },

    barcodeId: { type: String, unique: true, required: true },
}, { timestamps: true });

// 🚀 SPEED OPTIMIZATION
MedicineSchema.index({ createdAt: -1 });
MedicineSchema.index({ quantity: 1 });
MedicineSchema.index({ expiryDate: 1 });

// 🔥 BUG FIX: Next.js ki memory se purana cached model jabardasti delete karna 🔥
if (mongoose.models.Medicine) {
    delete mongoose.models.Medicine;
}

export default mongoose.model("Medicine", MedicineSchema);