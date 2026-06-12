import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// Manually parse .env
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || "";
      val = val.replace(/^['"](.*)['"]$/, "$1"); // remove quotes
      process.env[match[1]] = val;
    }
  });
}

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medicalshop";

// Schemas & Models
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  shopName: String,
  role: { type: String, default: 'admin' },
  status: { type: String, default: 'active' },
  subscriptionEnd: Date
}, { timestamps: true });

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

const SaleItemSchema = new mongoose.Schema({
  medicineId: mongoose.Schema.Types.ObjectId,
  name: String,
  quantity: Number,
  mrp: Number,
  purchasePrice: Number,
  total: Number
}, { _id: false });

const SaleSchema = new mongoose.Schema({
  items: [SaleItemSchema],
  totalAmount: Number,
  paymentMethod: String,
  date: Date,
  userId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Medicine = mongoose.models.Medicine || mongoose.model("Medicine", MedicineSchema);
const Sale = mongoose.models.Sale || mongoose.model("Sale", SaleSchema);

// Parse CLI arguments
const args = process.argv.slice(2);
let targetMeds = 50000;
let targetSales = 10000;
let clearData = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--meds" && args[i + 1]) {
    targetMeds = parseInt(args[i + 1], 10);
  }
  if (args[i] === "--sales" && args[i + 1]) {
    targetSales = parseInt(args[i + 1], 10);
  }
  if (args[i] === "--clear") {
    clearData = true;
  }
}

const medNames = [
  "Paracetamol", "Azithromycin", "Amoxicillin", "Cefixime", "Pantoprazole",
  "Rabeprazole", "Domperidone", "Diclofenac", "Levocetirizine", "Montelukast",
  "Telmisartan", "Metformin", "Amlodipine", "Atorvastatin", "Rosuvastatin",
  "Glimepiride", "Ibuprofen", "Vitamin C", "Zincovit", "Dolo 650", "Calpol 500",
  "Cheston Cold", "Cetirizine", "Limcee", "Combiflam", "Crocin", "Omez"
];
const distributors = [
  "Cipla Ltd", "Sun Pharmaceutical", "Mankind Pharma", "Macleods", "Lupin",
  "Alkem Laboratories", "Intas Pharmaceuticals", "Torrent Pharma", "Zydus Lifesciences",
  "Dr. Reddy's Laboratories"
];
const paymentMethods = ["Cash", "UPI", "Card"];

