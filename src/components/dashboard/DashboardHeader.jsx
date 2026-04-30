"use client";
import React from 'react';
import { Database } from 'lucide-react';
import { useSession } from 'next-auth/react';

const DashboardHeader = () => {
  const { data: session } = useSession();

  // 👇 Ye raha aapka Backup Logic
  const handleBackup = async () => {
    alert("⏳ Backup start ho raha hai... Please wait.");

    try {
      const response = await fetch('/api/backup');
      const data = await response.json();

      if (data.success) {
        alert(`✅ Backup Successful!\n\nMessage: ${data.message}`);
      } else {
        alert(`❌ Backup Failed!\n\nError: ${data.error}\nDetails: ${data.details}`);
      }
    } catch (error) {
      alert("❌ Server se connection toot gaya ya error aaya!");
      console.error("Backup trigger error:", error);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Welcome back {session?.user?.name || ''}, here is your medical store summary.</p>
      </div>
      
      {/* Sirf ye EK button hona chahiye */}
      {session?.user?.role === 'admin' && (
        <button
          onClick={handleBackup}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow-md"
        >
          <Database className="w-4 h-4" />
          <span>Save Backup</span>
        </button>
      )}
    </div>
  );
};

export default DashboardHeader;