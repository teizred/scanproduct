"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChevronLeft, Loader2, CheckCircle, Calendar, Package } from "lucide-react";
import Link from "next/link";
import BottomNav from "@/app/components/BottomNav";
import { cn } from "@/lib/utils";

export default function ManualAddPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setIsSaving(true);
    try {
      // Default expiry for fruits/veggies if empty (7 days)
      const finalExpiry = expiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const res = await fetch("/api/fridge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          expiryDate: finalExpiry,
          imageUrl: image,
          quantity: 1,
          category: "Fruits & Légumes", // Default category for manual add of fresh items
          nutriscore: "A", // Fresh produce is usually A
        }),
      });

      if (res.ok) {
        router.push("/fridge");
        router.refresh();
      }
    } catch (error) {
      console.error("Failed to save product:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-32 min-h-screen bg-black">
      <header className="p-6 flex items-center bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-30">
        <Link href="/fridge" className="p-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors mr-4">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-white tracking-tight">Ajout Manuel</h1>
      </header>

      <main className="p-6 max-w-xl mx-auto space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Upload Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative aspect-square w-full max-w-[280px] mx-auto rounded-[2.5rem] overflow-hidden bg-zinc-900 border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center cursor-pointer group hover:border-emerald-500/50 transition-all"
          >
            {image ? (
              <>
                <img src={image} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="text-white" size={32} />
                </div>
              </>
            ) : (
              <div className="text-center space-y-3 p-6">
                <div className="h-16 w-16 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  {isUploading ? <Loader2 className="text-emerald-500 animate-spin" size={32} /> : <Camera className="text-zinc-500" size={32} />}
                </div>
                <p className="text-zinc-500 text-sm font-medium">Prendre une photo</p>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImageCapture} 
              accept="image/*" 
              capture="environment"
              className="hidden" 
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-zinc-400 text-sm font-bold uppercase tracking-widest pl-1">Nom du produit</label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input
                  required
                  type="text"
                  placeholder="Ex: Bananes, Pommes..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-zinc-400 text-sm font-bold uppercase tracking-widest pl-1">Date de péremption (Optionnel)</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500 transition-all [color-scheme:dark]"
                />
              </div>
              <p className="text-zinc-600 text-[10px] pl-1 uppercase tracking-tight">Si vide, sera fixé par défaut à +7 jours.</p>
            </div>
          </div>

          <button
            type="submit"
            disabled={!name || isSaving}
            className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:bg-zinc-800 text-white font-black rounded-[2rem] transition-all active:scale-95 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 text-lg"
          >
            {isSaving ? (
              <Loader2 className="animate-spin" size={24} />
            ) : (
              <>
                <CheckCircle size={24} />
                Ajouter au frigo
              </>
            )}
          </button>

          <div className="text-center">
            <Link href="/scan" className="text-zinc-500 hover:text-emerald-500 text-sm font-medium transition-colors">
              Ou scanner un code-barres ?
            </Link>
          </div>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
