"use client";

import { useState } from "react";
import { Loader2, ChefHat, Check } from "lucide-react";
import { useRouter } from "next/navigation";

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
        // Recipe generated successfully, redirect to recipes list
        router.push("/recipes");
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la génération");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setIsGenerating(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-center">
        <p className="text-zinc-500">Votre frigo est vide. Ajoutez des produits pour générer des recettes !</p>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {items.map((item) => {
          const isSelected = selectedItemIds.has(item.id);
          const daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
          
          let statusColor = "text-emerald-500";
          if (daysLeft <= 1) statusColor = "text-rose-500 font-bold";
          else if (daysLeft <= 3) statusColor = "text-orange-500 font-bold";

          return (
            <div 
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-colors flex items-center space-x-4 ${
                isSelected 
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20" 
                  : "border-transparent bg-white dark:bg-zinc-900 shadow-sm"
              }`}
            >
              <div className={`w-6 h-6 rounded-md border flex items-center justify-center ${
                isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-zinc-300 dark:border-zinc-600"
              }`}>
                {isSelected && <Check size={16} />}
              </div>
              
              <div className="flex-1">
                <h3 className="font-medium text-base">{item.name}</h3>
                <p className={`text-sm ${statusColor}`}>
                  {daysLeft <= 0 ? "Périmé / Aujourd'hui" : `Expire dans ${daysLeft} jour(s)`}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleGenerate}
        disabled={isGenerating || selectedItemIds.size === 0}
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl p-4 flex items-center justify-center space-x-2 transition-colors sticky bottom-6 shadow-lg shadow-emerald-500/20"
      >
        {isGenerating ? (
          <>
            <Loader2 className="animate-spin" size={24} />
            <span>Création de la recette...</span>
          </>
        ) : (
          <>
            <ChefHat size={24} />
            <span>Générer ({selectedItemIds.size} ingrédient{selectedItemIds.size > 1 ? 's' : ''})</span>
          </>
        )}
      </button>
    </div>
  );
}
