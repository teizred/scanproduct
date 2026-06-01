"use client";

import { useState } from "react";
import { ChefHat, Calendar, X, Utensils, ChevronRight, Globe, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type SharedRecipe = {
  id: string;
  title: string;
  content: string;
  createdAt: string | Date | null;
  ownerName: string | null;
  ownerId: string;
};

const ADJECTIVES = ["Chef", "Gourmet", "Marmiton", "Créatif", "Généreux", "Inspiré", "Pétillant", "Malicieux", "Passionné", "Aventurier"];
const FOODS = ["Basilic", "Paprika", "Romarin", "Safran", "Gingembre", "Coriandre", "Miel", "Citron", "Piment", "Curry"];
const GRADIENTS = [
  "from-emerald-400 to-cyan-400",
  "from-purple-400 to-pink-400",
  "from-amber-400 to-orange-400",
  "from-rose-400 to-red-400",
  "from-indigo-400 to-purple-400",
  "from-teal-400 to-emerald-400"
];

function getFriendlyPseudonym(ownerId: string, ownerName: string | null): string {
  if (ownerName && ownerName.trim().length > 0) {
    return ownerName;
  }
  
  let hash = 0;
  for (let i = 0; i < ownerId.length; i++) {
    hash = ownerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  
  const adjective = ADJECTIVES[hash % ADJECTIVES.length];
  const food = FOODS[(hash >> 2) % FOODS.length];
  return `${adjective} ${food}`;
}

function getAvatarGradient(ownerId: string): string {
  let hash = 0;
  for (let i = 0; i < ownerId.length; i++) {
    hash = ownerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  return GRADIENTS[hash % GRADIENTS.length];
}

// Helper to unescape JSON string characters on-the-fly for clean markdown display
function unescapeString(val: string): string {
  return val
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

// Helper to heal older broken or truncated JSON-stored recipes on-the-fly
function parseRecipeContent(content: string, fallbackTitle: string) {
  const text = content.trim();
  if (text.startsWith("{") || text.includes('"title"') && text.includes('"content"')) {
    let cleanText = text;
    // Strip JSON markdown wrapper if present
    if (cleanText.startsWith("```json")) {
      cleanText = cleanText.substring(7);
    } else if (cleanText.startsWith("```")) {
      cleanText = cleanText.substring(3);
    }
    if (cleanText.endsWith("```")) {
      cleanText = cleanText.substring(0, cleanText.length - 3);
    }
    cleanText = cleanText.trim();

    // 1. Try standard JSON.parse first
    try {
      const parsed = JSON.parse(cleanText);
      return {
        title: parsed.title || fallbackTitle,
        content: parsed.content || ""
      };
    } catch (e) {
      console.warn("Failed standard JSON parse, running robust regex healing parser:", e);
    }

    // 2. Fallback: Robust regex extraction for malformed or truncated JSON
    let title = fallbackTitle;
    let recipeContent = cleanText;

    // Extract title
    const titleMatch = cleanText.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (titleMatch) {
      title = unescapeString(titleMatch[1]);
    }

    // Extract content
    const contentMatch = cleanText.match(/"content"\s*:\s*"([\s\S]*)"/);
    if (contentMatch) {
      recipeContent = unescapeString(contentMatch[1]);
    } else {
      // If we couldn't match a complete closing quote for content (because it was truncated)
      // find where '"content"' starts and extract everything after the opening quote
      const contentKeyIdx = cleanText.indexOf('"content"');
      if (contentKeyIdx !== -1) {
        const startSearchIdx = contentKeyIdx + 9;
        const firstQuoteIdx = cleanText.indexOf('"', startSearchIdx);
        if (firstQuoteIdx !== -1) {
          let rawContent = cleanText.substring(firstQuoteIdx + 1);
          // Strip any trailing JSON formatting characters if present
          rawContent = rawContent.trim();
          if (rawContent.endsWith("}")) {
            rawContent = rawContent.substring(0, rawContent.length - 1).trim();
          }
          if (rawContent.endsWith('"')) {
            rawContent = rawContent.substring(0, rawContent.length - 1);
          }
          recipeContent = unescapeString(rawContent);
        }
      }
    }

    return {
      title,
      content: recipeContent
    };
  }

  return {
    title: fallbackTitle,
    content: content
  };
}

export default function SocialFeed({ initialRecipes }: { initialRecipes: SharedRecipe[] }) {
  const [recipes] = useState<SharedRecipe[]>(initialRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState<SharedRecipe | null>(null);

  const activeRecipeData = selectedRecipe 
    ? parseRecipeContent(selectedRecipe.content, selectedRecipe.title)
    : null;

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 glass rounded-[2rem] border-dashed border-zinc-800 text-center space-y-4">
        <div className="h-20 w-20 rounded-full bg-zinc-900 border border-zinc-850 flex items-center justify-center text-zinc-600 shadow-inner">
          <ChefHat size={36} />
        </div>
        <div className="space-y-1">
          <p className="text-white font-extrabold text-lg tracking-tight">Le feed est vide</p>
          <p className="text-zinc-550 text-xs max-w-xs mx-auto leading-relaxed">
            {"Aucune recette partagée par la communauté pour le moment. Allez dans l'onglet Recettes pour partager vos meilleures créations !"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {recipes.map((recipe) => {
          const healed = parseRecipeContent(recipe.content, recipe.title);
          const dateStr = recipe.createdAt 
            ? new Date(recipe.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
            : "";
          
          const pseudonym = getFriendlyPseudonym(recipe.ownerId, recipe.ownerName);
          const gradient = getAvatarGradient(recipe.ownerId);

          return (
            <div 
              key={recipe.id} 
              className="glass rounded-[2rem] border-zinc-850 overflow-hidden flex flex-col hover:border-zinc-700 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-lg cursor-pointer"
              onClick={() => setSelectedRecipe(recipe)}
            >
              {/* Owner Header Info (strictly anonymous and secure) */}
              <div className="p-4 bg-zinc-900/40 border-b border-zinc-850 flex items-center gap-3">
                <div className={cn("h-8 w-8 rounded-full flex items-center justify-center text-zinc-950 font-extrabold text-xs uppercase bg-gradient-to-br shadow-inner shrink-0", gradient)}>
                  {pseudonym[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-black tracking-tight leading-none truncate">
                    {pseudonym}
                  </p>
                  <p className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider mt-0.5">
                    Chef de la Communauté
                  </p>
                </div>
                <span className="flex items-center gap-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  <Globe size={9} />
                  Public
                </span>
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <h3 className="text-base font-extrabold text-white tracking-tight leading-snug break-words">
                    {healed.title}
                  </h3>
                  <p className="text-zinc-500 text-[10px] font-medium uppercase tracking-wider flex items-center gap-1.5 leading-none">
                    <Calendar size={11} className="text-zinc-650" />
                    Partagée le {dateStr}
                  </p>
                </div>

                {/* Open Button */}
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900/60 hover:bg-zinc-800 text-white font-bold py-2.5 px-4 rounded-xl border border-zinc-850 hover:border-zinc-700 transition-colors active:scale-[0.98] text-xs shrink-0"
                >
                  <Sparkles size={13} className="text-emerald-400" />
                  <span>Voir la recette</span>
                  <ChevronRight size={13} className="text-zinc-500 ml-auto" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Shared Recipe Full Screen Modal */}
      {selectedRecipe && activeRecipeData && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-zinc-950 animate-fade-in">
          {/* Content Container */}
          <div className="w-full h-full flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="border-b border-zinc-900 shrink-0 bg-zinc-950">
              <div className="max-w-4xl mx-auto w-full px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <Utensils size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg tracking-tight leading-none">
                      {activeRecipeData.title}
                    </h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                      Partagé par {getFriendlyPseudonym(selectedRecipe.ownerId, selectedRecipe.ownerName)}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="p-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all active:scale-90"
                  aria-label="Fermer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Scrollable Detailed Recipe Content */}
            <div className="w-full overflow-y-auto flex-1 bg-zinc-950 scrollbar-none">
              <div className="p-6 pb-20 md:p-8 md:pb-24 prose prose-zinc dark:prose-invert max-w-4xl mx-auto w-full prose-emerald prose-p:text-zinc-300 prose-headings:text-white prose-li:text-zinc-300 prose-strong:text-emerald-400">
                <ReactMarkdown>{activeRecipeData.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
