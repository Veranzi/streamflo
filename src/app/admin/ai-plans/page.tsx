"use client";

import { Fragment, useEffect, useState } from "react";
import { Plus, X, Pencil, Ban, Check, Loader2, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { PageHeader, EmptyState, Badge } from "@/components/ui";

type BillingPeriod = "monthly" | "termly" | "annually";
type SubscriberType = "student" | "teacher" | "school" | "parent";

interface AIPlan {
  id: string;
  name: string;
  subscriber_type: SubscriberType;
  price_kes: number;
  billing_period: BillingPeriod;
  active: boolean;
}

type NewPlanForm = Omit<AIPlan, "id" | "active">;

const SUBSCRIBER_TYPES: SubscriberType[] = ["student", "teacher", "school", "parent"];
const BILLING_PERIODS: BillingPeriod[] = ["monthly", "termly", "annually"];

const defaultNewPlan: NewPlanForm = {
  name: "",
  subscriber_type: "student",
  price_kes: 0,
  billing_period: "monthly",
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

type ViewTab = "all" | "active" | "inactive";

export default function AIPlansPage() {
  const [plans, setPlans] = useState<AIPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<AIPlan>>({});

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlan, setNewPlan] = useState<NewPlanForm>(defaultNewPlan);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [savingId, setSavingId] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<Record<string, string>>({});
  const [view, setView] = useState<ViewTab>("all");

  async function fetchPlans() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/ai-plans");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Request failed with status ${res.status}`);
      }
      const data: AIPlan[] = await res.json();
      setPlans(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPlans();
  }, []);

  function startEdit(plan: AIPlan) {
    setEditingId(plan.id);
    setEditDraft({
      name: plan.name,
      subscriber_type: plan.subscriber_type,
      price_kes: plan.price_kes,
      billing_period: plan.billing_period,
    });
    setRowError((prev) => ({ ...prev, [plan.id]: "" }));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft({});
  }

  async function saveEdit(id: string) {
    setSavingId(id);
    setRowError((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await fetch(`/api/admin/ai-plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editDraft),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Save failed with status ${res.status}`);
      }
      const updated: AIPlan = await res.json();
      setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
      setEditDraft({});
    } catch (err: unknown) {
      setRowError((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : "Save failed.",
      }));
    } finally {
      setSavingId(null);
    }
  }

  async function deactivatePlan(id: string) {
    if (!confirm("Deactivate this plan? Subscribers will no longer be able to select it.")) return;
    setDeactivatingId(id);
    setRowError((prev) => ({ ...prev, [id]: "" }));
    try {
      const res = await fetch(`/api/admin/ai-plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Deactivate failed with status ${res.status}`);
      }
      const updated: AIPlan = await res.json();
      setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err: unknown) {
      setRowError((prev) => ({
        ...prev,
        [id]: err instanceof Error ? err.message : "Deactivate failed.",
      }));
    } finally {
      setDeactivatingId(null);
    }
  }

  async function createPlan(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/admin/ai-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Create failed with status ${res.status}`);
      }
      const created: AIPlan = await res.json();
      setPlans((prev) => [created, ...prev]);
      setNewPlan(defaultNewPlan);
      setShowCreateForm(false);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Create failed.");
    } finally {
      setCreating(false);
    }
  }

  function formatKES(amount: number) {
    return `KES ${Number(amount || 0).toLocaleString()}`;
  }

  const activeCount = plans.filter((p) => p.active).length;
  const tabCounts: Record<ViewTab, number> = {
    all: plans.length,
    active: activeCount,
    inactive: plans.length - activeCount,
  };
  const visiblePlans =
    view === "all" ? plans : plans.filter((p) => (view === "active" ? p.active : !p.active));

  return (
    <div className="space-y-6">
      <PageHeader
        title="EduTena AI plans"
        description="Set prices and billing periods for AI features for each type of subscriber."
        actions={
          <button
            onClick={() => {
              setShowCreateForm((v) => !v);
              setCreateError(null);
            }}
            className={showCreateForm ? "btn btn-secondary" : "btn btn-primary"}
          >
            {showCreateForm ? <><X className="h-4 w-4" /> Close form</> : <><Plus className="h-4 w-4" /> New plan</>}
          </button>
        }
      />

      {showCreateForm && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="font-semibold text-ink">Create a new plan</h2>
              <p className="text-xs text-ink-soft">New plans are active straight away.</p>
            </div>
          </div>
          <form onSubmit={createPlan} className="card-pad space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="label">
                  Plan name <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  placeholder="For example, Student Basic"
                  value={newPlan.name}
                  onChange={(e) => setNewPlan((p) => ({ ...p, name: e.target.value }))}
                  className="input"
                />
              </div>

              <div>
                <label className="label">
                  Subscriber type <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={newPlan.subscriber_type}
                  onChange={(e) =>
                    setNewPlan((p) => ({ ...p, subscriber_type: e.target.value as SubscriberType }))
                  }
                  className="select"
                >
                  {SUBSCRIBER_TYPES.map((t) => (
                    <option key={t} value={t}>{cap(t)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">
                  Price (KES) <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="number"
                  min={0}
                  step={1}
                  placeholder="For example, 500"
                  value={newPlan.price_kes === 0 ? "" : newPlan.price_kes}
                  onChange={(e) =>
                    setNewPlan((p) => ({ ...p, price_kes: Number(e.target.value) }))
                  }
                  className="input"
                />
              </div>

              <div>
                <label className="label">
                  Billing period <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={newPlan.billing_period}
                  onChange={(e) =>
                    setNewPlan((p) => ({ ...p, billing_period: e.target.value as BillingPeriod }))
                  }
                  className="select"
                >
                  {BILLING_PERIODS.map((bp) => (
                    <option key={bp} value={bp}>{cap(bp)}</option>
                  ))}
                </select>
              </div>
            </div>

            {createError && (
              <div className="alert alert-error">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateError(null);
                  setNewPlan(defaultNewPlan);
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button type="submit" disabled={creating} className="btn btn-primary">
                {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Check className="h-4 w-4" /> Create plan</>}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        {!loading && !error && plans.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="tabs">
              {(["all", "active", "inactive"] as ViewTab[]).map((t) => {
                const active = view === t;
                return (
                  <button key={t} onClick={() => setView(t)} className={`tab ${active ? "tab-active" : ""}`}>
                    {cap(t)}
                    <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {tabCounts[t]}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-ink-soft">
              {activeCount} active of {plans.length} plans
            </p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-ink-soft">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading plans...
          </div>
        ) : error ? (
          <div className="p-5 sm:p-6">
            <div className="alert alert-error items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={fetchPlans} className="btn btn-secondary btn-sm">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          </div>
        ) : plans.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No AI plans yet"
            description="Create a plan so learners, teachers, parents and schools can subscribe."
            action={
              <button onClick={() => setShowCreateForm(true)} className="btn btn-primary">
                <Plus className="h-4 w-4" /> Create the first plan
              </button>
            }
          />
        ) : visiblePlans.length === 0 ? (
          <EmptyState icon={Layers} title="No plans in this view" description="Try another filter tab." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Plan name</th>
                  <th>Subscriber type</th>
                  <th className="text-right">Price</th>
                  <th className="hidden sm:table-cell">Billing period</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visiblePlans.map((plan) => {
                  const isEditing = editingId === plan.id;
                  const isSaving = savingId === plan.id;
                  const isDeactivating = deactivatingId === plan.id;
                  const rowErr = rowError[plan.id];

                  return (
                    <Fragment key={plan.id}>
                      <tr className={`${isEditing ? "bg-primary-50/60" : ""} ${!plan.active && !isEditing ? "text-slate-400" : ""}`}>
                        <td>
                          {isEditing ? (
                            <input
                              type="text"
                              value={editDraft.name ?? ""}
                              onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                              className="input min-w-[160px] py-1.5"
                            />
                          ) : (
                            <span className={`font-medium ${plan.active ? "text-ink" : "text-slate-500"}`}>{plan.name}</span>
                          )}
                        </td>

                        <td>
                          {isEditing ? (
                            <select
                              value={editDraft.subscriber_type ?? plan.subscriber_type}
                              onChange={(e) =>
                                setEditDraft((d) => ({ ...d, subscriber_type: e.target.value as SubscriberType }))
                              }
                              className="select py-1.5"
                            >
                              {SUBSCRIBER_TYPES.map((t) => (
                                <option key={t} value={t}>{cap(t)}</option>
                              ))}
                            </select>
                          ) : (
                            <Badge tone="blue">{cap(plan.subscriber_type)}</Badge>
                          )}
                        </td>

                        <td className="text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={editDraft.price_kes ?? plan.price_kes}
                              onChange={(e) =>
                                setEditDraft((d) => ({ ...d, price_kes: Number(e.target.value) }))
                              }
                              className="input ml-auto w-28 py-1.5 text-right"
                            />
                          ) : (
                            <span className={`whitespace-nowrap font-semibold tabular-nums ${plan.active ? "text-ink" : ""}`}>{formatKES(plan.price_kes)}</span>
                          )}
                        </td>

                        <td className="hidden sm:table-cell">
                          {isEditing ? (
                            <select
                              value={editDraft.billing_period ?? plan.billing_period}
                              onChange={(e) =>
                                setEditDraft((d) => ({ ...d, billing_period: e.target.value as BillingPeriod }))
                              }
                              className="select py-1.5"
                            >
                              {BILLING_PERIODS.map((bp) => (
                                <option key={bp} value={bp}>{cap(bp)}</option>
                              ))}
                            </select>
                          ) : (
                            cap(plan.billing_period)
                          )}
                        </td>

                        <td>
                          {plan.active ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Inactive</Badge>}
                        </td>

                        <td className="whitespace-nowrap text-right">
                          {isEditing ? (
                            <div className="inline-flex items-center gap-2">
                              <button onClick={() => saveEdit(plan.id)} disabled={isSaving} className="btn btn-primary btn-sm">
                                {isSaving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : <><Check className="h-3.5 w-3.5" /> Save</>}
                              </button>
                              <button onClick={cancelEdit} disabled={isSaving} className="btn btn-secondary btn-sm">
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button onClick={() => startEdit(plan)} className="btn-icon" title="Edit plan">
                                <Pencil className="h-4 w-4" />
                              </button>
                              {plan.active && (
                                <button
                                  onClick={() => deactivatePlan(plan.id)}
                                  disabled={isDeactivating}
                                  className="btn-icon text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                                  title="Deactivate plan"
                                >
                                  {isDeactivating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>

                      {rowErr && (
                        <tr className="bg-red-50 hover:bg-red-50">
                          <td colSpan={6} className="py-2 text-xs text-red-700">
                            <span className="inline-flex items-center gap-1.5"><AlertCircle className="h-3.5 w-3.5" /> {rowErr}</span>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
