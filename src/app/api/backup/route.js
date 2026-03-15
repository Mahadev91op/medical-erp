import { NextResponse } from "next/server";
import { exec } from "child_process";
import util from "util";
import fs from "fs";
import path from "path";

const execPromise = util.promisify(exec);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const backupFolder = "D:\\MedicalBackup"; 
        
        // Database ka exact folder path jo mongodump banata hai
        const dbBackupPath = path.join(backupFolder, "medical-erp");

        // 🚀 SMART LOGIC: Agar purana backup pehle se hai, toh usko pehle delete karo
        if (fs.existsSync(dbBackupPath)) {
            fs.rmSync(dbBackupPath, { recursive: true, force: true });
            console.log("🗑️ Purana backup delete kar diya gaya hai.");
        }

        // Agar main D:\MedicalBackup folder nahi hai toh banayega
        if (!fs.existsSync(backupFolder)) {
            fs.mkdirSync(backupFolder, { recursive: true });
        }

        // Try 1: Normal command 
        const command = `mongodump --uri="mongodb://127.0.0.1:27017/medical-erp" --out="${backupFolder}"`;
        
        try {
            const { stdout, stderr } = await execPromise(command);
            return NextResponse.json({ 
                success: true, 
                message: `🎉 Fresh Backup Save! Purana delete karke naya data daal diya gaya hai.`,
                debug: stderr
            });
        } catch (err) {
            // Try 2: Full path tool command
            const mongodumpPath = `"C:\\Program Files\\MongoDB\\Tools\\100\\bin\\mongodump.exe"`;
            const fallbackCommand = `${mongodumpPath} --uri="mongodb://127.0.0.1:27017/medical-erp" --out="${backupFolder}"`;
            
            const { stdout, stderr } = await execPromise(fallbackCommand);
            return NextResponse.json({ 
                success: true, 
                message: `🎉 Fresh Backup Save! Purana delete karke naya data daal diya gaya hai.`,
                debug: stderr
            });
        }

    } catch (error) {
        return NextResponse.json({ 
            success: false, 
            error: "Backup fail ho gaya!",
            details: error.message,
            stderr: error.stderr || "Koi stderr output nahi mila"
        }, { status: 500 });
    }
}