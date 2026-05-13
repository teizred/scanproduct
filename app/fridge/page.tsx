import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { fridgeItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import FridgeList from "./FridgeList";

export default async function FridgePage() {
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
      <header className="bg-white dark:bg-zinc-900 p-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold">Mon Frigo</h1>
        <Link href="/scan" className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
          <Plus size={24} />
        </Link>
      </header>

      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <FridgeList initialItems={items} />
      </main>
    </div>
  );
}
