import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// Load .env
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, "utf8");
  envConfig.split("\n").forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] || "";
      val = val.replace(/^['"](.*)['"]$/, "$1");
      process.env[match[1]] = val;
    }
  });
}

const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medical-erp";

// Schemas & Models
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  shopName: String,
  address: String,
  phoneNumber: String,
  email: String,
  role: { type: String, default: 'admin' },
  status: { type: String, default: 'active' },
  subscriptionEnd: Date,
  subscriptionHistory: Array,
  termsAccepted: { type: Boolean, default: true },
  termsVersion: { type: String, default: "v1.0" },
  consentTimestamp: Date
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
  barcodeId: { type: String, unique: true },
  userId: mongoose.Schema.Types.ObjectId,
  isLoose: { type: Boolean, default: false },
  tabletsPerStrip: { type: Number, default: 1 },
  stripMrp: { type: Number, default: 0 }
}, { timestamps: true });

const SaleItemSchema = new mongoose.Schema({
  medicineId: mongoose.Schema.Types.ObjectId,
  name: String,
  quantity: Number,
  mrp: Number,
  purchasePrice: Number,
  total: Number,
  discountPercent: Number,
  gstPercent: Number,
  taxableAmount: Number,
  cgstAmount: Number,
  sgstAmount: Number
}, { _id: false });

