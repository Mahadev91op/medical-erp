import mongoose from "mongoose";
import fs from "fs";
import path from "path";

// Manually parse .env from workspace
const envPath = ".env";
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
  role: { type: String, default: 'admin' }
});

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

const DistributorSchema = new mongoose.Schema({
  name: String,
  phone: String,
  address: String,
  userId: mongoose.Schema.Types.ObjectId
}, { timestamps: true });

const CustomerTransactionSchema = new mongoose.Schema({
  type: String,
  amount: Number,
  date: Date,
  saleId: mongoose.Schema.Types.ObjectId,
  note: String
}, { _id: false });

const CustomerSchema = new mongoose.Schema({
  name: String,
  phone: String,
  userId: mongoose.Schema.Types.ObjectId,
  balance: Number,
  creditLimit: Number,
  promiseDate: Date,
  transactions: [CustomerTransactionSchema]
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Medicine = mongoose.models.Medicine || mongoose.model("Medicine", MedicineSchema);
const Sale = mongoose.models.Sale || mongoose.model("Sale", SaleSchema);
const Distributor = mongoose.models.Distributor || mongoose.model("Distributor", DistributorSchema);
const Customer = mongoose.models.Customer || mongoose.model("Customer", CustomerSchema);

const distributorsList = [
  { name: "Cipla Ltd", phone: "9876543210", address: "Mumbai, Maharashtra" },
  { name: "Sun Pharmaceutical", phone: "9876543211", address: "Ahmedabad, Gujarat" },
  { name: "Mankind Pharma", phone: "9876543212", address: "New Delhi, Delhi" },
  { name: "Lupin Ltd", phone: "9876543213", address: "Pune, Maharashtra" },
  { name: "Dr. Reddy's Lab", phone: "9876543214", address: "Hyderabad, Telangana" }
];

const customersList = [
  { name: "Ramesh Kumar", phone: "9001002001", balance: 1200, creditLimit: 5000 },
  { name: "Suresh Sharma", phone: "9001002002", balance: 0, creditLimit: 10000 },
  { name: "Amit Verma", phone: "9001002003", balance: -500, creditLimit: 8000 },
  { name: "Priya Patel", phone: "9001002004", balance: 2500, creditLimit: 15000 },
  { name: "Vikram Singh", phone: "9001002005", balance: 0, creditLimit: 5000 }
];

const medicineListTemplate = [
  { name: "Dolo 650mg", mrp: 30, purchasePrice: 20 },
  { name: "Calpol 500mg", mrp: 18, purchasePrice: 12 },
  { name: "Augmentin 625 DUO", mrp: 200, purchasePrice: 140 },
  { name: "Pan-D Capsule", mrp: 150, purchasePrice: 105 },
  { name: "Azithral 500mg", mrp: 120, purchasePrice: 84 },
  { name: "Taxim-O 200mg", mrp: 110, purchasePrice: 77 },
  { name: "Monticope Tablet", mrp: 95, purchasePrice: 66 },
  { name: "Zifi 200mg", mrp: 100, purchasePrice: 70 },
  { name: "Combiflam Tablet", mrp: 25, purchasePrice: 17 },
  { name: "Allegra 120mg", mrp: 180, purchasePrice: 126 },
  { name: "Telma 40mg", mrp: 90, purchasePrice: 63 },
  { name: "Lipvas 10mg", mrp: 75, purchasePrice: 52 },
  { name: "Glycomet GP 1", mrp: 60, purchasePrice: 42 },
  { name: "Shelcal 500mg", mrp: 115, purchasePrice: 80 },
  { name: "Limcee 500mg", mrp: 28, purchasePrice: 19 },
  { name: "Neurobion Forte", mrp: 35, purchasePrice: 24 },
  { name: "Omez 20mg", mrp: 55, purchasePrice: 38 },
  { name: "Pantocid 40mg", mrp: 140, purchasePrice: 98 },
  { name: "Amlokind 5mg", mrp: 22, purchasePrice: 15 },
  { name: "Zinetac 150mg", mrp: 15, purchasePrice: 10 }
];

const userIdsToSeed = [
  new mongoose.Types.ObjectId("000000000000000000000000"), // Superadmin (maha)
  new mongoose.Types.ObjectId("6a3517759906afafc3c467b2")  // Regular Admin (mahadev)
];

async function seed() {
  console.log("🚀 Starting Seeding for Today's Demo Data...");
  console.log("🔗 Connecting to MongoDB:", mongoUri);
  await mongoose.connect(mongoUri);
  console.log("✅ Connected.");

  // Set today's date context: June 26, 2026
  const today = new Date("2026-06-26T10:00:00.000Z");
  console.log(`📅 Today's Simulated Date: ${today.toISOString()}`);

  for (const userId of userIdsToSeed) {
    console.log(`\n--------------------------------------------`);
    console.log(`👤 Seeding for userId: ${userId.toString()}`);

    // Clear old data for this user only
    await Medicine.deleteMany({ userId });
    await Sale.deleteMany({ userId });
    await Distributor.deleteMany({ userId });
    await Customer.deleteMany({ userId });
    console.log("🗑️ Cleared existing medicines, sales, distributors, and customers.");

    // 1. Seed Distributors
    const seededDistributors = [];
    for (const d of distributorsList) {
      const dist = new Distributor({
        ...d,
        userId,
        createdAt: today,
        updatedAt: today
      });
      await dist.save();
      seededDistributors.push(dist.name);
    }
    console.log(`✅ Seeded ${seededDistributors.length} Distributors.`);

    // 2. Seed Customers
    const seededCustomers = [];
    for (const c of customersList) {
      const cust = new Customer({
        ...c,
        userId,
        createdAt: today,
        updatedAt: today,
        transactions: []
      });
      await cust.save();
      seededCustomers.push(cust);
    }
    console.log(`✅ Seeded ${seededCustomers.length} Customers.`);

    // 3. Seed Medicines
    const seededMeds = [];
    const sampleMeds = []; // subset to link to sales

    let medIndex = 0;
    // Generate medicines with different expiry and quantity categories
    for (const item of medicineListTemplate) {
      // Category 1: Expired Medicines (Expiry date before June 26, 2026)
      const expiryExpired = new Date(today);
      expiryExpired.setDate(today.getDate() - (Math.floor(Math.random() * 60) + 15)); // Expired 15 to 75 days ago

      // Category 2: Near Expiry (Expiry date within 90 days: June 27 to Sept 24, 2026)
      const expiryNear = new Date(today);
      expiryNear.setDate(today.getDate() + (Math.floor(Math.random() * 60) + 10)); // Expiring in 10 to 70 days

      // Category 3: Healthy Expiry (Expiry date long in future)
      const expiryHealthy = new Date(today);
      expiryHealthy.setDate(today.getDate() + (Math.floor(Math.random() * 400) + 120)); // Expiring in 120 to 520 days

      // Let's generate multiple batches for each medicine to populate database
      const configurations = [
        { type: "expired", expiry: expiryExpired, qty: Math.floor(Math.random() * 40) + 10, nameSuffix: " (Expired Batch)" },
        { type: "near_expiry", expiry: expiryNear, qty: Math.floor(Math.random() * 50) + 15, nameSuffix: " (Near Expiry)" },
        { type: "low_stock", expiry: expiryHealthy, qty: Math.floor(Math.random() * 8) + 1, nameSuffix: " (Low Stock)" },
        { type: "healthy", expiry: expiryHealthy, qty: Math.floor(Math.random() * 120) + 40, nameSuffix: "" }
      ];

      for (const config of configurations) {
        const barcodeId = `MED-${userId.toString().slice(-4)}-${String(medIndex).padStart(4, '0')}`;
        const distributor = seededDistributors[Math.floor(Math.random() * seededDistributors.length)];
        const purchaseDate = new Date(today);
        purchaseDate.setDate(today.getDate() - Math.floor(Math.random() * 20)); // purchased in last 20 days

        const medDoc = {
          name: `${item.name}${config.nameSuffix}`,
          batch: `B-${Math.floor(Math.random() * 90000) + 10000}`,
          expiryDate: config.expiry,
          quantity: config.qty,
          mrp: item.mrp,
          purchasePrice: item.purchasePrice,
          distributor,
          billNumber: `BILL-${Math.floor(Math.random() * 9000) + 1000}`,
          purchaseDate,
          barcodeId,
          userId,
          createdAt: purchaseDate,
          updatedAt: purchaseDate
        };

        const savedMed = await new Medicine(medDoc).save();
        seededMeds.push(savedMed);
        medIndex++;

        // Save active medicines for billing linking (excluding expired or out of stock)
        if (config.qty > 0 && config.expiry > today) {
          sampleMeds.push(savedMed);
        }
      }
    }
    console.log(`✅ Seeded ${seededMeds.length} Medicines.`);

    // 4. Seed Sales
    const seededSales = [];
    
    // We will generate sales for the last 7 days to make the chart look nice
    // Today is June 26, 2026.
    const salesConfig = [
      { dateOffset: 0, saleCount: 6, label: "Today (June 26)" }, // 6 sales today
      { dateOffset: 1, saleCount: 4, label: "Yesterday (June 25)" },
      { dateOffset: 2, saleCount: 5, label: "2 days ago (June 24)" },
      { dateOffset: 3, saleCount: 3, label: "3 days ago (June 23)" },
      { dateOffset: 4, saleCount: 4, label: "4 days ago (June 22)" },
      { dateOffset: 5, saleCount: 2, label: "5 days ago (June 21)" },
      { dateOffset: 6, saleCount: 3, label: "6 days ago (June 20)" },
      { dateOffset: 15, saleCount: 5, label: "15 days ago" },
      { dateOffset: 45, saleCount: 8, label: "45 days ago" }
    ];

    const paymentMethods = ["Cash", "UPI", "Card"];

    for (const conf of salesConfig) {
      const saleDateBase = new Date(today);
      saleDateBase.setDate(today.getDate() - conf.dateOffset);

      for (let s = 0; s < conf.saleCount; s++) {
        // Generate random time of day
        const saleDate = new Date(saleDateBase);
        saleDate.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60)); // Between 9 AM and 8 PM

        const itemsCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 items per sale
        const items = [];
        let totalAmount = 0;

        for (let i = 0; i < itemsCount; i++) {
          const med = sampleMeds[Math.floor(Math.random() * sampleMeds.length)];
          const quantity = Math.floor(Math.random() * 3) + 1; // 1 to 3 qty
          const total = quantity * med.mrp;
          totalAmount += total;

          items.push({
            medicineId: med._id,
            name: med.name,
            quantity,
            mrp: med.mrp,
            purchasePrice: med.purchasePrice,
            total
          });
        }

        const saleDoc = new Sale({
          items,
          totalAmount,
          paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          date: saleDate,
          userId,
          createdAt: saleDate,
          updatedAt: saleDate
        });

        await saleDoc.save();
        seededSales.push(saleDoc);
      }
    }
    console.log(`✅ Seeded ${seededSales.length} Sales.`);
  }

  console.log("\n============================================");
  console.log("🎉 ALL TODAY'S DEMO DATA SEEDED SUCCESSFULLY!");
  process.exit(0);
}

seed().catch(err => {
  console.error("❌ Seeding Error:", err);
  process.exit(1);
});
