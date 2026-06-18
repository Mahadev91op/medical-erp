import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Customer from "@/models/Customer";
import Distributor from "@/models/Distributor";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const genericPrompts = [
  { label: "Today's Sales Report", query: "sales" },
  { label: "Yesterday's Sales Report", query: "yesterday sales" },
  { label: "Low Stock Inventory Alerts", query: "stock" },
  { label: "Near Expiry Stock Warnings", query: "expiry" },
  { label: "Outstanding Dues (Credit Book)", query: "udhar" },
  { label: "Distributors List", query: "distributors" },
  { label: "Logged in Devices & Sessions", query: "active devices" },
  { label: "Total Inventory Valuation", query: "inventory value" },
  { label: "Latest Sale Invoice Details", query: "latest invoice" }
];

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim().toLowerCase();

    if (q.length < 2) {
      // Return static matching suggestions when query is empty or too short (1 character)
      // to avoid running heavy database queries
      const matchedPrompts = q
        ? genericPrompts.filter(p => 
            p.label.toLowerCase().includes(q) || p.query.toLowerCase().includes(q)
          )
        : genericPrompts;
      return NextResponse.json({
        success: true,
        suggestions: matchedPrompts.slice(0, 5)
      });
    }

    await connectToDatabase();
    const regex = new RegExp(escapeRegex(q), "i");

    // Run searches in parallel
    const [medicines, customers, distributors] = await Promise.all([
      Medicine.find({ userId, name: regex }).select("name").limit(3).lean(),
      Customer.find({ userId, name: regex }).select("name").limit(2).lean(),
      Distributor.find({ userId, name: regex }).select("name").limit(2).lean()
    ]);

    const suggestions = [];

    // 1. Add matched medicines
    medicines.forEach(m => {
      suggestions.push({
        type: "medicine",
        label: `📦 Medicine: ${m.name}`,
        query: `${m.name} details`
      });
    });

    // 2. Add matched customers
    customers.forEach(c => {
      suggestions.push({
        type: "customer",
        label: `👤 Customer: ${c.name}`,
        query: `${c.name} balance`
      });
    });

    // 3. Add matched distributors
    distributors.forEach(d => {
      suggestions.push({
        type: "distributor",
        label: `🚛 Vendor: ${d.name}`,
        query: `${d.name} details`
      });
    });

    // 4. Add generic prompts matching the text
    const matchedPrompts = genericPrompts.filter(p => 
      p.label.toLowerCase().includes(q) || p.query.toLowerCase().includes(q)
    );
    
    matchedPrompts.forEach(p => {
      suggestions.push({
        type: "prompt",
        label: `💡 Query: ${p.label}`,
        query: p.query
      });
    });

    return NextResponse.json({
      success: true,
      suggestions: suggestions.slice(0, 8) // Return max 8 total suggestions
    });

  } catch (error) {
    console.error("Autocomplete API error:", error);
    return NextResponse.json({ success: false, suggestions: [] });
  }
}
