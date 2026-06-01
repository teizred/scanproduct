"use client";

import { useState } from "react";
import { ChefHat, Calendar, Sparkles, X, Heart, Clock, Utensils, ChevronRight, Globe, Share2, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

type Recipe = {
  id: string;
  userId: string;
  title: string;
  content: string;
  usedItems: any;
  isShared: boolean;
  createdAt: string | Date | null;
};

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

export default function RecipesList({ savedRecipes }: { savedRecipes: Recipe[] }) {
  const [recipes, setRecipes] = useState<Recipe[]>(savedRecipes);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isSharing, setIsSharing] = useState<string | null>(null);

  // Helper to get raw array from Drizzle JSON field
  const getUsedItems = (usedItems: any): any[] => {
    if (!usedItems) return [];
    if (typeof usedItems === "string") {
      try { return JSON.parse(usedItems); } catch { return []; }
    }
    return Array.isArray(usedItems) ? usedItems : [];
  };

  const handleToggleShare = async (id: string, currentShared: boolean) => {
    setIsSharing(id);
    try {
      const res = await fetch(`/api/recipes/${id}/share`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isShared: !currentShared }),
      });
      if (res.ok) {
        setRecipes(
          recipes.map((r) =>
            r.id === id ? { ...r, isShared: !currentShared } : r
          )
        );
        if (selectedRecipe && selectedRecipe.id === id) {
          setSelectedRecipe({ ...selectedRecipe, isShared: !currentShared });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSharing(null);
    }
  };

  const activeRecipeData = selectedRecipe 
    ? parseRecipeContent(selectedRecipe.content, selectedRecipe.title)
    : null;

  return (
    <div className="space-y-6">
      {/* Vertical Grid of Recipe Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {recipes.map((recipe, index) => {
          const healed = parseRecipeContent(recipe.content, recipe.title);
          const itemsUsed = getUsedItems(recipe.usedItems);
          const dateStr = recipe.createdAt 
            ? new Date(recipe.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
            : "";

          return (
            <div 
              key={recipe.id} 
              className={cn(
                "bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 rounded-[2rem] overflow-hidden flex flex-col hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-lg cursor-pointer w-full backdrop-blur-md"
              )}
              onClick={() => setSelectedRecipe(recipe)}
            >
              {/* Header */}
              <div className="p-5 bg-zinc-950/40 border-b border-zinc-850 flex items-center justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/10">
                    Chef Recette
                  </span>
                  <p className="text-zinc-550 text-xs font-medium uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
                    <Calendar size={12} className="text-zinc-500" />
                    Générée le {dateStr}
                  </p>
                </div>
                {recipe.isShared && (
                  <span className="flex items-center gap-1.5 text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-xl uppercase tracking-wider shadow-sm">
                    <Globe size={10} />
                    Partagée
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <h3 className="text-lg font-extrabold text-white tracking-tight leading-snug">
                    {healed.title}
                  </h3>
                </div>

                {/* Open Button */}
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900/60 hover:bg-zinc-800 text-white font-bold py-2.5 px-4 rounded-xl border border-zinc-850 hover:border-zinc-700 transition-colors active:scale-[0.98] text-sm shrink-0"
                >
                  <Sparkles size={15} className="text-emerald-400" />
                  <span>Voir la recette</span>
                  <ChevronRight size={15} className="text-zinc-500 ml-auto" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Recipe Full Screen Modal */}
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
                      Cuisine Anti-Gaspillage
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Share Recipe Toggle Button */}
                  <button
                    onClick={() => handleToggleShare(selectedRecipe.id, selectedRecipe.isShared)}
                    disabled={isSharing === selectedRecipe.id}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all font-bold text-xs uppercase tracking-wider active:scale-95 disabled:opacity-50",
                      selectedRecipe.isShared
                        ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20"
                        : "text-zinc-400 bg-zinc-900 border-zinc-800 hover:text-white hover:border-zinc-750"
                    )}
                  >
                    {isSharing === selectedRecipe.id ? (
                      <Loader2 size={13} className="animate-spin text-emerald-500" />
                    ) : (
                      <Globe size={13} />
                    )}
                    <span>{selectedRecipe.isShared ? "Partagée" : "Partager"}</span>
                  </button>

                  <button
                    onClick={() => setSelectedRecipe(null)}
                    className="p-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all active:scale-90"
                    aria-label="Fermer"
                  >
                    <X size={20} />
                  </button>
                </div>
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
