"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { useRouter } from "next/navigation";
import { fetchProductByBarcode, OFFProduct } from "@/lib/openfoodfacts";
import { Camera, RefreshCw, CheckCircle, ArrowRight, Loader2, ChevronLeft } from "lucide-react";
import Link from "next/link";

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
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current frame to canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Get base64 image data
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);
    
    // Stop video stream
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
    // Stop video stream
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
    setStep("confirm");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col">
      <header className="p-4 flex items-center justify-between z-10 bg-zinc-900/80 backdrop-blur-md">
        <Link href="/" className="p-2 rounded-full bg-zinc-800 text-zinc-300">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="font-semibold text-lg">
          {step === "barcode" && "Scanner le Code-barres"}
          {step === "expiry" && "Scanner la Date"}
          {step === "confirm" && "Confirmer"}
        </h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      {error && (
        <div className="bg-rose-500 text-white p-3 mx-4 mt-4 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <main className="flex-1 flex flex-col relative">
        {/* Hidden canvas for image capture */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Video Viewer for steps 1 and 2 */}
        {(step === "barcode" || step === "expiry") && (
          <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute min-w-full min-h-full object-cover"
            />
            
            {/* Overlay Guides */}
            <div className="absolute inset-0 border-[40px] border-black/50 flex items-center justify-center pointer-events-none">
              <div className="w-full h-48 border-2 border-emerald-500 rounded-xl relative">
                {step === "barcode" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-rose-500 opacity-80 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div>
                  </div>
                )}
                <div className="absolute -top-10 left-0 right-0 text-center text-white font-medium drop-shadow-md">
                  {step === "barcode" ? "Placez le code-barres ici" : "Placez la date de péremption ici"}
                </div>
              </div>
            </div>

            {/* Loading Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center z-20">
                <Loader2 className="animate-spin text-emerald-500 mb-4" size={48} />
                <p className="text-lg font-medium">Analyse en cours...</p>
              </div>
            )}
          </div>
        )}

        {/* Controls for Barcode Step */}
        {step === "barcode" && !isProcessing && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent flex flex-col items-center gap-6">
            <button
              onClick={skipToConfirm}
              className="text-zinc-300 font-medium py-2 px-6 bg-zinc-800/80 rounded-full backdrop-blur-md transition-colors hover:bg-zinc-700/80"
            >
              Saisir manuellement
            </button>
          </div>
        )}

        {/* Controls for Expiry Step */}
        {step === "expiry" && !isProcessing && (
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent flex flex-col items-center gap-6">
            <button
              onClick={handleCaptureExpiry}
              className="w-20 h-20 bg-emerald-500 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              <Camera size={32} className="text-white" />
            </button>
            <button
              onClick={skipToConfirm}
              className="text-zinc-300 font-medium py-2 px-6 bg-zinc-800/80 rounded-full backdrop-blur-md"
            >
              Saisir manuellement
            </button>
          </div>
        )}

        {/* Manual Entry Fallback / Confirm Step */}
        {step === "confirm" && (
          <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-6 overflow-y-auto">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-zinc-100 dark:border-zinc-800 space-y-6">
              
              {productData?.product.image_url && (
                <div className="flex justify-center mb-6">
                  <img 
                    src={productData.product.image_url} 
                    alt="Produit" 
                    className="h-32 object-contain rounded-lg"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Nom du produit</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl p-4 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: Lait demi-écrémé"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Date de péremption (DLC)</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl p-4 text-zinc-900 dark:text-zinc-50 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-1">Quantité</label>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xl font-bold"
                  >
                    -
                  </button>
                  <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50 w-8 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-12 h-12 rounded-xl bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xl font-bold"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveItem}
                disabled={isProcessing || !name || !expiryDate}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl p-4 flex items-center justify-center space-x-2 transition-colors mt-8 shadow-lg shadow-emerald-500/20"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <CheckCircle size={24} />
                    <span>Ajouter au frigo</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
