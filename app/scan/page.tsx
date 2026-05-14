"use client";

import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useRouter } from "next/navigation";
import { fetchProductByBarcode, OFFProduct } from "@/lib/openfoodfacts";
import { Camera, CheckCircle, Loader2, ChevronLeft, Calendar, Info, X } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/app/components/BottomNav";
import { cn } from "@/lib/utils";

type Step = "barcode" | "expiry" | "confirm";

export default function ScanPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState<Step>("barcode");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [barcode, setBarcode] = useState("");
  const [productData, setProductData] = useState<OFFProduct | null>(null);
  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  // Initialize camera for barcode scanning
  useEffect(() => {
    if (step === "barcode") {
      let controls: any = null;
      const startScanner = async () => {
        try {
          if (!readerRef.current) {
            readerRef.current = new BrowserMultiFormatReader();
          }
          if (videoRef.current) {
            controls = await readerRef.current.decodeFromVideoDevice(
              undefined,
              videoRef.current,
              (result, error) => {
                if (result) {
                  const code = result.getText();
                  handleBarcodeScanned(code);
                  if (controls) controls.stop();
                }
              }
            );
          }
        } catch (err) {
          console.error("Scanner error:", err);
          setError("Impossible d'accéder à la caméra. Vérifiez vos permissions.");
        }
      };

      startScanner();

      return () => {
        if (controls) controls.stop();
      };
    }
  }, [step]);

  // Simple video stream for expiry capture
  useEffect(() => {
    if (step === "expiry" && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.error("Camera error:", err);
          setError("Impossible d'accéder à la caméra.");
        });

      return () => {
        if (videoRef.current?.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((track) => track.stop());
        }
      };
    }
  }, [step]);

  const handleBarcodeScanned = async (code: string) => {
    setBarcode(code);
    setIsProcessing(true);
    try {
      const data = await fetchProductByBarcode(code);
      if (data && data.product.product_name) {
        setProductData(data);
        setName(data.product.product_name);
      } else {
        setName("Produit inconnu");
      }
      setStep("expiry");
    } catch (err) {
      console.error(err);
      setName("Erreur lors de la recherche");
      setStep("expiry");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCaptureExpiry = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setIsProcessing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);
    
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      const data = await res.json();
      if (data.date) {
        setExpiryDate(data.date);
      } else {
        setError("Aucune date n'a pu être extraite. Veuillez la saisir manuellement.");
      }
      setStep("confirm");
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'extraction de la date.");
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
          barcode: barcode || null,
          name,
          expiryDate,
          quantity,
          imageUrl: productData?.product.image_url,
          brand: productData?.product.brands,
          category: productData?.product.categories,
        }),
      });

      if (res.ok) {
        router.push("/fridge");
      } else {
        const err = await res.json();
        setError(err.error || "Erreur lors de la sauvegarde.");
      }
    } catch (err) {
      console.error(err);
      setError("Erreur réseau.");
    } finally {
      setIsProcessing(false);
    }
  };

  const skipToConfirm = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setStep("confirm");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col relative overflow-hidden">
      {/* Immersive Header */}
      <header className="p-6 flex items-center justify-between fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent">
        <Link href="/" className="p-2 rounded-2xl glass text-zinc-300">
          <ChevronLeft size={24} />
        </Link>
        <div className="text-center">
          <h1 className="text-white font-bold tracking-tight">
            {step === "barcode" && "Scanner le Code-barres"}
            {step === "expiry" && "Scanner la Date"}
            {step === "confirm" && "Confirmer le produit"}
          </h1>
          <div className="flex justify-center gap-1 mt-1">
            <div className={cn("h-1 w-4 rounded-full transition-colors", step === "barcode" ? "bg-emerald-500" : "bg-zinc-800")} />
            <div className={cn("h-1 w-4 rounded-full transition-colors", step === "expiry" ? "bg-emerald-500" : "bg-zinc-800")} />
            <div className={cn("h-1 w-4 rounded-full transition-colors", step === "confirm" ? "bg-emerald-500" : "bg-zinc-800")} />
          </div>
        </div>
        <div className="w-10" />
      </header>

      {error && (
        <div className="fixed top-24 left-6 right-6 z-50 glass border-rose-500/20 bg-rose-500/10 p-4 rounded-2xl flex items-center gap-3">
          <Info className="text-rose-500 shrink-0" size={20} />
          <p className="text-rose-500 text-sm font-medium">{error}</p>
          <button onClick={() => setError("")} className="ml-auto text-rose-500/50">
            <X size={16} />
          </button>
        </div>
      )}

      <main className="flex-1 flex flex-col">
        <canvas ref={canvasRef} className="hidden" />

        {(step === "barcode" || step === "expiry") && (
          <div className="flex-1 relative flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute min-w-full min-h-full object-cover opacity-80"
            />
            
            {/* Viewfinder Overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-[85%] max-w-sm aspect-square relative">
                {/* Corners */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-emerald-500 rounded-tl-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-emerald-500 rounded-tr-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-emerald-500 rounded-bl-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-emerald-500 rounded-br-3xl shadow-[0_0_20px_rgba(16,185,129,0.3)]" />
                
                {/* Scanning line for barcode */}
                {step === "barcode" && (
                  <div className="absolute inset-x-0 h-0.5 bg-emerald-500/80 animate-[scan_2s_infinite] shadow-[0_0_15px_rgba(16,185,129,0.8)]" />
                )}

                <div className="absolute -bottom-12 left-0 right-0 text-center text-zinc-400 text-sm font-medium">
                  {step === "barcode" ? "Alignez le code-barres" : "Cadrez la date de péremption"}
                </div>
              </div>
            </div>

            {isProcessing && (
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-40">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full border-4 border-zinc-800 border-t-emerald-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="text-emerald-500" size={32} />
                  </div>
                </div>
                <p className="mt-6 text-white font-black tracking-widest uppercase text-xs">Analyse intelligente...</p>
              </div>
            )}
          </div>
        )}

        {/* Action Controls */}
        {!isProcessing && (step === "barcode" || step === "expiry") && (
          <div className="fixed bottom-32 left-0 right-0 flex flex-col items-center gap-6 px-6 z-40">
            {step === "expiry" && (
              <button
                onClick={handleCaptureExpiry}
                className="w-20 h-20 bg-emerald-500 rounded-full border-[6px] border-white/20 flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_30px_rgba(16,185,129,0.4)]"
              >
                <div className="h-14 w-14 rounded-full bg-emerald-400 flex items-center justify-center border-2 border-white/40">
                  <Camera size={32} className="text-white" />
                </div>
              </button>
            )}
            
            <button
              onClick={skipToConfirm}
              className="glass px-8 py-4 rounded-[2rem] text-white font-bold text-sm tracking-wide hover:bg-white/20 transition-all pointer-events-auto shadow-2xl"
            >
              Saisir manuellement
            </button>
          </div>
        )}

        {/* Confirmation Form */}
        {step === "confirm" && (
          <div className="flex-1 bg-zinc-950 p-6 pt-24 overflow-y-auto">
            <div className="glass rounded-[2.5rem] p-8 border-zinc-800 space-y-8 max-w-lg mx-auto">
              
              {productData?.product.image_url && (
                <div className="flex justify-center -mt-16">
                  <div className="h-32 w-32 glass rounded-3xl p-2 border-zinc-800 shadow-2xl overflow-hidden">
                    <img 
                      src={productData.product.image_url} 
                      alt="Produit" 
                      className="h-full w-full object-contain rounded-2xl"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Produit</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"
                    placeholder="Nom du produit"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Calendar size={12} />
                    Date de péremption
                  </label>
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all color-scheme-dark"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Quantité</label>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white font-bold hover:bg-zinc-800 active:scale-90 transition-all"
                    >
                      -
                    </button>
                    <div className="flex-1 h-14 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-xl font-black text-white">
                      {quantity}
                    </div>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white font-bold hover:bg-zinc-800 active:scale-90 transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSaveItem}
                disabled={isProcessing || !name || !expiryDate}
                className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black rounded-2xl py-5 flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 mt-4"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <CheckCircle size={24} strokeWidth={3} />
                    <span>Valider & Ajouter</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />

      <style jsx global>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
      `}</style>
    </div>
  );
}
