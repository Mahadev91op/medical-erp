const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

// Ensure demo_data directory exists
const demoDir = path.join(__dirname, "..", "demo_data");
if (!fs.existsSync(demoDir)) {
  fs.mkdirSync(demoDir);
}

// 1. GENERATE MYBILLBOOK EXCEL DEMO DATA
function generateMyBillBookExcel() {
  const data = [
    {
      "Item Name": "Paracetamol 650mg (Crocin)",
      "Stock Quantity": 250,
      "MRP": 30.50,
      "Purchase Price": 21.00,
      "Batch Number": "PR2601",
      "Expiry Date": "2027-10-31"
    },
    {
      "Item Name": "Amoxicillin 500mg Capsule",
      "Stock Quantity": 120,
      "MRP": 85.00,
      "Purchase Price": 58.50,
      "Batch Number": "AMX99",
      "Expiry Date": "2027-04-15"
    },
    {
      "Item Name": "Cetirizine 10mg Allergy Relief",
      "Stock Quantity": 500,
      "MRP": 18.00,
      "Purchase Price": 12.00,
      "Batch Number": "CTZ404",
      "Expiry Date": "2028-12-01"
    },
    {
      "Item Name": "Atorvastatin 10mg (Lipitor)",
      "Stock Quantity": 80,
      "MRP": 115.00,
      "Purchase Price": 80.00,
      "Batch Number": "ATR12",
      "Expiry Date": "2027-08-20"
    },
    {
      "Item Name": "Pantoprazole 40mg Acid Reflux",
      "Stock Quantity": 190,
      "MRP": 65.00,
      "Purchase Price": 45.00,
      "Batch Number": "PNT003",
      "Expiry Date": "2027-11-15"
    }
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, "Items");
  const filePath = path.join(demoDir, "mybillbook_items_demo.xlsx");
  XLSX.writeFile(wb, filePath);
  console.log("Created: mybillbook_items_demo.xlsx");
}

// 2. GENERATE BUSY ACCOUNTING JSON DEMO DATA
function generateBusyJson() {
  const data = {
    items: [
      {
        itemName: "Aspirin 75mg Low Dose",
        qty: 350,
        mrp: 22.00,
        purchaseRate: 15.00,
        batchNo: "ASP26B",
        expiryDate: "2027-12-31"
      },
      {
        itemName: "Metformin 500mg SR",
        qty: 400,
        mrp: 45.50,
        purchaseRate: 31.00,
        batchNo: "MET2601",
        expiryDate: "2028-02-15"
      },
      {
        itemName: "Azithromycin 500mg (Azee)",
        qty: 150,
        mrp: 120.00,
        purchaseRate: 85.00,
        batchNo: "AZI909",
        expiryDate: "2027-06-30"
      }
    ],
    parties: [
      {
        partyName: "Rahul Sharma (Customer)",
        phone: "9876543210",
        opBal: 1250.00,
        parentGroup: "Sundry Debtors"
      },
      {
        partyName: "Ambika Pharma Distributor",
        phone: "9911882233",
        opBal: -45000.00,
        parentGroup: "Sundry Creditors",
        address: "Sector 5, Noida, UP"
      },
      {
        partyName: "Amit Verma (Customer)",
        phone: "9998887776",
        opBal: 450.00,
        parentGroup: "Sundry Debtors"
      }
    ]
  };

  const filePath = path.join(demoDir, "busy_masters_demo.json");
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
  console.log("Created: busy_masters_demo.json");
}

// 3. GENERATE MARGERP BINARY DBF DEMO DATA
function generateMargDbf() {
  const fields = [
    { name: "PNAME", type: "C", length: 30 },
    { name: "STK", type: "N", length: 6 },
    { name: "MRP", type: "N", length: 8 },
    { name: "PURRATE", type: "N", length: 8 },
    { name: "BATCH", type: "C", length: 10 },
    { name: "EXP", type: "C", length: 8 }
  ];

  const records = [
    { PNAME: "Ibuprofen 400mg Tablet", STK: "300", MRP: "40.00", PURRATE: "28.00", BATCH: "IBU88A", EXP: "20271130" },
    { PNAME: "Vitamin C 500mg Chewable", STK: "600", MRP: "25.00", PURRATE: "17.50", BATCH: "VIT26", EXP: "20280515" },
    { PNAME: "Omeprazole 20mg Capsules", STK: "140", MRP: "55.00", PURRATE: "38.00", BATCH: "OMP02", EXP: "20270920" }
  ];

  const numRecords = records.length;
  const headerLength = 32 + 32 * fields.length + 1;
  const recordLength = 1 + fields.reduce((sum, f) => sum + f.length, 0); // 1 deletion flag + sum of field lens
  
  const buffer = Buffer.alloc(headerLength + recordLength * numRecords);

  // Write header signature: dBase III
  buffer.writeUInt8(0x03, 0);
  // Date of last update: YY MM DD
  buffer.writeUInt8(26, 1);
  buffer.writeUInt8(7, 2);
  buffer.writeUInt8(24, 3);
  // Number of records
  buffer.writeInt32LE(numRecords, 4);
  // Header length
  buffer.writeInt16LE(headerLength, 8);
  // Record length
  buffer.writeInt16LE(recordLength, 10);

  // Write field descriptors
  let offset = 32;
  fields.forEach(field => {
    // Field name (ASCII)
    const nameBuf = Buffer.alloc(11);
    nameBuf.write(field.name, "ascii");
    nameBuf.copy(buffer, offset);
    // Field type
    buffer.write(field.type, offset + 11, 1, "ascii");
    // Field data address (unused, leave 0)
    // Field length
    buffer.writeUInt8(field.length, offset + 16);
    offset += 32;
  });

  // Header terminator
  buffer.writeUInt8(0x0D, offset);

  // Write records
  let recordOffset = headerLength;
  records.forEach(rec => {
    // Write deletion flag (space = active)
    buffer.write(" ", recordOffset, 1, "ascii");
    
    let fieldOffset = recordOffset + 1;
    fields.forEach(field => {
      let val = String(rec[field.name] || "");
      // Pad C (character) with spaces right-aligned or left-aligned
      if (field.type === "C") {
        val = val.padEnd(field.length, " ");
      } else if (field.type === "N") {
        val = val.padStart(field.length, " ");
      }
      buffer.write(val, fieldOffset, field.length, "ascii");
      fieldOffset += field.length;
    });
    recordOffset += recordLength;
  });

  const filePath = path.join(demoDir, "marg_items_demo.dbf");
  fs.writeFileSync(filePath, buffer);
  console.log("Created binary dBase DBF file: marg_items_demo.dbf");
}

generateMyBillBookExcel();
generateBusyJson();
generateMargDbf();
console.log("Successfully generated all demo accounting files inside medical-erp/demo_data/ directory!");
