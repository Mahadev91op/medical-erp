import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Customer from "@/models/Customer";
import Distributor from "@/models/Distributor";
import { getServerSession } from "next-auth";
import { bulkImportData } from "@/lib/bulkImport";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyUser } from "@/lib/verifyUser";
import * as XLSX from "xlsx";

export const dynamic = 'force-dynamic';

function generateRandomPhone() {
  return "9" + Math.floor(100000000 + Math.random() * 900000000).toString();
}

function sanitizePhone(phoneStr) {
  if (!phoneStr) return "";
  return String(phoneStr).replace(/[^0-9]/g, "").substring(0, 15);
}

// Pure JS DBF/xBase file parser
function parseDBF(buffer) {
  try {
    const numRecords = buffer.readInt32LE(4);
    const headerLength = buffer.readInt16LE(8);
    const recordLength = buffer.readInt16LE(10);
    
    // Field descriptors start at byte 32
    const fields = [];
    let offset = 32;
    // Header terminator is 0x0D
    while (offset < headerLength - 1 && buffer[offset] !== 0x0D) {
      const fieldName = buffer.toString("ascii", offset, offset + 11).replace(/\0/g, "").trim();
      const fieldType = String.fromCharCode(buffer[offset + 11]);
      const fieldLen = buffer[offset + 16];
      fields.push({ name: fieldName, type: fieldType, length: fieldLen });
      offset += 32;
    }
    
    const records = [];
    let recordOffset = headerLength;
    for (let i = 0; i < numRecords; i++) {
      if (recordOffset + recordLength > buffer.length) break;
      
      const isDeleted = buffer[recordOffset] === 0x2A; // Asterisk 0x2A means deleted
      if (!isDeleted) {
        const record = {};
        let fieldOffset = recordOffset + 1; // skip deletion flag
        for (const field of fields) {
          const val = buffer.toString("ascii", fieldOffset, fieldOffset + field.length).trim();
          record[field.name] = val;
          fieldOffset += field.length;
        }
        records.push(record);
      }
      recordOffset += recordLength;
    }
    
    return records;
  } catch (err) {
    console.error("DBF Parse Error:", err);
    throw new Error("Failed to parse DBF binary structure: " + err.message);
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const verification = await verifyUser(userId, session.user.role);
    if (!verification.success) {
      return NextResponse.json({ error: verification.error }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const importType = formData.get("importType") || "items"; // "items" or "parties"
    const dryRun = formData.get("dryRun") === "true";
    const conflictMode = formData.get("conflictMode") || "skip";

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let parsedData = [];
    const fileName = file.name.toLowerCase();

    // 1. Check if DBF file (Direct Marg Database File)
    if (fileName.endsWith(".dbf")) {
      try {
        parsedData = parseDBF(buffer);
      } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 400 });
      }
    } 
    // 2. Check if JSON
    else if (fileName.endsWith(".json")) {
      try {
        parsedData = JSON.parse(buffer.toString("utf8"));
      } catch (err) {
        return NextResponse.json({ success: false, error: "Invalid JSON format." }, { status: 400 });
      }
    } 
    // 3. Spreadsheet format (Excel/CSV)
    else {
      try {
        const workbook = XLSX.read(buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        parsedData = XLSX.utils.sheet_to_json(worksheet);
      } catch (err) {
        return NextResponse.json({ success: false, error: "Failed to parse spreadsheet file.", details: err.message }, { status: 400 });
      }
    }

    if (!Array.isArray(parsedData) || parsedData.length === 0) {
      return NextResponse.json({ success: false, error: "Uploaded file is empty or has incompatible database columns." }, { status: 400 });
    }

    const importedMedicines = [];
    const importedCustomers = [];
    const importedDistributors = [];

    // Dynamically match column keys based on standard Marg DBF / Excel columns
    if (importType === "items") {
      for (const row of parsedData) {
        // Search keys case-insensitively
        const keys = Object.keys(row);
        
        // Find matched columns
        const nameKey = keys.find(k => k.toLowerCase() === "pname" || k.toLowerCase() === "name" || k.toLowerCase().includes("itemname") || k.toLowerCase().includes("productname")) || keys[0];
        const qtyKey = keys.find(k => k.toLowerCase() === "stk" || k.toLowerCase() === "qty" || k.toLowerCase() === "quantity" || k.toLowerCase().includes("stock") || k.toLowerCase().includes("clstock")) || null;
        const mrpKey = keys.find(k => k.toLowerCase() === "mrp" || k.toLowerCase() === "rate" || k.toLowerCase().includes("mrpprice")) || null;
        const purchaseKey = keys.find(k => k.toLowerCase().includes("purrate") || k.toLowerCase().includes("purchase") || k.toLowerCase() === "cost") || null;
        const batchKey = keys.find(k => k.toLowerCase() === "batch" || k.toLowerCase() === "batchno" || k.toLowerCase().includes("batch")) || null;
        const expiryKey = keys.find(k => k.toLowerCase() === "exp" || k.toLowerCase() === "expiry" || k.toLowerCase().includes("expdate")) || null;

        const name = row[nameKey] || "";
        if (!name) continue;

        const qty = qtyKey ? parseFloat(row[qtyKey]) || 0 : 0;
        const mrp = mrpKey ? parseFloat(row[mrpKey]) || 0 : 10;
        const purchase = purchaseKey ? parseFloat(row[purchaseKey]) || 0 : mrp * 0.7;
        const batch = batchKey ? String(row[batchKey]).trim() || "BATCH-1" : "BATCH-1";
        
        let expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        if (expiryKey && row[expiryKey]) {
          const rawVal = String(row[expiryKey]).trim();
          // Marg DBF dates can look like "20261024" or "261024" or standard Date formats
          if (/^\d{8}$/.test(rawVal)) {
            const y = parseInt(rawVal.substring(0, 4));
            const m = parseInt(rawVal.substring(4, 6)) - 1;
            const d = parseInt(rawVal.substring(6, 8));
            expiryDate = new Date(y, m, d);
          } else {
            const parsedExp = Date.parse(rawVal);
            if (!isNaN(parsedExp)) expiryDate = new Date(parsedExp);
          }
        }

        const barcode = `MR-${userId.toString().substring(18)}-${Math.floor(100000 + Math.random() * 900000)}`;

        importedMedicines.push({
          name,
          batch,
          expiryDate,
          quantity: Math.max(0, qty),
          mrp: mrp || 10,
          purchasePrice: purchase,
          distributor: "Marg Imported Supplier",
          billNumber: "MARG-IMPORT",
          purchaseDate: new Date(),
          barcodeId: barcode,
          userId
        });
      }
    } else if (importType === "parties") {
      for (const row of parsedData) {
        const keys = Object.keys(row);
        
        const nameKey = keys.find(k => k.toLowerCase() === "lname" || k.toLowerCase() === "name" || k.toLowerCase().includes("party") || k.toLowerCase().includes("customer")) || keys[0];
        const phoneKey = keys.find(k => k.toLowerCase() === "phone" || k.toLowerCase() === "mobile" || k.toLowerCase() === "tel" || k.toLowerCase().includes("phone")) || null;
        const balanceKey = keys.find(k => k.toLowerCase() === "bal" || k.toLowerCase() === "balance" || k.toLowerCase().includes("due")) || null;
        const typeKey = keys.find(k => k.toLowerCase() === "type" || k.toLowerCase().includes("partytype") || k.toLowerCase() === "group") || null;

        const name = row[nameKey] || "";
        if (!name) continue;

        const phone = phoneKey ? sanitizePhone(row[phoneKey]) : "";
        const balance = balanceKey ? parseFloat(row[balanceKey]) || 0 : 0;
        
        let isSupplier = false;
        if (typeKey && row[typeKey]) {
          const typeStr = String(row[typeKey]).toLowerCase();
          if (typeStr.includes("supplier") || typeStr.includes("vendor") || typeStr.includes("creditor") || typeStr.includes("purchase")) {
            isSupplier = true;
          }
        } else if (name.toLowerCase().includes("supplier") || name.toLowerCase().includes("distributor")) {
          isSupplier = true;
        }

        if (isSupplier) {
          importedDistributors.push({
            name,
            phone,
            address: row["address"] || row["Address"] || "Imported from MargERP",
            userId
          });
        } else {
          importedCustomers.push({
            name,
            phone: phone || generateRandomPhone(),
            balance,
            creditLimit: 15000,
            userId,
            transactions: balance !== 0 ? [{
              type: balance > 0 ? "Debt" : "Payment",
              amount: Math.abs(balance),
              date: new Date(),
              note: "Imported from MargERP opening balance"
            }] : []
          });
        }
      }
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        counts: {
          medicines: importedMedicines.length,
          customers: importedCustomers.length,
          distributors: importedDistributors.length
        },
        preview: {
          medicines: importedMedicines.slice(0, 5),
          customers: importedCustomers.slice(0, 5),
          distributors: importedDistributors.slice(0, 5)
        }
      });
    }

    // Connect DB & Save
    await connectToDatabase();

    // Perform actual DB writes in high-performance bulk mode
    const dbCounts = await bulkImportData({
      userId,
      medicines: importType === "items" ? importedMedicines : [],
      customers: importType === "parties" ? importedCustomers : [],
      distributors: importType === "parties" ? importedDistributors : [],
      conflictMode
    });

    return NextResponse.json({
      success: true,
      dryRun: false,
      message: `Successfully imported ${importType} from MargERP!`,
      counts: dbCounts
    });

  } catch (err) {
    console.error("MargERP sync general failure:", err);
    return NextResponse.json({ success: false, error: "Internal server error occurred.", details: err.message }, { status: 500 });
  }
}
