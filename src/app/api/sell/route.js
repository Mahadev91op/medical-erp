import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";

export async function POST(req) {
  // Temporary bypass for local development to avoid "Unauthorized" blocking
  // const session = await getServerSession(authOptions);
  // if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectToDatabase();
    
    let calculatedTotal = 0;
    let newSaleId = null; 

    const { cartItems, paymentMethod = "Cash" } = await req.json();

    const saleItems = [];
    const savePromises = []; 

    // Saari medicines 1 hi baar me le aao
    const itemIds = cartItems.map(item => item._id);
    const medicinesInDb = await Medicine.find({ _id: { $in: itemIds } });

    const medMap = {};
    medicinesInDb.forEach(med => { medMap[med._id.toString()] = med; });

    for (let item of cartItems) {
      const med = medMap[item._id.toString()];
      
      if (!med) throw new Error(`${item.name} database me nahi mili!`);
      if (med.quantity < item.sellQuantity) throw new Error(`${item.name} ka stock kam hai! Available: ${med.quantity}`);

      med.quantity -= item.sellQuantity;
      
      // Stock update ko save array me daalo
      savePromises.push(med.save());

      const itemTotal = item.sellQuantity * (item.mrp || 0);
      calculatedTotal += itemTotal;

      saleItems.push({
        medicineId: med._id,
        name: med.name,
        quantity: item.sellQuantity,
        mrp: item.mrp || 0,
        total: itemTotal
      });
    }

    const newSale = new Sale({
      items: saleItems,
      totalAmount: calculatedTotal,
      paymentMethod
    });
    
    savePromises.push(newSale.save());

    // Ek sath parallel database me update
    await Promise.all(savePromises);
    newSaleId = newSale._id; 

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