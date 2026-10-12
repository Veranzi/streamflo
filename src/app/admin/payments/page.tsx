"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, School, Sparkles, Clock, Loader2, Receipt, Check, X } from "lucide-react";
import { PageHeader, StatCard, EmptyState, Badge, type Tone } from "@/components/ui";

interface Payment {
  id: number;
  source: "school" | "ai_subscription";
  payer_name: string | null;
  payer_detail: string | null;
  amount_kes: number;
  method: string | null;
  mpesa_code: string | null;
  status: string;
  created_at: string;
}

const STATUS_TONE: Record<string, Tone> = {
  success: "green",
  approved: "green",
  pending: "amber",
  failed: "red",
  rejected: "red",
  reversed: "gray",
};

const SOURCE_TONE: Record<string, Tone> = {
  school: "blue",
  ai_subscription: "purple",
};

const SOURCE_LABEL: Record<string, string> = {
  school: "School",
  ai_subscription: "AI plan",
};

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "success", label: "Completed" },
  { key: "failed", label: "Failed or rejected" },
];

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

const Muted = ({ children = "N/A" }: { children?: React.ReactNode }) => (
  <span className="text-slate-400">{children}</span>
);

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [schoolRevenue, setSchoolRevenue] = useState(0);
  const [aiRevenue, setAiRevenue] = useState(0);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/payments?page=${page}&status=${status}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setTotal(data.total ?? 0);
    setPendingTotal(data.pending_total ?? 0);
    setRevenue(data.revenue ?? 0);
    setSchoolRevenue(data.school_revenue ?? 0);
    setAiRevenue(data.ai_revenue ?? 0);
    setLoading(false);
  }, [page, status]);

  useEffect(() => { load(); }, [load]);

  // School listing payments are confirmed here; confirming upgrades the school to Premium.
  async function decide(p: Payment, action: "confirm" | "reject") {
    const question = action === "confirm"
      ? `Confirm KES ${Number(p.amount_kes).toLocaleString()} from ${p.payer_name ?? "this school"}? The school will be upgraded to Premium.`
      : `Reject this payment from ${p.payer_name ?? "this school"}?`;
    if (!confirm(question)) return;
    setBusyId(p.id);
    setActionError("");
    const res = await fetch(`/api/admin/payments/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const data = await res.json().catch(() => ({}));
    setBusyId(null);
    if (!res.ok) { setActionError(data.error ?? "Could not update the payment."); return; }
    setRows((prev) => prev.map((r) => (r.source === "school" && r.id === p.id ? { ...r, status: data.status } : r)));
    load();
  }

  const pages = Math.ceil(total / 30);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description={`All school and AI plan payments in one place. ${total.toLocaleString()} transactions in this view.`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total revenue" value={`KES ${revenue.toLocaleString()}`} hint="Schools and AI subscriptions" icon={Wallet} tone="green" />
        <StatCard label="School subscriptions" value={`KES ${schoolRevenue.toLocaleString()}`} hint="Premium school listings" icon={School} tone="blue" />
        <StatCard label="AI subscriptions" value={`KES ${aiRevenue.toLocaleString()}`} hint="Pochi la Biashara payments" icon={Sparkles} tone="purple" />
        <StatCard label="Pending payments" value={pendingTotal.toLocaleString()} hint="Waiting for confirmation" icon={Clock} tone="amber" />
      </div>

      {actionError && <div className="alert alert-error">{actionError}</div>}

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="tabs">
            {STATUS_TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => { setStatus(t.key); setPage(1); }}
                className={`tab ${status === t.key ? "tab-active" : ""}`}
              >
                {t.label}
                {t.key === "pending" && pendingTotal > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${status === t.key ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
                    {pendingTotal}
                  </span>
                )}
              </button>
            ))}
          </div>
          <p className="text-sm text-ink-soft">{total.toLocaleString()} transactions</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-ink-soft">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading payments...
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={Receipt} title="No payments yet" description="Payments will appear here once schools or learners pay." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Payer</th>
                  <th>Amount</th>
                  <th className="hidden md:table-cell">Method</th>
                  <th className="hidden md:table-cell">Reference</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Date</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p, i) => (
                  <tr key={`${p.source}-${p.id}-${i}`}>
                    <td><Badge tone={SOURCE_TONE[p.source] ?? "gray"}>{SOURCE_LABEL[p.source] ?? p.source}</Badge></td>
                    <td>
                      <div className="font-medium text-ink">{p.payer_name ?? <Muted>Unknown</Muted>}</div>
                      {p.payer_detail && <div className="text-xs text-ink-soft">{p.payer_detail}</div>}
                    </td>
                    <td className="whitespace-nowrap font-semibold tabular-nums text-ink">KES {Number(p.amount_kes).toLocaleString()}</td>
                    <td className="hidden capitalize md:table-cell">{p.method ?? <Muted />}</td>
                    <td className="hidden font-mono text-xs md:table-cell">{p.mpesa_code ?? <Muted />}</td>
                    <td><span className="capitalize"><Badge tone={STATUS_TONE[p.status] ?? "gray"}>{p.status}</Badge></span></td>
                    <td className="hidden whitespace-nowrap text-ink-soft sm:table-cell">{fmtDate(p.created_at)}</td>
                    <td className="text-right">
                      {p.source === "school" && p.status === "pending" ? (
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => decide(p, "confirm")} disabled={busyId === p.id} className="btn btn-accent btn-sm" title="Confirm payment and upgrade school">
                            {busyId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Confirm
                          </button>
                          <button onClick={() => decide(p, "reject")} disabled={busyId === p.id} className="btn btn-danger-soft btn-sm" title="Reject payment">
                            <X className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      ) : p.source === "ai_subscription" && p.status === "pending" ? (
                        <a href="/admin/subscriptions" className="link text-xs">Review in Subscriptions</a>
                      ) : (
                        <span className="text-xs text-ink-soft">Done</span>
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
