import mongoose from "mongoose";

const MedicineSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, "Dawai ka naam zaroori hai"] 
  },
  batch: { 
    type: String, 
    required: [true, "Batch number zaroori hai"] 
  },
  expiryDate: { 
    type: Date, 
    required: [true, "Expiry date zaroori hai"] 
  },
  quantity: { 
    type: Number, 
    required: [true, "Quantity zaroori hai"],
    min: [0, "Quantity 0 se kam nahi ho sakti"]
  },
  mrp: { 
    type: Number, 
    required: [true, "MRP (Price) zaroori hai"] 
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

export default mongoose.models.Medicine || mongoose.model("Medicine", MedicineSchema);