"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import GoogleButton from "@/components/GoogleButton";
import PasswordInput from "@/components/PasswordInput";
import AuthShell, { AuthHeading, AuthDivider, AccountTypeCards } from "@/components/AuthShell";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Invalid email or password.");
    } else {
      router.push(callbackUrl);
    }
  }

  return (
    <AuthShell statement="Welcome back to Streamflo." description="Sign in to continue learning, follow schools and manage your account.">
      <AuthHeading title="Sign in" subtitle="Use your email or username and password." />

      {error && (
        <div className="alert alert-error mb-5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <GoogleButton callbackUrl={callbackUrl} />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="label">Email or username</label>
          <input
            id="login-email"
            type="text"
            placeholder="you@example.com"
            autoComplete="username"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-slate-700">Password</label>
            <Link href="/forgot-password" className="link text-xs">
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            placeholder="Your password"
            autoComplete="current-password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="input"
            required
          />
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-8 border-t border-slate-200 pt-6">
        <p className="mb-3 text-sm font-medium text-ink">New to Streamflo? Create an account as a</p>
        <AccountTypeCards layout="row" />
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
