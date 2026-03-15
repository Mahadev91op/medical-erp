"use client";
import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Loader2, Camera } from "lucide-react";

export default function CameraScanner({ onScan, onClose }) {
  const [isStarting, setIsStarting] = useState(true);
  const scannerRef = useRef(null);
  const isUnmounting = useRef(false);

  useEffect(() => {
    isUnmounting.current = false;
    let html5QrCode;

    // 🔥 FIX 1: 300ms ka delay taaki React apna DOM structure (HTML) properly bana le
    // Isse 'removeChild' aur 'AbortError' dono fix ho jayenge
    const startTimer = setTimeout(() => {
      if (isUnmounting.current) return;

      html5QrCode = new Html5Qrcode("scanner-container");
      scannerRef.current = html5QrCode;

      html5QrCode
        .start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Agar pehle hi band ho raha hai toh ignore karo
            if (isUnmounting.current) return;

            // Scan milte hi flag true karo taaki multiple baar scan na ho
            isUnmounting.current = true;

            if (scannerRef.current) {
              scannerRef.current
                .stop()
                .then(() => {
                  scannerRef.current.clear();
                  onScan(decodedText); // Scanner band hone ke baad data bhejo
                })
                .catch((err) => {
                  console.warn("Scanner rokne me issue (Ignored):", err);
                  onScan(decodedText); // Agar rokne me error aaye tab bhi scan data bhej do
                });
            }
          },
          (errorMessage) => {
            // Background scan processing errors ko ignore karna zaroori hai
          }
        )
        .then(() => {
          // Camera successfully chalu ho gaya
          if (isUnmounting.current) {
            // Par agar user ne chalu hote hi X button daba diya, toh turant rok do
            html5QrCode.stop().catch(() => {});
          } else {
            setIsStarting(false); // Spinner hatao, camera dikhao
          }
        })
        .catch((err) => {
          // 🔥 FIX 2: Yahan AbortError pakda jayega aur website crash nahi hogi!
          if (err.name === "NotAllowedError") {
            alert("Bhai, Camera permission allow karni padegi!");
          } else {
            console.warn("Camera Abort Error ko suppress kar diya gaya:", err);
          }
          setIsStarting(false);
        });
    }, 300);

    // 🔥 FIX 3: Cleanup function jo component band hone par sab kuch saaf karega
    return () => {
      isUnmounting.current = true;
      clearTimeout(startTimer); // Agar timer chalne se pehle hi band ho gaya toh timer roko

      if (scannerRef.current) {
        try {
          // Safely stop the camera feed if it was running
          if (scannerRef.current.isScanning) {
            scannerRef.current
              .stop()
              .then(() => {
                scannerRef.current.clear();
              })
              .catch((err) => console.warn("Cleanup warning:", err));
          } else {
            scannerRef.current.clear();
          }
        } catch (e) {
          console.warn("Sync cleanup warning:", e);
        }
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
          <button
            onClick={onClose}
            className="p-2 bg-rose-100 text-rose-600 rounded-full hover:bg-rose-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Container */}
        <div className="relative w-full bg-black min-h-[300px] flex items-center justify-center">
          {/* Jab tak camera full load na ho jaye, ye spinner dikhega */}
          {isStarting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-slate-900">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
              <p className="text-sm font-medium">Starting Camera...</p>
            </div>
          )}

          <div id="scanner-container" className="w-full"></div>
        </div>

        {/* Footer Info */}
        <div className="p-5 bg-white text-center">
          <p className="text-sm text-slate-600 font-semibold mb-1">
            Scan the Barcode
          </p>
          <p className="text-xs text-slate-400 font-medium">
            Sticker ko screen par dikh rahe box ke beech me rakhein.
          </p>
        </div>
      </div>
    </div>
  );
}