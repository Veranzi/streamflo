"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PasswordInput from "@/components/PasswordInput";
import { StatCard } from "@/components/ui";
import type { LucideIcon } from "lucide-react";
import {
  Users, GraduationCap, School, Shield, CalendarDays, Phone, Crown, ArrowRight, MessagesSquare,
  Compass, LayoutDashboard, UserRound, CircleCheck, TriangleAlert, Loader2, KeyRound, Lock,
  LogOut, ChevronRight,
} from "lucide-react";

interface AccountInfo {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  role: "parent" | "student" | "institution" | "admin";
  student_grade: number | null;
  school_id: number | null;
  created_at: string;
  has_password: boolean;
  stats?: {
    chats: number;
    predictions: number;
    subscriptions: number;
  };
}

export default function AccountPage() {
  const { status } = useSession();
  const router = useRouter();
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [grade, setGrade] = useState<number | "">("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // Password form
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => { if (status === "unauthenticated") router.push("/login?callbackUrl=/account"); }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/account").then((r) => r.json()).then((data: AccountInfo) => {
      setAccount(data);
      setName(data.username ?? "");
      setPhone(data.phone ?? "");
      setGrade(data.student_grade ?? "");
    }).catch(() => {}).finally(() => setLoading(false));
  }, [status]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: name,
          phone: phone || null,
          student_grade: account?.role === "student" ? (grade === "" ? null : Number(grade)) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) setProfileMsg({ type: "err", text: data.error ?? "Failed to save." });
      else setProfileMsg({ type: "ok", text: "Profile updated." });
    } catch {
      setProfileMsg({ type: "err", text: "Network error." });
    } finally {
      setSavingProfile(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);
    if (newPwd !== newPwd2) { setPwdMsg({ type: "err", text: "Passwords do not match." }); return; }
    if (newPwd.length < 6) { setPwdMsg({ type: "err", text: "Password must be at least 6 characters." }); return; }

    setSavingPwd(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current: currentPwd, next: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) setPwdMsg({ type: "err", text: data.error ?? "Failed to change password." });
      else {
        setPwdMsg({ type: "ok", text: "Password changed." });
        setCurrentPwd(""); setNewPwd(""); setNewPwd2("");
      }
    } catch {
      setPwdMsg({ type: "err", text: "Network error." });
    } finally {
      setSavingPwd(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <>
        <Navbar />
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
          <div className="skeleton mb-2 h-8 w-48" />
          <div className="skeleton mb-8 h-4 w-72" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="card card-pad space-y-3 lg:col-span-1">
              <div className="skeleton h-16 w-16 rounded-full" />
              <div className="skeleton h-4 w-2/3" />
              <div className="skeleton h-3 w-1/2" />
            </div>
            <div className="card card-pad space-y-3 lg:col-span-2">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-10 w-full" />
              <div className="skeleton h-10 w-full" />
            </div>
          </div>
        </div>
      </>
    );
  }
  if (!account) return null;

  const roleLabel = {
    parent: "Parent", student: "Student", institution: "School", admin: "Admin",
  }[account.role];
  const roleBadge = {
    parent: "badge-blue",
    student: "badge-green",
    institution: "badge-purple",
    admin: "badge-amber",
  }[account.role];
  const RoleIcon = {
    parent: Users, student: GraduationCap, institution: School, admin: Shield,
  }[account.role];
  const subCount = account.stats?.subscriptions ?? 0;

  return (
    <>
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-6">
          <h1 className="page-title">My account</h1>
          <p className="page-subtitle">Manage your profile, password, and account preferences.</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column: summary */}
          <div className="space-y-6 lg:col-span-1">
            {/* Profile summary */}
            <div className="card overflow-hidden">
              <div className="h-16 bg-gradient-to-r from-primary-700 to-primary-900" />
              <div className="px-5 pb-5">
                <div className="-mt-8 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-primary-700 font-display text-2xl font-bold text-white shadow-sm">
                  {(account.username || account.email)[0]?.toUpperCase()}
                </div>
                <p className="mt-3 truncate font-display text-lg font-bold text-ink">{account.username}</p>
                <p className="truncate text-sm text-ink-soft">{account.email}</p>
                <span className={`badge ${roleBadge} mt-2`}>
                  <RoleIcon className="h-3 w-3" /> {roleLabel}
                </span>
                <dl className="mt-5 space-y-2.5 border-t border-slate-100 pt-4 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-ink-soft"><CalendarDays className="h-4 w-4" /> Member since</dt>
                    <dd className="font-medium text-ink">
                      {new Date(account.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-ink-soft"><Phone className="h-4 w-4" /> Phone</dt>
                    <dd className={account.phone ? "font-medium text-ink" : "text-slate-400"}>{account.phone || "Not set"}</dd>
                  </div>
                  {account.role === "student" && (
                    <div className="flex items-center justify-between gap-3">
                      <dt className="flex items-center gap-2 text-ink-soft"><GraduationCap className="h-4 w-4" /> Grade</dt>
                      <dd className={account.student_grade ? "font-medium text-ink" : "text-slate-400"}>
                        {account.student_grade ? `Grade ${account.student_grade}` : "Not set"}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Subscription status */}
            <div className="card card-pad">
              <div className="flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${subCount > 0 ? "bg-accent-50 text-accent-700" : "bg-slate-100 text-slate-500"}`}>
                  <Crown className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-semibold">Subscription</h2>
                    {subCount > 0
                      ? <span className="badge badge-green">Subscribed</span>
                      : <span className="badge badge-gray">No plan</span>}
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    {subCount > 0
                      ? `You have ${subCount} subscription${subCount === 1 ? "" : "s"} on record.`
                      : "Subscribe to unlock the study chatbot and file uploads."}
                  </p>
                </div>
              </div>
              <Link href="/ai/subscribe" className={`btn ${subCount > 0 ? "btn-secondary" : "btn-primary"} mt-4 w-full`}>
                {subCount > 0 ? "View plans" : "Choose a plan"} <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Quick links */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-base font-semibold">Quick links</h2>
              </div>
              <nav className="p-2">
                <QuickLink href="/ai/chat" icon={MessagesSquare} tint="bg-primary-50 text-primary-700" label="Study chatbot" />
                <QuickLink href="/ai/predict" icon={Compass} tint="bg-accent-50 text-accent-700" label="Career predictor" />
                {account.role === "institution" && (
                  <QuickLink href="/dashboard" icon={LayoutDashboard} tint="bg-violet-50 text-violet-700" label="School dashboard" />
                )}
                <QuickLink href="/ai/subscribe" icon={Crown} tint="bg-amber-50 text-amber-700" label="Subscription plans" />
              </nav>
            </div>
          </div>

          {/* Right column: settings */}
          <div className="space-y-6 lg:col-span-2">
            {/* Stats (parent / student) */}
            {account.stats && (account.role === "parent" || account.role === "student") && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Chats" value={account.stats.chats} icon={MessagesSquare} tone="blue" />
                <StatCard label="Predictions" value={account.stats.predictions} icon={Compass} tone="green" />
                <StatCard label="Subscriptions" value={account.stats.subscriptions} icon={Crown} tone="amber" />
              </div>
            )}

            {/* Profile form */}
            <form onSubmit={saveProfile} className="card">
              <div className="card-header">
                <div className="flex items-center gap-2">
                  <UserRound className="h-5 w-5 text-slate-400" />
                  <h2 className="text-base font-semibold">Profile details</h2>
                </div>
              </div>
              <div className="space-y-4 p-5 sm:p-6">
                {profileMsg && (
                  <div className={`alert ${profileMsg.type === "ok" ? "alert-success" : "alert-error"}`}>
                    {profileMsg.type === "ok"
                      ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
                      : <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
                    <span>{profileMsg.text}</span>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Full name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)} className="input" required />
                  </div>
                  <div>
                    <label className="label">Phone <span className="font-normal text-slate-400">(optional)</span></label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="0712345678" />
                  </div>
                </div>
                <div>
                  <label className="label">Email</label>
                  <input value={account.email} disabled className="input" />
                  <p className="help-text">Your email address cannot be changed.</p>
                </div>
                {account.role === "student" && (
                  <div className="sm:max-w-xs">
                    <label className="label">Grade</label>
                    <select value={grade} onChange={(e) => setGrade(e.target.value === "" ? "" : Number(e.target.value))}
                      className="select">
                      <option value="">Not set</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((g) =>
                        <option key={g} value={g}>Grade {g}</option>
                      )}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex justify-end rounded-b-xl border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                <button type="submit" disabled={savingProfile} className="btn btn-primary">
                  {savingProfile && <Loader2 className="h-4 w-4 animate-spin" />}
                  {savingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>

            {/* Password form (only if account has a password; Google only users skip this) */}
            {account.has_password && (
              <form onSubmit={changePassword} className="card">
                <div className="card-header">
                  <div className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5 text-slate-400" />
                    <h2 className="text-base font-semibold">Change password</h2>
                  </div>
                </div>
                <div className="space-y-4 p-5 sm:p-6">
                  {pwdMsg && (
                    <div className={`alert ${pwdMsg.type === "ok" ? "alert-success" : "alert-error"}`}>
                      {pwdMsg.type === "ok"
                        ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
                        : <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
                      <span>{pwdMsg.text}</span>
                    </div>
                  )}
                  <div>
                    <label className="label">Current password</label>
                    <PasswordInput placeholder="Current password" value={currentPwd}
                      onChange={(e) => setCurrentPwd(e.target.value)} required className="input" />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="label">New password</label>
                      <PasswordInput placeholder="New password" value={newPwd}
                        onChange={(e) => setNewPwd(e.target.value)} required className="input" />
                    </div>
                    <div>
                      <label className="label">Confirm new password</label>
                      <PasswordInput placeholder="Confirm new password" value={newPwd2}
                        onChange={(e) => setNewPwd2(e.target.value)} required className="input" />
                    </div>
                  </div>
                  <p className="help-text">Use at least 6 characters.</p>
                </div>
                <div className="flex justify-end rounded-b-xl border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
                  <button type="submit" disabled={savingPwd} className="btn btn-primary">
                    {savingPwd && <Loader2 className="h-4 w-4 animate-spin" />}
                    {savingPwd ? "Saving..." : "Change password"}
                  </button>
                </div>
              </form>
            )}

            {!account.has_password && (
              <div className="alert alert-info">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  You signed in with Google, so your password is managed by Google. To set a password,
                  sign out and use the email sign up flow with the same email.
                </span>
              </div>
            )}

            {/* Sign out */}
            <div className="card card-pad flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-semibold">Sign out</h2>
                <p className="text-sm text-ink-soft">End your session on this device.</p>
              </div>
              <button onClick={() => signOut({ callbackUrl: "/" })} className="btn btn-danger-soft">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

function QuickLink({
  href, icon: Icon, tint, label,
}: { href: string; icon: LucideIcon; tint: string; label: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tint}`}>
        <Icon className="h-4 w-4" />
      </span>
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-slate-500" />
    </Link>
  );
}
