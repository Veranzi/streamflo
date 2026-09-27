"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Check, X, Loader2, AlertCircle, Users } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui";

interface Agent {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  agent_code: string;
  commission_rate: number;
  created_at: string;
}

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  agent_code: "",
  commission_rate: "",
};

type FormState = typeof EMPTY_FORM;

export default function AdminAgentsPage() {
  const [rows, setRows] = useState<Agent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<FormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Inline edit
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Delete
  const [deleting, setDeleting] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agents");
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to load agents"); setLoading(false); return; }
      setRows(data.rows ?? data ?? []);
      setTotal(data.total ?? (data.rows ?? data ?? []).length);
    } catch (e) {
      setError((e as Error).message);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Create
  function openCreate() {
    setCreateForm(EMPTY_FORM);
    setCreateError(null);
    setShowCreate(true);
  }

  function cancelCreate() {
    setShowCreate(false);
    setCreateError(null);
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.agent_code.trim()) {
      setCreateError("Name, email and agent code are required.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          phone: createForm.phone.trim() || null,
          agent_code: createForm.agent_code.trim(),
          commission_rate: parseFloat(createForm.commission_rate) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.error ?? "Failed to create agent"); setCreating(false); return; }
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      await load();
    } catch (e) {
      setCreateError((e as Error).message);
    }
    setCreating(false);
  }

  // Edit
  function startEdit(agent: Agent) {
    setEditId(agent.id);
    setEditForm({
      name: agent.name,
      email: agent.email,
      phone: agent.phone ?? "",
      agent_code: agent.agent_code,
      commission_rate: String(agent.commission_rate),
    });
    setEditError(null);
  }

  function cancelEdit() {
    setEditId(null);
    setEditError(null);
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editId === null) return;
    setEditError(null);
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.agent_code.trim()) {
      setEditError("Name, email and agent code are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editId,
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim() || null,
          agent_code: editForm.agent_code.trim(),
          commission_rate: parseFloat(editForm.commission_rate) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setEditError(data.error ?? "Failed to save changes"); setSaving(false); return; }
      setEditId(null);
      await load();
    } catch (e) {
      setEditError((e as Error).message);
    }
    setSaving(false);
  }

  // Delete
  async function del(id: number, name: string) {
    if (!confirm(`Delete agent "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try {
      await fetch("/api/admin/agents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await load();
    } catch {
      // swallow
    }
    setDeleting(null);
  }

  // Helpers
  const inputCls = "input py-1.5";
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales agents"
        description={`Agents who bring schools on board and earn commission. ${total} in total.`}
        actions={
          !showCreate && (
            <button onClick={openCreate} className="btn btn-primary">
              <Plus className="h-4 w-4" /> Add agent
            </button>
          )
        }
      />

      {error && (
        <div className="alert alert-error">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {showCreate && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="font-semibold text-ink">New agent</h2>
              <p className="text-xs text-ink-soft">Fields marked with * are required.</p>
            </div>
            <button type="button" onClick={cancelCreate} className="btn-icon" title="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <form onSubmit={submitCreate} className="card-pad space-y-5">
            {createError && (
              <div className="alert alert-error">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{createError}</span>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="label">Name *</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Full name"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="agent@example.com"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Phone</label>
                <input
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+254700000000"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Agent code *</label>
                <input
                  value={createForm.agent_code}
                  onChange={(e) => setCreateForm((f) => ({ ...f, agent_code: e.target.value }))}
                  placeholder="AGT001"
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label">Commission rate (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={createForm.commission_rate}
                  onChange={(e) => setCreateForm((f) => ({ ...f, commission_rate: e.target.value }))}
                  placeholder="10"
                  className="input"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={cancelCreate} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={creating} className="btn btn-primary">
                {creating ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><Check className="h-4 w-4" /> Create agent</>}
              </button>
            </div>
          </form>
        </div>
      )}

      {editError && (
        <div className="alert alert-error">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{editError}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-ink-soft">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading agents...
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No agents yet"
            description="Add your first sales agent to start tracking commissions."
            action={
              !showCreate && (
                <button onClick={openCreate} className="btn btn-primary">
                  <Plus className="h-4 w-4" /> Add agent
                </button>
              )
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="hidden md:table-cell">Email</th>
                  <th className="hidden lg:table-cell">Phone</th>
                  <th>Agent code</th>
                  <th className="text-right">Commission</th>
                  <th className="hidden sm:table-cell">Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((agent) =>
                  editId === agent.id ? (
                    <tr key={agent.id} className="bg-primary-50/60 hover:bg-primary-50/60">
                      <td>
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className={`${inputCls} min-w-[140px]`}
                          placeholder="Full name"
                        />
                      </td>
                      <td className="hidden md:table-cell">
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                          className={`${inputCls} min-w-[160px]`}
                          placeholder="Email"
                        />
                      </td>
                      <td className="hidden lg:table-cell">
                        <input
                          value={editForm.phone}
                          onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                          className={`${inputCls} min-w-[120px]`}
                          placeholder="Phone"
                        />
                      </td>
                      <td>
                        <input
                          value={editForm.agent_code}
                          onChange={(e) => setEditForm((f) => ({ ...f, agent_code: e.target.value }))}
                          className={`${inputCls} min-w-[90px]`}
                          placeholder="Code"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={editForm.commission_rate}
                          onChange={(e) => setEditForm((f) => ({ ...f, commission_rate: e.target.value }))}
                          className={`${inputCls} ml-auto w-24 text-right`}
                          placeholder="0"
                        />
                      </td>
                      <td className="hidden whitespace-nowrap text-xs text-ink-soft sm:table-cell">
                        {fmtDate(agent.created_at)}
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <div className="inline-flex gap-2">
                          <button disabled={saving} onClick={submitEdit} className="btn btn-primary btn-sm">
                            {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : <><Check className="h-3.5 w-3.5" /> Save</>}
                          </button>
                          <button onClick={cancelEdit} className="btn btn-secondary btn-sm">
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={agent.id}>
                      <td>
                        <div className="font-semibold text-ink">{agent.name}</div>
                        <div className="text-xs text-ink-soft md:hidden">{agent.email}</div>
                      </td>
                      <td className="hidden md:table-cell">{agent.email}</td>
                      <td className="hidden lg:table-cell">{agent.phone ?? <span className="text-slate-400">Not set</span>}</td>
                      <td>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
                          {agent.agent_code}
                        </span>
                      </td>
                      <td className="text-right font-semibold tabular-nums text-ink">
                        {Number(agent.commission_rate).toFixed(2)}%
                      </td>
                      <td className="hidden whitespace-nowrap text-ink-soft sm:table-cell">
                        {fmtDate(agent.created_at)}
                      </td>
                      <td className="whitespace-nowrap text-right">
                        <div className="inline-flex gap-1">
                          <button onClick={() => startEdit(agent)} className="btn-icon" title="Edit agent">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            disabled={deleting === agent.id}
                            onClick={() => del(agent.id, agent.name)}
                            className="btn-icon text-red-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                            title="Delete agent"
                          >
                            {deleting === agent.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
