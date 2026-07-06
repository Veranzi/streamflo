"use client";

import { useEffect, useState, useCallback } from "react";

interface SubEntry {
  id: number;
  user_id: number;
  email: string;
  user_name: string;
  plan_name: string;
  subscriber_type: string;
  billing_period: string;
  phone: string;
  mpesa_code: string;
  amount_kes: number;
  status: "pending" | "approved" | "rejected";
  reject_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
}

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function AdminSubscriptionsPage() {
  const [rows, setRows] = useState<SubEntry[]>([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, revenue: 0 });
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/ai-subscriptions?status=${status}&page=${page}`);
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to load"); setLoading(false); return; }
      setRows(data.rows ?? []);
      setCounts({ total: data.total, pending: data.pending, approved: data.approved, rejected: data.rejected, revenue: data.revenue });
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  async function approve(id: number) {
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/ai/subscription/manual-payment/${id}/approve`, { method: "POST" });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Approve failed");
    }
    await load();
    setBusyId(null);
  }

  async function reject(id: number) {
    const reason = prompt("Reject reason (optional):") ?? "";
    setBusyId(id);
    setError(null);
    const res = await fetch(`/api/ai/subscription/manual-payment/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Reject failed");
    }
    await load();
    setBusyId(null);
  }

  const pages = Math.ceil(counts.total / 30);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-slate-800">AI Subscriptions</h1>
        <button onClick={load} className="text-sm text-blue-600 hover:underline">Refresh</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-amber-400">
          <p className="text-xs text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-slate-800">{counts.pending}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-green-500">
          <p className="text-xs text-slate-500">Approved</p>
          <p className="text-2xl font-bold text-slate-800">{counts.approved}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-red-400">
          <p className="text-xs text-slate-500">Rejected</p>
          <p className="text-2xl font-bold text-slate-800">{counts.rejected}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
          <p className="text-xs text-slate-500">Revenue (AI)</p>
          <p className="text-2xl font-bold text-slate-800">KES {counts.revenue.toLocaleString()}</p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded mb-4">{error}</div>}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-4">
        {STATUS_TABS.map((t) => (
          <button key={t.key} onClick={() => { setStatus(t.key); setPage(1); }}
            className={`px-4 py-2 rounded text-sm font-medium ${status === t.key ? "bg-blue-600 text-white" : "bg-white border text-slate-600 hover:bg-slate-50"}`}>
            {t.label}
            {t.key === "pending" && counts.pending > 0 && (
              <span className="ml-1.5 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5">{counts.pending}</span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 border-b">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Plan</th>
              <th className="p-3">Phone</th>
              <th className="p-3">M-Pesa Code</th>
              <th className="p-3 text-right">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Submitted</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="p-8 text-center text-slate-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} className="p-8 text-center text-slate-400">No entries found.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3">
                  <div className="font-semibold text-slate-800">{r.user_name}</div>
                  <div className="text-xs text-slate-400">{r.email}</div>
                </td>
                <td className="p-3">
                  <div className="font-medium text-slate-700">{r.plan_name}</div>
                  <div className="text-xs text-slate-400 capitalize">{r.subscriber_type} · {r.billing_period}</div>
                </td>
                <td className="p-3 font-mono text-slate-600 text-xs">{r.phone}</td>
                <td className="p-3 font-mono font-bold text-slate-800">{r.mpesa_code}</td>
                <td className="p-3 text-right font-semibold text-slate-800">KES {Number(r.amount_kes).toLocaleString()}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[r.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {r.status}
                  </span>
                  {r.reject_reason && <div className="text-xs text-red-500 mt-1">{r.reject_reason}</div>}
                </td>
                <td className="p-3 text-slate-400 text-xs">{new Date(r.created_at).toLocaleString("en-KE")}</td>
                <td className="p-3 text-right whitespace-nowrap space-x-2">
                  {r.status === "pending" && (
                    <>
                      <button disabled={busyId === r.id} onClick={() => approve(r.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-50">
                        {busyId === r.id ? "…" : "Approve"}
                      </button>
                      <button disabled={busyId === r.id} onClick={() => reject(r.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-50">
                        Reject
                      </button>
                    </>
                  )}
                  {r.status !== "pending" && (
                    <span className="text-xs text-slate-400">
                      {r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString("en-KE") : "—"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex gap-2 mt-4 justify-end">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded text-sm ${page === p ? "bg-blue-600 text-white" : "bg-white border text-slate-600 hover:bg-slate-50"}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
