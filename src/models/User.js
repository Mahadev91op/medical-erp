import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  name: { type: String, trim: true },
  shopName: { type: String, trim: true },
  address: { type: String, trim: true },
  phoneNumber: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  role: { 
    type: String, 
    enum: ['superadmin', 'admin', 'staff'], 
    default: 'admin' 
  },
  status: {
    type: String,
    enum: ['active', 'disabled'],
    default: 'active'
  },
  subscriptionEnd: {
    type: Date,
    default: () => {
      // Default to 7 days from registration (7-day free trial)
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d;
    }
  },
  subscriptionHistory: [{
    addedMonths: { type: Number, required: true },
    addedAt: { type: Date, default: Date.now },
    newExpirationDate: { type: Date, required: true }
  }]
}, { timestamps: true });

export default mongoose.models.User || mongoose.model("User", UserSchema);