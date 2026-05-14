import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { fridgeItems } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { BellRing, ArrowUpRight, TrendingDown, Info, ChefHat } from "lucide-react";
import BottomNav from "@/app/components/BottomNav";
import SignOutButton from "@/app/components/SignOutButton";
import IndiceInfo from "@/app/components/IndiceInfo";
import { cn } from "@/lib/utils";

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

  // 1. Freshness Score (100 - vigilanceIndex)
  const vigilanceIndex = items.length > 0 
    ? Math.round((expiringSoon.length / items.length) * 100) 
    : 0;
  const freshnessScore = 100 - vigilanceIndex;

  // 2. Health Score (Based on Nutri-Score)
  const nutriscoreMap: Record<string, number> = { a: 4, b: 3, c: 2, d: 1, e: 0 };
  const nutriscoreReverseMap = ["E", "D", "C", "B", "A"];
  const itemsWithNutriscore = items.filter(i => i.nutriscore && nutriscoreMap[i.nutriscore.toLowerCase()] !== undefined);
  const avgNutriscoreValue = itemsWithNutriscore.length > 0
    ? itemsWithNutriscore.reduce((acc, i) => acc + nutriscoreMap[i.nutriscore!.toLowerCase()], 0) / itemsWithNutriscore.length
    : 2; 
  const healthScore = (avgNutriscoreValue / 4) * 100;
  const avgNutriscoreLabel = nutriscoreReverseMap[Math.round(avgNutriscoreValue)];

  // 3. Diversity Score (Categories)
  const categories = new Set(items.map(i => i.category).filter(Boolean));
  const diversityCount = categories.size;
  const diversityScore = Math.min((diversityCount / 8) * 100, 100); // 8 categories = 100%

  // Global Frigo-Score
  const frigoScore = items.length > 0 
    ? Math.round((freshnessScore * 0.5) + (healthScore * 0.3) + (diversityScore * 0.2))
    : 100; // Perfect score if empty!

  let scoreMessage = "Frigo Exemplaire ! 🌟";
  if (frigoScore < 50) scoreMessage = "Alerte Gaspillage ! ⚠️";
  else if (frigoScore < 75) scoreMessage = "Peut mieux faire ! 🍎";
  else if (frigoScore < 90) scoreMessage = "Bonne gestion ! 👍";

  return (
    <div className="pb-32">
      {/* Header */}
      <header className="p-6 flex justify-between items-center bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-30">
        <div className="space-y-1">
          <p className="text-sm font-medium text-emerald-500 uppercase tracking-widest">Tableau de bord</p>
          <h1 className="text-2xl font-bold text-white">
            Hello, {session.user.name?.split(" ")[0] || "Toi"} ! 👋
          </h1>
        </div>
        <SignOutButton />
      </header>

      <main className="px-6 space-y-8 max-w-4xl mx-auto">
        {/* Hero Frigo-Score Card */}
        <div className={cn(
          "relative group overflow-hidden rounded-[2rem] p-8 glass border-zinc-800 transition-all",
          frigoScore < 50 ? "bg-gradient-to-br from-rose-500/20 to-transparent border-rose-500/20" : 
          frigoScore < 80 ? "bg-gradient-to-br from-amber-500/20 to-transparent border-amber-500/20" :
          "bg-gradient-to-br from-emerald-500/20 to-transparent border-emerald-500/20"
        )}>
          <IndiceInfo />
          
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-colors",
                frigoScore < 50 ? "bg-rose-500 shadow-rose-500/40" : 
                frigoScore < 80 ? "bg-amber-500 shadow-amber-500/40" :
                "bg-emerald-500 shadow-emerald-500/40"
              )}>
                <ChefHat className="text-white" size={24} />
              </div>
              <div>
                <p className="text-zinc-400 text-sm font-medium">Frigo-Score Global</p>
                <p className={cn(
                  "text-xs font-bold",
                  frigoScore < 50 ? "text-rose-400" : 
                  frigoScore < 80 ? "text-amber-400" :
                  "text-emerald-400"
                )}>
                  {scoreMessage}
                </p>
              </div>
            </div>
            
            <div className="flex items-baseline gap-2">
              <span className="text-7xl font-black text-white leading-none tracking-tighter">
                {frigoScore}
              </span>
              <span className="text-zinc-500 font-bold uppercase tracking-widest text-sm">/ 100</span>
            </div>

            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-1000",
                  frigoScore < 50 ? "bg-rose-500" : 
                  frigoScore < 80 ? "bg-amber-500" :
                  "bg-emerald-500"
                )} 
                style={{ width: `${frigoScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass rounded-[2rem] p-6 border-zinc-800 flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-zinc-500 text-sm font-medium">Qualité Nutritionnelle</p>
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold text-white">Grade {avgNutriscoreLabel}</p>
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black text-white",
                  avgNutriscoreLabel === "A" ? "bg-emerald-600" : 
                  avgNutriscoreLabel === "B" ? "bg-lime-500" :
                  avgNutriscoreLabel === "C" ? "bg-yellow-500" :
                  avgNutriscoreLabel === "D" ? "bg-orange-500" : "bg-rose-600"
                )}>
                  {avgNutriscoreLabel}
                </div>
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <ArrowUpRight className="text-zinc-400" size={24} />
            </div>
          </div>
          
          <div className="glass rounded-[2rem] p-6 border-zinc-800 flex items-center justify-between group">
            <div className="space-y-1">
              <p className="text-zinc-500 text-sm font-medium">Diversité Alimentaire</p>
              <p className="text-3xl font-bold text-white">{diversityCount} catégories</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
              <BellRing className="text-zinc-400" size={24} />
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
                      <div className="flex items-center gap-2">
                        <p className="text-zinc-500 text-xs">Qté: {item.quantity}</p>
                        {item.nutriscore && (
                          <span className="text-[10px] font-black text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded-md uppercase">
                            Nutri {item.nutriscore}
                          </span>
                        )}
                      </div>
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
