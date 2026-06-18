import mongoose from "mongoose";

const SaleItemSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true },
  mrp: { type: Number, required: true },
  purchasePrice: { type: Number, default: 0 },
  total: { type: Number, required: true },
  discountPercent: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 0 },
  taxableAmount: { type: Number, default: 0 },
  cgstAmount: { type: Number, default: 0 },
  sgstAmount: { type: Number, default: 0 }
}, { _id: false }); 

const SaleSchema = new mongoose.Schema({
  items: [SaleItemSchema],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Udhaar'], default: 'Cash' },
  date: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customerName: { type: String, default: "" },
  customerPhone: { type: String, default: "" },
  prescriptionDetail: {
    doctorName: { type: String, default: "" },
    doctorRegNo: { type: String, default: "" },
    patientAge: { type: Number, default: null },
    patientGender: { type: String, default: "" }
  },
  totalDiscount: { type: Number, default: 0 },
  totalTax: { type: Number, default: 0 }
}, { 
    timestamps: true, 
    versionKey: false 
});

// 🚀 SPEED OPTIMIZATION FOR REPORTS
SaleSchema.index({ userId: 1 });
SaleSchema.index({ userId: 1, date: -1 });
SaleSchema.index({ date: -1 });
SaleSchema.index({ "items.medicineId": 1 });

export default mongoose.models.Sale || mongoose.model("Sale", SaleSchema);