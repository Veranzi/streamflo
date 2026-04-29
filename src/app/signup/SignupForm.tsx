"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GoogleButton from "@/components/GoogleButton";
import PasswordInput from "@/components/PasswordInput";

interface Props {
  role: "parent" | "student";
  title: string;
  tagline: string;
  callbackUrl?: string;
}

export default function SignupForm({ role, title, tagline, callbackUrl = "/ai" }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "", email: "", phone: "",
    password: "", password2: "",
    grade: role === "student" ? 5 : undefined,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.password !== form.password2) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          grade: role === "student" ? form.grade : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Sign up failed."); setLoading(false); return; }

      // auto-login
      const signInRes = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (signInRes?.error) {
        setError("Account created — please sign in.");
        router.push("/login");
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  const accent = role === "parent" ? "blue" : "green";
  const accentBg = accent === "blue" ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700";
  const accentText = accent === "blue" ? "text-blue-700" : "text-green-700";

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow">
        <Link href="/signup" className="text-sm text-slate-500 hover:underline">← Choose a different account type</Link>

        <h1 className={`text-3xl font-extrabold mt-4 mb-1 ${accentText}`}>{title}</h1>
        <p className="text-slate-600 text-sm mb-6">{tagline}</p>

        {error && <p className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</p>}

        <GoogleButton pendingRole={role} callbackUrl={callbackUrl} label={`Continue with Google as ${role === "student" ? "Student" : "Parent"}`} />
        <div className="flex items-center my-4">
          <div className="flex-1 border-t" />
          <span className="px-3 text-xs text-slate-400 uppercase">or with email</span>
          <div className="flex-1 border-t" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input required placeholder="Full name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border p-3 rounded" />

          <input required type="email" placeholder="Email" value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border p-3 rounded" />

          <input placeholder="Phone (optional)" value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border p-3 rounded" />

          {role === "student" && (
            <div>
              <label className="text-sm font-medium text-slate-600">Current grade</label>
              <select value={form.grade}
                onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })}
                className="w-full border p-3 rounded mt-1">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) =>
                  <option key={g} value={g}>Grade {g}</option>
                )}
              </select>
            </div>
          )}

          <PasswordInput required placeholder="Password (min 6 characters)" value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border p-3 rounded" />

          <PasswordInput required placeholder="Confirm password" value={form.password2}
            onChange={(e) => setForm({ ...form, password2: e.target.value })}
            className="w-full border p-3 rounded" />

          <button type="submit" disabled={loading}
            className={`${accentBg} text-white w-full p-3 rounded-lg font-semibold transition disabled:opacity-60`}>
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account? <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
