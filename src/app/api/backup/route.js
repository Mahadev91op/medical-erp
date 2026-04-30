import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import fs from "fs";
import path from "path";

const execPromise = util.promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // 1. .env se seedha asli database link (URI) uthao!
        const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/medicalshop";
        
        // 2. Backup ka main folder path
        const backupBaseDir = process.env.BACKUP_DIR || path.join(process.cwd(), "public", "backups"); 

        // 3. Agar backup folder nahi hai, toh use create karo
        if (!fs.existsSync(backupBaseDir)) {
            fs.mkdirSync(backupBaseDir, { recursive: true });
        }

        // Try 1: Normal mongodump command (asli URI ke sath)
        const command = `mongodump --uri="${mongoUri}" --out="${backupBaseDir}"`;
        
        try {
            const { stdout, stderr } = await execPromise(command);
            return NextResponse.json({ 
                success: true, 
                message: "🎉 Backup Successful! Apna folder check karein.",
                debug: stderr || stdout || "Warning: Database shayad poori tarah khali hai!"
            });
        } catch (err) {
            // Try 2: Agar command directly na chale, toh Tools path se chalao
            // Dhyan de: process.env.MONGODUMP_PATH me quotes(") mat lagana .env file me
            const defaultMongoDump = `"C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongodump.exe"`;
            const mongodumpExe = process.env.MONGODUMP_PATH ? `"${process.env.MONGODUMP_PATH}"` : defaultMongoDump;
            
            const fallbackCommand = `${mongodumpExe} --uri="${mongoUri}" --out="${backupBaseDir}"`;
            
            const { stdout, stderr } = await execPromise(fallbackCommand);
            return NextResponse.json({ 
                success: true, 
                message: "🎉 Backup Successful (Tools Path se)! Apna folder check karein.",
                debug: stderr || stdout
            });
        }

    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            error: "Backup Command Fail Ho Gayi!",
            details: error.message,
            stderr: error.stderr || "Koi error message nahi mila"
        }, { status: 500 });
    }
}