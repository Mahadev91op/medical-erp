"use client";
import { useEffect, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Loader2, Camera } from "lucide-react";

export default function CameraScanner({ onScan, onClose }) {
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    // Html5Qrcode ka direct instance banayenge (bina built-in UI ke)
    const html5QrCode = new Html5Qrcode("scanner-container");

    const startCamera = async () => {
      try {
        // { facingMode: "environment" } se direct phone ka Back Camera open hoga
        await html5QrCode.start(
          { facingMode: "environment" }, 
          {
            fps: 10, // Fast scanning
            qrbox: { width: 250, height: 150 }, // Rectangular box for barcode
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Jaise hi barcode mila, camera stop karo aur data bhej do
            html5QrCode.stop().then(() => {
              html5QrCode.clear();
              onScan(decodedText);
            }).catch(err => console.error("Camera rokne me error:", err));
          },
          (errorMessage) => {
            // Scanning process me aane wale normal errors ko ignore karein
          }
        );
        setIsStarting(false); // Camera successfully chalu ho gaya
      } catch (err) {
        console.error("Camera chalu karne me error aaya:", err);
        setIsStarting(false);
        alert("Camera ki permission allow karein ya dusra browser use karein.");
      }
    };

    startCamera();

    // Jab user modal close kare ya component hata de, toh camera band ho jana chahiye
    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop()
          .then(() => html5QrCode.clear())
          .catch(err => console.error("Cleanup error:", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center text-slate-800 font-bold">
            <Camera className="w-5 h-5 mr-2 text-emerald-600" />
            Live Camera Scanner
          </div>
          <button onClick={onClose} className="p-2 bg-rose-100 text-rose-600 rounded-full hover:bg-rose-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Camera Container */}
        <div className="relative w-full bg-black min-h-[300px] flex items-center justify-center">
          {/* Jab tak camera chalu ho raha hai, Loading spinner dikhao */}
          {isStarting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-slate-900">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
              <p className="text-sm font-medium">Starting Camera...</p>
            </div>
          )}
          
          {/* Ye ID hamesha "scanner-container" honi chahiye kyunki JS isi ko dhundhega */}
          <div id="scanner-container" className="w-full"></div>
        </div>
        
        {/* Footer Info */}
        <div className="p-5 bg-white text-center">
          <p className="text-sm text-slate-600 font-semibold mb-1">Scan the Barcode</p>
          <p className="text-xs text-slate-400 font-medium">Sticker ko screen par dikh rahe box ke beech me rakhein.</p>
        </div>

      </div>
    </div>
  );
}