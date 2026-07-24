import Medicine from "@/models/Medicine";
import Customer from "@/models/Customer";
import Distributor from "@/models/Distributor";

export async function bulkImportData({ userId, medicines = [], customers = [], distributors = [], conflictMode = "skip" }) {
  const result = {
    medicines: 0,
    customers: 0,
    distributors: 0
  };

  // 1. DISTRIBUTORS IMPORT
  if (distributors && distributors.length > 0) {
    if (conflictMode === "wipe") {
      await Distributor.deleteMany({ userId });
      // Remove internal duplicates in distributors array
      const uniqueDists = [];
      const seen = new Set();
      for (const d of distributors) {
        const lowerName = d.name.toLowerCase();
        if (!seen.has(lowerName)) {
          seen.add(lowerName);
          uniqueDists.push(d);
        }
      }
      if (uniqueDists.length > 0) {
        const res = await Distributor.insertMany(uniqueDists);
        result.distributors = res.length;
      }
    } else {
      const existing = await Distributor.find({ userId }).select("name").lean();
      const existingNames = new Set(existing.map(d => d.name.toLowerCase()));
      
      const newDists = distributors.filter(d => !existingNames.has(d.name.toLowerCase()));
      const uniqueNewDists = [];
      const seen = new Set();
      for (const d of newDists) {
        const lowerName = d.name.toLowerCase();
        if (!seen.has(lowerName)) {
          seen.add(lowerName);
          uniqueNewDists.push(d);
        }
      }

      if (uniqueNewDists.length > 0) {
        const res = await Distributor.insertMany(uniqueNewDists);
        result.distributors = res.length;
      }
    }
  }

  // 2. CUSTOMERS IMPORT
  if (customers && customers.length > 0) {
    if (conflictMode === "wipe") {
      await Customer.deleteMany({ userId });
      // Ensure unique phone numbers in list
      const uniqueCusts = [];
      const seenPhones = new Set();
      for (const c of customers) {
        if (!seenPhones.has(c.phone)) {
          seenPhones.add(c.phone);
          uniqueCusts.push(c);
        }
      }
      if (uniqueCusts.length > 0) {
        const res = await Customer.insertMany(uniqueCusts);
        result.customers = res.length;
      }
    } else {
      const existing = await Customer.find({ userId }).select("name phone").lean();
      const existingNames = new Map(existing.map(c => [c.name.toLowerCase(), c]));
      const existingPhones = new Set(existing.map(c => c.phone));

      const bulkOps = [];
      const seenPhonesInImport = new Set();

      for (const cust of customers) {
        const nameLower = cust.name.toLowerCase();
        const existsByName = existingNames.get(nameLower);

        if (existsByName) {
          if (conflictMode === "overwrite") {
            bulkOps.push({
              updateOne: {
                filter: { _id: existsByName._id },
                update: { $set: { balance: cust.balance, phone: cust.phone } }
              }
            });
            result.customers++;
          }
        } else {
          // Check phone duplicate
          if (!existingPhones.has(cust.phone) && !seenPhonesInImport.has(cust.phone)) {
            seenPhonesInImport.add(cust.phone);
            bulkOps.push({
              insertOne: { document: cust }
            });
            result.customers++;
          }
        }
      }

      if (bulkOps.length > 0) {
        await Customer.bulkWrite(bulkOps);
      }
    }
  }

  // 3. MEDICINES IMPORT
  if (medicines && medicines.length > 0) {
    if (conflictMode === "wipe") {
      await Medicine.deleteMany({ userId });
      
      // Ensure unique names + batch in imported medicines to prevent internal unique key errors
      const uniqueMeds = [];
      const seenKeys = new Set();
      for (const m of medicines) {
        const key = `${m.name.toLowerCase()}_${String(m.batch).toLowerCase()}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          uniqueMeds.push(m);
        }
      }
      
      if (uniqueMeds.length > 0) {
        const res = await Medicine.insertMany(uniqueMeds);
        result.medicines = res.length;
      }
    } else {
      const existing = await Medicine.find({ userId }).select("name batch").lean();
      const existingMap = new Set(existing.map(m => `${m.name.toLowerCase()}_${String(m.batch).toLowerCase()}`));

      const bulkOps = [];
      const seenMedsInImport = new Set();

      for (const med of medicines) {
        const key = `${med.name.toLowerCase()}_${String(med.batch).toLowerCase()}`;
        const hasDuplicate = existingMap.has(key);

        if (hasDuplicate) {
          if (conflictMode === "overwrite") {
            bulkOps.push({
              updateOne: {
                filter: { userId, name: med.name, batch: med.batch },
                update: { 
                  $set: { 
                    quantity: med.quantity, 
                    mrp: med.mrp, 
                    purchasePrice: med.purchasePrice, 
                    expiryDate: med.expiryDate 
                  } 
                }
              }
            });
            result.medicines++;
          }
        } else {
          if (!seenMedsInImport.has(key)) {
            seenMedsInImport.add(key);
            bulkOps.push({
              insertOne: { document: med }
            });
            result.medicines++;
          }
        }
      }

      if (bulkOps.length > 0) {
        await Medicine.bulkWrite(bulkOps);
      }
    }
  }

  return result;
}
