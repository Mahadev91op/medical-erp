import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Customer from "@/models/Customer";
import Distributor from "@/models/Distributor";
import { getServerSession } from "next-auth";
import { bulkImportData } from "@/lib/bulkImport";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyUser } from "@/lib/verifyUser";
import fs from "fs";
import path from "path";
import os from "os";
import { DatabaseSync } from "node:sqlite";

export const dynamic = 'force-dynamic';

// Helper to clean phone numbers
function sanitizePhone(phoneStr) {
  if (!phoneStr) return "";
  return String(phoneStr).replace(/[^0-9]/g, "").substring(0, 15);
}

function generateRandomPhone() {
  return "9" + Math.floor(100000000 + Math.random() * 900000000).toString();
}

// Locate local Vyapar database paths
function getLocalVyaparPaths() {
  const home = os.homedir();
  const paths = [];
  
  if (process.env.LOCALAPPDATA) {
    paths.push(path.join(process.env.LOCALAPPDATA, "vyaparApp", "vyapar.db"));
    paths.push(path.join(process.env.LOCALAPPDATA, "Vyapar", "vyapar.db"));
    paths.push(path.join(process.env.LOCALAPPDATA, "vyaparApp", "User Data", "Default", "vyapar.db"));
  }
  if (process.env.APPDATA) {
    paths.push(path.join(process.env.APPDATA, "vyaparApp", "vyapar.db"));
  }
  
  paths.push(path.join(home, "AppData", "Local", "vyaparApp", "vyapar.db"));
  paths.push(path.join(home, "AppData", "Roaming", "vyaparApp", "vyapar.db"));
  
  return [...new Set(paths)].filter(p => fs.existsSync(p));
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const localPaths = getLocalVyaparPaths();
    return NextResponse.json({ success: true, localPaths });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message });
  }
}

