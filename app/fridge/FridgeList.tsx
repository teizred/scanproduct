"use client";

import { useState } from "react";
import { Trash2, Refrigerator, Loader2, Calendar, Search, Share2, Globe, Plus, Minus } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

type FridgeItem = {
  id: string;
  name: string;
  expiryDate: string | Date;
  quantity: number;
  imageUrl: string | null;
  category?: string | null;
  nutriscore?: string | null;
  ecoscore?: string | null;
  isShared: boolean;
};

export default function FridgeList({ initialItems }: { initialItems: FridgeItem[] }) {
  const [items, setItems] = useState<FridgeItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdatingQty, setIsUpdatingQty] = useState<string | null>(null);
  const router = useRouter();

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/fridge/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems(items.filter((item) => item.id !== id));
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleUpdateQuantity = async (id: string, newQty: number) => {
    if (newQty < 1) return;
    setIsUpdatingQty(id);
    try {
      const res = await fetch(`/api/fridge/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQty }),
      });
      if (res.ok) {
        setItems(
          items.map((item) =>
            item.id === id ? { ...item, quantity: newQty } : item
          )
        );
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingQty(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 glass rounded-[2rem] border-dashed border-zinc-800 text-center space-y-4">
        <div className="h-16 w-16 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-emerald-400 shadow-inner">
          <Refrigerator size={28} />
        </div>
        <div className="space-y-1 max-w-xs">
          <p className="text-white font-extrabold text-base tracking-tight">Votre frigo est vide</p>
          <p className="text-zinc-550 text-[11px] font-medium leading-relaxed">Scannez des produits pour commencer à suivre vos dates de péremption.</p>
        </div>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/30 border border-zinc-850 rounded-xl py-3.5 pl-11 pr-4 text-xs text-white placeholder:text-zinc-550 focus:outline-none focus:border-emerald-500/20 focus:ring-1 focus:ring-emerald-500/10 transition-all backdrop-blur-md"
        />
      </div>

      {filteredItems.length === 0 && searchQuery !== "" ? (
        <div className="glass rounded-2xl p-12 text-center space-y-3 border-dashed border-zinc-850">
          <div className="h-12 w-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mx-auto text-lg">🔍</div>
          <p className="text-zinc-550 text-xs font-semibold">Aucun produit trouvé pour "{searchQuery}"</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filteredItems.map((item) => {
            const expiry = new Date(item.expiryDate);
            const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
            const isUrgent = daysLeft <= 1;
            const isWarning = daysLeft <= 3;
            
            return (
              <div 
                key={item.id} 
                className="relative glass group rounded-[1.75rem] p-4 flex flex-row items-start gap-4 transition-all duration-300 border backdrop-blur-md hover:bg-zinc-900/5 shadow-sm border-zinc-850 hover:border-zinc-750"
              >
                {/* Thumbnail Image */}
                <div className="h-20 w-20 rounded-2xl bg-zinc-950 border border-zinc-850 overflow-hidden shrink-0 flex items-center justify-center shadow-inner relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <Refrigerator size={28} className="text-zinc-700" />
                  )}
                </div>

                {/* Right Content Column (Flex-1) */}
                <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                  
                  {/* Top Line: Name and Nutriscore */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight leading-snug break-words">
                        {item.name}
                      </h3>
                      {item.nutriscore && (
                        <span className={cn(
                          "shrink-0 px-2 py-0.5 rounded-lg text-[9px] font-black text-white uppercase tracking-wider shadow-sm",
                          item.nutriscore.toLowerCase() === 'a' ? "bg-emerald-600 border border-emerald-500/20" :
                          item.nutriscore.toLowerCase() === 'b' ? "bg-lime-600 border border-lime-500/20" :
                          item.nutriscore.toLowerCase() === 'c' ? "bg-yellow-600 border border-yellow-500/20" :
                          item.nutriscore.toLowerCase() === 'd' ? "bg-orange-600 border border-orange-500/20" : "bg-rose-600 border border-rose-500/20"
                        )}>
                          {item.nutriscore.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Expiry Badge / Public Badge Row */}
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border",
                        isUrgent 
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                          : isWarning 
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      )}>
                        {daysLeft < 0 ? "Périmé" : daysLeft === 0 ? "Aujourd'hui" : `J-${daysLeft}`}
                      </span>


                    </div>
                  </div>

                  {/* Bottom Line: Interactive Quantity Controller & Actions Tray */}
                  <div className="flex items-center justify-between gap-3 mt-3 pt-2.5 border-t border-zinc-900/60">
                    
                    {/* Accessible Quantity Selector */}
                    <div className="flex items-center gap-1 bg-zinc-950/60 border border-zinc-850 p-1 rounded-xl shadow-inner shrink-0">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1 || isUpdatingQty === item.id}
                        className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none active:scale-90 shadow-sm"
                        aria-label="Diminuer la quantité"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-xs font-black text-white px-2 select-none min-w-[16px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        disabled={isUpdatingQty === item.id}
                        className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-90 shadow-sm"
                        aria-label="Augmenter la quantité"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Accessible Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleDelete(item.id)}
                        disabled={isDeleting === item.id}
                        className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-rose-500 bg-zinc-900 border border-zinc-850 hover:bg-rose-500/10 hover:border-rose-500/20 rounded-lg transition-all disabled:opacity-50 active:scale-95 shadow-sm"
                      >
                        {isDeleting === item.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Trash2 size={13} />
                        )}
                      </button>
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
