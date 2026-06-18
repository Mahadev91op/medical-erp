import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import Distributor from "@/models/Distributor";
import Customer from "@/models/Customer";
import ActiveSession from "@/models/ActiveSession";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

const stopwords = new Set([
  "ka", "ki", "ke", "ko", "se", "ne", "me", "mein", "par", "pe", "hai", "hain", "tha", "thi", "the", "ho", "gaya", "gayi", "hoga", "hogi", "kya", "kab", "kaun", "kiska", "kiski", "kiske", "kisme", "kaha", "kahang", "kidhar", "kaise", "kitna", "kitni", "kitne", "kyun", "kyu", "kisi", "kise", "aur", "ya", "toh", "to", "bhi", "hi", "he", "she", "it", "they", "we", "i", "you", "me", "my", "our", "your", "his", "her", "their", "this", "that", "these", "those", "is", "am", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "can", "could", "will", "would", "shall", "should", "may", "might", "must", "about", "above", "below", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now", "dawai", "medicine", "medicines", "details", "info", "information", "detail", "batao", "dikhao", "dikhaye", "karo", "please", "bataiye", "karke", "batao", "dedo", "milega", "kahan"
]);

const genericKeywords = new Set([
  "sales", "sale", "revenue", "collection", "earning", "earnings", "income", 
  "today", "yesterday", "tomorrow", "week", "weekly", "month", "monthly", "year", "yearly", 
  "best", "top", "most", "sold", "selling", "low", "stock", "quantity", "qty", "shortage", 
  "expiry", "expire", "expired", "alert", "alerts", "udhar", "udhaar", "udhaari", "debt", 
  "debts", "debtor", "debtors", "balance", "balances", "dues", "outstanding", "credit", "credits", 
  "khata", "book", "distributor", "distributors", "supplier", "suppliers", "vendor", "vendors", 
  "list", "all", "show", "get", "view", "find", "search", "details", "detail", "info", "information", 
  "about", "aaj", "kal", "hafta", "mahina", "mahine", "maheene", "saal", "dawai", "dawaai", "dawayi", 
  "dawayan", "bika", "bikne", "khatam", "khatm", "hatao", "badlo", "paise", "paisa", "rupey", "rupees", 
  "rupiya", "len", "den", "dena", "lena", "number", "phone", "contact", "address", "location", "who", "what",
  "baki", "baaki", "bacha", "bachi", "left", "session", "sessions", "device", "devices", "login", "logins",
  "online", "offline", "active", "connected", "valuation", "value", "profit", "margin", "cost", "investment",
  "invoice", "invoices", "bill", "bills", "latest", "recent", "last", "barcode", "barcodes", "inventory"
]);

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const getISTDateRange = (type) => {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const nowIST = new Date(now.getTime() + istOffset);

  let start = new Date(nowIST);
  let end = new Date(nowIST);

  if (type === "today") {
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
  } else if (type === "yesterday") {
    start.setDate(start.getDate() - 1);
    start.setUTCHours(0, 0, 0, 0);
    end.setDate(end.getDate() - 1);
    end.setUTCHours(23, 59, 59, 999);
  } else if (type === "week") {
    start.setDate(start.getDate() - 7);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
  } else if (type === "month") {
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    end.setUTCHours(23, 59, 59, 999);
  }

  const startUTC = new Date(start.getTime() - istOffset);
  const endUTC = new Date(end.getTime() - istOffset);

  return { start: startUTC, end: endUTC };
};

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ success: false, reply: "Your message is empty. How can I help you?" });
    }

    const cleanMsg = message.trim();
    
    // Security / Write command block
    const writePattern = /(delete|remove|update|change|insert|add|modify|set|edit|create|save|mitao|badlo|hatao)/i;
    if (writePattern.test(cleanMsg) && /(price|quantity|mrp|medicine|stock|distributor|customer|balance)/i.test(cleanMsg)) {
      return NextResponse.json({
        success: true,
        reply: "⚠️ **Security Restriction:** You requested database modification. I operate on a **strict read-only database engine** and do not have write access. Please ask me about sales, stock levels, near expiry medicines, or outstanding balances!"
      });
    }

    // Tokenization and keyword extraction
    const rawWords = cleanMsg.toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ")
      .split(/\s+/);
    
    const keywords = rawWords.filter(w => w.length >= 3 && !stopwords.has(w));
    
    // Determine if we should perform entity search (e.g. at least one non-generic word exists)
    const nonGenericKeywords = keywords.filter(kw => !genericKeywords.has(kw));
    const shouldSearchEntities = nonGenericKeywords.length > 0;

    // 1. SEARCH SPECIFIC ENTITY FIRST (If any non-generic query words are present)
    if (shouldSearchEntities) {
      const keywordRegexes = nonGenericKeywords.map(kw => new RegExp(escapeRegex(kw), "i"));

      const [matchedMeds, matchedCusts, matchedDists] = await Promise.all([
        Medicine.find({ userId, name: { $in: keywordRegexes } }).limit(5).lean(),
        Customer.find({ userId, name: { $in: keywordRegexes } }).limit(3).lean(),
        Distributor.find({ userId, name: { $in: keywordRegexes } }).limit(3).lean()
      ]);

      // Handle Customer Lookups
      if (matchedCusts.length > 0) {
        const cust = matchedCusts[0];
        
        // Find latest invoice of this customer
        const custSale = await Sale.findOne({ userId, $or: [{ customerName: cust.name }, { customerPhone: cust.phone }] }).sort({ date: -1 }).lean();
        let invoiceText = "";
        if (custSale) {
          invoiceText = `\n🧾 **Latest Bill:** Invoice [${custSale._id.toString().slice(-6)}] on ${new Date(custSale.date).toLocaleDateString("en-IN")} - Paid: **₹${custSale.totalAmount.toFixed(2)}** (${custSale.paymentMethod})`;
        }

        const lastTrans = cust.transactions && cust.transactions.length > 0 
          ? cust.transactions[cust.transactions.length - 1]
          : null;
        
        let transText = lastTrans 
          ? `Last Credit transaction: **${lastTrans.type}** of **₹${lastTrans.amount}** on ${new Date(lastTrans.date).toLocaleDateString("en-IN")}`
          : "No credit book transactions recorded yet.";

        return NextResponse.json({
          success: true,
          reply: `👤 **Customer Found:** **${cust.name}**\n\n` +
                 `- **Phone Number:** ${cust.phone}\n` +
                 `- **Outstanding Balance:** **₹${cust.balance.toFixed(2)}** ${cust.balance > 0 ? '(Pending payment)' : '(Cleared)'}\n` +
                 `- **Credit Limit allowed:** ₹${cust.creditLimit || 10000}\n` +
                 `- **Promise to Pay Date:** ${cust.promiseDate ? new Date(cust.promiseDate).toLocaleDateString("en-IN") : 'Not set'}\n` +
                 `${invoiceText}\n` +
                 `- *${transText}*`
        });
      }

      // Handle Distributor Lookups
      if (matchedDists.length > 0) {
        const dist = matchedDists[0];
        
        // Detailed metrics of distributor: spend cost, unique bills
        const distMedicines = await Medicine.find({ userId, distributor: dist.name }).lean();
        
        let spendText = "";
        let medList = "";
        
        if (distMedicines.length > 0) {
          const totalSpent = distMedicines.reduce((sum, m) => sum + ((m.purchasePrice || m.mrp) * m.quantity), 0);
          const totalItems = distMedicines.reduce((sum, m) => sum + m.quantity, 0);
          const uniqueBills = [...new Set(distMedicines.map(m => m.billNumber).filter(Boolean))];
          
          spendText = `- **Total Stock Investment:** ₹${totalSpent.toFixed(2)}\n` +
                      `- **Total Units Purchased:** ${totalItems} units\n` +
                      `- **Purchase Invoices/Bills:** ${uniqueBills.length > 0 ? uniqueBills.join(", ") : "None"}\n`;
                      
          medList = "\n📦 **Supplied Medicines currently in stock:**\n" + 
                    distMedicines.slice(0, 5).map(m => `- **${m.name}** (Qty: ${m.quantity}, MRP: ₹${m.mrp})`).join("\n") +
                    (distMedicines.length > 5 ? `\n*(And ${distMedicines.length - 5} more medicines...)*` : "");
        } else {
          spendText = "- **Total Stock Investment:** ₹0.00\n";
          medList = "\n📦 No active medicines from this supplier currently in inventory.";
        }

        return NextResponse.json({
          success: true,
          reply: `🚛 **Distributor Details:** **${dist.name}**\n\n` +
                 `- **Phone/Mobile:** ${dist.phone || 'N/A'}\n` +
                 `- **Address:** ${dist.address || 'N/A'}\n` +
                 `${spendText}` +
                 `${medList}`
        });
      }

      // Handle Medicine Lookups
      if (matchedMeds.length > 0) {
        const med = matchedMeds[0];
        const expDate = new Date(med.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" });

        const isBarcodeQ = /(barcode|scanner|barcode\s*id|number)/i.test(cleanMsg);
        const isDistributorQ = /(distributor|supplier|vendor|kis\s*se|buy|purchase\s*from)/i.test(cleanMsg);
        const isPriceQ = /(price|mrp|cost|kharid|purchase\s*price)/i.test(cleanMsg);
        const isExpiryQ = /(expire|expiry|expiry\s*date|kab\s*expire)/i.test(cleanMsg);
        const isQuantityQ = /(quantity|qty|stock|kitna\s*bacha|stock\s*left|left)/i.test(cleanMsg);

        if (isBarcodeQ && !isPriceQ && !isExpiryQ && !isQuantityQ) {
          return NextResponse.json({
            success: true,
            reply: `🏷️ **Barcode ID of ${med.name}:**\n` +
                   `The Barcode Number for **${med.name}** (Batch: ${med.batch}) is **${med.barcodeId}**.`
          });
        }
        if (isDistributorQ) {
          return NextResponse.json({
            success: true,
            reply: `📦 **Supplier of ${med.name}:**\n` +
                   `Medicine **${med.name}** (Batch: ${med.batch}) is supplied by vendor **${med.distributor}**.`
          });
        }
        if (isPriceQ) {
          return NextResponse.json({
            success: true,
            reply: `💰 **Pricing details for ${med.name} (Batch: ${med.batch}):**\n\n` +
                   `- **MRP (Retail Price):** ₹${med.mrp.toFixed(2)}\n` +
                   `- **Purchase Cost Price:** ₹${(med.purchasePrice || 0).toFixed(2)}`
          });
        }
        if (isExpiryQ) {
          return NextResponse.json({
            success: true,
            reply: `⏳ **Expiry of ${med.name}:**\n` +
                   `Medicine **${med.name}** (Batch: ${med.batch}) will expire on **${expDate}**.`
          });
        }
        if (isQuantityQ) {
          return NextResponse.json({
            success: true,
            reply: `📦 **Stock details for ${med.name}:**\n` +
                   `Currently **${med.quantity}** units of **${med.name}** (Batch: ${med.batch}) are available in stock.`
          });
        }

        // Default: Full Medicine Details
        return NextResponse.json({
          success: true,
          reply: `📦 **Medicine Details Found:**\n\n` +
                 `- **Name:** **${med.name}**\n` +
                 `- **Batch Number:** ${med.batch}\n` +
                 `- **Stock Quantity:** **${med.quantity}** units\n` +
                 `- **MRP (Retail Price):** ₹${med.mrp.toFixed(2)}\n` +
                 `- **Purchase Price:** ₹${(med.purchasePrice || 0).toFixed(2)}\n` +
                 `- **Expiry Date:** **${expDate}**\n` +
                 `- **Barcode ID:** \`${med.barcodeId}\`\n` +
                 `- **Distributor:** **${med.distributor}**\n` +
                 `- **Purchase Invoice / Bill:** ${med.billNumber || 'N/A'}`
        });
      }
    }

    // 2. GENERIC INTENTS

    // A. Active Sessions / Logged in Devices
    if (/(device|session|login|online|logged)/i.test(cleanMsg)) {
      const activeSessions = await ActiveSession.find({ userId, status: "active" }).sort({ lastActive: -1 }).lean();

      if (activeSessions.length === 0) {
        return NextResponse.json({
          success: true,
          reply: "📱 **Connected Devices:**\nNo active login sessions recorded. (This session is authenticated dynamically)."
        });
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      let listRows = activeSessions.map((s, idx) => {
        const isOnline = new Date(s.lastActive) > fiveMinutesAgo;
        const statusDot = isOnline ? "🟢 Online" : "🟡 Inactive";
        const timeStr = new Date(s.lastActive).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit' });
        return `| ${idx+1}. **${s.os}** | ${s.browser} | ${s.deviceType} | ${s.ipAddress || 'Local'} | ${statusDot} (Active: ${timeStr}) |`;
      }).join("\n");

      return NextResponse.json({
        success: true,
        reply: `📱 **Active Login Devices & Sessions:**\n\n` +
               `- **Total Logged-in Devices:** ${activeSessions.length}\n` +
               `- **Online Devices (Active within last 5 mins):** ${activeSessions.filter(s => new Date(s.lastActive) > fiveMinutesAgo).length}\n\n` +
               `| OS / Platform | Browser | Device Type | IP Address | Status |\n` +
               `| :--- | :--- | :--- | :--- | :--- |\n` +
               `${listRows}`
      });
    }

    // B. Inventory Valuation
    if (/(valuation|value|margin|profit|inventory)/i.test(cleanMsg)) {
      const meds = await Medicine.find({ userId }).select("quantity mrp purchasePrice name").lean();

      if (meds.length === 0) {
        return NextResponse.json({
          success: true,
          reply: "📊 **Inventory Valuation:**\nYour inventory is empty. No medicines registered."
        });
      }

      const uniqueMeds = meds.length;
      const totalQuantity = meds.reduce((sum, m) => sum + m.quantity, 0);
      const totalMRPVal = meds.reduce((sum, m) => sum + (m.mrp * m.quantity), 0);
      const totalCostVal = meds.reduce((sum, m) => sum + ((m.purchasePrice || m.mrp) * m.quantity), 0);
      const netProfitMargin = totalMRPVal - totalCostVal;
      const avgMarginPercent = totalMRPVal > 0 ? (netProfitMargin / totalMRPVal) * 100 : 0;

      return NextResponse.json({
        success: true,
        reply: `📊 **MedERP Inventory Valuation (Real-Time):**\n\n` +
               `- **Total Unique Products:** ${uniqueMeds} medicines\n` +
               `- **Total Stock in Hand:** ${totalQuantity} units\n\n` +
               `- **Total Stock Value (MRP):** **₹${totalMRPVal.toFixed(2)}** *(Expected Revenue)*\n` +
               `- **Total Cost Value (Purchase Price):** **₹${totalCostVal.toFixed(2)}** *(Net Investment)*\n` +
               `- **Expected Profit Margin:** **₹${netProfitMargin.toFixed(2)}** *(Margin: ${avgMarginPercent.toFixed(1)}%)*`
      });
    }

    // C. Invoice details / Sale Lookup
    if (/(invoice|bill|latest\s*sale|recent\s*sale|last\s*bill|last\s*sale)/i.test(cleanMsg)) {
      // Find latest sale invoice
      const latestSale = await Sale.findOne({ userId }).sort({ date: -1 }).lean();

      if (!latestSale) {
        return NextResponse.json({
          success: true,
          reply: "🧾 **Invoice Check:** No sales transactions found in the system."
        });
      }

      const formattedDate = new Date(latestSale.date).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      
      let itemsTable = latestSale.items.map(item => 
        `| ${item.name} | ${item.quantity} | ₹${item.mrp.toFixed(2)} | ₹${item.total.toFixed(2)} |`
      ).join("\n");

      return NextResponse.json({
        success: true,
        reply: `🧾 **Latest Invoice Details:**\n\n` +
               `- **Invoice ID / Invoice Ref:** \`${latestSale._id}\`\n` +
               `- **Date & Time (IST):** ${formattedDate}\n` +
               `- **Customer Name:** ${latestSale.customerName || "Walk-in Customer"}\n` +
               `- **Customer Phone:** ${latestSale.customerPhone || "N/A"}\n` +
               `- **Payment Method:** **${latestSale.paymentMethod}**\n\n` +
               `| Item Name | Qty | MRP | Total |\n` +
               `| :--- | :--- | :--- | :--- |\n` +
               `${itemsTable}\n\n` +
               `- **Subtotal Amount:** ₹${(latestSale.totalAmount + (latestSale.totalDiscount || 0) - (latestSale.totalTax || 0)).toFixed(2)}\n` +
               `- **Discounts Given:** ₹${(latestSale.totalDiscount || 0).toFixed(2)}\n` +
               `- **Tax (GST):** ₹${(latestSale.totalTax || 0).toFixed(2)}\n` +
               `- **Total Bill Paid:** **₹${latestSale.totalAmount.toFixed(2)}**`
      });
    }

    // D. Outstanding Customer Debt (Udhaar Summary)
    if (/(udha+r|udha+ri|debt|debts|balance|outstanding|khata|dues|credit)/i.test(cleanMsg)) {
      const debtors = await Customer.find({ userId, balance: { $gt: 0 } }).sort({ balance: -1 }).lean();

      if (debtors.length === 0) {
        return NextResponse.json({
          success: true,
          reply: "🎉 **Credit Outstanding Status:**\nCongratulations! There are currently no outstanding customer dues in the Credit Book (Khata)."
        });
      }

      const totalBalance = debtors.reduce((sum, d) => sum + d.balance, 0);
      let listRows = debtors.slice(0, 5).map((d, i) => 
        `${i+1}. **${d.name}** (${d.phone}) - Outstanding: **₹${d.balance.toFixed(2)}**`
      ).join("\n");

      return NextResponse.json({
        success: true,
        reply: `📖 **Credit Book (Udhaar) Summary:**\n\n` +
               `- **Total Outstanding Dues:** **₹${totalBalance.toFixed(2)}**\n` +
               `- **Customers owing balance:** ${debtors.length}\n\n` +
               `🥇 **Top 5 Debtors (Highest Balance):**\n${listRows}`
      });
    }

    // E. Today's Sales
    if (/(aaj|today|current day).*(sale|bika|revenue|collection|earning|income|paise)/i.test(cleanMsg) || 
        /(sale|bika|revenue|collection|earning|income|paise).*(aaj|today)/i.test(cleanMsg) || 
        /^(today|sales|sale|revenue|earning|income)$/i.test(cleanMsg)) {
      
      const { start, end } = getISTDateRange("today");
      const sales = await Sale.find({ userId, date: { $gte: start, $lte: end } }).lean();

      if (sales.length === 0) {
        return NextResponse.json({
          success: true,
          reply: "📊 **Today's Sales Summary:**\nNo sales invoices have been recorded today yet."
        });
      }

      const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalDiscount = sales.reduce((sum, s) => sum + (s.totalDiscount || 0), 0);
      const paymentSummary = sales.reduce((acc, s) => {
        const method = s.paymentMethod || "Cash";
        acc[method] = (acc[method] || 0) + s.totalAmount;
        return acc;
      }, {});

      let paymentText = Object.entries(paymentSummary)
        .map(([method, amount]) => `- **${method}:** ₹${amount.toFixed(2)}`)
        .join("\n");

      return NextResponse.json({
        success: true,
        reply: `📊 **Today's Sales Summary:**\n\n` +
               `- **Total Sales Revenue:** **₹${totalRevenue.toFixed(2)}**\n` +
               `- **Total Invoices / Bills:** ${sales.length}\n` +
               `- **Total Discount Given:** ₹${totalDiscount.toFixed(2)}\n\n` +
               `💳 **Payment Mode Breakdown:**\n${paymentText}`
      });
    }

    // F. Yesterday's Sales
    if (/(kal|yesterday).*(sale|bika|revenue|collection|earning|income|paise)/i.test(cleanMsg) || 
        /(sale|bika|revenue|collection|earning|income|paise).*(kal|yesterday)/i.test(cleanMsg) ||
        /^(yesterday)$/i.test(cleanMsg)) {
      
      const { start, end } = getISTDateRange("yesterday");
      const sales = await Sale.find({ userId, date: { $gte: start, $lte: end } }).lean();

      if (sales.length === 0) {
        return NextResponse.json({
          success: true,
          reply: "📊 **Yesterday's Sales Summary:**\nNo sales invoices were recorded yesterday."
        });
      }

      const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
      const totalDiscount = sales.reduce((sum, s) => sum + (s.totalDiscount || 0), 0);
      const paymentSummary = sales.reduce((acc, s) => {
        const method = s.paymentMethod || "Cash";
        acc[method] = (acc[method] || 0) + s.totalAmount;
        return acc;
      }, {});

      let paymentText = Object.entries(paymentSummary)
        .map(([method, amount]) => `- **${method}:** ₹${amount.toFixed(2)}`)
        .join("\n");

      return NextResponse.json({
        success: true,
        reply: `📊 **Yesterday's Sales Summary:**\n\n` +
               `- **Total Sales Revenue:** **₹${totalRevenue.toFixed(2)}**\n` +
               `- **Total Invoices / Bills:** ${sales.length}\n` +
               `- **Total Discount Given:** ₹${totalDiscount.toFixed(2)}\n\n` +
               `💳 **Payment Mode Breakdown:**\n${paymentText}`
      });
    }

    // G. Weekly Sales
    if (/(week|hafta|hafte|is hafte).*(sale|bika|revenue|collection|earning|income|paise)/i.test(cleanMsg) || 
        /(sale|bika|revenue|collection|earning|income|paise).*(week|hafta|hafte)/i.test(cleanMsg) ||
        /^(week|weekly)$/i.test(cleanMsg)) {
      
      const { start, end } = getISTDateRange("week");
      const sales = await Sale.find({ userId, date: { $gte: start, $lte: end } }).lean();

      if (sales.length === 0) {
        return NextResponse.json({
          success: true,
          reply: "📊 **Weekly Sales Summary:**\nNo sales entries in the last 7 days."
        });
      }

      const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
      return NextResponse.json({
        success: true,
        reply: `📊 **Last 7 Days Sales Summary:**\n\n` +
               `- **Total Revenue:** **₹${totalRevenue.toFixed(2)}**\n` +
               `- **Total Bills Generated:** ${sales.length}\n` +
               `- **Average Ticket Size:** ₹${(totalRevenue / sales.length).toFixed(2)}`
      });
    }

    // H. Monthly Sales
    if (/(month|mahina|mahine|maheene|is mahine).*(sale|bika|revenue|collection|earning|income|paise)/i.test(cleanMsg) || 
        /(sale|bika|revenue|collection|earning|income|paise).*(month|mahina|mahine|maheene|is mahine)/i.test(cleanMsg) ||
        /^(month|monthly)$/i.test(cleanMsg)) {
      
      const { start, end } = getISTDateRange("month");
      const sales = await Sale.find({ userId, date: { $gte: start, $lte: end } }).lean();

      if (sales.length === 0) {
        return NextResponse.json({
          success: true,
          reply: "📊 **Monthly Sales Summary:**\nNo sales entries for this month yet."
        });
      }

      const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
      return NextResponse.json({
        success: true,
        reply: `📊 **Month-to-Date Sales Summary:**\n\n` +
               `- **Total Monthly Revenue:** **₹${totalRevenue.toFixed(2)}**\n` +
               `- **Total Bills:** ${sales.length}\n` +
               `- **Average Bill Value:** ₹${(totalRevenue / sales.length).toFixed(2)}`
      });
    }

    // I. Best/Top Selling Product
    if (/(most|sabse\s+jada|sabse\s+jyada|top|best|popular).*(sold|bika|bikne|sale|selling)/i.test(cleanMsg) ||
        /^(best|top|best\s*selling|top\s*selling)$/i.test(cleanMsg)) {
      
      let dateFilter = { userId };
      let timeLabel = "Overall";
      
      if (/today|aaj/i.test(cleanMsg)) {
        const { start, end } = getISTDateRange("today");
        dateFilter.date = { $gte: start, $lte: end };
        timeLabel = "Today";
      } else if (/yesterday|kal/i.test(cleanMsg)) {
        const { start, end } = getISTDateRange("yesterday");
        dateFilter.date = { $gte: start, $lte: end };
        timeLabel = "Yesterday";
      } else if (/month|mahina/i.test(cleanMsg)) {
        const { start, end } = getISTDateRange("month");
        dateFilter.date = { $gte: start, $lte: end };
        timeLabel = "This Month";
      }

      const topProducts = await Sale.aggregate([
        { $match: dateFilter },
        { $unwind: "$items" },
        { 
          $group: {
            _id: "$items.name",
            totalQty: { $sum: "$items.quantity" },
            totalRevenue: { $sum: "$items.total" }
          }
        },
        { $sort: { totalQty: -1 } },
        { $limit: 5 }
      ]);

      if (topProducts.length === 0) {
        return NextResponse.json({
          success: true,
          reply: `📈 **Top Selling Products (${timeLabel}):**\nNo sales recorded during this time period.`
        });
      }

      let listText = topProducts.map((p, idx) => 
        `${idx + 1}. **${p._id}** - Qty Sold: **${p.totalQty}** (Total Revenue: ₹${p.totalRevenue.toFixed(2)})`
      ).join("\n");

      return NextResponse.json({
        success: true,
        reply: `🔥 **Top 5 Best Selling Products (${timeLabel}):**\n\n${listText}`
      });
    }

    // J. Low Stock Alert
    if (/(low\s*stock|out\s*of\s*stock|khatam|khatm|stock\s*alert|kam\s*stock|shortage)/i.test(cleanMsg) ||
        /^(stock|low|shortage|low\s*stock)$/i.test(cleanMsg)) {
      
      const lowStockMedicines = await Medicine.find({ 
        userId, 
        quantity: { $lte: 10 } 
      }).sort({ quantity: 1 }).limit(10).lean();

      if (lowStockMedicines.length === 0) {
        return NextResponse.json({
          success: true,
          reply: "✅ **Stock Health Check:** Excellent! All medicines in your inventory are well-stocked (none are below 10 units)."
        });
      }

      let tableRows = lowStockMedicines.map(m => 
        `| ${m.name} | ${m.batch} | **${m.quantity}** | ₹${m.mrp.toFixed(2)} |`
      ).join("\n");

      return NextResponse.json({
        success: true,
        reply: `⚠️ **Low Stock Warning (Top 10 items):**\n\n` +
               `| Medicine Name | Batch | Quantity Left | Retail Price (MRP) |\n` +
               `| :--- | :--- | :--- | :--- |\n` +
               `${tableRows}\n\n` +
               `*We recommend placing restock orders soon.*`
      });
    }

    // K. Expiry Alerts
    if (/(expire|expiry|kharab|kharaab|expiry\s+list)/i.test(cleanMsg) ||
        /^(expiry|expire|expired)$/i.test(cleanMsg)) {
      
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      const expiringMedicines = await Medicine.find({
        userId,
        expiryDate: { $lte: threeMonthsFromNow, $gt: new Date() },
        quantity: { $gt: 0 }
      }).sort({ expiryDate: 1 }).limit(10).lean();

      if (expiringMedicines.length === 0) {
        return NextResponse.json({
          success: true,
          reply: "✅ **Expiry Health Check:** Great! No active stock items are expiring in the next 3 months."
        });
      }

      let tableRows = expiringMedicines.map(m => {
        const dateStr = new Date(m.expiryDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
        return `| ${m.name} | ${m.batch} | ${dateStr} | ${m.quantity} |`;
      }).join("\n");

      return NextResponse.json({
        success: true,
        reply: `⏳ **Near Expiry Alerts (Next 3 Months):**\n\n` +
               `| Medicine Name | Batch | Expiry Date | Stock Qty |\n` +
               `| :--- | :--- | :--- | :--- |\n` +
               `${tableRows}\n\n` +
               `*Consider returning these near-expiry items to the distributor.*`
      });
    }

    // L. Distributor list
    if (/(distributors?|supplier|vendor)s?\s*(list|saare|all|naam|names)/i.test(cleanMsg) ||
        /^(distributor|distributors|supplier|vendor)$/i.test(cleanMsg)) {
      
      const distributors = await Distributor.find({ userId }).sort({ name: 1 }).lean();

      if (distributors.length === 0) {
        return NextResponse.json({
          success: true,
          reply: "🚛 **Distributors:** You have no registered distributors in the system."
        });
      }

      let listText = distributors.map((d, idx) => 
        `- **${d.name}** | Phone: ${d.phone || 'N/A'} | Address: ${d.address || 'N/A'}`
      ).join("\n");

      return NextResponse.json({
        success: true,
        reply: `🚛 **Registered Distributors:**\n\n${listText}`
      });
    }

    // Default Fallback Help Info
    return NextResponse.json({
      success: true,
      reply: "🤔 **I couldn't quite match your request.** Here are some commands I understand:\n\n" +
             "1. **Sales Report:** Ask \`sales\`, \`today's revenue\`, or \`yesterday sales\`.\n" +
             "2. **Stock Health:** Ask \`stock\`, \`low stock\`, or check specific medicine details (e.g., \`Crocin details\`).\n" +
             "3. **Credit Book (Udhaar):** Ask \`udhar\`, \`outstanding dues\`, or check specific customer dues (e.g., \`Rohit outstanding\`).\n" +
             "4. **Valuation & Margin:** Ask \`inventory valuation\` or \`margin\`.\n" +
             "5. **Connected Sessions:** Ask \`devices\`, \`active logins\` or \`online status\`.\n" +
             "6. **Latest Invoices:** Ask \`latest sale\` or \`last bill\`.\n" +
             "7. **Vendors:** Ask \`distributors\`.\n\n" +
             "*Please enter clean medicine names or short keywords for instant reports!*"
    });

  } catch (error) {
    console.error("AI Assistant API error:", error);
    return NextResponse.json({ success: false, reply: "⚠️ Server encountered an error. Please try again shortly." });
  }
}
