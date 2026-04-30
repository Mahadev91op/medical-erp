import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import fs from "fs";
import path from "path";

const execPromise = util.promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medicalshop";
        const backupBaseDir = process.env.BACKUP_DIR || path.join(process.cwd(), "public", "backups");
        
        let dbName = "medicalshop";
        try {
            const url = new URL(mongoUri);
            dbName = url.pathname.substring(1) || "medicalshop"; 
        } catch(e) {
             const parts = mongoUri.split('/');
             dbName = parts[parts.length - 1].split('?')[0];
        }

        const backupFolder = path.join(backupBaseDir, dbName);

        if (!fs.existsSync(backupFolder)) {
             return NextResponse.json({ 
                 success: false, 
                 error: "Backup folder nahi mila! Pehle backup save kijiye." 
             }, { status: 400 });
        }

        // 🚀 SMART LOGIC: '--drop' ka matlab hai pehle current data ko saaf karo, phir backup dalo
        const command = `mongorestore --uri="${mongoUri}" --drop "${backupFolder}"`;
        
        try {
            const { stdout, stderr } = await execPromise(command);
            return NextResponse.json({ 
                success: true, 
                message: `🎉 JADU! Purana Data successfully wapas aa gaya hai!`,
                debug: stderr
            });
        } catch (err) {
            // Agar normal command fail ho toh path wali command chalayega
            const defaultMongoRestore = `"C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongorestore.exe"`;
            const mongorestoreExe = process.env.MONGORESTORE_PATH ? `"${process.env.MONGORESTORE_PATH}"` : defaultMongoRestore;
            
            const fallbackCommand = `${mongorestoreExe} --uri="${mongoUri}" --drop "${backupFolder}"`;
            
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