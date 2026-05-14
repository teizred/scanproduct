"use client";

import { Info, X, ChefHat } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export default function IndiceInfo() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const Modal = () => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="glass max-w-sm w-full p-8 rounded-[2.5rem] border-white/10 relative space-y-6 animate-in zoom-in-95 duration-300 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-6 right-6 p-2 rounded-full bg-zinc-900/50 text-zinc-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="h-14 w-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
          <ChefHat className="text-white" size={28} />
        </div>

        <div className="space-y-4">
          <h3 className="text-2xl font-black text-white tracking-tight">Le Frigo-Score</h3>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Votre Frigo-Score est une note globale sur 100 qui analyse la gestion de vos stocks :
          </p>
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm">
              <span className="text-emerald-400 font-bold">50%</span>
              <span className="text-zinc-400"><span className="text-zinc-200 font-medium">Fraîcheur :</span> Points perdus pour chaque produit proche de sa date de péremption.</span>
            </li>
            <li className="flex gap-3 text-sm">
              <span className="text-emerald-400 font-bold">30%</span>
              <span className="text-zinc-400"><span className="text-zinc-200 font-medium">Santé :</span> Basé sur la moyenne des Nutri-Scores de vos produits.</span>
            </li>
            <li className="flex gap-3 text-sm">
              <span className="text-emerald-400 font-bold">20%</span>
              <span className="text-zinc-400"><span className="text-zinc-200 font-medium">Diversité :</span> Récompense la variété des catégories alimentaires présentes.</span>
            </li>
          </ul>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl transition-all active:scale-95 shadow-xl shadow-emerald-500/30 text-lg"
        >
          J'ai compris
        </button>
      </div>
      {/* Background click to close */}
      <div className="absolute inset-0 -z-10" onClick={() => setIsOpen(false)} />
    </div>
  );

  return (
    <div className="absolute top-0 right-0 p-4 z-20">
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 text-zinc-500/50 hover:text-white transition-colors hover:scale-110 active:scale-90"
        aria-label="Plus d'informations"
      >
        <Info size={20} />
      </button>

      {isOpen && mounted && createPortal(<Modal />, document.body)}
    </div>
  );
}
