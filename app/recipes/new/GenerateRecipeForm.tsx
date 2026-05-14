"use client";

import { useState } from "react";
import { Loader2, ChefHat, Check, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function GenerateRecipeForm({ items }: { items: any[] }) {
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();

  const toggleItem = (id: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItemIds(newSet);
  };

  const handleGenerate = async () => {
    if (selectedItemIds.size === 0) return;
    
    setIsGenerating(true);
    const selectedItems = items.filter(item => selectedItemIds.has(item.id));
    
    try {
      const res = await fetch("/api/recipes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selectedItems }),
      });

      if (res.ok) {
        router.push("/recipes");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 glass rounded-[2rem] border-dashed border-zinc-800 text-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-zinc-900 flex items-center justify-center">
          <ChefHat size={40} className="text-zinc-700" />
        </div>
        <div className="space-y-1">
          <p className="text-white font-bold text-lg">Frigo vide</p>
          <p className="text-zinc-500 text-sm">Ajoutez des produits pour générer des recettes !</p>
        </div>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-3">
        {items.map((item) => {
          const isSelected = selectedItemIds.has(item.id);
          const expiry = new Date(item.expiryDate);
          const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
          const isUrgent = daysLeft <= 1;
          const isWarning = daysLeft <= 3;

          return (
            <div 
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={cn(
                "glass group rounded-3xl p-4 border-zinc-800 flex items-center gap-4 cursor-pointer transition-all active:scale-[0.98]",
                isSelected 
                  ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/5" 
                  : "hover:border-zinc-700"
              )}
            >
              <div className={cn(
                "h-6 w-6 rounded-lg border flex items-center justify-center transition-colors",
                isSelected 
                  ? "bg-emerald-500 border-emerald-500 text-white" 
                  : "border-zinc-700 bg-zinc-900"
              )}>
                {isSelected && <Check size={14} strokeWidth={4} />}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "font-bold transition-colors truncate",
                  isSelected ? "text-emerald-400" : "text-white"
                )}>
                  {item.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-black uppercase tracking-wider",
                    isUrgent ? "text-rose-500" : isWarning ? "text-orange-500" : "text-emerald-500"
                  )}>
                    <Calendar size={10} />
                    {daysLeft <= 0 ? "Aujourd'hui" : `J-${daysLeft}`}
                  </div>
                </div>
              </div>

              {item.imageUrl && (
                <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                  <img src={item.imageUrl} alt="" className="w-full h-full object-cover opacity-50" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-32 left-6 right-6 flex justify-center pointer-events-none z-40">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || selectedItemIds.size === 0}
          className="w-full max-w-lg bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black rounded-2xl py-4 flex items-center justify-center gap-3 transition-all shadow-2xl shadow-emerald-500/40 pointer-events-auto active:scale-95 disabled:shadow-none"
        >
          {isGenerating ? (
            <>
              <Loader2 className="animate-spin" size={24} />
              <span>Génération...</span>
            </>
          ) : (
            <>
              <ChefHat size={24} />
              <span>Générer ({selectedItemIds.size} ingrédient{selectedItemIds.size > 1 ? 's' : ''})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
