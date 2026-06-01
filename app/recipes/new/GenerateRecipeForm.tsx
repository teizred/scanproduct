"use client";

import { useState, useEffect } from "react";
import { Loader2, ChefHat, Check, Calendar, ChevronLeft, Sparkles, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import BottomNav from "@/app/components/BottomNav";

type FridgeItem = {
  id: string;
  name: string;
  expiryDate: string | Date;
  quantity: number;
  imageUrl: string | null;
  nutriscore?: string | null;
};

const ZERO_WASTE_TIPS = [
  "Astuce : Ne jetez pas les pieds de brocoli ! Pelez-les et coupez-les en dés, ils font un excellent velouté ou une purée crémeuse. 🥦",
  "Éco-Geste : Saviez-vous que ranger vos oignons loin des pommes de terre évite qu'ils ne germent prématurément ? 🥔",
  "Astuce : Vos herbes fraîches flétrissent ? Mixez-les avec un filet d'huile d'olive et congelez-les dans un bac à glaçons ! 🌿",
  "Astuce : Conservez les restes de fromage râpé ou de croûtes de parmesan au congélateur pour parfumer vos soupes et bouillons. 🧀",
  "Éco-Geste : Mettre les restes en haut du frigo augmente de 40% vos chances de les consommer rapidement avant qu'ils ne se gâtent ! 🥪",
  "Astuce : Un pain un peu rassis ? Humidifiez-le légèrement d'eau et passez-le 5 minutes au four à 180°C pour lui redonner tout son croustillant ! 🥖",
  "Astuce : Vos restes de riz font d'excellents riz sautés express le lendemain. Ajoutez-y un œuf et vos restes de légumes ! 🍳"
];

export default function GenerateRecipeForm({ items }: { items: FridgeItem[] }) {
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTipIdx, setCurrentTipIdx] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setCurrentTipIdx((prev) => (prev + 1) % ZERO_WASTE_TIPS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const toggleItem = (id: string) => {
    const newSet = new Set(selectedItemIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedItemIds(newSet);
  };

  const handleSelectAll = () => {
    if (selectedItemIds.size === items.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(items.map(item => item.id)));
    }
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
      <div className="pb-32">
        <header className="p-6 flex items-center bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-30 border-b border-zinc-900/50">
          <button 
            type="button" 
            onClick={() => router.push("/recipes")} 
            className="p-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all mr-4 active:scale-90"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white tracking-tight">Nouvelle Recette</h1>
        </header>

        <main className="p-6 max-w-4xl mx-auto w-full flex flex-col items-center justify-center py-20 px-6 glass rounded-[2rem] border-dashed border-zinc-800 text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-zinc-900 flex items-center justify-center">
            <ChefHat size={40} className="text-zinc-700" />
          </div>
          <div className="space-y-1">
            <p className="text-white font-bold text-lg">Frigo vide</p>
            <p className="text-zinc-500 text-sm">Ajoutez des produits pour générer des recettes !</p>
          </div>
        </main>
        
        <BottomNav />
      </div>
    );
  }

  const now = new Date();
  const allSelected = selectedItemIds.size === items.length;

  return (
    <div className="pb-32">
      {/* Sticky Header containing primary Action Button on the top-right */}
      <header className="p-6 flex items-center justify-between bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-30 border-b border-zinc-900/50">
        <div className="flex items-center">
          <button 
            type="button" 
            onClick={() => router.push("/recipes")} 
            className="p-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all mr-4 active:scale-90"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-white tracking-tight">Nouvelle Recette</h1>
        </div>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating || selectedItemIds.size === 0}
          className={cn(
            "flex items-center gap-2 font-bold px-4 py-2.5 rounded-2xl transition-all duration-300 text-xs active:scale-95 border shrink-0",
            selectedItemIds.size === 0
              ? "bg-zinc-900/50 text-zinc-500 border-zinc-800"
              : "bg-emerald-500 text-white border-emerald-500/20 shadow-lg shadow-emerald-500/10 hover:bg-emerald-450"
          )}
        >
          {isGenerating ? (
            <Loader2 className="animate-spin" size={14} />
          ) : (
            <ChefHat size={14} />
          )}
          <span>{isGenerating ? "Création..." : `Générer (${selectedItemIds.size})`}</span>
        </button>
      </header>

      <main className="p-6 max-w-4xl mx-auto w-full space-y-6">
        <div className="space-y-1">
          <h2 className="text-white font-bold text-lg">Choix des ingrédients</h2>
          <p className="text-zinc-500 text-sm">
            Sélectionnez les ingrédients que vous souhaitez utiliser en priorité pour générer une recette anti-gaspi.
          </p>
        </div>

        {/* PWA Selection Control Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900 px-1">
          <span className="text-xs font-black uppercase tracking-wider text-zinc-500">
            {selectedItemIds.size} / {items.length} ingrédient{items.length > 1 ? 's' : ''}
          </span>
          <button
            type="button"
            onClick={handleSelectAll}
            className={cn(
              "text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border transition-all active:scale-95",
              allSelected
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
            )}
          >
            {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
        </div>

        {/* Compact PWA Ingredients List */}
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
                  "glass group rounded-2xl p-3 flex items-center gap-3 cursor-pointer transition-all duration-300 active:scale-[0.98]",
                  isSelected 
                    ? "bg-emerald-500/[0.04] border-emerald-500/30 shadow-md shadow-emerald-500/[0.01]" 
                    : "border-zinc-800/80 hover:border-zinc-700"
                )}
              >
                {/* Clean PWA Checkbox Pill */}
                <div className={cn(
                  "h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                  isSelected 
                    ? "bg-emerald-500 border-emerald-500 text-white animate-scale-in" 
                    : "border-zinc-700 bg-zinc-900"
                )}>
                  {isSelected && <Check size={12} strokeWidth={4} />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={cn(
                    "font-bold text-sm transition-colors truncate tracking-tight",
                    isSelected ? "text-emerald-400" : "text-white"
                  )}>
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className={cn(
                      "flex items-center gap-1 text-[9px] font-black uppercase tracking-wider",
                      isUrgent ? "text-rose-500" : isWarning ? "text-orange-500" : "text-emerald-500"
                    )}>
                      <Calendar size={8} />
                      {daysLeft < 0 ? "Périmé" : daysLeft === 0 ? "Aujourd'hui" : `J-${daysLeft}`}
                    </div>
                  </div>
                </div>

                {item.imageUrl && (
                  <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0">
                    <img src={item.imageUrl} alt="" className="w-full h-full object-cover opacity-70" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <BottomNav />

      {/* Full-Screen Zero-Waste Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6">
          <div className="w-full max-w-md p-8 glass rounded-[2.5rem] flex flex-col items-center space-y-6 text-center shadow-2xl border-zinc-800 animate-scale-in">
            {/* Spinning Outer Ring with Stationary Icon */}
            <div className="relative h-24 w-24 flex items-center justify-center mb-2">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10 border-t-emerald-400 animate-spin" />
              <div className="h-16 w-16 rounded-full bg-zinc-950 border border-zinc-850 flex items-center justify-center text-emerald-400 shadow-inner">
                <ChefHat size={28} />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-extrabold text-white text-lg tracking-tight">Le Chef virtuel cuisine...</h3>
              <p className="text-zinc-500 text-xs font-semibold uppercase tracking-widest">Création de votre recette anti-gaspi</p>
            </div>

            <div className="w-full h-px bg-zinc-850" />

            <div className="space-y-3 w-full">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/10">
                Pendant ce temps...
              </span>
              <div className="w-full bg-zinc-950/60 border border-zinc-850 rounded-2xl p-5 min-h-[110px] flex items-center justify-center transition-all duration-350">
                <p key={currentTipIdx} className="text-xs text-zinc-300 font-medium leading-relaxed italic text-center animate-fade-in">
                  {ZERO_WASTE_TIPS[currentTipIdx]}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
