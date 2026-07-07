"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError("Incorrect email or password.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (err) {
      console.error("Admin sign-in failed:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to sign in right now. Please check your Supabase configuration."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.h1}>Photographer sign in</h1>
      <form onSubmit={handleLogin} className={styles.form}>
        <div>
          <label htmlFor="admin-email" className={styles.label}>
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={styles.input}
          />
        </div>
        <div>
          <label htmlFor="admin-password" className={styles.label}>
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
          />
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" disabled={loading} className={styles.button}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
