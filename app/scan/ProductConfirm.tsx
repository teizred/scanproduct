"use client";

import { Calendar, CheckCircle, Loader2 } from "lucide-react";
import { OFFProduct } from "@/lib/openfoodfacts";

interface ProductConfirmProps {
  name: string;
  setName: (name: string) => void;
  expiryDate: string;
  setExpiryDate: (date: string) => void;
  quantity: number;
  setQuantity: (q: number) => void;
  productData: OFFProduct | null;
  isProcessing: boolean;
  onSave: () => void;
}

export default function ProductConfirm({
  name, setName, expiryDate, setExpiryDate, quantity, setQuantity, productData, isProcessing, onSave
}: ProductConfirmProps) {
  return (
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
              className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-white font-bold focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all [color-scheme:dark]"
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
          onClick={onSave}
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
  );
}
