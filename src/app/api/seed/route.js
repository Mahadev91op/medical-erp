import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Medicine from "@/models/Medicine";
import Sale from "@/models/Sale";

export async function GET(req) {
    try {
        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        // Default 2000 data banega, aap URL me ?count=5000 lagakar change bhi kar sakte hain
        const count = parseInt(searchParams.get("count")) || 2000;

        // Realistic Medical Data Dummy Arrays
        const medNames = ["Paracetamol", "Azithromycin", "Amoxicillin", "Cefixime", "Pantoprazole", "Rabeprazole", "Domperidone", "Diclofenac", "Levocetirizine", "Montelukast", "Telmisartan", "Metformin", "Amlodipine", "Atorvastatin", "Rosuvastatin", "Glimepiride", "Ibuprofen", "Vitamin C", "Zincovit", "Dolo", "Calpol", "Cheston Cold"];
        const distributors = ["Cipla", "Sun Pharma", "Mankind", "Macleods", "Lupin", "Alkem", "Intas", "Torrent", "Zydus", "Dr. Reddy's"];
        const paymentMethods = ["Cash", "UPI", "Card"];

        const medicinesToInsert = [];
        
        // 1. Generate Fake Medicines
        for (let i = 0; i < count; i++) {
            const randomName = medNames[Math.floor(Math.random() * medNames.length)];
            const mg = [100, 250, 500, 650][Math.floor(Math.random() * 4)];

            // Random Expiry: Kuch expire hone wali hain (Alert check karne ke liye), kuch 2 saal baad hongi
            const today = new Date();
            const expiry = new Date();
            expiry.setDate(today.getDate() + (Math.floor(Math.random() * 800) - 15)); 

            const purchase = new Date();
            purchase.setDate(today.getDate() - Math.floor(Math.random() * 100));

            // Random Stock: Kuch 0 hongi (Out of stock test), kuch < 10 (Low stock test)
            const qty = Math.floor(Math.random() * 150); 
            const mrp = Math.floor(Math.random() * 500) + 15;

            medicinesToInsert.push({
                name: `${randomName} ${mg}mg`,
                batch: `B-${Math.floor(Math.random() * 90000) + 10000}`,
                expiryDate: expiry,
                quantity: qty,
                mrp: mrp,
                distributor: distributors[Math.floor(Math.random() * distributors.length)],
                billNumber: `INV-${Math.floor(Math.random() * 9000) + 1000}`,
                purchaseDate: purchase,
                barcodeId: `MED-${Date.now()}-${i}-${Math.floor(Math.random() * 10000)}`
            });
        }

        // Fast bulk insert using Mongoose
        const insertedMeds = await Medicine.insertMany(medicinesToInsert);

        // 2. Generate Fake Sales for Dashboard Graph (Pichle 7 din ka revenue test)
        const salesToInsert = [];
        for(let i = 0; i < 300; i++) {
            const saleItemsCount = Math.floor(Math.random() * 4) + 1; // Har bill me 1 se 4 dawa
            const saleItems = [];
            let totalAmount = 0;

            for(let j = 0; j < saleItemsCount; j++) {
                const randomMed = insertedMeds[Math.floor(Math.random() * insertedMeds.length)];
                const sellQty = Math.floor(Math.random() * 5) + 1;
                const itemTotal = sellQty * randomMed.mrp;
                totalAmount += itemTotal;

                saleItems.push({
                    medicineId: randomMed._id,
                    name: randomMed.name,
                    quantity: sellQty,
                    mrp: randomMed.mrp,
                    total: itemTotal
                });
            }

            // Pichle 7 din me se koi bhi random din
            const saleDate = new Date();
            saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 7));

            salesToInsert.push({
                items: saleItems,
                totalAmount: totalAmount,
                paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
                date: saleDate
            });
        }

        await Sale.insertMany(salesToInsert);

        return NextResponse.json({
            success: true,
            message: `🎉 BINGO! ${count} Medicines aur 300 Sales ka demo data database mein daal diya gaya hai! Ab apna Dashboard check karo.`
        });

    } catch (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}