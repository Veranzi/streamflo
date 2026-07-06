"use client";

import { useEffect, useState, useCallback } from "react";

interface Msg {
  id: number; name: string; email: string; phone: string;
  message: string; handled: boolean; created_at: string;
}

export default function AdminContactsPage() {
  const [rows, setRows] = useState<Msg[]>([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState("false");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/contacts?handled=${filter}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setUnread(data.unread ?? 0);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function markHandled(id: number, handled: boolean) {
    setBusy(id);
    await fetch("/api/admin/contacts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, handled }) });
    await load();
    setBusy(null);
  }

  async function del(id: number) {
    if (!confirm("Delete this message?")) return;
    setBusy(id);
    await fetch("/api/admin/contacts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
    setBusy(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Contact Messages</h1>
          {unread > 0 && <p className="text-sm text-amber-600 font-medium mt-0.5">{unread} unread</p>}
        </div>
        <div className="flex gap-2">
          {[["false", "Unread"], ["true", "Handled"], ["all", "All"]].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3 py-2 rounded text-sm font-medium ${filter === v ? "bg-blue-600 text-white" : "bg-white border text-slate-600 hover:bg-slate-50"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400 p-8">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center text-slate-400">No messages.</div>
      ) : (
        <div className="space-y-3">
          {rows.map((m) => (
            <div key={m.id} className={`bg-white rounded-xl shadow border ${m.handled ? "border-slate-100 opacity-70" : "border-blue-200"}`}>
              <div className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800">{m.name}</span>
                    <span className="text-sm text-slate-500">{m.email}</span>
                    {m.phone && <span className="text-sm text-slate-400">{m.phone}</span>}
                    {!m.handled && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">New</span>}
                  </div>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{m.message}</p>
                  {expanded === m.id && (
                    <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap bg-slate-50 rounded p-3">{m.message}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">{new Date(m.created_at).toLocaleString("en-KE")}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold">
                    {expanded === m.id ? "Less" : "Read"}
                  </button>
                  <button disabled={busy === m.id} onClick={() => markHandled(m.id, !m.handled)}
                    className={`px-3 py-1 rounded text-xs font-semibold disabled:opacity-50 ${m.handled ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}>
                    {m.handled ? "Reopen" : "Done"}
                  </button>
                  <button disabled={busy === m.id} onClick={() => del(m.id)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs font-semibold disabled:opacity-50">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
