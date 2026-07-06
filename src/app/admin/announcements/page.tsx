"use client";

import { useEffect, useState, useCallback } from "react";

interface Ann { id: number; message: string; active: boolean; created_at: string; }

export default function AdminAnnouncementsPage() {
  const [rows, setRows] = useState<Ann[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [saving, setSaving] = useState(false);

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

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Announcements</h1>

      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h2 className="font-semibold text-slate-700 mb-3">New Announcement</h2>
        <div className="flex gap-3">
          <input value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Type announcement message…"
            className="flex-1 border border-slate-300 rounded px-3 py-2 text-sm" />
          <button onClick={create} disabled={saving || !newMsg.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {saving ? "Posting…" : "Post"}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">Active announcements scroll across the home page.</p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-slate-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-8 text-center text-slate-400">No announcements yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500 border-b">
              <tr>
                <th className="p-3">Message</th>
                <th className="p-3">Status</th>
                <th className="p-3">Created</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="p-3 text-slate-800 max-w-md">{a.message}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                      {a.active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">{new Date(a.created_at).toLocaleDateString("en-KE")}</td>
                  <td className="p-3 text-right space-x-2">
                    <button disabled={busy === a.id} onClick={() => toggle(a.id, a.active)}
                      className={`px-3 py-1 rounded text-xs font-semibold disabled:opacity-50 ${a.active ? "bg-slate-100 text-slate-700 hover:bg-slate-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
                      {a.active ? "Hide" : "Show"}
                    </button>
                    <button disabled={busy === a.id} onClick={() => del(a.id)}
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
