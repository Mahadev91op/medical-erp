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
  distributor: { 
    type: String, 
    enum: ['A', 'B'], // Sirf A ya B allow karega
    required: true 
  },
  barcodeId: { 
    type: String, 
    unique: true, 
    required: true 
  }, // Unique sticker ID
}, { timestamps: true }); // createdAt aur updatedAt apne aap add ho jayega

// Next.js hot-reloading me error na de isliye ye check lagate hain
export default mongoose.models.Medicine || mongoose.model("Medicine", MedicineSchema);