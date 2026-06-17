import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { verifyUser } from "@/lib/verifyUser";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const verification = await verifyUser(userId, session.user.role);
  if (!verification.success) {
    return NextResponse.json({ error: verification.error }, { status: 403 });
  }

  try {
    await connectToDatabase();
    
    let calculatedTotal = 0;
    let newSaleId = null; 

    const { 
      cartItems, 
      paymentMethod = "Cash", 
      customerName = "", 
      customerPhone = "",
      prescriptionDetail = { doctorName: "", doctorRegNo: "", patientAge: null, patientGender: "" }
    } = await req.json();

    // Saari medicines 1 hi baar me le aao
    const itemIds = cartItems.map(item => item._id);
    const medicinesInDb = await Medicine.find({ _id: { $in: itemIds }, userId });

    const medMap = {};
    medicinesInDb.forEach(med => { medMap[med._id.toString()] = med; });

    const saleItems = [];
    const decrementedItems = []; // Track updates to rollback if something fails
    let totalDiscount = 0;
    let totalTax = 0;

    try {
      for (let item of cartItems) {
        const med = medMap[item._id.toString()];
        
        if (!med) throw new Error(`${item.name} not found in database!`);
        if (med.quantity < item.sellQuantity) {
          throw new Error(`${item.name} has insufficient stock! Available: ${med.quantity}`);
        }

        // Atomic stock update to prevent race conditions
        const res = await Medicine.updateOne(
          { _id: med._id, userId, quantity: { $gte: item.sellQuantity } },
          { $inc: { quantity: -item.sellQuantity } }
        );
        
        if (res.modifiedCount === 0) {
          throw new Error(`${item.name} has insufficient stock or update failed!`);
        }

        // Track for rollback
        decrementedItems.push({
          medicineId: med._id,
          quantity: item.sellQuantity
        });

        const discountPercent = Number(item.discountPercent || 0);
        const gstPercent = Number(item.gstPercent || 0);
        const itemMrp = item.mrp || 0;
        
        const discountedMrp = itemMrp * (1 - discountPercent / 100);
        const itemTotal = item.sellQuantity * discountedMrp;
        calculatedTotal += itemTotal;

        // Extract tax details
        const taxableAmount = itemTotal / (1 + gstPercent / 100);
        const itemTax = itemTotal - taxableAmount;
        totalTax += itemTax;
        
        const cgstAmount = itemTax / 2;
        const sgstAmount = itemTax / 2;
        
        totalDiscount += (itemMrp * item.sellQuantity) - itemTotal;

        saleItems.push({
          medicineId: med._id,
          name: med.name,
          quantity: item.sellQuantity,
          mrp: itemMrp,
          purchasePrice: med.purchasePrice || 0,
          total: itemTotal,
          discountPercent,
          gstPercent,
          taxableAmount,
          cgstAmount,
          sgstAmount
        });
      }

      // Save the sale
      const newSale = new Sale({
        items: saleItems,
        totalAmount: calculatedTotal,
        paymentMethod,
        userId,
        customerName,
        customerPhone,
        prescriptionDetail,
        totalDiscount,
        totalTax
      });
      
      await newSale.save();
      newSaleId = newSale._id; 

    } catch (innerError) {
      // Rollback any stock that was already decremented
      for (let roll of decrementedItems) {
        try {
          await Medicine.updateOne(
            { _id: roll.medicineId, userId },
            { $inc: { quantity: roll.quantity } }
          );
        } catch (rollbackErr) {
          console.error("Rollback failed for medicine:", roll.medicineId, rollbackErr);
        }
      }
      throw innerError; // Rethrow to outer try-catch block
    }

    return NextResponse.json({ 
      success: true, 
      message: "Sale Complete! Bill saved.", 
      saleId: newSaleId,
      totalAmount: calculatedTotal
    });

  } catch (error) {
    console.error("Sell API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}