"use client";

import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useRouter } from "next/navigation";
import { fetchProductByBarcode, OFFProduct } from "@/lib/openfoodfacts";
import { Camera, CheckCircle, Loader2, ChevronLeft, Calendar, Info, X } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/app/components/BottomNav";
import { cn } from "@/lib/utils";
import ProductConfirm from "./ProductConfirm";
import ScannerOverlay from "./ScannerOverlay";

type Step = "barcode" | "expiry" | "confirm";

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<Step>("barcode");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  
  // Product State
  const [barcode, setBarcode] = useState("");
  const [productData, setProductData] = useState<OFFProduct | null>(null);
  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState(1);

  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  // 1. Scanner Logic
  useEffect(() => {
    if (step === "confirm") return;
    
    let controls: any = null;
    const startScanner = async () => {
      try {
        if (step === "barcode") {
          readerRef.current = readerRef.current || new BrowserMultiFormatReader();
          if (videoRef.current) {
            controls = await readerRef.current.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
              if (result) {
                handleBarcodeScanned(result.getText());
                if (controls) controls.stop();
              }
            });
          }
        } else if (step === "expiry") {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
          if (videoRef.current) videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError("Erreur caméra. Vérifiez vos permissions.");
      }
    };

    startScanner();
    return () => { if (controls) controls.stop(); };
  }, [step]);

  const handleBarcodeScanned = async (code: string) => {
    setBarcode(code);
    setIsProcessing(true);
    try {
      const data = await fetchProductByBarcode(code);
      setProductData(data);
      setName(data?.product.product_name || "Produit inconnu");
      setStep("expiry");
    } catch (err) {
      setName("Produit inconnu");
      setStep("expiry");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCaptureExpiry = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsProcessing(true);
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: canvas.toDataURL("image/jpeg", 0.8) }),
      });
      const data = await res.json();
      setExpiryDate(data.date || "");
      if (!data.date) setError("Date non détectée. Saisie manuelle requise.");
      setStep("confirm");
    } catch (err) {
      setStep("confirm");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveItem = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/fridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          barcode, name, expiryDate, quantity,
          imageUrl: productData?.product.image_url,
          nutriscore: productData?.product.nutriscore_grade,
          category: productData?.product.categories,
        }),
      });
      if (res.ok) router.push("/fridge");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden">
      <header className="p-6 flex items-center justify-between fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <Link href="/" className="p-2 rounded-2xl glass text-zinc-300"><ChevronLeft size={24} /></Link>
        <h1 className="text-white font-bold">{step === "confirm" ? "Confirmer" : "Scanner"}</h1>
        <div className="w-10" />
      </header>

      {error && (
        <div className="fixed top-24 left-6 right-6 z-50 glass border-rose-500/20 bg-rose-500/10 p-4 rounded-2xl flex items-center gap-3">
          <p className="text-rose-500 text-sm flex-1">{error}</p>
          <button onClick={() => setError("")}><X size={16} className="text-rose-500" /></button>
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <canvas ref={canvasRef} className="hidden" />

        {(step === "barcode" || step === "expiry") && (
          <div className="flex-1 relative flex items-center justify-center bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="absolute min-w-full min-h-full object-cover opacity-80" />
            <ScannerOverlay step={step} />
            
            {isProcessing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-40">
                <Loader2 className="text-emerald-500 animate-spin" size={48} />
                <p className="mt-4 text-white text-xs font-black tracking-widest uppercase">Analyse...</p>
              </div>
            )}

            {!isProcessing && (
              <div className="fixed bottom-32 left-0 right-0 flex flex-col items-center gap-6 z-40">
                {step === "expiry" && (
                  <button onClick={handleCaptureExpiry} className="w-20 h-20 bg-emerald-500 rounded-full border-[6px] border-white/20 flex items-center justify-center shadow-xl shadow-emerald-500/40">
                    <Camera size={32} className="text-white" />
                  </button>
                )}
                <button onClick={() => setStep("confirm")} className="glass px-8 py-4 rounded-[2rem] text-white font-bold text-sm shadow-2xl">Saisir manuellement</button>
              </div>
            )}
          </div>
        )}

        {step === "confirm" && (
          <ProductConfirm 
            name={name} setName={setName} 
            expiryDate={expiryDate} setExpiryDate={setExpiryDate}
            quantity={quantity} setQuantity={setQuantity}
            productData={productData} isProcessing={isProcessing}
            onSave={handleSaveItem}
          />
        )}
      </main>
      <BottomNav />
    </div>
  );
}
