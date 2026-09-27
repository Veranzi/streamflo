"use client";

import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, Clock, XCircle, Wallet, Loader2, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
import { PageHeader, StatCard, EmptyState, Badge, type Tone } from "@/components/ui";

type FilterTab = "All" | "Active" | "Expired" | "Cancelled";

interface Subscription {
  id: string;
  user_name: string;
  email: string;
  plan_name: string;
  price_kes: number;
  billing_period: string;
  status: "active" | "expired" | "cancelled";
  starts_at: string;
  expires_at: string;
}

const STATUS_TONE: Record<string, Tone> = {
  active: "green",
  expired: "amber",
  cancelled: "red",
};

function formatDate(iso: string) {
  if (!iso) return "Not set";
  return new Date(iso).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatKES(amount: number) {
  return `KES ${Number(amount || 0).toLocaleString()}`;
}

export default function AiActiveSubsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai-active-subs");
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setSubscriptions(Array.isArray(data) ? data : data.subscriptions ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const counts: Record<FilterTab, number> = {
    All: subscriptions.length,
    Active: subscriptions.filter((s) => s.status === "active").length,
    Expired: subscriptions.filter((s) => s.status === "expired").length,
    Cancelled: subscriptions.filter((s) => s.status === "cancelled").length,
  };

  const activeValue = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + Number(s.price_kes || 0), 0);

  const filtered =
    activeTab === "All"
      ? subscriptions
      : subscriptions.filter((s) => s.status === activeTab.toLowerCase());

  async function handleCancel(id: string) {
    setCancellingId(id);
    setConfirmId(null);
    try {
      const res = await fetch("/api/admin/ai-active-subs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "cancelled" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed: ${res.status}`);
      }
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "cancelled" } : s))
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Could not cancel subscription.");
    } finally {
      setCancellingId(null);
    }
  }

  const tabs: FilterTab[] = ["All", "Active", "Expired", "Cancelled"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="EduTena subscriptions"
        description="See every AI plan subscription across users and cancel active plans when needed."
        actions={
          <button onClick={fetchSubscriptions} className="btn btn-secondary" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        }
      />

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active" value={counts.Active.toLocaleString()} hint="Currently running plans" icon={CheckCircle2} tone="green" />
          <StatCard label="Expired" value={counts.Expired.toLocaleString()} hint="Plans that ran out" icon={Clock} tone="amber" />
          <StatCard label="Cancelled" value={counts.Cancelled.toLocaleString()} hint="Stopped by an admin or user" icon={XCircle} tone="red" />
          <StatCard label="Active plan value" value={formatKES(activeValue)} hint="Sum of active plan prices" icon={Wallet} tone="blue" />
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="tabs">
            {tabs.map((tab) => {
              const active = activeTab === tab;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`tab ${active ? "tab-active" : ""}`}>
                  {tab}
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {counts[tab]}
                  </span>
                </button>
              );
            })}
          </div>
          {!loading && !error && filtered.length > 0 && (
            <p className="text-sm text-ink-soft">
              Showing {filtered.length} of {subscriptions.length} subscription{subscriptions.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-ink-soft">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading subscriptions...
          </div>
        ) : error ? (
          <div className="p-5 sm:p-6">
            <div className="alert alert-error items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={fetchSubscriptions} className="btn btn-secondary btn-sm">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={Sparkles} title="No subscriptions found" description="There are no subscriptions for this filter yet." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Plan</th>
                  <th className="hidden sm:table-cell">Price</th>
                  <th className="hidden lg:table-cell">Billing period</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Starts</th>
                  <th className="hidden md:table-cell">Expires</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub) => (
                  <tr key={sub.id}>
                    <td>
                      <div className="whitespace-nowrap font-medium text-ink">{sub.user_name}</div>
                      <div className="text-xs text-ink-soft">{sub.email}</div>
                    </td>
                    <td className="whitespace-nowrap">{sub.plan_name}</td>
                    <td className="hidden whitespace-nowrap font-medium tabular-nums text-ink sm:table-cell">{formatKES(sub.price_kes)}</td>
                    <td className="hidden whitespace-nowrap capitalize lg:table-cell">{sub.billing_period}</td>
                    <td>
                      <span className="capitalize"><Badge tone={STATUS_TONE[sub.status] ?? "gray"}>{sub.status}</Badge></span>
                    </td>
                    <td className="hidden whitespace-nowrap text-ink-soft md:table-cell">{formatDate(sub.starts_at)}</td>
                    <td className="hidden whitespace-nowrap text-ink-soft md:table-cell">{formatDate(sub.expires_at)}</td>
                    <td className="whitespace-nowrap text-right">
                      {sub.status === "active" ? (
                        confirmId === sub.id ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="text-xs text-ink-soft">Cancel this plan?</span>
                            <button
                              onClick={() => handleCancel(sub.id)}
                              disabled={cancellingId === sub.id}
                              className="btn btn-danger btn-sm"
                            >
                              {cancellingId === sub.id ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Cancelling...</>
                              ) : (
                                "Yes, cancel"
                              )}
                            </button>
                            <button onClick={() => setConfirmId(null)} className="btn btn-secondary btn-sm">
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmId(sub.id)}
                            className="btn btn-danger-soft btn-sm"
                            title="Cancel subscription"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Cancel
                          </button>
                        )
                      ) : (
                        <span className="text-xs text-slate-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
