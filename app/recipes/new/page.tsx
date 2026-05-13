import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { fridgeItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import GenerateRecipeForm from "./GenerateRecipeForm";

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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 flex flex-col pb-20">
      <header className="bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-center sticky top-0 z-10">
        <Link href="/" className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 mr-4">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Générer une Recette</h1>
      </header>

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          Sélectionnez les ingrédients que vous souhaitez utiliser en priorité pour générer une recette anti-gaspi.
        </p>
        <GenerateRecipeForm items={items} />
      </main>
    </div>
  );
}
