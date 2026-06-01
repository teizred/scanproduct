"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Refrigerator, ScanBarcode, ChefHat, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Accueil", href: "/", icon: Home },
    { label: "Frigo", href: "/fridge", icon: Refrigerator },
    { label: "Scanner", href: "/scan", icon: ScanBarcode },
    { label: "Recettes", href: "/recipes", icon: ChefHat },
    { label: "Partage", href: "/social", icon: Users },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 px-6 pointer-events-none">
      <div className="glass rounded-3xl p-2 flex items-center justify-between w-full max-w-lg pointer-events-auto shadow-2xl shadow-black/50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 gap-1 transition-colors rounded-2xl",
                isActive ? "text-emerald-500" : "text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
