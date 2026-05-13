import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { fridgeItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import Link from "next/link";
import { ScanBarcode, Refrigerator, ChefHat, BellRing, LogOut } from "lucide-react";
import SignOutButton from "@/app/components/SignOutButton";

export default async function Dashboard() {
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

  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  const expiringSoon = items.filter(
    (item) => new Date(item.expiryDate) <= threeDaysFromNow
  );

  // Mock stats for MVP
  const moneySaved = "25.50";
  const antiWasteScore = 850;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-20">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 p-6 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            Frigo Intelligent
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Bonjour, {session.user.name || "Utilisateur"} 👋
          </p>
        </div>
        <SignOutButton />
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Score Anti-Gaspi</span>
            <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{antiWasteScore}</span>
            <span className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">+50 ce mois</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center">
            <span className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Économies</span>
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{moneySaved} €</span>
            <span className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1">Estimées ce mois</span>
          </div>
        </div>

        {/* Quick Actions */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Actions Rapides</h2>
          <div className="grid grid-cols-3 gap-3">
            <Link href="/scan" className="flex flex-col items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 p-4 rounded-2xl transition-transform active:scale-95">
              <ScanBarcode className="mb-2" size={28} />
              <span className="text-sm font-medium">Scanner</span>
            </Link>
            <Link href="/fridge" className="flex flex-col items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 p-4 rounded-2xl transition-transform active:scale-95">
              <Refrigerator className="mb-2" size={28} />
              <span className="text-sm font-medium">Mon Frigo</span>
            </Link>
            <Link href="/recipes/new" className="flex flex-col items-center justify-center bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 p-4 rounded-2xl transition-transform active:scale-95">
              <ChefHat className="mb-2" size={28} />
              <span className="text-sm font-medium">Recettes</span>
            </Link>
          </div>
        </section>

        {/* Alerts / Expiring Soon */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <BellRing size={20} className="mr-2 text-rose-500" />
              À consommer vite
            </h2>
            <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 text-xs font-bold px-2 py-1 rounded-full">
              {expiringSoon.length}
            </span>
          </div>

          {expiringSoon.length > 0 ? (
            <div className="space-y-3">
              {expiringSoon.map((item) => {
                const daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
                return (
                  <div key={item.id} className="bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden flex items-center justify-center">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <Refrigerator size={20} className="text-zinc-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-medium text-base">{item.name}</h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">Qté: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${daysLeft <= 1 ? 'text-rose-500' : 'text-orange-500'}`}>
                        {daysLeft <= 0 ? "Aujourd'hui" : `J-${daysLeft}`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800 text-center">
              <p className="text-zinc-500 dark:text-zinc-400">Tout va bien, rien ne périme bientôt !</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
