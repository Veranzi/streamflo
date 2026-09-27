"use client";

import { useEffect, useState, useCallback } from "react";
import { Wallet, School, Sparkles, Clock, Loader2, Receipt } from "lucide-react";
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
