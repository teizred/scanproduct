"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const { error } = await authClient.signIn.email({
      email,
      password,
    });

    if (error) {
      setError(error.message ?? "Une erreur est survenue");
      return;
    }

    router.push("/");
  }

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 24 }}>
      <h1>Se connecter</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 12, padding: 8 }}
        />
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 12, padding: 8 }}
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" style={{ padding: "8px 16px" }}>
          Se connecter
        </button>
      </form>
    </div>
  );
}