"use client";

import { cn } from "@/lib/utils";

interface ScannerOverlayProps {
  step: "barcode" | "expiry" | "confirm";
}

export default function ScannerOverlay({ step }: ScannerOverlayProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="relative w-72 h-72">
        {/* Main Thin Frame */}
        <div className="absolute inset-0 border border-white/30 rounded-[2.5rem]" />
        
        {/* Accentuated Corners for Visibility */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-500 rounded-tl-[2.5rem]" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500 rounded-tr-[2.5rem]" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-500 rounded-bl-[2.5rem]" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-500 rounded-br-[2.5rem]" />
      </div>

      <div className="absolute bottom-24 left-0 right-0 text-center">
        <span className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-full shadow-lg shadow-emerald-500/20">
          {step === "barcode" ? "Scan Code-barres" : "Scan Date"}
        </span>
      </div>
    </div>
  );
}