const SaleSchema = new mongoose.Schema({
  items: [SaleItemSchema],
  totalAmount: Number,
  paymentMethod: String,
  date: Date,
  userId: mongoose.Schema.Types.ObjectId,
  customerName: String,
  customerPhone: String,
  prescriptionDetail: {
    doctorName: String,
    doctorRegNo: String,
    patientAge: Number,
    patientGender: String
  },
  totalDiscount: Number,
  totalTax: Number
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

// Data Templates
const baseMedNames = [
  "Paracetamol", "Azithromycin", "Amoxicillin", "Cefixime", "Pantoprazole",
  "Rabeprazole", "Domperidone", "Diclofenac", "Levocetirizine", "Montelukast",
  "Telmisartan", "Metformin", "Amlodipine", "Atorvastatin", "Rosuvastatin",
  "Glimepiride", "Ibuprofen", "Vitamin C", "Zincovit", "Dolo", "Calpol",
  "Cheston Cold", "Cetirizine", "Limcee", "Combiflam", "Crocin", "Omez",
  "Augmentin", "Pan-D", "Azithral", "Taxim-O", "Monticope", "Zifi",
  "Allegra", "Telma", "Lipvas", "Glycomet", "Shelcal", "Neurobion Forte",
  "Pantocid", "Amlokind", "Zinetac", "Disprin", "Vicks Action 500", "Gelusil",
  "Digene", "Ecosprin", "Clavam", "Deriphyllin", "Asthalin", "Budecort",
  "Duolin", "Ascoril", "Benadryl", "Corex", "Grilinctus", "Alex Syrup",
  "Multivite", "Becosules", "Evion", "Ranitin", "Aciloc", "Ultacet"
];

const medForms = ["Tablet", "Capsule", "Syrup 100ml", "Injection", "Ointment 20g", "Suspension 60ml", "Drops 15ml", "Gel 30g"];
const medDosages = ["50mg", "100mg", "200mg", "250mg", "400mg", "500mg", "650mg", "1000mg", "10mg", "20mg", "40mg", "5mg"];

const distributorCompanies = [
  "Cipla Ltd", "Sun Pharmaceutical", "Mankind Pharma", "Macleods Pharma", "Lupin Ltd",
  "Alkem Laboratories", "Intas Pharmaceuticals", "Torrent Pharma", "Zydus Lifesciences",
  "Dr. Reddy's Laboratories", "Abbott India", "GSK India", "Sanofi India", "Pfizer Ltd",
  "Alembic Pharma", "Ajanta Pharma", "Biocon Ltd", "Glenmark Pharma", "IPCA Laboratories",
  "JB Chemicals", "Micro Labs Ltd", "Natco Pharma", "RPG Life Sciences", "Wallace Pharma"
];

const cities = ["Delhi", "Mumbai", "Kolkata", "Chennai", "Bengaluru", "Hyderabad", "Ahmedabad", "Pune", "Jaipur", "Lucknow", "Patna", "Indore", "Chandigarh", "Surat"];

const customerFirstNames = ["Ramesh", "Suresh", "Amit", "Priya", "Vikram", "Rajesh", "Anita", "Manoj", "Sunil", "Deepak", "Pooja", "Rahul", "Neha", "Sanjay", "Aarti", "Vijay", "Kavita", "Ravi", "Anil", "Meena", "Dinesh", "Alok", "Shweta", "Gaurav", "Preeti"];
const customerLastNames = ["Kumar", "Sharma", "Verma", "Patel", "Singh", "Gupta", "Yadav", "Joshi", "Mishra", "Pandey", "Shah", "Chauhan", "Mehta", "Agrawal", "Bansal", "Rao", "Nair", "Reddy", "Thakur", "Saxena"];

const doctorNames = ["Dr. R. K. Sharma", "Dr. A. P. Mishra", "Dr. S. K. Gupta", "Dr. Neha Verma", "Dr. V. P. Singh", "Dr. Priya Deshmukh", "Dr. Rajesh Agrawal", "Dr. M. K. Roy"];

const paymentMethods = ["Cash", "UPI", "Card", "Udhaar"];

async function main() {
  const startTime = Date.now();
  console.log("🚀 STARTING 1 LAKH+ DEMO DATA SEEDING FOR USER 'Mahadev'...");
  console.log("🔗 Connecting to MongoDB:", mongoUri);
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB.");

  // 1. Create/Ensure User "mahadev"
  const usernameLower = "mahadev";
  const hashedPassword = await bcrypt.hash("maha", 10);

  let user = await User.findOne({ username: usernameLower });
  if (!user) {
    user = new User({
      username: usernameLower,
      password: hashedPassword,
      name: "Mahadev",
      shopName: "Mahadev Medical & Healthcare Store",
      address: "Shop No. 12-14, Commercial Hub, Main Station Road",
      phoneNumber: "9876543210",
      email: "mahadev@medicalerp.com",
      role: "admin",
      status: "active",
      subscriptionEnd: new Date("2035-12-31T23:59:59.000Z"),
      termsAccepted: true,
      termsVersion: "v1.0",
      consentTimestamp: new Date()
    });
    await user.save();
    console.log(`✅ Created User '${usernameLower}' (ID: ${user._id}) with password 'maha'`);
  } else {
    user.password = hashedPassword;
    user.status = "active";
    user.role = "admin";
    user.subscriptionEnd = new Date("2035-12-31T23:59:59.000Z");
    user.termsAccepted = true;
    await user.save();
    console.log(`✅ Updated existing User '${usernameLower}' (ID: ${user._id}) password to 'maha'`);
  }

  const userId = user._id;

  // 2. Clear old data for mahadev user
  console.log(`\n🗑️ Clearing old data for user '${usernameLower}'...`);
  await Promise.all([
    Medicine.deleteMany({ userId }),
    Sale.deleteMany({ userId }),
    Distributor.deleteMany({ userId }),
    Customer.deleteMany({ userId })
  ]);
  console.log("✅ Cleared old medicines, sales, distributors, and customers.");

  // 3. Seed Distributors (~500 Distributors)
  const TARGET_DISTRIBUTORS = 500;
  console.log(`\n⏳ Seeding ${TARGET_DISTRIBUTORS} Distributors...`);
  const distributorsList = [];
  const distributorNames = [];
  for (let i = 0; i < TARGET_DISTRIBUTORS; i++) {
    const baseComp = distributorCompanies[i % distributorCompanies.length];
    const city = cities[i % cities.length];
    const distName = `${baseComp} (${city} Branch - ${i + 1})`;
    distributorNames.push(distName);
    distributorsList.push({
      name: distName,
      phone: `98700${String(i).padStart(5, '0')}`,
      address: `Plot ${100 + i}, Industrial Area, ${city}`,
      userId,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  await Distributor.collection.insertMany(distributorsList);
  console.log(`✅ Seeded ${TARGET_DISTRIBUTORS} Distributors.`);

  // 4. Seed Customers & Khata (~1,500 Customers with transactions)
  const TARGET_CUSTOMERS = 1500;
  console.log(`\n⏳ Seeding ${TARGET_CUSTOMERS} Customers with transactions...`);
  const customersDocs = [];
  const customerRefList = []; // for linking to sales

  const today = new Date();

  for (let i = 0; i < TARGET_CUSTOMERS; i++) {
    const fname = customerFirstNames[Math.floor(Math.random() * customerFirstNames.length)];
    const lname = customerLastNames[Math.floor(Math.random() * customerLastNames.length)];
    const fullName = `${fname} ${lname} ${i > 500 ? '#' + i : ''}`.trim();
    const phone = `9000${String(i).padStart(6, '0')}`;

    // Balances: 60% zero, 35% owes money (positive), 5% advance (negative)
    let balance = 0;
    const balRand = Math.random();
    if (balRand < 0.35) {
      balance = Math.floor(Math.random() * 4500) + 150;
    } else if (balRand < 0.40) {
      balance = -(Math.floor(Math.random() * 500) + 50);
    }

    const creditLimit = [5000, 10000, 15000, 20000, 25000][Math.floor(Math.random() * 5)];
    let promiseDate = null;
    if (balance > 0) {
      promiseDate = new Date();
      promiseDate.setDate(today.getDate() + (Math.floor(Math.random() * 30) + 1));
    }

    // Customer transactions
    const txCount = Math.floor(Math.random() * 4);
    const transactions = [];
    for (let t = 0; t < txCount; t++) {
      const txDate = new Date();
      txDate.setDate(today.getDate() - Math.floor(Math.random() * 60));
      const txType = Math.random() < 0.5 ? 'Sale' : 'Payment';
      const txAmount = Math.floor(Math.random() * 1200) + 100;
      transactions.push({
        type: txType,
        amount: txAmount,
        date: txDate,
        note: txType === 'Sale' ? 'Udhaar purchase' : 'Cash repayment'
      });
    }

    customerRefList.push({ name: fullName, phone });
    customersDocs.push({
      name: fullName,
      phone,
      userId,
      balance,
      creditLimit,
      promiseDate,
      transactions,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  await Customer.collection.insertMany(customersDocs);
  console.log(`✅ Seeded ${TARGET_CUSTOMERS} Customers.`);

  // 5. Seed Medicines (~75,000 Medicines)
  const TARGET_MEDICINES = 75000;
  console.log(`\n⏳ Seeding ${TARGET_MEDICINES} Medicines in chunks of 5000...`);
  
  const sampleMedsForSales = []; // collection of medicines to link sales
  let insertedMeds = 0;
  const CHUNK_SIZE = 5000;

  for (let i = 0; i < TARGET_MEDICINES; i += CHUNK_SIZE) {
    const chunk = [];
    const currentChunkSize = Math.min(CHUNK_SIZE, TARGET_MEDICINES - i);

    for (let j = 0; j < currentChunkSize; j++) {
      const index = i + j;
      const baseName = baseMedNames[index % baseMedNames.length];
      const form = medForms[Math.floor(Math.random() * medForms.length)];
      const mg = medDosages[Math.floor(Math.random() * medDosages.length)];
      const fullName = `${baseName} ${mg} (${form})`;

      const mrp = Math.floor(Math.random() * 650) + 12;
      const purchasePrice = Math.round(mrp * (0.6 + Math.random() * 0.15)); // 25-40% profit margin

      // Quantities & Expiries
      // 70% normal in stock (20-300)
      // 10% low stock (1-9)
      // 5% out of stock (0)
      // 8% expired (past 10-180 days)
      // 7% expiring soon (next 10-85 days)
      let qty = Math.floor(Math.random() * 250) + 20;
      const expDate = new Date(today);

      const typeRand = Math.random();
      if (typeRand < 0.05) {
        qty = 0; // Out of stock
        expDate.setDate(today.getDate() + Math.floor(Math.random() * 300) + 100);
      } else if (typeRand < 0.15) {
        qty = Math.floor(Math.random() * 9) + 1; // Low stock
        expDate.setDate(today.getDate() + Math.floor(Math.random() * 300) + 100);
      } else if (typeRand < 0.23) {
        // Expired
        expDate.setDate(today.getDate() - (Math.floor(Math.random() * 170) + 10));
      } else if (typeRand < 0.30) {
        // Expiring soon (10-85 days)
        expDate.setDate(today.getDate() + (Math.floor(Math.random() * 75) + 10));
      } else {
        // Healthy expiry
        expDate.setDate(today.getDate() + (Math.floor(Math.random() * 600) + 100));
      }

      const purchaseDate = new Date(today);
      purchaseDate.setDate(today.getDate() - Math.floor(Math.random() * 200));

      const distributor = distributorNames[index % distributorNames.length];
      const barcodeId = `MED-MAHA-${String(index + 100000).padStart(7, '0')}`;
      const isLoose = Math.random() < 0.15;
      const tabletsPerStrip = isLoose ? [10, 15, 20][Math.floor(Math.random() * 3)] : 1;
      const stripMrp = isLoose ? mrp : 0;

      const medId = new mongoose.Types.ObjectId();
      if (sampleMedsForSales.length < 10000 && qty > 0 && expDate > today) {
        sampleMedsForSales.push({ _id: medId, name: fullName, mrp, purchasePrice });
      }

      chunk.push({
        _id: medId,
        name: fullName,
        batch: `B-${Math.floor(Math.random() * 89999) + 10000}`,
        expiryDate: expDate,
        quantity: qty,
        mrp,
        purchasePrice,
        distributor,
        billNumber: `INV-${Math.floor(Math.random() * 89999) + 10000}`,
        purchaseDate,
        barcodeId,
        userId,
        isLoose,
        tabletsPerStrip,
        stripMrp,
        createdAt: purchaseDate,
        updatedAt: purchaseDate
      });
    }

    await Medicine.collection.insertMany(chunk);
    insertedMeds += chunk.length;
    process.stdout.write(`\r   ➡️ Medicines: Inserted ${insertedMeds} / ${TARGET_MEDICINES}`);
  }
  console.log(`\n✅ Seeded ${TARGET_MEDICINES} Medicines.`);

  // 6. Seed Sales (~35,000 Sales)
  const TARGET_SALES = 35000;
  console.log(`\n⏳ Seeding ${TARGET_SALES} Sales across the last 365 days...`);
  
  let insertedSales = 0;
  for (let i = 0; i < TARGET_SALES; i += CHUNK_SIZE) {
    const chunk = [];
    const currentChunkSize = Math.min(CHUNK_SIZE, TARGET_SALES - i);

    for (let j = 0; j < currentChunkSize; j++) {
      const index = i + j;
      const itemsCount = Math.floor(Math.random() * 4) + 1; // 1 to 4 items
      const items = [];
      let totalAmount = 0;
      let totalTax = 0;
      let totalDiscount = 0;

      for (let k = 0; k < itemsCount; k++) {
        const med = sampleMedsForSales[Math.floor(Math.random() * sampleMedsForSales.length)];
        const sellQty = Math.floor(Math.random() * 5) + 1;
        const rawTotal = sellQty * med.mrp;
        const discountPercent = Math.random() < 0.3 ? [5, 10, 12, 15][Math.floor(Math.random() * 4)] : 0;
        const discountAmt = Math.round((rawTotal * discountPercent) / 100);
        const taxableAmount = rawTotal - discountAmt;
        const gstPercent = [0, 5, 12, 18][Math.floor(Math.random() * 4)];
        const cgstAmount = Math.round((taxableAmount * (gstPercent / 2)) / 100);
        const sgstAmount = Math.round((taxableAmount * (gstPercent / 2)) / 100);
        const finalItemTotal = taxableAmount + cgstAmount + sgstAmount;

        totalAmount += finalItemTotal;
        totalTax += (cgstAmount + sgstAmount);
        totalDiscount += discountAmt;

        items.push({
          medicineId: med._id,
          name: med.name,
          quantity: sellQty,
          mrp: med.mrp,
          purchasePrice: med.purchasePrice,
          total: finalItemTotal,
          discountPercent,
          gstPercent,
          taxableAmount,
          cgstAmount,
          sgstAmount
        });
      }

      // Sale Dates distribution:
      // ~200 sales dated TODAY so current day dashboard is full
      // ~2,000 sales dated past 7 days
      // ~8,000 sales dated past 30 days
      // remaining spread across 365 days
      const saleDate = new Date(today);
      if (index < 200) {
        // Today: randomize time between 8 AM and 9 PM today
        saleDate.setHours(8 + Math.floor(Math.random() * 13), Math.floor(Math.random() * 60));
      } else if (index < 2200) {
        // Past 7 days
        saleDate.setDate(today.getDate() - (Math.floor(Math.random() * 7) + 1));
        saleDate.setHours(8 + Math.floor(Math.random() * 13), Math.floor(Math.random() * 60));
      } else if (index < 10000) {
        // Past 30 days
        saleDate.setDate(today.getDate() - (Math.floor(Math.random() * 30) + 1));
        saleDate.setHours(8 + Math.floor(Math.random() * 13), Math.floor(Math.random() * 60));
      } else {
        // Past 365 days
        saleDate.setDate(today.getDate() - (Math.floor(Math.random() * 365) + 1));
        saleDate.setHours(8 + Math.floor(Math.random() * 13), Math.floor(Math.random() * 60));
      }

      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const cust = customerRefList[Math.floor(Math.random() * customerRefList.length)];
      const docName = doctorNames[Math.floor(Math.random() * doctorNames.length)];

      chunk.push({
        items,
        totalAmount,
        paymentMethod,
        date: saleDate,
        userId,
        customerName: cust.name,
        customerPhone: cust.phone,
        prescriptionDetail: {
          doctorName: docName,
          doctorRegNo: `REG-${Math.floor(Math.random() * 89999) + 10000}`,
          patientAge: Math.floor(Math.random() * 60) + 18,
          patientGender: Math.random() < 0.5 ? 'Male' : 'Female'
        },
        totalDiscount,
        totalTax,
        createdAt: saleDate,
        updatedAt: saleDate
      });
    }

    await Sale.collection.insertMany(chunk);
    insertedSales += chunk.length;
    process.stdout.write(`\r   ➡️ Sales: Inserted ${insertedSales} / ${TARGET_SALES}`);
  }
  console.log(`\n✅ Seeded ${TARGET_SALES} Sales.`);

  // Verification Summary
  const [totalMeds, totalSalesCount, totalCusts, totalDists] = await Promise.all([
    Medicine.countDocuments({ userId }),
    Sale.countDocuments({ userId }),
    Customer.countDocuments({ userId }),
    Distributor.countDocuments({ userId })
  ]);

  const grandTotalDocs = totalMeds + totalSalesCount + totalCusts + totalDists;

  console.log(`\n======================================================`);
  console.log(`🎉 1 LAKH+ DEMO DATA SEEDING COMPLETE FOR 'Mahadev'!`);
  console.log(`------------------------------------------------------`);
  console.log(`👤 Account Username: mahadev (ID: ${userId})`);
  console.log(`🔑 Account Password: maha`);
  console.log(`💊 Medicines Seeded:    ${totalMeds.toLocaleString()}`);
  console.log(`🧾 Sales Bills Seeded:  ${totalSalesCount.toLocaleString()}`);
  console.log(`👥 Customers Seeded:    ${totalCusts.toLocaleString()}`);
  console.log(`🏢 Distributors Seeded: ${totalDists.toLocaleString()}`);
  console.log(`📊 TOTAL DEMO RECORDS:  ${grandTotalDocs.toLocaleString()}`);
  console.log(`⏱️ Total Time Elapsed:  ${((Date.now() - startTime) / 1000).toFixed(2)} seconds`);
  console.log(`======================================================\n`);

  process.exit(0);
}

main().catch(err => {
  console.error("❌ Seeding Script Error:", err);
  process.exit(1);
});