async function seed() {
  const startTime = Date.now();
  console.log("🚀 STARTING HIGH-PERFORMANCE SEEDING...");
  console.log("🔗 Connecting to MongoDB:", mongoUri);
  await mongoose.connect(mongoUri);
  console.log("✅ Connected.");

  // Get or Create Users
  let usersList = await User.find({}).lean();
  if (usersList.length === 0) {
    console.log("⚠️ No users found in database. Creating default users...");
    const hashedPassword = await bcrypt.hash("maha123", 10);
    const defaults = [
      { username: "ana", password: hashedPassword, name: "Ana Maria", shopName: "Ana Pharmacy" },
      { username: "mahadev", password: hashedPassword, name: "Mahadev", shopName: "Mahadev Medical Store" },
      { username: "samrat medicine", password: hashedPassword, name: "Samrat", shopName: "Samrat Medicine Center" }
    ];
    await User.insertMany(defaults);
    usersList = await User.find({}).lean();
    console.log(`✅ Created ${usersList.length} default users.`);
  }

  console.log(`👥 Found ${usersList.length} users in database:`, usersList.map(u => u.username).join(", "));

  if (clearData) {
    console.log("🗑️ Clearing existing medicines and sales for ALL users...");
    await Medicine.deleteMany({});
    await Sale.deleteMany({});
    console.log("✅ Cleared all existing data.");
  }

  // Seed for each user
  for (const user of usersList) {
    const userStartTime = Date.now();
    const userId = user._id;
    console.log(`\n--------------------------------------------`);
    console.log(`👤 Seeding for user: "${user.username}" (ID: ${userId})`);
    
    // 1. Medicines Seeding
    console.log(`⏳ Seeding ${targetMeds} Medicines for ${user.username}...`);
    const batchSize = 5000;
    const sampleMeds = []; // subset to link to sales

    for (let i = 0; i < targetMeds; i += batchSize) {
      const chunk = [];
      const currentBatchSize = Math.min(batchSize, targetMeds - i);

      for (let j = 0; j < currentBatchSize; j++) {
        const index = i + j;
        const randomName = medNames[Math.floor(Math.random() * medNames.length)];
        const mg = [100, 250, 500, 650][Math.floor(Math.random() * 4)];
        const fullName = `${randomName} ${mg}mg`;
        const mrp = Math.floor(Math.random() * 450) + 15;
        const purchasePrice = Math.floor(mrp * 0.7); // 30% profit margin
        
        // Expiry dates: mostly valid, some expired (10%), some expiring soon within 90 days (15%)
        const today = new Date();
        const expiryDate = new Date();
        const randType = Math.random();
        if (randType < 0.1) {
          // Expired in past 1-6 months
          expiryDate.setDate(today.getDate() - (Math.floor(Math.random() * 150) + 10));
        } else if (randType < 0.25) {
          // Expiring soon (10-85 days from now)
          expiryDate.setDate(today.getDate() + (Math.floor(Math.random() * 75) + 10));
        } else {
          // Long expiry (100 - 700 days from now)
          expiryDate.setDate(today.getDate() + (Math.floor(Math.random() * 600) + 100));
        }

        const purchaseDate = new Date();
        purchaseDate.setDate(today.getDate() - Math.floor(Math.random() * 180));

        // Quantity: mostly positive, some out of stock (5%)
        const quantity = Math.random() < 0.05 ? 0 : Math.floor(Math.random() * 200) + 1;

        const medId = new mongoose.Types.ObjectId();
        if (sampleMeds.length < 5000) {
          sampleMeds.push({ _id: medId, name: fullName, mrp, purchasePrice });
        }

        chunk.push({
          _id: medId,
          name: fullName,
          batch: `B-${Math.floor(Math.random() * 90000) + 10000}`,
          expiryDate,
          quantity,
          mrp,
          purchasePrice,
          distributor: distributors[Math.floor(Math.random() * distributors.length)],
          billNumber: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
          purchaseDate,
          barcodeId: `MED-${userId.toString().slice(-4)}-${index}-${Date.now().toString().slice(-4)}`,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      // Direct MongoDB collection insert to bypass mongoose overhead
      await Medicine.collection.insertMany(chunk);
      process.stdout.write(`\r   ➡️ Medicines: Inserted ${i + currentBatchSize} / ${targetMeds}`);
    }
    console.log(`\n   ✅ Medicines seeding completed.`);

    // 2. Sales Seeding
    if (sampleMeds.length === 0) {
      console.log(`⚠️ Skip sales seeding for ${user.username} as no medicines are available.`);
      continue;
    }

    console.log(`⏳ Seeding ${targetSales} Sales for ${user.username}...`);
    for (let i = 0; i < targetSales; i += batchSize) {
      const chunk = [];
      const currentBatchSize = Math.min(batchSize, targetSales - i);

      for (let j = 0; j < currentBatchSize; j++) {
        const saleItemsCount = Math.floor(Math.random() * 4) + 1;
        const saleItems = [];
        let totalAmount = 0;

        for (let k = 0; k < saleItemsCount; k++) {
          const randomMed = sampleMeds[Math.floor(Math.random() * sampleMeds.length)];
          const sellQty = Math.floor(Math.random() * 5) + 1;
          const itemTotal = sellQty * randomMed.mrp;
          totalAmount += itemTotal;

          saleItems.push({
            medicineId: randomMed._id,
            name: randomMed.name,
            quantity: sellQty,
            mrp: randomMed.mrp,
            purchasePrice: randomMed.purchasePrice,
            total: itemTotal
          });
        }

        // Sale date: spread over past 90 days
        const saleDate = new Date();
        saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 90));
        // Add random hours/minutes
        saleDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

        chunk.push({
          items: saleItems,
          totalAmount,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          date: saleDate,
          userId,
          createdAt: saleDate,
          updatedAt: saleDate
        });
      }

      await Sale.collection.insertMany(chunk);
      process.stdout.write(`\r   ➡️ Sales: Inserted ${i + currentBatchSize} / ${targetSales}`);
    }
    console.log(`\n   ✅ Sales seeding completed.`);
    console.log(`🎉 Completed seeding for user: ${user.username} in ${((Date.now() - userStartTime) / 1000).toFixed(2)}s`);
  }

  console.log(`\n============================================`);
  console.log(`🎉 ALL SEEDING DONE! Total time: ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seeding Error:", err);
  process.exit(1);
});
