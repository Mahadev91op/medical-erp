import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import fs from "fs";

const execPromise = util.promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Asli backup folder ka path jahan database save hua tha
        const backupFolder = "D:\\MedicalBackup\\medical-erp"; 

        if (!fs.existsSync(backupFolder)) {
             return NextResponse.json({ 
                 success: false, 
                 error: "Backup folder nahi mila! Pehle backup save kijiye." 
             }, { status: 400 });
        }

        // 🚀 SMART LOGIC: '--drop' ka matlab hai pehle current data ko saaf karo, phir backup dalo
        const command = `mongorestore --uri="mongodb://127.0.0.1:27017/medical-erp" --drop "${backupFolder}"`;
        
        try {
            const { stdout, stderr } = await execPromise(command);
            return NextResponse.json({ 
                success: true, 
                message: `🎉 JADU! Purana Data successfully wapas aa gaya hai!`,
                debug: stderr
            });
        } catch (err) {
            // Agar normal command fail ho toh path wali command chalayega
            const mongorestorePath = `"C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongorestore.exe"`;
            const fallbackCommand = `${mongorestorePath} --uri="mongodb://127.0.0.1:27017/medical-erp" --drop "${backupFolder}"`;
            
            const { stdout, stderr } = await execPromise(fallbackCommand);
            return NextResponse.json({ 
                success: true, 
                message: `🎉 JADU! Purana Data successfully wapas aa gaya hai!`,
                debug: stderr
            });
        }

    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            error: "Restore fail ho gaya! Server error.",
            details: error.message,
            stderr: error.stderr || "Koi output nahi"
        }, { status: 500 });
    }
}