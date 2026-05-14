"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, ArrowRight } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error } = await authClient.signIn.email({
        email,
        password,
      });

      if (error) {
        setError(error.message ?? "Une erreur est survenue");
        return;
      }

      router.push("/");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-zinc-950 to-zinc-950">
      <div className="w-full max-w-md space-y-8 glass p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent" />
        
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-white">
            Frigo <span className="text-emerald-500">Intelligent</span>
          </h1>
          <p className="text-zinc-400">Heureux de vous revoir !</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative group">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
            
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 text-rose-500 p-3 rounded-xl text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Se connecter
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-sm">
          <p className="text-zinc-500">
            Pas encore de compte ?{" "}
            <Link href="/sign-up" className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}