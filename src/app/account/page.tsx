"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PasswordInput from "@/components/PasswordInput";

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
    return (<><Navbar /><div className="max-w-3xl mx-auto px-6 py-10 text-slate-500">Loading…</div></>);
  }
  if (!account) return null;

  const roleLabel = {
    parent: "Parent", student: "Student", institution: "School", admin: "Admin",
  }[account.role];
  const roleColor = {
    parent: "bg-blue-100 text-blue-700",
    student: "bg-green-100 text-green-700",
    institution: "bg-indigo-100 text-indigo-700",
    admin: "bg-purple-100 text-purple-700",
  }[account.role];

  return (
    <>
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">My Account</h1>
        <p className="text-slate-600 mb-8">Manage your profile, password, and account preferences.</p>

        {/* Header card */}
        <div className="bg-white rounded shadow p-6 mb-6 flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl font-bold flex items-center justify-center">
                {(account.username || account.email)[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-xl font-bold">{account.username}</p>
                <p className="text-sm text-slate-500">{account.email}</p>
                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${roleColor} font-semibold`}>{roleLabel}</span>
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-500 text-right">
            <p>Member since</p>
            <p className="font-semibold text-slate-700">
              {new Date(account.created_at).toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* Stats (parent / student) */}
        {account.stats && (account.role === "parent" || account.role === "student") && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-2xl font-bold text-blue-700">{account.stats.chats}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Chats</p>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{account.stats.predictions}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Predictions</p>
            </div>
            <div className="bg-white rounded shadow p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">{account.stats.subscriptions}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wide mt-1">Subscriptions</p>
            </div>
          </div>
        )}

        {/* Quick links by role */}
        <div className="bg-white rounded shadow p-6 mb-6">
          <h3 className="font-bold mb-3">Quick links</h3>
          <div className="flex flex-wrap gap-2">
            <Link href="/ai/chat" className="text-sm bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded hover:bg-blue-100">
              💬 Chatbot
            </Link>
            <Link href="/ai/predict" className="text-sm bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded hover:bg-green-100">
              🎯 Career Predictor
            </Link>
            {account.role === "institution" && (
              <Link href="/dashboard" className="text-sm bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded hover:bg-indigo-100">
                🏫 School Dashboard
              </Link>
            )}
            <Link href="/ai/subscribe" className="text-sm bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded hover:bg-amber-100">
              ⭐ Subscription Plans
            </Link>
          </div>
        </div>

        {/* Profile form */}
        <form onSubmit={saveProfile} className="bg-white rounded shadow p-6 mb-6 space-y-4">
          <h3 className="font-bold">Profile details</h3>
          {profileMsg && (
            <p className={`text-sm p-2 rounded ${profileMsg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
              {profileMsg.text}
            </p>
          )}
          <div>
            <label className="text-sm font-medium text-slate-700">Full name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-2 rounded mt-1" required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email (cannot change)</label>
            <input value={account.email} disabled className="w-full border p-2 rounded mt-1 bg-slate-50 text-slate-500 cursor-not-allowed" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Phone (optional)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border p-2 rounded mt-1" placeholder="0712345678" />
          </div>
          {account.role === "student" && (
            <div>
              <label className="text-sm font-medium text-slate-700">Grade</label>
              <select value={grade} onChange={(e) => setGrade(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-full border p-2 rounded mt-1">
                <option value="">Not set</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) =>
                  <option key={g} value={g}>Grade {g}</option>
                )}
              </select>
            </div>
          )}
          <button type="submit" disabled={savingProfile}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-60 font-semibold">
            {savingProfile ? "Saving…" : "Save changes"}
          </button>
        </form>

        {/* Password form (only if account has a password — Google-only users skip this) */}
        {account.has_password && (
          <form onSubmit={changePassword} className="bg-white rounded shadow p-6 mb-6 space-y-4">
            <h3 className="font-bold">Change password</h3>
            {pwdMsg && (
              <p className={`text-sm p-2 rounded ${pwdMsg.type === "ok" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                {pwdMsg.text}
              </p>
            )}
            <PasswordInput placeholder="Current password" value={currentPwd}
              onChange={(e) => setCurrentPwd(e.target.value)} required className="w-full border p-2 rounded" />
            <PasswordInput placeholder="New password" value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)} required className="w-full border p-2 rounded" />
            <PasswordInput placeholder="Confirm new password" value={newPwd2}
              onChange={(e) => setNewPwd2(e.target.value)} required className="w-full border p-2 rounded" />
            <button type="submit" disabled={savingPwd}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-60 font-semibold">
              {savingPwd ? "Saving…" : "Change password"}
            </button>
          </form>
        )}

        {!account.has_password && (
          <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-6 text-sm text-blue-800">
            🔐 You signed in with Google — password is managed by Google. To set a password,
            sign out and use the email sign-up flow with the same email.
          </div>
        )}

        {/* Sign out */}
        <div className="bg-white rounded shadow p-6 flex justify-between items-center">
          <div>
            <h3 className="font-bold">Sign out</h3>
            <p className="text-sm text-slate-500">End your session on this device.</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 font-semibold">
            Sign out
          </button>
        </div>
      </div>

      <Footer />
    </>
  );
}
