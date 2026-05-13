import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recipes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft, Plus, ChefHat } from "lucide-react";
import ReactMarkdown from "react-markdown";

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col pb-20">
      <header className="bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Mes Recettes</h1>
        <Link href="/recipes/new" className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
          <Plus size={24} />
        </Link>
      </header>

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6">
        {savedRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <ChefHat size={48} className="text-zinc-300 dark:text-zinc-700 mb-4" />
            <p className="text-zinc-500 dark:text-zinc-400 font-medium">Aucune recette pour le moment.</p>
            <Link href="/recipes/new" className="mt-4 text-emerald-600 font-medium hover:underline">
              Générer une recette
            </Link>
          </div>
        ) : (
          savedRecipes.map((recipe) => (
            <div key={recipe.id} className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 border-b border-emerald-100 dark:border-emerald-900/30">
                <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-400">
                  {recipe.title}
                </h2>
                <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                  Générée le {new Date(recipe.createdAt!).toLocaleDateString("fr-FR")}
                </p>
              </div>
              <div className="p-6 prose prose-zinc dark:prose-invert max-w-none prose-emerald">
                <ReactMarkdown>{recipe.content}</ReactMarkdown>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
