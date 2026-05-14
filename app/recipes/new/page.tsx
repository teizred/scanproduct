import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { fridgeItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import GenerateRecipeForm from "./GenerateRecipeForm";
import BottomNav from "@/app/components/BottomNav";

export default async function NewRecipePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const items = await db
    .select()
    .from(fridgeItems)
    .where(eq(fridgeItems.userId, session.user.id))
    .orderBy(asc(fridgeItems.expiryDate));

  return (
    <div className="pb-32">
      <header className="p-6 flex items-center bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-30">
        <Link href="/recipes" className="p-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors mr-4">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-white tracking-tight">Nouvelle Recette</h1>
      </header>

      <main className="p-6 max-w-4xl mx-auto w-full space-y-6">
        <div className="space-y-1">
          <h2 className="text-white font-bold text-lg">Choix des ingrédients</h2>
          <p className="text-zinc-500 text-sm">
            Sélectionnez les ingrédients que vous souhaitez utiliser en priorité pour générer une recette anti-gaspi.
          </p>
        </div>
        <GenerateRecipeForm items={items} />
      </main>

      <BottomNav />
    </div>
  );
}
