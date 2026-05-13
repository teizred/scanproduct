"use client";

import { useState } from "react";
import { Trash2, Refrigerator } from "lucide-react";
import { useRouter } from "next/navigation";

type FridgeItem = {
  id: string;
  name: string;
  expiryDate: string | Date;
  quantity: number;
  imageUrl: string | null;
};

export default function FridgeList({ initialItems }: { initialItems: FridgeItem[] }) {
  const [items, setItems] = useState<FridgeItem[]>(initialItems);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    try {
      const res = await fetch(`/api/fridge/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setItems(items.filter((item) => item.id !== id));
        router.refresh(); // Update the server data
      } else {
        alert("Erreur lors de la suppression");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur réseau");
    } finally {
      setIsDeleting(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Refrigerator size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" />
        <p className="text-zinc-500 dark:text-zinc-400 font-medium">Votre frigo est vide.</p>
        <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">Scannez des produits pour commencer.</p>
      </div>
    );
  }

  const now = new Date();

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const expiry = new Date(item.expiryDate);
        const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 3600 * 24));
        
        let statusColor = "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20";
        if (daysLeft <= 1) statusColor = "text-rose-500 bg-rose-50 dark:bg-rose-900/20";
        else if (daysLeft <= 3) statusColor = "text-orange-500 bg-orange-50 dark:bg-orange-900/20";

        return (
          <div key={item.id} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center space-x-4 overflow-hidden">
              <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Refrigerator size={24} className="text-zinc-400" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-base truncate">{item.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${statusColor}`}>
                    {daysLeft < 0 ? "Périmé" : daysLeft === 0 ? "Aujourd'hui" : `J-${daysLeft}`}
                  </span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">Qté: {item.quantity}</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => handleDelete(item.id)}
              disabled={isDeleting === item.id}
              className="p-3 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors disabled:opacity-50"
              aria-label="Supprimer"
            >
              <Trash2 size={20} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
