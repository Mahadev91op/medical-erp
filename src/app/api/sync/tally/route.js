import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Customer from "@/models/Customer";
import Distributor from "@/models/Distributor";
import { getServerSession } from "next-auth";
import { bulkImportData } from "@/lib/bulkImport";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyUser } from "@/lib/verifyUser";
import { XMLParser } from "fast-xml-parser";
import axios from "axios";

export const dynamic = 'force-dynamic';

// Helper to clean and format dates from Tally (usually YYYYMMDD or DD-MM-YYYY)
function parseTallyDate(dateStr) {
  if (!dateStr) return null;
  const cleaned = String(dateStr).trim();
  
  // Format: YYYYMMDD (e.g. 20261024)
  if (/^\d{8}$/.test(cleaned)) {
    const year = parseInt(cleaned.substring(0, 4));
    const month = parseInt(cleaned.substring(4, 6)) - 1; // 0-indexed
    const day = parseInt(cleaned.substring(6, 8));
    return new Date(year, month, day);
  }
  
  // Format: DD-MM-YYYY or DD/MM/YYYY or DD-MMM-YYYY
  const parsed = Date.parse(cleaned);
  if (!isNaN(parsed)) {
    return new Date(parsed);
  }
  
  return null;
}

// Generate random 10-digit number for phone if missing
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

    const { action, tallyUrl = "http://127.0.0.1:9000", companyName, dryRun = false, conflictMode = "skip" } = await req.json();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_"
    });

    // ACTION 1: Check Connection and Get Companies List
    if (action === "companies") {
      const xmlRequest = `
        <ENVELOPE>
          <HEADER>
            <VERSION>1</VERSION>
            <TALLYREQUEST>Export</TALLYREQUEST>
            <TYPE>Data</TYPE>
            <ID>List of Companies</ID>
          </HEADER>
          <BODY>
            <DESC>
              <STATICVARIABLES>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
              </STATICVARIABLES>
            </DESC>
          </BODY>
        </ENVELOPE>
      `;

      try {
        const response = await axios.post(tallyUrl, xmlRequest, {
          headers: { "Content-Type": "text/xml" },
          timeout: 4000
        });

        const jsonObj = parser.parse(response.data);
        
        // Tally response contains company list
        let companies = [];
        const envelope = jsonObj.ENVELOPE;
        
        if (envelope && envelope.BODY && envelope.BODY.DATA) {
          const companyList = envelope.BODY.DATA.COMPANYNAME || [];
          companies = Array.isArray(companyList) ? companyList : [companyList];
        }

        // Tally sometimes returns them in a nested object structure, handle fallback
        if (companies.length === 0 && response.data.includes("<COMPANYNAME>")) {
          const matches = response.data.match(/<COMPANYNAME>([^<]+)<\/COMPANYNAME>/g);
          if (matches) {
            companies = matches.map(m => m.replace(/<\/?COMPANYNAME>/g, "").trim());
          }
        }

        return NextResponse.json({ success: true, companies });
      } catch (err) {
        console.error("Tally companies fetch error:", err);
        return NextResponse.json({
          success: false,
          error: "Tally server is unreachable. Please make sure TallyPrime is open, and 'Tally is acting as: Both' or ODBC Server is enabled on port 9000.",
          details: err.message
        }, { status: 500 });
      }
    }

    // ACTION 2: Sync Data (Medicines, Customers, Distributors)
    if (action === "sync") {
      if (!companyName) {
        return NextResponse.json({ success: false, error: "Please select/specify a company name." }, { status: 400 });
      }

      await connectToDatabase();

      // Setup XML Queries for Ledgers (Customers/Distributors)
      const ledgersXml = `
        <ENVELOPE>
          <HEADER>
            <VERSION>1</VERSION>
            <TALLYREQUEST>Export</TALLYREQUEST>
            <TYPE>Collection</TYPE>
            <ID>CustomLedgers</ID>
          </HEADER>
          <BODY>
            <DESC>
              <STATICVARIABLES>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
              </STATICVARIABLES>
              <TDL>
                <TDLDECLARATION>
                  <COLLECTION Name="CustomLedgers" Type="Ledger">
                    <FETCH>Name, Parent, LedgerPhone, Email, Address, OpeningBalance</FETCH>
                  </COLLECTION>
                </TDLDECLARATION>
              </TDL>
            </DESC>
          </BODY>
        </ENVELOPE>
      `;

      // Setup XML Queries for Stock Items with Batch Details
      const stockXml = `
        <ENVELOPE>
          <HEADER>
            <VERSION>1</VERSION>
            <TALLYREQUEST>Export</TALLYREQUEST>
            <TYPE>Collection</TYPE>
            <ID>CustomStockItems</ID>
          </HEADER>
          <BODY>
            <DESC>
              <STATICVARIABLES>
                <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
                <SVCURRENTCOMPANY>${companyName}</SVCURRENTCOMPANY>
              </STATICVARIABLES>
              <TDL>
                <TDLDECLARATION>
                  <COLLECTION Name="CustomStockItems" Type="StockItem">
                    <FETCH>Name, OpeningBalance, BaseUnit, BatchAllocations, *</FETCH>
                  </COLLECTION>
                </TDLDECLARATION>
              </TDL>
            </DESC>
          </BODY>
        </ENVELOPE>
      `;

      let tallyLedgers = [];
      let tallyStockItems = [];

      // 1. Fetch Ledgers
      try {
        const responseLedgers = await axios.post(tallyUrl, ledgersXml, {
          headers: { "Content-Type": "text/xml" },
          timeout: 10000
        });
        const parsedLedgers = parser.parse(responseLedgers.data);
        
        let rawLedgers = [];
        if (parsedLedgers.ENVELOPE?.BODY?.DATA?.COLLECTION?.LEDGER) {
          const ledgerData = parsedLedgers.ENVELOPE.BODY.DATA.COLLECTION.LEDGER;
          rawLedgers = Array.isArray(ledgerData) ? ledgerData : [ledgerData];
        }
        
        tallyLedgers = rawLedgers;
      } catch (err) {
        return NextResponse.json({ success: false, error: "Failed to fetch ledgers from Tally.", details: err.message }, { status: 500 });
      }

      // 2. Fetch Stock Items
      try {
        const responseStock = await axios.post(tallyUrl, stockXml, {
          headers: { "Content-Type": "text/xml" },
          timeout: 15000
        });
        const parsedStock = parser.parse(responseStock.data);
        
        let rawStock = [];
        if (parsedStock.ENVELOPE?.BODY?.DATA?.COLLECTION?.STOCKITEM) {
          const stockData = parsedStock.ENVELOPE.BODY.DATA.COLLECTION.STOCKITEM;
          rawStock = Array.isArray(stockData) ? stockData : [stockData];
        }
        
        tallyStockItems = rawStock;
      } catch (err) {
        return NextResponse.json({ success: false, error: "Failed to fetch stock items from Tally.", details: err.message }, { status: 500 });
      }

      // Data normalization lists
      const finalCustomers = [];
      const finalDistributors = [];
      const finalMedicines = [];

      const logs = [];
      logs.push(`Fetched ${tallyLedgers.length} ledgers and ${tallyStockItems.length} stock items from Tally.`);

      // 3. Process Ledgers (Customers vs Distributors)
      for (const ledger of tallyLedgers) {
        const name = ledger.NAME || ledger.NAME?.["#text"] || "";
        const parent = ledger.PARENT || "";
        const phone = ledger.LEDGERPHONE || "";
        const email = ledger.EMAIL || "";
        const address = Array.isArray(ledger.ADDRESS) ? ledger.ADDRESS.join(", ") : (ledger.ADDRESS || "");
        
        let rawBalance = ledger.OPENINGBALANCE || 0;
        if (typeof rawBalance === "object") rawBalance = rawBalance["#text"] || 0;
        // Parse balance: Tally balances look like "-500.00" or "500.00 Dr" or "500.00 Cr"
        let parsedBalance = parseFloat(String(rawBalance).replace(/[^0-9.-]/g, "")) || 0;
        if (String(rawBalance).toLowerCase().includes("cr")) {
          // In standard tally, credit balance for debtor means negative dues (paid extra)
          parsedBalance = -Math.abs(parsedBalance);
        } else if (String(rawBalance).toLowerCase().includes("dr")) {
          parsedBalance = Math.abs(parsedBalance);
        }

        if (!name) continue;

        // Tally groups: Sundry Debtors -> Customers, Sundry Creditors -> Distributors
        if (parent.toLowerCase().includes("debtor")) {
          finalCustomers.push({
            name,
            phone: phone ? phone.replace(/[^0-9]/g, "").substring(0, 15) : generateRandomPhone(),
            balance: parsedBalance,
            creditLimit: 15000,
            promiseDate: null,
            userId,
            transactions: parsedBalance !== 0 ? [{
              type: parsedBalance > 0 ? "Debt" : "Payment",
              amount: Math.abs(parsedBalance),
              date: new Date(),
              note: "Imported from TallyPrime opening balance"
            }] : []
          });
        } else if (parent.toLowerCase().includes("creditor")) {
          finalDistributors.push({
            name,
            phone: phone ? phone.replace(/[^0-9]/g, "").substring(0, 15) : "",
            address: address || email || "Imported from Tally",
            userId
          });
        }
      }

      // 4. Process Stock Items and Batches
      for (const stock of tallyStockItems) {
        const itemName = stock.NAME || stock.NAME?.["#text"] || "";
        if (!itemName) continue;

        // Check if item has batches
        let batches = [];
        if (stock["BATCHALLOCATIONS.LIST"]) {
          const batchList = stock["BATCHALLOCATIONS.LIST"];
          batches = Array.isArray(batchList) ? batchList : [batchList];
        }

        // Tally stock rates/prices
        const itemMrp = parseFloat(stock.MRP || stock.STOCKEDMRP) || 0;
        const itemPurchasePrice = parseFloat(stock.STANDARDCOST || stock.PURCHASERATE || stock.OPENINGRATE) || 0;

        if (batches.length > 0) {
          for (const batchAlloc of batches) {
            const batchNo = batchAlloc.BATCHNAME || "BATCH-1";
            const expDate = parseTallyDate(batchAlloc.EXPIRYDATE) || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // Default 1 year
            
            let qty = batchAlloc.OPENINGBALANCE || 0;
            if (typeof qty === "object") qty = qty["#text"] || 0;
            const parsedQty = Math.abs(parseFloat(String(qty).replace(/[^0-9.-]/g, ""))) || 0;

            let rate = batchAlloc.RATE || itemMrp || 0;
            if (typeof rate === "object") rate = rate["#text"] || 0;
            const parsedMrp = parseFloat(String(rate).replace(/[^0-9.-]/g, "")) || itemMrp || 0;

            const barcode = `TL-${userId.toString().substring(18)}-${Math.floor(100000 + Math.random() * 900000)}`;

            finalMedicines.push({
              name: itemName,
              batch: batchNo,
              expiryDate: expDate,
              quantity: parsedQty,
              mrp: parsedMrp || 10, // Fallback MRP
              purchasePrice: itemPurchasePrice || parsedMrp * 0.7, // Estimate purchase if missing
              distributor: "Tally Imported Supplier",
              billNumber: "TALLY-IMPORT",
              purchaseDate: new Date(),
              barcodeId: barcode,
              userId
            });
          }
        } else {
          // If no batch allocation, create a default batch from opening balance
          let openingBal = stock.OPENINGBALANCE || 0;
          if (typeof openingBal === "object") openingBal = openingBal["#text"] || 0;
          const parsedQty = Math.abs(parseFloat(String(openingBal).replace(/[^0-9.-]/g, ""))) || 0;

          const barcode = `TL-${userId.toString().substring(18)}-${Math.floor(100000 + Math.random() * 900000)}`;
          
          finalMedicines.push({
            name: itemName,
            batch: "BATCH-1",
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default 1 year
            quantity: parsedQty,
            mrp: itemMrp || 10,
            purchasePrice: itemPurchasePrice || itemMrp * 0.7,
            distributor: "Tally Imported Supplier",
            billNumber: "TALLY-IMPORT",
            purchaseDate: new Date(),
            barcodeId: barcode,
            userId
          });
        }
      }

      // Dry run simulation mode: return result details immediately without saving
      if (dryRun) {
        return NextResponse.json({
          success: true,
          dryRun: true,
          logs,
          counts: {
            customers: finalCustomers.length,
            distributors: finalDistributors.length,
            medicines: finalMedicines.length
          },
          preview: {
            customers: finalCustomers.slice(0, 5),
            distributors: finalDistributors.slice(0, 5),
            medicines: finalMedicines.slice(0, 5)
          }
        });
      }

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
        message: `Successfully synchronized data from TallyPrime!`,
        counts: dbCounts
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action type." }, { status: 400 });

  } catch (error) {
    console.error("Tally Sync general API Error:", error);
    return NextResponse.json({
      success: false,
      error: "An internal server error occurred while performing Tally integration.",
      details: error.message
    }, { status: 500 });
  }
}
