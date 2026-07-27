import mongoose from "mongoose";

const MedicineSchema = new mongoose.Schema({
    name: { type: String, required: [true, "Medicine name is required"], trim: true },
    batch: { type: String, required: [true, "Batch number is required"], trim: true },
    expiryDate: { type: Date, required: [true, "Expiry date is required"] },
    quantity: { type: Number, required: [true, "Quantity is required"], min: [0, "Quantity cannot be less than 0"] },
    freeQty: { type: Number, default: 0 },
    mrp: { type: Number, required: [true, "MRP is required"] },
    purchasePrice: { type: Number, required: [true, "Purchase Price is required"], default: 0 },
    distributor: { type: String, required: true, trim: true },

    billNumber: { type: String, required: [true, "Bill number is required"], trim: true },
    purchaseDate: { type: Date, required: [true, "Purchase date is required"] },

    // Retail Chemist Extensions
    rackNumber: { type: String, default: "", trim: true },
    isScheduleH1: { type: Boolean, default: false },
    gstPercent: { type: Number, default: 12 },

    // Distributor Payment Credit & Khata Integration
    paymentStatus: { type: String, enum: ["paid", "unpaid", "partial"], default: "unpaid" },
    paymentTermsDays: { type: Number, default: 15 },
    dueDate: { type: Date },

    // GST Input Tax Credit (ITC)
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    itcEligible: { type: Boolean, default: true },

    barcodeId: { type: String, unique: true, required: true, trim: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Loose Medicine / Strip Conversion Support
    isLoose: { type: Boolean, default: false },
    tabletsPerStrip: { type: Number, default: 1 },
    stripMrp: { type: Number, default: 0 },
    hsnCode: { type: String, trim: true, default: "3004" },
}, { 
    timestamps: true, 
    versionKey: false 
});

MedicineSchema.index({ userId: 1 });
MedicineSchema.index({ userId: 1, createdAt: -1 });
MedicineSchema.index({ userId: 1, quantity: 1 });
MedicineSchema.index({ userId: 1, expiryDate: 1, quantity: 1 });
MedicineSchema.index({ userId: 1, name: 1 });
MedicineSchema.index({ userId: 1, barcodeId: 1 });
MedicineSchema.index({ userId: 1, batch: 1 });
MedicineSchema.index({ name: 1 }); 
MedicineSchema.index({ barcodeId: 1 });
MedicineSchema.index({ distributor: 1 });
MedicineSchema.index({ batch: 1 });
MedicineSchema.index({ quantity: 1 });
MedicineSchema.index({ expiryDate: 1 });
MedicineSchema.index({ createdAt: -1 });

export default mongoose.models.Medicine || mongoose.model("Medicine", MedicineSchema);