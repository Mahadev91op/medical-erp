import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Customer from "@/models/Customer";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyUser } from "@/lib/verifyUser";

export const dynamic = 'force-dynamic';

export async function GET(req) {
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

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";

    await connectToDatabase();
    
    let query = { userId };
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    // Scale-optimized query to handle 100,000+ customer records cleanly
    const customers = await Customer.find(query)
      .sort({ name: 1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, customers });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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

    await connectToDatabase();
    const body = await req.json();

    // Case 1: Record Repayment / Jama
    if (body.customerId && body.action === "repayment") {
      const { customerId, amount, note = "", saleId = null } = body;
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
      }

      const customer = await Customer.findOne({ _id: customerId, userId });
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      if (parsedAmount > customer.balance) {
        return NextResponse.json({ error: `Payment amount cannot exceed outstanding dues of ₹${customer.balance}` }, { status: 400 });
      }

      customer.balance -= parsedAmount;
      customer.transactions.push({
        type: "Payment",
        amount: parsedAmount,
        date: new Date(),
        saleId: saleId || undefined,
        note: note || "Payment Received"
      });

      await customer.save();
      return NextResponse.json({ success: true, customer });
    }

    // Case 2: Record Custom Debt / Adjustment
    if (body.customerId && body.action === "debt") {
      const { customerId, amount, note = "" } = body;
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        return NextResponse.json({ error: "Invalid debt amount" }, { status: 400 });
      }

      const customer = await Customer.findOne({ _id: customerId, userId });
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      customer.balance += parsedAmount;
      customer.transactions.push({
        type: "Debt",
        amount: parsedAmount,
        date: new Date(),
        note: note || "Custom Credit / Adjustment"
      });

      await customer.save();
      return NextResponse.json({ success: true, customer });
    }

    // Case 3: Update Credit Limit
    if (body.customerId && body.action === "updateLimit") {
      const { customerId, limit } = body;
      const parsedLimit = parseFloat(limit);
      if (isNaN(parsedLimit) || parsedLimit < 0) {
        return NextResponse.json({ error: "Invalid credit limit" }, { status: 400 });
      }

      const customer = await Customer.findOne({ _id: customerId, userId });
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      customer.creditLimit = parsedLimit;
      await customer.save();
      return NextResponse.json({ success: true, customer });
    }

    // Case 4: Update Repayment Promise Date
    if (body.customerId && body.action === "updatePromiseDate") {
      const { customerId, promiseDate } = body;

      const customer = await Customer.findOne({ _id: customerId, userId });
      if (!customer) {
        return NextResponse.json({ error: "Customer not found" }, { status: 404 });
      }

      customer.promiseDate = promiseDate ? new Date(promiseDate) : null;
      await customer.save();
      return NextResponse.json({ success: true, customer });
    }

    // Case 2: Create a New Customer
    const { name, phone } = body;
    if (!name || !phone) {
      return NextResponse.json({ error: "Name and Phone are required" }, { status: 400 });
    }

    // Check if customer already exists for this shop owner
    const existingCustomer = await Customer.findOne({ userId, phone });
    if (existingCustomer) {
      return NextResponse.json({ success: true, customer: existingCustomer, alreadyExists: true });
    }

    const newCustomer = new Customer({
      name,
      phone,
      userId,
      balance: 0,
      transactions: []
    });

    await newCustomer.save();
    return NextResponse.json({ success: true, customer: newCustomer });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
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

    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId");
    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
    }

    await connectToDatabase();
    const result = await Customer.deleteOne({ _id: customerId, userId });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Customer not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Customer profile deleted successfully!" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
