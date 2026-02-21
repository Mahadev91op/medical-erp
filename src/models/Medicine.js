import mongoose from "mongoose";

const MedicineSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Medicine name is required"] 
  },
  batch: { 
    type: String, 
    required: [true, "Batch number is required"] 
  },
  expiryDate: { 
    type: Date, 
    required: [true, "Expiry date is required"] 
  },
  quantity: { 
    type: Number, 
    required: [true, "Quantity is required"],
    min: [0, "Quantity cannot be less than 0"]
  },
  mrp: { 
    type: Number, 
    required: [true, "MRP is required"] 
  },
  distributor: { 
    type: String, 
    required: true 
  },
  barcodeId: { 
    type: String, 
    unique: true, 
    required: true 
  },
}, { timestamps: true });

// 🚀 SPEED OPTIMIZATION: Indexes for faster queries
MedicineSchema.index({ createdAt: -1 });
MedicineSchema.index({ quantity: 1 });
MedicineSchema.index({ expiryDate: 1 });

export default mongoose.models.Medicine || mongoose.model("Medicine", MedicineSchema);