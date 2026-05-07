"use client";

import { authClient } from "@/lib/auth-client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const { error } = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (error) {
      setError(error.message ?? "Une erreur est survenue");
      return;
    }

    router.refresh(); // middleware detects the new session and redirects server-side
  }

  return (
    <div style={{ maxWidth: 400, margin: "100px auto", padding: 24 }}>
      <h1>Créer un compte</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: "block", width: "100%", marginBottom: 12, padding: 8 }}
        />
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
          S'inscrire
        </button>
      </form>
    </div>
  );
}