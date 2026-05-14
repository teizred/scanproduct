import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { fridgeItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { BellRing, ArrowUpRight, TrendingDown, Info } from "lucide-react";
import BottomNav from "@/app/components/BottomNav";
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
    <div className="pb-32">
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="space-y-1">
          <p className="text-sm font-medium text-emerald-500 uppercase tracking-widest">Dashboard</p>
          <h1 className="text-2xl font-bold text-white">
            Hello, {session.user.name?.split(" ")[0] || "Toi"} ! 👋
          </h1>
        </div>
        <SignOutButton />
      </header>

      <main className="px-6 space-y-8 max-w-4xl mx-auto">
        {/* Hero Score Card */}
        <div className="relative group overflow-hidden rounded-[2rem] p-8 glass bg-gradient-to-br from-emerald-500/20 to-transparent border-emerald-500/20">
          <div className="absolute top-0 right-0 p-4">
            <Info size={20} className="text-emerald-500/50" />
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                <TrendingDown className="text-white" size={24} />
              </div>
              <div>
                <p className="text-zinc-400 text-sm font-medium">Score Anti-Gaspi</p>
                <p className="text-emerald-400 text-xs">+12% vs mois dernier</p>
              </div>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-white leading-none tracking-tighter">
                {antiWasteScore}
              </span>
              <span className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Points</span>
            </div>

            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[85%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass rounded-[2rem] p-6 border-zinc-800 flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-zinc-500 text-sm font-medium">Économies Estimées</p>
              <p className="text-3xl font-bold text-white">{moneySaved} €</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors">
              <ArrowUpRight className="text-zinc-400 group-hover:text-emerald-500 transition-colors" size={24} />
            </div>
          </div>
          
          <div className="glass rounded-[2rem] p-6 border-zinc-800 flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-zinc-500 text-sm font-medium">Items en stock</p>
              <p className="text-3xl font-bold text-white">{items.length}</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
              <BellRing className="text-zinc-400 group-hover:text-blue-500 transition-colors" size={24} />
            </div>
          </div>
        </div>

        {/* Alerts Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              À consommer vite
            </h2>
            <span className="text-zinc-500 text-sm font-medium">{expiringSoon.length} items</span>
          </div>

          {expiringSoon.length > 0 ? (
            <div className="space-y-3">
              {expiringSoon.map((item) => {
                const daysLeft = Math.ceil((new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
                const isUrgent = daysLeft <= 1;

                return (
                  <div key={item.id} className="glass group rounded-3xl p-4 border-zinc-800 flex items-center gap-4 hover:border-zinc-700 transition-colors">
                    <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden flex items-center justify-center">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-zinc-700 font-bold text-xl">{item.name[0]}</div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{item.name}</h3>
                      <p className="text-zinc-500 text-sm">Qté: {item.quantity}</p>
                    </div>

                    <div className={`px-4 py-2 rounded-2xl text-sm font-black ${
                      isUrgent 
                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" 
                        : "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                    }`}>
                      {daysLeft <= 0 ? "DLC" : `J-${daysLeft}`}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass rounded-[2rem] p-12 border-dashed border-zinc-800 flex flex-col items-center justify-center text-center space-y-2">
              <div className="h-16 w-16 rounded-full bg-zinc-900 flex items-center justify-center text-3xl">🎉</div>
              <p className="text-white font-bold">Zéro gaspillage !</p>
              <p className="text-zinc-500 text-sm">Tout est sous contrôle dans votre frigo.</p>
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