export async function POST(req) {
  let tempFilePath = null;
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

    // Determine if file is uploaded or local path is used
    const contentType = req.headers.get("content-type") || "";
    let dbPath = null;
    let dryRun = false;
    let conflictMode = "skip";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      dryRun = formData.get("dryRun") === "true";
      conflictMode = formData.get("conflictMode") || "skip";

      if (!file) {
        return NextResponse.json({ success: false, error: "No Vyapar database file uploaded." }, { status: 400 });
      }

      // Save upload buffer to temporary file
      const buffer = Buffer.from(await file.arrayBuffer());
      const tempDir = path.join(process.cwd(), "tmp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
      }
      tempFilePath = path.join(tempDir, `vyapar_temp_${Date.now()}.db`);
      fs.writeFileSync(tempFilePath, buffer);
      dbPath = tempFilePath;
    } else {
      const body = await req.json().catch(() => ({}));
      dbPath = body.dbPath;
      dryRun = body.dryRun || false;
      conflictMode = body.conflictMode || "skip";

      if (!dbPath) {
        return NextResponse.json({ success: false, error: "No database path provided." }, { status: 400 });
      }
      if (!fs.existsSync(dbPath)) {
        return NextResponse.json({ success: false, error: `File not found at specified path: ${dbPath}` }, { status: 404 });
      }
    }

    // Load database using built-in node:sqlite DatabaseSync
    const db = new DatabaseSync(dbPath);

    // Dynamic schema inspection
    const tablesQuery = db.prepare("SELECT name FROM sqlite_master WHERE type='table'");
    const tables = tablesQuery.all().map(t => t.name.toLowerCase());
    
    // Determine which tables are present
    // Vyapar usually uses tables like tbl_item, tbl_party, tbl_transaction or similar
    const itemTable = tables.find(t => t.includes("item") || t.includes("product") || t.includes("stock"));
    const partyTable = tables.find(t => t.includes("party") || t.includes("customer") || t.includes("supplier") || t.includes("contact"));

    if (!itemTable) {
      db.close();
      if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      return NextResponse.json({
        success: false,
        error: "Invalid database structure. Could not find items/stock table."
      }, { status: 400 });
    }

    // Inspect columns dynamically for Items
    const columnsQuery = db.prepare(`PRAGMA table_info(${itemTable})`);
    const itemCols = columnsQuery.all().map(c => c.name);

    const nameCol = itemCols.find(c => c.toLowerCase() === "name" || c.toLowerCase().includes("item_name") || c.toLowerCase().includes("itemname")) || itemCols[1];
    const qtyCol = itemCols.find(c => c.toLowerCase().includes("qty") || c.toLowerCase().includes("quantity") || c.toLowerCase().includes("stock")) || null;
    const mrpCol = itemCols.find(c => c.toLowerCase() === "mrp" || c.toLowerCase().includes("mrp_price")) || null;
    const purchaseCol = itemCols.find(c => c.toLowerCase().includes("purchase") || c.toLowerCase().includes("buy")) || null;
    const batchCol = itemCols.find(c => c.toLowerCase().includes("batch")) || null;
    const expiryCol = itemCols.find(c => c.toLowerCase().includes("expiry") || c.toLowerCase().includes("exp")) || null;

    // Fetch items
    const selectFields = [nameCol];
    if (qtyCol) selectFields.push(qtyCol);
    if (mrpCol) selectFields.push(mrpCol);
    if (purchaseCol) selectFields.push(purchaseCol);
    if (batchCol) selectFields.push(batchCol);
    if (expiryCol) selectFields.push(expiryCol);

    const itemsQuery = db.prepare(`SELECT ${selectFields.map(f => `\`${f}\``).join(", ")} FROM ${itemTable}`);
    const rawItems = itemsQuery.all();

    const finalMedicines = [];
    for (const item of rawItems) {
      const name = item[nameCol] || "";
      if (!name) continue;

      const qty = qtyCol ? parseFloat(item[qtyCol]) || 0 : 0;
      const mrp = mrpCol ? parseFloat(item[mrpCol]) || 0 : 10;
      const purchase = purchaseCol ? parseFloat(item[purchaseCol]) || 0 : mrp * 0.7;
      const batch = batchCol ? String(item[batchCol] || "").trim() || "BATCH-1" : "BATCH-1";
      
      let expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // default 1 year
      if (expiryCol && item[expiryCol]) {
        const parsedExp = Date.parse(item[expiryCol]);
        if (!isNaN(parsedExp)) {
          expiryDate = new Date(parsedExp);
        }
      }

      const barcode = `VP-${userId.toString().substring(18)}-${Math.floor(100000 + Math.random() * 900000)}`;

      finalMedicines.push({
        name,
        batch,
        expiryDate,
        quantity: Math.max(0, qty),
        mrp: mrp || 10,
        purchasePrice: purchase,
        distributor: "Vyapar Imported Supplier",
        billNumber: "VYAPAR-IMPORT",
        purchaseDate: new Date(),
        barcodeId: barcode,
        userId
      });
    }

    // Fetch parties
    const finalCustomers = [];
    const finalDistributors = [];

    if (partyTable) {
      const partyColsQuery = db.prepare(`PRAGMA table_info(${partyTable})`);
      const partyCols = partyColsQuery.all().map(c => c.name);

      const pNameCol = partyCols.find(c => c.toLowerCase() === "name" || c.toLowerCase().includes("party_name") || c.toLowerCase().includes("partyname")) || partyCols[1];
      const pPhoneCol = partyCols.find(c => c.toLowerCase().includes("phone") || c.toLowerCase().includes("mobile") || c.toLowerCase().includes("contact")) || null;
      const pTypeCol = partyCols.find(c => c.toLowerCase() === "type" || c.toLowerCase().includes("party_type") || c.toLowerCase().includes("role")) || null;
      const pBalanceCol = partyCols.find(c => c.toLowerCase().includes("balance") || c.toLowerCase().includes("due")) || null;

      const pSelectFields = [pNameCol];
      if (pPhoneCol) pSelectFields.push(pPhoneCol);
      if (pTypeCol) pSelectFields.push(pTypeCol);
      if (pBalanceCol) pSelectFields.push(pBalanceCol);

      const partiesQuery = db.prepare(`SELECT ${pSelectFields.map(f => `\`${f}\``).join(", ")} FROM ${partyTable}`);
      const rawParties = partiesQuery.all();

      for (const party of rawParties) {
        const name = party[pNameCol] || "";
        if (!name) continue;

        const phone = pPhoneCol ? sanitizePhone(party[pPhoneCol]) : "";
        const balance = pBalanceCol ? parseFloat(party[pBalanceCol]) || 0 : 0;
        
        // Determine type (Customer vs Supplier)
        let isSupplier = false;
        if (pTypeCol && party[pTypeCol]) {
          const typeStr = String(party[pTypeCol]).toLowerCase();
          if (typeStr.includes("supplier") || typeStr.includes("vendor") || typeStr.includes("creditor") || typeStr.includes("purchase")) {
            isSupplier = true;
          }
        }

        if (isSupplier) {
          finalDistributors.push({
            name,
            phone,
            address: "Imported from Vyapar App",
            userId
          });
        } else {
          finalCustomers.push({
            name,
            phone: phone || generateRandomPhone(),
            balance,
            creditLimit: 15000,
            promiseDate: null,
            userId,
            transactions: balance !== 0 ? [{
              type: balance > 0 ? "Debt" : "Payment",
              amount: Math.abs(balance),
              date: new Date(),
              note: "Imported from Vyapar App balance"
            }] : []
          });
        }
      }
    }

    db.close();

    // Remove temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    if (dryRun) {
      return NextResponse.json({
        success: true,
        dryRun: true,
        counts: {
          medicines: finalMedicines.length,
          customers: finalCustomers.length,
          distributors: finalDistributors.length
        },
        preview: {
          medicines: finalMedicines.slice(0, 5),
          customers: finalCustomers.slice(0, 5),
          distributors: finalDistributors.slice(0, 5)
        }
      });
    }

    // DB Sync operations
    await connectToDatabase();

    // Perform actual DB writes in high-performance bulk mode
    const dbCounts = await bulkImportData({
      userId,
      medicines: finalMedicines,
      customers: finalCustomers,
      distributors: finalDistributors,
      conflictMode
    });

    return NextResponse.json({
      success: true,
      dryRun: false,
      message: "Successfully imported data from Vyapar app!",
      counts: dbCounts
    });

  } catch (err) {
    console.error("Vyapar sync API Error:", err);
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try { fs.unlinkSync(tempFilePath); } catch (e) {}
    }
    return NextResponse.json({
      success: false,
      error: "Error processing Vyapar database.",
      details: err.message
    }, { status: 500 });
  }
}
