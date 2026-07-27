import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const apiKey = process.env.GEMINI_API_KEY;
    
    // Check if key is available and looks valid (uncommented and set)
    if (apiKey && apiKey !== "" && !apiKey.startsWith("#")) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const filePart = {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: file.type || "application/pdf"
          }
        };

        const prompt = `Extract all medicine items from this distributor invoice.
Return a JSON array containing objects with these EXACT keys:
- name: string (clean medicine name like "Limcee Tablet", "Telma 40", "Pantocid 40mg")
- batch: string (batch number, default if not found is "B-GEN")
- expiryDate: string (expiry date in format "MM/YY", e.g., "05/27")
- quantity: number (quantity of packs/strips, default is 10)
- mrp: number (MRP price, default is 0)
- purchasePrice: number (purchase cost price, default is 0)
- hsnCode: string (HSN code, default is "3004")
- gstPercent: number (GST bracket rate in percent: 0, 5, 12, 18, or 28, default is 12)

Response must be pure JSON only, without any markdown formatting or code block wrappers.`;

        const result = await model.generateContent([prompt, filePart]);
        const responseText = result.response.text().trim();
        
        // Clean markdown code blocks from response if present
        let cleanJsonText = responseText;
        if (cleanJsonText.startsWith("```json")) {
          cleanJsonText = cleanJsonText.substring(7);
        } else if (cleanJsonText.startsWith("```")) {
          cleanJsonText = cleanJsonText.substring(3);
        }
        if (cleanJsonText.endsWith("```")) {
          cleanJsonText = cleanJsonText.substring(0, cleanJsonText.length - 3);
        }
        cleanJsonText = cleanJsonText.trim();

        const medicines = JSON.parse(cleanJsonText);
        
        if (Array.isArray(medicines)) {
          // Normalize ids
          const parsed = medicines.map((m, idx) => ({
            id: idx + 1,
            name: m.name || "Unnamed Medicine",
            batch: m.batch || "B-GEN",
            expiryDate: m.expiryDate || "12/26",
            quantity: Number(m.quantity || 10),
            mrp: Number(m.mrp || 0),
            purchasePrice: Number(m.purchasePrice || 0),
            hsnCode: m.hsnCode || "3004",
            gstPercent: Number(m.gstPercent || 12)
          }));

          return NextResponse.json({ success: true, medicines: parsed });
        }
      } catch (geminiError) {
        console.error("Gemini AI API call failed:", geminiError);
        return NextResponse.json({ success: false, error: geminiError.message || "Gemini AI extraction failed" }, { status: 500 });
      }
    } else {
      return NextResponse.json({ success: false, error: "GEMINI_API_KEY is not configured in your .env file" }, { status: 400 });
    }

  } catch (error) {
    console.error("OCR Scanner Endpoint error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
