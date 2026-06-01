import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft, Plus, ChefHat, Sparkles } from "lucide-react";
import BottomNav from "@/app/components/BottomNav";
import RecipesList from "@/app/recipes/RecipesList";

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

      <main className="p-6 max-w-7xl mx-auto w-full space-y-8">
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
          <RecipesList savedRecipes={savedRecipes} />
        )}
      </main>

      <BottomNav />
    </div>
  );
}
