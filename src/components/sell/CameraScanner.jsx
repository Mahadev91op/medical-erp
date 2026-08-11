"use client";
import { useEffect, useState, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Loader2, Camera } from "lucide-react";

export default function CameraScanner({ onScan, onClose }) {
  const [isStarting, setIsStarting] = useState(true);
  const [cameraError, setCameraError] = useState(null);
  const scannerRef = useRef(null);
  const isUnmounting = useRef(false);

  useEffect(() => {
    isUnmounting.current = false;
    let html5QrCode;

    // Check if browser mediaDevices is supported (iOS Safari requires HTTPS or localhost)
    if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setTimeout(() => {
        setIsStarting(false);
        setCameraError("iOS Safari Camera requires HTTPS or Localhost. On LAN/Wi-Fi (HTTP), you can use the Quick Search bar or manual barcode entry.");
      }, 0);
      return;
    }

    const startTimer = setTimeout(() => {
      if (isUnmounting.current) return;

      try {
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
              if (isUnmounting.current) return;
              isUnmounting.current = true;

              if (scannerRef.current) {
                scannerRef.current
                  .stop()
                  .then(() => {
                    scannerRef.current.clear();
                    onScan(decodedText);
                  })
                  .catch((err) => {
                    console.warn("Scanner stop issue (Ignored):", err);
                    onScan(decodedText);
                  });
              }
            },
            () => {}
          )
          .then(() => {
            if (isUnmounting.current) {
              html5QrCode.stop().catch(() => {});
            } else {
              setIsStarting(false);
            }
          })
          .catch((err) => {
            if (err.name === "NotAllowedError") {
              setCameraError("Camera permission denied. Please allow Camera access in Safari / iPhone Settings.");
            } else {
              setCameraError("Camera initialization issue. You can use the Quick Search bar to find medicines instantly.");
            }
            setIsStarting(false);
          });
      } catch (err) {
        setCameraError("Camera is not available in this browser environment. Use Quick Search or manual Barcode.");
        setIsStarting(false);
      }
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
            <Camera className="w-5 h-5 mr-2 text-blue-600" />
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
          {/* Spinner when initializing */}
          {isStarting && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-slate-900">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
              <p className="text-sm font-medium">Starting Camera...</p>
            </div>
          )}

          {/* Error / Fallback info */}
          {cameraError && (
            <div className="p-6 text-center text-white bg-slate-900 flex flex-col items-center justify-center space-y-3 min-h-[300px]">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center">
                <Camera className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-200 max-w-xs">{cameraError}</p>
              <button
                onClick={onClose}
                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md"
              >
                Use Quick Search Instead
              </button>
            </div>
          )}

          {!cameraError && <div id="scanner-container" className="w-full"></div>}
        </div>

        {/* Footer Info */}
        <div className="p-5 bg-white text-center">
          <p className="text-sm text-slate-600 font-semibold mb-1">
            {cameraError ? "Alternative Scanning Options" : "Scan the Barcode"}
          </p>
          <p className="text-xs text-slate-400 font-medium">
            {cameraError
              ? "You can type medicine name or barcode directly in the Quick Search bar."
              : "Place the barcode sticker in the center of the scanning area."}
          </p>
        </div>
      </div>
    </div>
  );
}