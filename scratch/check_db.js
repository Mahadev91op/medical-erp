const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

// Manually parse MONGODB_URI from .env
let mongoUri = "";
try {
  const envContent = fs.readFileSync(path.join(process.cwd(), ".env"), "utf8");
  const mongoLine = envContent.split("\n").find(line => line.trim().startsWith("MONGODB_URI="));
  if (mongoLine) {
    const idx = mongoLine.indexOf("=");
    mongoUri = mongoLine.substring(idx + 1).trim().replace(/['"]/g, "");
  }
} catch (e) {
  console.error("Error reading .env file:", e);
}

// Define inline schemas to avoid ES module import compilation issues
const MedicineSchema = new mongoose.Schema({
    name: String,
    batch: String,
    expiryDate: Date,
    quantity: Number,
    mrp: Number,
    purchasePrice: Number,
    distributor: String,
    billNumber: String,
    purchaseDate: Date,
    barcodeId: String,
    userId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const CustomerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  userId: mongoose.Schema.Types.ObjectId,
  balance: Number
}, { timestamps: true });

const DistributorSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  userId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const Medicine = mongoose.models.Medicine || mongoose.model("Medicine", MedicineSchema);
const Customer = mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);
const Distributor = mongoose.models.Distributor || mongoose.model("Distributor", DistributorSchema);

async function checkDb() {
  if (!mongoUri) {
    console.error("MONGODB_URI is not defined in .env!");
    process.exit(1);
  }

  console.log("Connecting to MongoDB:", mongoUri);
  await mongoose.connect(mongoUri);
  console.log("Connected!");

  const medCount = await Medicine.countDocuments();
  const custCount = await Customer.countDocuments();
  const distCount = await Distributor.countDocuments();

  console.log(`\n--- DATABASE STATS ---`);
  console.log(`Medicines: ${medCount}`);
  console.log(`Customers: ${custCount}`);
  console.log(`Distributors: ${distCount}`);

  if (medCount > 0) {
    console.log(`\n--- MEDICINES PREVIEW (Last 5) ---`);
    const meds = await Medicine.find().sort({ createdAt: -1 }).limit(5);
    meds.forEach(m => {
      console.log(`- ${m.name} | Batch: ${m.batch} | Qty: ${m.quantity} | MRP: ${m.mrp} | Expiry: ${m.expiryDate} | Barcode: ${m.barcodeId}`);
    });
  }

  if (custCount > 0) {
    console.log(`\n--- CUSTOMERS PREVIEW (Last 5) ---`);
    const custs = await Customer.find().sort({ createdAt: -1 }).limit(5);
    custs.forEach(c => {
      console.log(`- ${c.name} | Phone: ${c.phone} | Balance: ${c.balance}`);
    });
  }

  if (distCount > 0) {
    console.log(`\n--- DISTRIBUTORS PREVIEW (Last 5) ---`);
    const dists = await Distributor.find().sort({ createdAt: -1 }).limit(5);
    dists.forEach(d => {
      console.log(`- ${d.name} | Phone: ${d.phone} | Address: ${d.address}`);
    });
  }

  await mongoose.disconnect();
  console.log("\nDisconnected from DB.");
}

checkDb().catch(err => {
  console.error("DB check failed:", err);
});
