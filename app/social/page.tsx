import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { recipes, users } from "@/db/schema";
import { eq, and, ne, count, desc } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import BottomNav from "@/app/components/BottomNav";
import SocialFeed from "@/app/social/SocialFeed";

export default async function SocialPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  // 1. Fetch all shared recipes from other users, joining user name for pseudonymization/display (omitting emails)
  const sharedRecipes = await db
    .select({
      id: recipes.id,
      title: recipes.title,
      content: recipes.content,
      createdAt: recipes.createdAt,
      ownerName: users.name,
      ownerId: users.id,
    })
    .from(recipes)
    .innerJoin(users, eq(recipes.userId, users.id))
    .where(
      and(
        eq(recipes.isShared, true),
        ne(recipes.userId, session.user.id)
      )
    )
    .orderBy(desc(recipes.createdAt));

  // 2. Fetch total public shared recipes count
  const totalCountResult = await db
    .select({ count: count() })
    .from(recipes)
    .where(eq(recipes.isShared, true));
  const totalSavedCount = totalCountResult[0]?.count || 0;

  return (
    <div className="pb-32">
      <header className="p-6 flex items-center justify-between bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-30">
        <Link href="/" className="p-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-white tracking-tight">Partage Communautaire</h1>
        <div className="w-10" />
      </header>

      <main className="p-6 max-w-4xl mx-auto w-full space-y-8">
        {/* Community Hero Stats */}
        <div className="relative group overflow-hidden rounded-[2rem] p-8 glass border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-transparent">
          <div className="space-y-2">
            <p className="text-sm font-medium text-emerald-400 uppercase tracking-widest">Anti-gaspillage collectif</p>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              {totalSavedCount} recettes partagées ! 🍳
            </h2>
            <p className="text-zinc-400 text-sm max-w-md">
              Découvrez les recettes savoureuses partagées par la communauté pour cuisiner malin et éviter le gaspillage alimentaire.
            </p>
          </div>
        </div>

        {/* Social Feed Component */}
        <SocialFeed initialRecipes={sharedRecipes} />
      </main>

      <BottomNav />
    </div>
  );
}
