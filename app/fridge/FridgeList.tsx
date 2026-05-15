"use client";

import { useState } from "react";
import { Trash2, Refrigerator, Loader2, Calendar, Search } from "lucide-react";
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
};

export default function FridgeList({ initialItems }: { initialItems: FridgeItem[] }) {
  const [items, setItems] = useState<FridgeItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
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

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 glass rounded-[2rem] border-dashed border-zinc-800 text-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-zinc-900 flex items-center justify-center">
          <Refrigerator size={40} className="text-zinc-700" />
        </div>
        <div className="space-y-1">
          <p className="text-white font-bold text-lg">Votre frigo est vide</p>
          <p className="text-zinc-500 text-sm">Scannez des produits pour commencer à suivre vos dates de péremption.</p>
        </div>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all backdrop-blur-md"
        />
      </div>

      {filteredItems.length === 0 && searchQuery !== "" ? (
        <div className="glass rounded-[2rem] p-12 text-center space-y-4 border-dashed border-zinc-800">
          <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-2xl">🔍</div>
          <p className="text-zinc-500 font-medium">Aucun produit trouvé pour "{searchQuery}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map((item) => {
        const expiry = new Date(item.expiryDate);
        const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
        const isUrgent = daysLeft <= 1;
        const isWarning = daysLeft <= 3;
        
        return (
          <div key={item.id} className="glass group rounded-3xl p-4 border-zinc-800 flex items-center gap-4 hover:border-zinc-700 transition-all">
            <div className="h-20 w-20 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <Refrigerator size={28} className="text-zinc-800" />
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white truncate text-lg tracking-tight">{item.name}</h3>
                {item.nutriscore && (
                  <span className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-black text-white uppercase",
                    item.nutriscore.toLowerCase() === 'a' ? "bg-emerald-600" :
                    item.nutriscore.toLowerCase() === 'b' ? "bg-lime-500" :
                    item.nutriscore.toLowerCase() === 'c' ? "bg-yellow-500" :
                    item.nutriscore.toLowerCase() === 'd' ? "bg-orange-500" : "bg-rose-600"
                  )}>
                    {item.nutriscore}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-xl uppercase tracking-wider",
                  isUrgent 
                    ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" 
                    : isWarning 
                      ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                      : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                )}>
                  <Calendar size={12} />
                  {daysLeft < 0 ? "Périmé" : daysLeft === 0 ? "Aujourd'hui" : `J-${daysLeft}`}
                </div>
                <span className="text-zinc-500 text-sm font-medium">Qté: {item.quantity}</span>
              </div>
            </div>
            
            <button
              onClick={() => handleDelete(item.id)}
              disabled={isDeleting === item.id}
              className="h-12 w-12 flex items-center justify-center text-zinc-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all disabled:opacity-50"
              aria-label="Supprimer"
            >
              {isDeleting === item.id ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Trash2 size={20} />
              )}
            </button>
          </div>
        );
        })}
      </div>
      )}
    </div>
  );
}
