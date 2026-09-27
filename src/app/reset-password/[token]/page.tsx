"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, LockKeyhole, XCircle } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import AuthShell, { AuthHeading } from "@/components/AuthShell";

type ValidityState =
  | { kind: "checking" }
  | { kind: "valid" }
  | { kind: "invalid"; reason: "missing" | "not_found" | "used" | "expired" };

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = params?.token ?? "";

  const [validity, setValidity] = useState<ValidityState>({ kind: "checking" });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setValidity({ kind: "invalid", reason: "missing" }); return; }
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.valid) setValidity({ kind: "valid" });
        else setValidity({ kind: "invalid", reason: d.reason ?? "not_found" });
      })
      .catch(() => setValidity({ kind: "invalid", reason: "not_found" }));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Failed to reset password.");
      else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2500);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      statement="Choose a new password."
      description="Pick something strong that you have not used before."
      backHref="/login"
      backLabel="Back to sign in"
    >
      <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-primary-100">
        <LockKeyhole className="h-6 w-6" />
      </span>
      <AuthHeading title="Set a new password" subtitle="Your new password must be at least 6 characters." />

      {validity.kind === "checking" && (
        <p className="flex items-center gap-2 text-sm text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" /> Checking link...
        </p>
      )}

      {validity.kind === "invalid" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">
                {validity.reason === "expired" ? "This reset link has expired."
                  : validity.reason === "used" ? "This reset link has already been used."
                  : "This reset link is invalid."}
              </p>
              <Link href="/forgot-password" className="link mt-2 inline-flex items-center gap-1">
                Request a new link <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {validity.kind === "valid" && !done && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="alert alert-error">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label htmlFor="reset-password" className="label">New password</label>
            <PasswordInput
              id="reset-password"
              required
              placeholder="At least 6 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="reset-confirm" className="label">Confirm new password</label>
            <PasswordInput
              id="reset-confirm"
              required
              placeholder="Type it again"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="input"
            />
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      )}

      {done && (
        <div className="rounded-xl border border-accent-200 bg-accent-50 p-5 text-sm text-accent-700">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Password updated.</p>
              <p className="mt-1 text-xs">Redirecting you to sign in...</p>
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
