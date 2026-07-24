import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Customer from "@/models/Customer";
import Distributor from "@/models/Distributor";
import { getServerSession } from "next-auth";
import { bulkImportData } from "@/lib/bulkImport";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyUser } from "@/lib/verifyUser";

export const dynamic = 'force-dynamic';

function generateRandomPhone() {
  return "9" + Math.floor(100000000 + Math.random() * 900000000).toString();
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

    const { action, sqlConfig, textData, dryRun = false, conflictMode = "skip" } = await req.json();

    await connectToDatabase();

    let importedMedicines = [];
    let importedCustomers = [];
    let importedDistributors = [];

    // METHOD A: Busy SQL Server Direct Connection
    if (action === "sql") {
      if (!sqlConfig) {
        return NextResponse.json({ success: false, error: "Missing SQL configuration details." }, { status: 400 });
      }

      // To connect to MS SQL, we dynamically require 'mssql' package.
      // If the customer hasn't configured MS SQL or we get connection errors, we report it.
      try {
        const sql = await import("mssql");
        const config = {
          user: sqlConfig.user,
          password: sqlConfig.password,
          server: sqlConfig.server || "localhost",
          database: sqlConfig.database,
          port: parseInt(sqlConfig.port) || 1433,
          options: {
            encrypt: false, // For local SQL Server
            trustServerCertificate: true
          },
          connectionTimeout: 5000
        };

        const pool = await sql.connect(config);
        
        // Busy database query structure for Stock Items & Batches
        // Busy standard tables: Master1 (Masters), ItemBatch (Batches), etc.
        // We will perform a custom robust extraction query on Busy schemas
        const itemsResult = await pool.request().query(`
          SELECT 
            m.Name as ItemName, 
            b.BatchNo, 
            b.ExpiryDate, 
            b.StockQty, 
            b.MRP, 
            b.PurchaseRate
          FROM Master1 m
          LEFT JOIN ItemBatch b ON m.Code = b.ItemCode
          WHERE m.MasterType = 6 -- Type 6 in Busy is Stock Items
        `).catch(async () => {
          // Fallback if schema differs (e.g. older Busy versions)
          return await pool.request().query(`
            SELECT Name as ItemName, '' as BatchNo, NULL as ExpiryDate, 0 as StockQty, 0 as MRP, 0 as PurchaseRate 
            FROM Master1 WHERE MasterType = 6
          `);
        });

        // Query Parties (Debtors & Creditors)
        const partiesResult = await pool.request().query(`
          SELECT Name as PartyName, ParentGroup, TelNo as Phone, Address1 + ' ' + Address2 as Address, OpBal as Balance
          FROM Master1
          WHERE MasterType = 1 -- Type 1 in Busy is Accounts
        `);

        await sql.close();

        // Map items
        for (const item of itemsResult.recordset) {
          const barcode = `BS-${userId.toString().substring(18)}-${Math.floor(100000 + Math.random() * 900000)}`;
          let expDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
          if (item.ExpiryDate) expDate = new Date(item.ExpiryDate);

          importedMedicines.push({
            name: item.ItemName,
            batch: item.BatchNo || "BATCH-1",
            expiryDate: expDate,
            quantity: Math.max(0, parseFloat(item.StockQty) || 0),
            mrp: parseFloat(item.MRP) || 10,
            purchasePrice: parseFloat(item.PurchaseRate) || (parseFloat(item.MRP) || 10) * 0.7,
            distributor: "Busy SQL Imported",
            billNumber: "BUSY-SQL-IMPORT",
            purchaseDate: new Date(),
            barcodeId: barcode,
            userId
          });
        }

        // Map parties
        for (const party of partiesResult.recordset) {
          const name = party.PartyName;
          const phone = party.Phone ? party.Phone.replace(/[^0-9]/g, "") : "";
          const bal = parseFloat(party.Balance) || 0;
          const group = String(party.ParentGroup).toLowerCase();

          if (group.includes("debtor") || group.includes("customer")) {
            importedCustomers.push({
              name,
              phone: phone || generateRandomPhone(),
              balance: bal,
              creditLimit: 15000,
              userId,
              transactions: bal !== 0 ? [{
                type: bal > 0 ? "Debt" : "Payment",
                amount: Math.abs(bal),
                date: new Date(),
                note: "Imported from Busy SQL"
              }] : []
            });
          } else if (group.includes("creditor") || group.includes("supplier") || group.includes("vendor")) {
            importedDistributors.push({
              name,
              phone,
              address: party.Address || "Imported from Busy SQL",
              userId
            });
          }
        }

      } catch (err) {
        return NextResponse.json({
          success: false,
          error: "Failed to connect or fetch from Busy SQL Server.",
          details: err.message
        }, { status: 500 });
      }
    }

    // METHOD B: Busy Text/JSON Data Files Parser
    else if (action === "text") {
      if (!textData) {
        return NextResponse.json({ success: false, error: "No data payload provided." }, { status: 400 });
      }

      try {
        const parsed = typeof textData === "string" ? JSON.parse(textData) : textData;
        
        // Expecting object like: { items: [...], parties: [...] }
        if (parsed.items && Array.isArray(parsed.items)) {
          for (const item of parsed.items) {
            const name = item.name || item.itemName || item.ItemName || "";
            if (!name) continue;

            const barcode = `BS-${userId.toString().substring(18)}-${Math.floor(100000 + Math.random() * 900000)}`;
            let expDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
            if (item.expiry || item.expiryDate) {
              const parsedExp = Date.parse(item.expiry || item.expiryDate);
              if (!isNaN(parsedExp)) expDate = new Date(parsedExp);
            }

            importedMedicines.push({
              name,
              batch: item.batch || item.batchNo || "BATCH-1",
              expiryDate: expDate,
              quantity: parseFloat(item.qty || item.quantity || item.StockQty) || 0,
              mrp: parseFloat(item.mrp || item.MRP) || 10,
              purchasePrice: parseFloat(item.purchasePrice || item.purchaseRate || item.PurchaseRate) || (parseFloat(item.mrp || item.MRP) || 10) * 0.7,
              distributor: "Busy Imported Supplier",
              billNumber: "BUSY-TXT-IMPORT",
              purchaseDate: new Date(),
              barcodeId: barcode,
              userId
            });
          }
        }

        if (parsed.parties && Array.isArray(parsed.parties)) {
          for (const p of parsed.parties) {
            const name = p.name || p.partyName || p.PartyName || "";
            if (!name) continue;

            const phone = p.phone || p.mobile || p.telNo || "";
            const balance = parseFloat(p.balance || p.opBal || p.Balance) || 0;
            const type = String(p.type || p.group || p.parentGroup || "").toLowerCase();

            if (type.includes("supplier") || type.includes("creditor") || type.includes("vendor")) {
              importedDistributors.push({
                name,
                phone,
                address: p.address || "Imported from Busy",
                userId
              });
            } else {
              importedCustomers.push({
                name,
                phone: phone ? phone.replace(/[^0-9]/g, "") : generateRandomPhone(),
                balance,
                creditLimit: 15000,
                userId,
                transactions: balance !== 0 ? [{
                  type: balance > 0 ? "Debt" : "Payment",
                  amount: Math.abs(balance),
                  date: new Date(),
                  note: "Imported from Busy exported data"
                }] : []
              });
            }
          }
        }

      } catch (err) {
        return NextResponse.json({ success: false, error: "Failed to parse uploaded Busy data file. Ensure it is valid JSON.", details: err.message }, { status: 400 });
      }
    }

    else {
      return NextResponse.json({ success: false, error: "Invalid action selected." }, { status: 400 });
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

    // Perform actual DB writes in high-performance bulk mode
    const dbCounts = await bulkImportData({
      userId,
      medicines: importedMedicines,
      customers: importedCustomers,
      distributors: importedDistributors,
      conflictMode
    });

    return NextResponse.json({
      success: true,
      dryRun: false,
      message: "Successfully synchronized data from Busy Accounting!",
      counts: dbCounts
    });

  } catch (err) {
    console.error("Busy sync general failure:", err);
    return NextResponse.json({ success: false, error: "Internal server error occurred.", details: err.message }, { status: 500 });
  }
}
