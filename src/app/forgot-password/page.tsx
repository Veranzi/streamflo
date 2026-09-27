"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Loader2, MailCheck, KeyRound } from "lucide-react";
import AuthShell, { AuthHeading } from "@/components/AuthShell";

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
    <AuthShell
      statement="Locked out? We will get you back in."
      description="Reset your password in a few steps and pick up where you left off."
      backHref="/login"
      backLabel="Back to sign in"
    >
      <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-primary-100">
        <KeyRound className="h-6 w-6" />
      </span>
      <AuthHeading
        title="Forgot your password?"
        subtitle="Enter your email and we'll send you a link to reset your password."
      />

      {done ? (
        <div className="rounded-xl border border-accent-200 bg-accent-50 p-5 text-sm text-accent-700">
          <div className="flex items-start gap-3">
            <MailCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p>If an account exists for <strong>{email}</strong>, a reset link has been sent.</p>
              <p className="mt-2 text-xs">Check your inbox and spam folder. The link expires in 1 hour.</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="alert alert-error">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label htmlFor="forgot-email" className="label">Email address</label>
            <input
              id="forgot-email"
              type="email"
              required
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-ink-soft">
        Remembered it? <Link href="/login" className="link">Sign in</Link>
      </p>
    </AuthShell>
  );
}
