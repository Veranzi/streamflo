"use client";

import { Fragment, useEffect, useState, useCallback } from "react";
import { Plus, X, Pencil, Trash2, Eye, EyeOff, Loader2, CalendarDays, Check } from "lucide-react";
import { PageHeader, EmptyState, Badge } from "@/components/ui";

interface Event { id: number; title: string; description: string; school_name: string | null; active: boolean; created_at: string; }

export default function AdminEventsPage() {
  const [rows, setRows] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // inline edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: "", description: "" });
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/events");
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/admin/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ title: "", description: "" });
    setShowNew(false);
    await load();
    setSaving(false);
  }

  async function toggle(id: number, active: boolean) {
    setBusy(id);
    await fetch("/api/admin/events", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active: !active }) });
    await load();
    setBusy(null);
  }

  async function del(id: number) {
    if (!confirm("Delete this event?")) return;
    setBusy(id);
    await fetch("/api/admin/events", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
    setBusy(null);
  }

  function startEdit(ev: Event) {
    setEditId(ev.id);
    setEditForm({ title: ev.title, description: ev.description });
  }

  function cancelEdit() {
    setEditId(null);
    setEditForm({ title: "", description: "" });
  }

  async function saveEdit() {
    if (!editForm.title.trim() || editId === null) return;
    setEditSaving(true);
    await fetch("/api/admin/events", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId, title: editForm.title, description: editForm.description }),
    });
    await load();
    setEditSaving(false);
    cancelEdit();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="School events and open days shown to parents on the site."
        actions={
          <button onClick={() => setShowNew(true)} className="btn btn-primary">
            <Plus className="h-4 w-4" /> New event
          </button>
        }
      />

      {showNew && (
        <div className="card overflow-hidden border-primary-200">
          <div className="card-header">
            <h2 className="font-semibold text-ink">New event</h2>
            <button onClick={() => setShowNew(false)} className="btn-icon" title="Close" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="card-pad space-y-4">
            <div>
              <label className="label">Event title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Parents open day"
                className="input"
              />
            </div>
            <div>
              <label className="label">
                Description <span className="font-normal text-ink-soft">(optional)</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Date, venue and anything parents should know"
                rows={3}
                className="textarea"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
            <button onClick={() => setShowNew(false)} className="btn btn-secondary">Cancel</button>
            <button onClick={create} disabled={saving} className="btn btn-primary">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Create event"}
            </button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No events yet"
            description="Create an event to let parents know what is coming up."
            action={
              <button onClick={() => setShowNew(true)} className="btn btn-primary btn-sm">
                <Plus className="h-4 w-4" /> New event
              </button>
            }
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th className="hidden md:table-cell">School</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <Fragment key={e.id}>
                    <tr className={editId === e.id ? "bg-primary-50/40" : ""}>
                      <td>
                        <div className="font-medium text-ink">{e.title}</div>
                        {e.description && (
                          <div className="line-clamp-1 max-w-md text-xs text-ink-soft">{e.description}</div>
                        )}
                      </td>
                      <td className="hidden text-ink-soft md:table-cell">
                        {e.school_name ?? <span className="text-slate-400">Streamflo</span>}
                      </td>
                      <td>
                        {e.active ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Hidden</Badge>}
                      </td>
                      <td className="hidden whitespace-nowrap text-ink-soft sm:table-cell">
                        {new Date(e.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                          <button
                            disabled={busy === e.id}
                            onClick={() => (editId === e.id ? cancelEdit() : startEdit(e))}
                            className={`btn-icon disabled:opacity-50 ${editId === e.id ? "bg-slate-100 text-slate-900" : ""}`}
                            title={editId === e.id ? "Cancel editing" : "Edit event"}
                            aria-label={editId === e.id ? "Cancel editing" : "Edit event"}
                          >
                            {editId === e.id ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                          </button>
                          <button
                            disabled={busy === e.id}
                            onClick={() => toggle(e.id, e.active)}
                            className="btn-icon disabled:opacity-50"
                            title={e.active ? "Hide event" : "Show event"}
                            aria-label={e.active ? "Hide event" : "Show event"}
                          >
                            {e.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                          <button
                            disabled={busy === e.id}
                            onClick={() => del(e.id)}
                            className="btn-icon hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Delete event"
                            aria-label="Delete event"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editId === e.id && (
                      <tr className="bg-slate-50 hover:bg-slate-50">
                        <td colSpan={5}>
                          <div className="max-w-xl space-y-3 py-2">
                            <p className="eyebrow">Edit event</p>
                            <div>
                              <label className="label">Event title</label>
                              <input
                                value={editForm.title}
                                onChange={(ev) => setEditForm({ ...editForm, title: ev.target.value })}
                                placeholder="Event title"
                                className="input"
                              />
                            </div>
                            <div>
                              <label className="label">
                                Description <span className="font-normal text-ink-soft">(optional)</span>
                              </label>
                              <textarea
                                value={editForm.description}
                                onChange={(ev) => setEditForm({ ...editForm, description: ev.target.value })}
                                placeholder="Description (optional)"
                                rows={3}
                                className="textarea"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={saveEdit}
                                disabled={editSaving || !editForm.title.trim()}
                                className="btn btn-primary btn-sm"
                              >
                                {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                {editSaving ? "Saving..." : "Save"}
                              </button>
                              <button onClick={cancelEdit} className="btn btn-secondary btn-sm">
                                Cancel
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
