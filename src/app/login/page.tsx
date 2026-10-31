"use client";

import { createBrowserClient } from "@supabase/ssr";
import Link from "next/link";
import { useState, type FormEvent } from "react";

export default function LoginPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    setError("");
    setMessage("");
    setBusy(true);

    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !key) {
        setError("Sign-in is currently unavailable.");
        return;
      }

      const supabase = createBrowserClient(url, key);

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        setError("Unable to sign in. Check your email and password.");
        return;
      }

      form.reset();
      setMessage("You are signed in.");
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const focus =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <h1 className="mb-3 text-3xl font-bold">Sign in</h1>
      <p className="mb-6">
        Sign in to manage your property listings.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="mb-1 block font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className={`w-full rounded border border-gray-500 p-3 ${focus}`}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block font-medium">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className={`w-full rounded border border-gray-500 p-3 ${focus}`}
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className={`rounded bg-blue-700 px-5 py-3 font-semibold text-white disabled:opacity-60 ${focus}`}
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        {error && <p role="alert">{error}</p>}
        <p role="status">{message}</p>
      </form>

      <Link href="/" className={`mt-6 inline-block underline ${focus}`}>
        Back to properties
      </Link>
    </main>
  );
}
