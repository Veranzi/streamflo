"use client";

import { useEffect, useState, useCallback } from "react";

interface Post { id: number; title: string; featured: boolean; school_name: string | null; created_at: string; }

export default function AdminBlogPage() {
  const [rows, setRows] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", featured: false });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/blog?page=${page}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  async function save() {
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/admin/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowNew(false);
    setForm({ title: "", content: "", featured: false });
    await load();
    setSaving(false);
  }

  async function toggleFeatured(id: number, current: boolean) {
    setBusy(id);
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    await fetch(`/api/admin/blog/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: row.title, content: "", featured: !current }) });
    await load();
    setBusy(null);
  }

  async function del(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    setBusy(id);
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    await load();
    setBusy(null);
  }

  const pages = Math.ceil(total / 20);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Blog Posts</h1>
          <p className="text-sm text-slate-500">{total} total</p>
        </div>
        <button onClick={() => setShowNew(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700">
          + New Post
        </button>
      </div>

      {showNew && (
        <div className="bg-white rounded-xl shadow p-6 mb-6 border border-blue-200">
          <h2 className="font-bold text-slate-800 mb-4">New Blog Post</h2>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Title" className="border border-slate-300 rounded px-3 py-2 text-sm w-full mb-3" />
          <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Content (HTML or plain text)" rows={6}
            className="border border-slate-300 rounded px-3 py-2 text-sm w-full mb-3 font-mono" />
          <label className="flex items-center gap-2 text-sm text-slate-700 mb-4">
            <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
            Featured post
          </label>
          <div className="flex gap-3">
            <button onClick={save} disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Saving…" : "Publish"}
            </button>
            <button onClick={() => setShowNew(false)} className="bg-slate-100 text-slate-700 px-4 py-2 rounded text-sm hover:bg-slate-200">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 border-b">
            <tr>
              <th className="p-3">Title</th>
              <th className="p-3">School</th>
              <th className="p-3">Featured</th>
              <th className="p-3">Date</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">No posts yet.</td></tr>
            ) : rows.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3 font-medium text-slate-800 max-w-xs truncate">{p.title}</td>
                <td className="p-3 text-slate-500 text-xs">{p.school_name ?? "—"}</td>
                <td className="p-3">
                  <button onClick={() => toggleFeatured(p.id, p.featured)} disabled={busy === p.id}
                    className={`text-xs px-2 py-0.5 rounded-full font-semibold ${p.featured ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                    {p.featured ? "★ Featured" : "Not featured"}
                  </button>
                </td>
                <td className="p-3 text-slate-400">{new Date(p.created_at).toLocaleDateString("en-KE")}</td>
                <td className="p-3 text-right">
                  <button disabled={busy === p.id} onClick={() => del(p.id, p.title)}
                    className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-xs font-semibold disabled:opacity-50">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex gap-2 mt-4 justify-end">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded text-sm ${page === p ? "bg-blue-600 text-white" : "bg-white border text-slate-600 hover:bg-slate-50"}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
