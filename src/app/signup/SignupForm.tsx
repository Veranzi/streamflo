"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2, MessageSquareText, Compass, BookOpen, Search, Sparkles, ShieldCheck } from "lucide-react";
import GoogleButton from "@/components/GoogleButton";
import PasswordInput from "@/components/PasswordInput";
import AuthShell, { AuthHeading, AuthDivider, AccountTypeCards, type AuthBenefit } from "@/components/AuthShell";

interface Props {
  role: "parent" | "student";
  title: string;
  tagline: string;
  callbackUrl?: string;
}

const PARENT_BENEFITS: AuthBenefit[] = [
  { icon: Search, title: "Compare schools", text: "Filter schools by county, curriculum, gender and boarding." },
  { icon: MessageSquareText, title: "Homework help", text: "Support your children with CBE focused AI tutoring." },
  { icon: Compass, title: "Career guidance", text: "See career pathway predictions for your child." },
];

const STUDENT_BENEFITS: AuthBenefit[] = [
  { icon: Sparkles, title: "Study help any time", text: "Ask questions and get clear CBE explanations." },
  { icon: BookOpen, title: "Curated notes", text: "Notes organised by grade and learning area." },
  { icon: ShieldCheck, title: "Free and private", text: "Your account and progress stay secure." },
];

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
        setError("Account created. Please sign in.");
        router.push("/login");
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  }

  return (
    <AuthShell
      statement={role === "parent" ? "Help your children learn and grow." : "Learn smarter, every day."}
      description={role === "parent"
        ? "Streamflo helps Kenyan parents support learning at home and choose the right school."
        : "Streamflo helps students across Kenya learn with confidence and plan their future."}
      benefits={role === "parent" ? PARENT_BENEFITS : STUDENT_BENEFITS}
      width="lg"
      backHref="/signup"
      backLabel="All account types"
    >
      <AuthHeading title={title} subtitle={tagline} />

      <div className="mb-6">
        <p className="label">Account type</p>
        <AccountTypeCards layout="row" active={role} />
      </div>

      {error && (
        <div className="alert alert-error mb-5">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <GoogleButton pendingRole={role} callbackUrl={callbackUrl} label={`Continue with Google as ${role === "student" ? "Student" : "Parent"}`} />
      <AuthDivider />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="su-name" className="label">Full name</label>
          <input id="su-name" required placeholder="Jane Wanjiku" autoComplete="name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="su-email" className="label">Email</label>
            <input id="su-email" required type="email" placeholder="you@example.com" autoComplete="email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input" />
          </div>
          <div>
            <label htmlFor="su-phone" className="label">
              Phone <span className="font-normal text-ink-soft">(optional)</span>
            </label>
            <input id="su-phone" placeholder="07XX XXX XXX" autoComplete="tel" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input" />
          </div>
        </div>

        {role === "student" && (
          <div>
            <label htmlFor="su-grade" className="label">Current grade</label>
            <select id="su-grade" value={form.grade}
              onChange={(e) => setForm({ ...form, grade: Number(e.target.value) })}
              className="select">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) =>
                <option key={g} value={g}>Grade {g}</option>
              )}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="su-password" className="label">Password</label>
            <PasswordInput id="su-password" required placeholder="At least 6 characters" autoComplete="new-password" value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input" />
          </div>
          <div>
            <label htmlFor="su-password2" className="label">Confirm password</label>
            <PasswordInput id="su-password2" required placeholder="Type it again" autoComplete="new-password" value={form.password2}
              onChange={(e) => setForm({ ...form, password2: e.target.value })}
              className="input" />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-soft">
        Already have an account? <Link href="/login" className="link">Sign in</Link>
      </p>
    </AuthShell>
  );
}
