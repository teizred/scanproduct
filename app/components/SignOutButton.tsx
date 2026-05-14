"use client";

import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return (
    <button
      onClick={handleSignOut}
      className="p-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-rose-500 hover:border-rose-500/30 transition-all active:scale-90"
      aria-label="Déconnexion"
    >
      <LogOut size={20} />
    </button>
  );
}
