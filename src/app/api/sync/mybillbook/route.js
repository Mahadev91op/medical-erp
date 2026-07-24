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

function parseExcelDate(val) {
  if (!val) return null;
  
  // If Excel serial number (days since 1900)
  if (typeof val === "number") {
    return new Date((val - 25569) * 86400 * 1000);
  }
  
  const parsed = Date.parse(String(val).trim());
  if (!isNaN(parsed)) return new Date(parsed);
  
  return null;
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
    
    // Check if JSON or Excel
    const isJson = file.name.endsWith(".json");
    
    if (isJson) {
      try {
        parsedData = JSON.parse(buffer.toString("utf8"));
      } catch (err) {
        return NextResponse.json({ success: false, error: "Invalid JSON format." }, { status: 400 });
      }
    } else {
      // Excel/CSV parse using pre-installed xlsx
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
      return NextResponse.json({ success: false, error: "Uploaded file is empty or formatted incorrectly." }, { status: 400 });
    }

    const importedMedicines = [];
    const importedCustomers = [];
    const importedDistributors = [];

    // Parse data dynamically based on myBillBook column structures
    if (importType === "items") {
      for (const row of parsedData) {
        // Map common item keys from myBillBook
        const name = row["Item Name"] || row["item_name"] || row["ItemName"] || row["Name"] || row["Name of Item"] || "";
        if (!name) continue;

        const qty = parseFloat(row["Stock Quantity"] || row["Stock"] || row["Opening Stock"] || row["qty"] || row["quantity"] || row["Stock Qty"]) || 0;
        const mrp = parseFloat(row["MRP"] || row["mrp"] || row["Sale Price"] || row["Price"]) || 10;
        const purchase = parseFloat(row["Purchase Price"] || row["purchase_price"] || row["PurchaseRate"]) || mrp * 0.7;
        const batch = String(row["Batch Number"] || row["Batch"] || row["BatchNo"] || "").trim() || "BATCH-1";
        
        let expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        const rawExpiry = row["Expiry Date"] || row["ExpiryDate"] || row["Expiry"] || row["exp"];
        if (rawExpiry) {
          const parsedExp = parseExcelDate(rawExpiry);
          if (parsedExp) expiryDate = parsedExp;
        }

        const barcode = `MB-${userId.toString().substring(18)}-${Math.floor(100000 + Math.random() * 900000)}`;

        importedMedicines.push({
          name,
          batch,
          expiryDate,
          quantity: Math.max(0, qty),
          mrp: mrp || 10,
          purchasePrice: purchase,
          distributor: "myBillBook Imported Supplier",
          billNumber: "MYBILLBOOK-IMPORT",
          purchaseDate: new Date(),
          barcodeId: barcode,
          userId
        });
      }
    } else if (importType === "parties") {
      for (const row of parsedData) {
        // Map common party keys from myBillBook
        const name = row["Party Name"] || row["name"] || row["PartyName"] || row["Customer Name"] || "";
        if (!name) continue;

        const phone = row["Phone Number"] || row["Phone"] || row["Mobile"] || row["mobile"] || "";
        const balance = parseFloat(row["Opening Balance"] || row["Balance"] || row["balance"] || row["Receivable Dues"]) || 0;
        const type = String(row["Party Type"] || row["Type"] || row["type"] || "").toLowerCase();

        const isSupplier = type.includes("supplier") || type.includes("vendor") || type.includes("creditor") || row["To Pay"] !== undefined;

        if (isSupplier) {
          importedDistributors.push({
            name,
            phone: phone ? String(phone).replace(/[^0-9]/g, "") : "",
            address: row["Address"] || "Imported from myBillBook",
            userId
          });
        } else {
          importedCustomers.push({
            name,
            phone: phone ? String(phone).replace(/[^0-9]/g, "") : generateRandomPhone(),
            balance,
            creditLimit: 15000,
            userId,
            transactions: balance !== 0 ? [{
              type: balance > 0 ? "Debt" : "Payment",
              amount: Math.abs(balance),
              date: new Date(),
              note: "Imported from myBillBook balance"
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

    // DB writes
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
      message: `Successfully imported ${importType} from myBillBook!`,
      counts: dbCounts
    });

  } catch (err) {
    console.error("myBillBook sync general failure:", err);
    return NextResponse.json({ success: false, error: "Internal server error occurred.", details: err.message }, { status: 500 });
  }
}
