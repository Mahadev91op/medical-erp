import mongoose from "mongoose";

const SaleItemSchema = new mongoose.Schema({
  medicineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  name: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true },
  mrp: { type: Number, required: true },
  total: { type: Number, required: true } 
}, { _id: false }); // 🔥 HUGE STORAGE SAVER: Pehle bill ke andar har dawai ka apna naya ID banta tha, jiska koi kaam nahi tha. Ise hatane se lakho bills me bohot MBs data bachega.

const SaleSchema = new mongoose.Schema({
  items: [SaleItemSchema],
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card'], default: 'Cash' },
  date: { type: Date, default: Date.now }
}, { 
    timestamps: true, 
    versionKey: false // 🔥 STORAGE SAVER: Removes useless '__v' field
});

// 🚀 SPEED OPTIMIZATION
SaleSchema.index({ date: -1 });

export default mongoose.models.Sale || mongoose.model("Sale", SaleSchema);