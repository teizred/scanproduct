"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Refrigerator, ScanBarcode, ChefHat, User } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { label: "Accueil", href: "/", icon: Home },
    { label: "Frigo", href: "/fridge", icon: Refrigerator },
    { label: "Scanner", href: "/scan", icon: ScanBarcode, isPrimary: true },
    { label: "Recettes", href: "/recipes", icon: ChefHat },
    { label: "Profil", href: "/settings", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 px-6 pointer-events-none">
      <div className="glass rounded-3xl p-2 flex items-center justify-between w-full max-w-lg pointer-events-auto shadow-2xl shadow-black/50">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative -top-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 transition-transform active:scale-95"
              >
                <Icon size={28} />
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 gap-1 transition-colors rounded-2xl",
                isActive ? "text-emerald-500" : "text-zinc-500 hover:text-zinc-300"
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
