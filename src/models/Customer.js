import mongoose from "mongoose";

const CustomerTransactionSchema = new mongoose.Schema({
  type: { type: String, enum: ['Sale', 'Payment', 'Debt'], required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale' },
  note: { type: String, default: "" }
}, { _id: false });

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Customer name is required"], trim: true },
  phone: { type: String, required: [true, "Customer phone is required"], trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  balance: { type: Number, default: 0 }, // Positive means they owe money
  creditLimit: { type: Number, default: 10000 }, // Credit limit, default 10,000 Rs
  promiseDate: { type: Date, default: null }, // Target payment promise date
  transactions: [CustomerTransactionSchema]
}, { 
  timestamps: true, 
  versionKey: false 
});

// Compound index to ensure quick customer lookups per shop user
CustomerSchema.index({ userId: 1, phone: 1 }, { unique: true });
CustomerSchema.index({ userId: 1, name: 1 });

export default mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
