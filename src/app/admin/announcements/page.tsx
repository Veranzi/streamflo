"use client";

import { useEffect, useState, useCallback } from "react";
import { Megaphone, Send, Pencil, Trash2, Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { PageHeader, EmptyState, Badge } from "@/components/ui";

interface Ann { id: number; message: string; active: boolean; created_at: string; }

export default function AdminAnnouncementsPage() {
  const [rows, setRows] = useState<Ann[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Inline edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [editMsg, setEditMsg] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/announcements");
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create() {
    if (!newMsg.trim()) return;
    setSaving(true);
    await fetch("/api/admin/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: newMsg.trim() }) });
    setNewMsg("");
    await load();
    setSaving(false);
  }

  async function toggle(id: number, current: boolean) {
    setBusy(id);
    await fetch(`/api/admin/announcements/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active: !current }) });
    await load();
    setBusy(null);
  }

  async function del(id: number) {
    if (!confirm("Delete this announcement?")) return;
    setBusy(id);
    await fetch(`/api/admin/announcements/${id}`, { method: "DELETE" });
    await load();
    setBusy(null);
  }

  function startEdit(a: Ann) {
    setEditId(a.id);
    setEditMsg(a.message);
  }

  function cancelEdit() {
    setEditId(null);
    setEditMsg("");
  }

  async function saveEdit(id: number) {
    if (!editMsg.trim()) return;
    setEditSaving(true);
    await fetch(`/api/admin/announcements/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: editMsg.trim() }),
    });
    setEditId(null);
    setEditMsg("");
    await load();
    setEditSaving(false);
  }

  const activeCount = rows.filter((r) => r.active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Announcements"
        description="Short messages that scroll across the top of the home page."
      />

      <div className="card card-pad">
        <label className="label" htmlFor="new-announcement">New announcement</label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="new-announcement"
            value={newMsg}
            onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="e.g. Form One admissions for 2027 are now open"
            className="input flex-1"
          />
          <button onClick={create} disabled={saving || !newMsg.trim()} className="btn btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {saving ? "Posting..." : "Post"}
          </button>
        </div>
        <p className="help-text">Active announcements scroll across the home page. Press Enter to post.</p>
      </div>

      <div className="card overflow-hidden">
        <div className="card-header">
          <h2 className="font-semibold text-ink">All announcements</h2>
          {!loading && rows.length > 0 && (
            <span className="text-xs text-ink-soft">
              {activeCount} active of {rows.length}
            </span>
          )}
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No announcements yet"
            description="Post your first announcement above to show it on the home page."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Message</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => {
                  const isEditing = editId === a.id;
                  return (
                    <tr key={a.id}>
                      <td className="max-w-md text-ink">
                        {isEditing ? (
                          <input
                            autoFocus
                            value={editMsg}
                            onChange={(e) => setEditMsg(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(a.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="input py-1.5"
                          />
                        ) : (
                          a.message
                        )}
                      </td>
                      <td>
                        {a.active ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Hidden</Badge>}
                      </td>
                      <td className="hidden whitespace-nowrap text-ink-soft sm:table-cell">
                        {new Date(a.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(a.id)}
                                disabled={editSaving || !editMsg.trim()}
                                className="btn btn-primary btn-sm"
                              >
                                {editSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                                {editSaving ? "Saving..." : "Save"}
                              </button>
                              <button onClick={cancelEdit} disabled={editSaving} className="btn btn-secondary btn-sm">
                                <X className="h-3.5 w-3.5" /> Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                disabled={busy === a.id}
                                onClick={() => startEdit(a)}
                                className="btn-icon disabled:opacity-50"
                                title="Edit announcement"
                                aria-label="Edit announcement"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                disabled={busy === a.id}
                                onClick={() => toggle(a.id, a.active)}
                                className="btn-icon disabled:opacity-50"
                                title={a.active ? "Hide from home page" : "Show on home page"}
                                aria-label={a.active ? "Hide" : "Show"}
                              >
                                {a.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                              <button
                                disabled={busy === a.id}
                                onClick={() => del(a.id)}
                                className="btn-icon hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                title="Delete announcement"
                                aria-label="Delete announcement"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
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
