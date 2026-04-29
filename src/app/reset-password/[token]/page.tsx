"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PasswordInput from "@/components/PasswordInput";

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-500 to-blue-300 p-4">
      <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-blue-100">
        <h2 className="text-2xl font-extrabold mb-6 text-center text-blue-700">Set a new password</h2>

        {validity.kind === "checking" && (
          <p className="text-center text-slate-500">Checking link…</p>
        )}

        {validity.kind === "invalid" && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded text-sm text-center space-y-2">
            <p className="font-semibold">
              {validity.reason === "expired" ? "This reset link has expired."
                : validity.reason === "used" ? "This reset link has already been used."
                : "This reset link is invalid."}
            </p>
            <Link href="/forgot-password" className="inline-block mt-2 text-blue-700 hover:underline">
              Request a new link →
            </Link>
          </div>
        )}

        {validity.kind === "valid" && !done && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <p className="bg-red-50 text-red-700 text-sm p-2 rounded text-center">{error}</p>}
            <PasswordInput
              required
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <PasswordInput
              required
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="border w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-700 hover:bg-blue-800 text-white w-full p-3 rounded-lg font-semibold shadow disabled:opacity-60"
            >
              {loading ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        {done && (
          <div className="bg-green-50 border border-green-200 p-4 rounded text-sm text-green-800 text-center">
            <div className="text-3xl mb-2">✅</div>
            <p className="font-semibold">Password updated.</p>
            <p className="text-xs mt-1">Redirecting you to sign in…</p>
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">
          <Link href="/login" className="hover:underline">← Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
