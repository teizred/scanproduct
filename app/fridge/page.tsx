import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { fridgeItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { ChevronLeft, Plus } from "lucide-react";
import FridgeList from "@/app/fridge/FridgeList";
import BottomNav from "@/app/components/BottomNav";

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
    <div className="pb-32">
      <header className="p-6 flex items-center justify-between bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-30">
        <Link href="/" className="p-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-xl font-bold text-white tracking-tight">Mon Frigo</h1>
        <div className="flex items-center gap-2">
          <Link href="/add" className="p-2 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <Plus size={24} />
          </Link>
        </div>
      </header>

      <main className="p-6 max-w-4xl mx-auto w-full space-y-6">
        <FridgeList initialItems={items} />
      </main>

      <BottomNav />
    </div>
  );
}
