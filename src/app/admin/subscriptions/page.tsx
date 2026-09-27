"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, CheckCircle2, XCircle, Wallet, RefreshCw, Loader2, Check, X, ClipboardList } from "lucide-react";
import { PageHeader, StatCard, EmptyState, Badge, type Tone } from "@/components/ui";

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
] as const;

const STATUS_TONE: Record<string, Tone> = {
  pending: "amber",
  approved: "green",
  rejected: "red",
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

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

  const tabCount: Record<string, number> = {
    all: (counts.pending ?? 0) + (counts.approved ?? 0) + (counts.rejected ?? 0),
    pending: counts.pending ?? 0,
    approved: counts.approved ?? 0,
    rejected: counts.rejected ?? 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI subscriptions"
        description="Check M-Pesa codes and approve or reject AI plan payment requests."
        actions={
          <button onClick={load} className="btn btn-secondary" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Pending" value={(counts.pending ?? 0).toLocaleString()} hint="Waiting for review" icon={Clock} tone="amber" />
        <StatCard label="Approved" value={(counts.approved ?? 0).toLocaleString()} hint="Plans activated" icon={CheckCircle2} tone="green" />
        <StatCard label="Rejected" value={(counts.rejected ?? 0).toLocaleString()} hint="Requests declined" icon={XCircle} tone="red" />
        <StatCard label="AI revenue" value={`KES ${(counts.revenue ?? 0).toLocaleString()}`} hint="From approved payments" icon={Wallet} tone="blue" />
      </div>

      {error && (
        <div className="alert alert-error">
          <XCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="tabs">
            {STATUS_TABS.map((t) => {
              const active = status === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => { setStatus(t.key); setPage(1); }}
                  className={`tab ${active ? "tab-active" : ""}`}
                >
                  {t.label}
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                      active
                        ? "bg-white/20 text-white"
                        : t.key === "pending" && tabCount.pending > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tabCount[t.key]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-ink-soft">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading requests...
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No requests found" description="Subscription requests matching this filter will show here." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th className="hidden lg:table-cell">Phone</th>
                  <th>M-Pesa code</th>
                  <th className="text-right">Amount</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Submitted</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <div className="font-semibold text-ink">{r.user_name}</div>
                      <div className="text-xs text-ink-soft">{r.email}</div>
                    </td>
                    <td>
                      <div className="font-medium text-ink">{r.plan_name}</div>
                      <div className="flex items-center gap-1.5 text-xs capitalize text-ink-soft">
                        <span>{r.subscriber_type}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300" />
                        <span>{r.billing_period}</span>
                      </div>
                    </td>
                    <td className="hidden font-mono text-xs lg:table-cell">{r.phone}</td>
                    <td className="font-mono font-semibold text-ink">{r.mpesa_code}</td>
                    <td className="whitespace-nowrap text-right font-semibold tabular-nums text-ink">KES {Number(r.amount_kes).toLocaleString()}</td>
                    <td>
                      <span className="capitalize"><Badge tone={STATUS_TONE[r.status] ?? "gray"}>{r.status}</Badge></span>
                      {r.reject_reason && <div className="mt-1 max-w-[180px] text-xs text-red-600">{r.reject_reason}</div>}
                    </td>
                    <td className="hidden whitespace-nowrap text-xs text-ink-soft md:table-cell">{fmtDateTime(r.created_at)}</td>
                    <td className="whitespace-nowrap text-right">
                      {r.status === "pending" ? (
                        <div className="inline-flex gap-2">
                          <button
                            disabled={busyId === r.id}
                            onClick={() => approve(r.id)}
                            className="btn btn-accent btn-sm"
                            title="Approve payment"
                          >
                            {busyId === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Approve
                          </button>
                          <button
                            disabled={busyId === r.id}
                            onClick={() => reject(r.id)}
                            className="btn btn-danger-soft btn-sm"
                            title="Reject payment"
                          >
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-ink-soft">
                          {r.reviewed_at ? `Reviewed ${fmtDate(r.reviewed_at)}` : <span className="text-slate-400">N/A</span>}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex flex-wrap justify-end gap-1.5">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`h-9 w-9 rounded-lg text-sm font-medium transition ${page === p ? "bg-primary-700 text-white" : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
