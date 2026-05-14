import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft, Plus, ChefHat, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import BottomNav from "@/app/components/BottomNav";

export default async function RecipesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const savedRecipes = await db
    .select()
    .from(recipes)
    .where(eq(recipes.userId, session.user.id))
    .orderBy(desc(recipes.createdAt));

  return (
    <div className="pb-32">
      <header className="p-6 flex items-center justify-between bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-30">
        <Link href="/" className="p-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-white tracking-tight">Mes Recettes</h1>
        <Link href="/recipes/new" className="p-2 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
          <Plus size={24} />
        </Link>
      </header>

      <main className="p-6 max-w-4xl mx-auto w-full space-y-8">
        {savedRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 glass rounded-[2rem] border-dashed border-zinc-800 text-center space-y-6">
            <div className="h-20 w-20 rounded-full bg-zinc-900 flex items-center justify-center">
              <ChefHat size={40} className="text-zinc-700" />
            </div>
            <div className="space-y-1">
              <p className="text-white font-bold text-lg">Aucune recette pour le moment</p>
              <p className="text-zinc-500 text-sm">Générez des recettes intelligentes basées sur vos produits qui expirent bientôt.</p>
            </div>
            <Link 
              href="/recipes/new" 
              className="flex items-center gap-2 bg-emerald-500 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-colors"
            >
              <Sparkles size={18} />
              Générer une recette
            </Link>
          </div>
        ) : (
          savedRecipes.map((recipe) => (
            <div key={recipe.id} className="glass rounded-[2rem] border-zinc-800 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 p-6 border-b border-zinc-800 flex items-center justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-white tracking-tight leading-none">
                    {recipe.title}
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">
                    Générée le {new Date(recipe.createdAt!).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-zinc-950 flex items-center justify-center text-emerald-500 border border-zinc-800">
                  <ChefHat size={20} />
                </div>
              </div>
              <div className="p-8 prose prose-zinc dark:prose-invert max-w-none prose-emerald prose-p:text-zinc-300 prose-headings:text-white prose-li:text-zinc-300">
                <ReactMarkdown>{recipe.content}</ReactMarkdown>
              </div>
            </div>
          ))
        )}
      </main>

      <BottomNav />
    </div>
  );
}
