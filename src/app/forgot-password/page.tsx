"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Failed to send reset link.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-500 to-blue-300 p-4">
      <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-blue-100">
        <h2 className="text-2xl font-extrabold mb-2 text-center text-blue-700">Forgot password?</h2>
        <p className="text-center text-sm text-slate-500 mb-6">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>

        {done ? (
          <div className="bg-green-50 border border-green-200 p-4 rounded text-sm text-green-800 text-center">
            <div className="text-3xl mb-2">📬</div>
            <p>If an account exists for <strong>{email}</strong>, a reset link has been sent.</p>
            <p className="mt-2 text-xs text-green-700">Check your inbox (and spam folder). The link expires in 1 hour.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="bg-red-50 text-red-700 text-sm p-2 rounded text-center">{error}</p>}
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 text-white w-full p-3 rounded-lg font-semibold shadow disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center text-sm text-slate-500 space-y-1">
          <p>
            Remembered it? <Link href="/login" className="text-blue-700 font-semibold hover:underline">Sign in</Link>
          </p>
          <p>
            <Link href="/" className="hover:underline">← Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
