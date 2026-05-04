"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

interface Pending {
  id: number;
  user_id: number;
  email: string;
  user_name: string;
  plan_id: number;
  plan_name: string;
  subscriber_type: "parent" | "school";
  phone: string;
  mpesa_code: string;
  amount_kes: number;
  created_at: string;
}

export default function AdminSubscriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [rows, setRows] = useState<Pending[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = session?.user?.role === "admin";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/admin/subscriptions");
  }, [status, router]);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/ai/subscription/manual-payment/pending");
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to load pending payments"); return; }
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  async function approve(id: number) {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/ai/subscription/manual-payment/${id}/approve`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Approve failed");
      }
      await load();
    } finally { setBusyId(null); }
  }

  async function reject(id: number) {
    if (busyId) return;
    const reason = prompt("Reject reason (optional):") ?? "";
    setBusyId(id);
    try {
      const res = await fetch(`/api/ai/subscription/manual-payment/${id}/reject`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Reject failed");
      }
      await load();
    } finally { setBusyId(null); }
  }

  if (status === "loading") {
    return <><Navbar /><div className="max-w-5xl mx-auto px-6 py-8 text-slate-500">Loading…</div></>;
  }

  if (!isAdmin) {
    return (
      <>
        <Navbar />
        <div className="max-w-5xl mx-auto px-6 py-8">
          <h1 className="text-xl font-bold text-slate-800">Admin only</h1>
          <p className="text-slate-600 mt-2">Your account doesn&apos;t have admin access.</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">← Back to home</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Pending Pochi payments</h1>
          <button onClick={load} className="text-sm text-blue-600 hover:underline">Refresh</button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-900 text-sm p-3 rounded mb-4">{error}</div>}

        {rows.length === 0 ? (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-8 text-center text-slate-500">
            Nothing pending. 🎉
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Plan</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">M-Pesa code</th>
                  <th className="p-3 text-right">Amount</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{r.user_name}</div>
                      <div className="text-xs text-slate-500">{r.email}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-700">{r.plan_name}</div>
                      <div className="text-xs text-slate-500 capitalize">{r.subscriber_type}</div>
                    </td>
                    <td className="p-3 font-mono text-slate-700">{r.phone}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{r.mpesa_code}</td>
                    <td className="p-3 text-right font-semibold text-slate-800">Ksh {Number(r.amount_kes).toLocaleString()}</td>
                    <td className="p-3 text-slate-500 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                    <td className="p-3 text-right space-x-2 whitespace-nowrap">
                      <button disabled={busyId === r.id} onClick={() => approve(r.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-50">
                        {busyId === r.id ? "…" : "Approve"}
                      </button>
                      <button disabled={busyId === r.id} onClick={() => reject(r.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-50">
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
