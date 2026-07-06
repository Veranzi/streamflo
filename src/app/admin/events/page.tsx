"use client";

import { useEffect, useState, useCallback } from "react";

interface Event { id: number; title: string; description: string; school_name: string | null; active: boolean; created_at: string; }

export default function AdminEventsPage() {
  const [rows, setRows] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Events</h1>
        <button onClick={() => setShowNew(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700">
          + New Event
        </button>
      </div>

      {showNew && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 border border-blue-200">
          <h2 className="font-bold text-slate-800 mb-4">New Event</h2>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Event title" className="border border-slate-300 rounded px-3 py-2 text-sm w-full mb-3" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)" rows={3}
            className="border border-slate-300 rounded px-3 py-2 text-sm w-full mb-3" />
          <div className="flex gap-3">
            <button onClick={create} disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving…" : "Create"}
            </button>
            <button onClick={() => setShowNew(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded text-sm hover:bg-slate-200">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-slate-400">No events yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 border-b">
              <tr>
                <th className="p-3">Title</th>
                <th className="p-3">School</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800">{e.title}</td>
                  <td className="p-3 text-slate-500 text-xs">{e.school_name ?? "—"}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${e.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {e.active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{new Date(e.created_at).toLocaleDateString("en-KE")}</td>
                  <td className="p-3 text-right space-x-2">
                    <button disabled={busy === e.id} onClick={() => toggle(e.id, e.active)}
                      className={`px-3 py-1 rounded text-xs font-semibold disabled:opacity-50 ${e.active ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
                      {e.active ? "Hide" : "Show"}
                    </button>
                    <button disabled={busy === e.id} onClick={() => del(e.id)}
                      className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs font-semibold disabled:opacity-50">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
