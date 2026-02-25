import mongoose from "mongoose";

const MedicineSchema = new mongoose.Schema({
    // trim: true lagane se extra galti se dabaye gaye spaces save nahi honge (Space bachega)
    name: { type: String, required: [true, "Medicine name is required"], trim: true },
    batch: { type: String, required: [true, "Batch number is required"], trim: true },
    expiryDate: { type: Date, required: [true, "Expiry date is required"] },
    quantity: { type: Number, required: [true, "Quantity is required"], min: [0, "Quantity cannot be less than 0"] },
    mrp: { type: Number, required: [true, "MRP is required"] },
    distributor: { type: String, required: true, trim: true },

    billNumber: { type: String, required: [true, "Bill number is required"], trim: true },
    purchaseDate: { type: Date, required: [true, "Purchase date is required"] },

    barcodeId: { type: String, unique: true, required: true, trim: true },
}, { 
    timestamps: true, 
    versionKey: false // 🔥 STORAGE SAVER: Mongoose har entry me '__v: 0' save karta hai, ise false karne se har row me space bachegi
});

// 🚀 SPEED OPTIMIZATION
MedicineSchema.index({ createdAt: -1 });
MedicineSchema.index({ quantity: 1 });
MedicineSchema.index({ expiryDate: 1 });

if (mongoose.models.Medicine) {
    delete mongoose.models.Medicine;
}

export default mongoose.model("Medicine", MedicineSchema);