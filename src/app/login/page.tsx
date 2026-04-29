"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import GoogleButton from "@/components/GoogleButton";
import PasswordInput from "@/components/PasswordInput";

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
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-blue-700 via-blue-500 to-blue-300 p-4"
         style={{
           backgroundImage: `radial-gradient(circle at 20% 30%, rgba(96,165,250,0.25), transparent 70%),
                              radial-gradient(circle at 80% 70%, rgba(29,78,216,0.25), transparent 60%)`
         }}>

      <div className="bg-white/95 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-blue-100">
        <h2 className="text-3xl font-extrabold mb-2 text-center text-blue-700">Welcome back</h2>
        <p className="text-center text-sm text-slate-500 mb-6">Sign in to your Streamflo account</p>

        {error && (
          <p className="bg-red-50 text-red-700 text-center text-sm mb-4 p-2 rounded">{error}</p>
        )}

        <GoogleButton callbackUrl={callbackUrl} />
        <div className="flex items-center my-4">
          <div className="flex-1 border-t" />
          <span className="px-3 text-xs text-slate-400 uppercase">or with email</span>
          <div className="flex-1 border-t" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="border w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />

          <PasswordInput
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border w-full p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            required
          />

          <div className="text-right -mt-2">
            <Link href="/forgot-password" className="text-xs text-blue-600 hover:underline">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-700 hover:bg-blue-800 text-white w-full p-3 rounded-lg font-semibold text-lg shadow transition disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-slate-600 mb-3">New to Streamflo?</p>
          <div className="grid grid-cols-1 gap-2">
            <Link href="/signup/parent" className="text-sm border border-blue-200 text-blue-700 rounded-lg p-2 hover:bg-blue-50">
              👨‍👩‍👧 Sign up as a Parent
            </Link>
            <Link href="/signup/student" className="text-sm border border-green-200 text-green-700 rounded-lg p-2 hover:bg-green-50">
              🎓 Sign up as a Student
            </Link>
            <Link href="/register" className="text-sm border border-indigo-200 text-indigo-700 rounded-lg p-2 hover:bg-indigo-50">
              🏫 Register a School
            </Link>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          <Link href="/" className="hover:underline">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
