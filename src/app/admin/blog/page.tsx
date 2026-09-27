"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, X, Pencil, Trash2, Star, Loader2, Newspaper, ChevronLeft, ChevronRight,
} from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui";

interface Post { id: number; title: string; featured: boolean; school_name: string | null; created_at: string; }

interface EditForm { title: string; content: string; featured: boolean; }

export default function AdminBlogPage() {
  const [rows, setRows] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  // create new post state
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", featured: false });
  const [saving, setSaving] = useState(false);

  // edit post state
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: "", content: "", featured: false });
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/blog?page=${page}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  // create
  async function save() {
    if (!form.title.trim()) return;
    setSaving(true);
    await fetch("/api/admin/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowNew(false);
    setForm({ title: "", content: "", featured: false });
    await load();
    setSaving(false);
  }

  // toggle featured
  async function toggleFeatured(id: number, current: boolean) {
    setBusy(id);
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    await fetch(`/api/admin/blog/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: row.title, content: "", featured: !current }) });
    await load();
    setBusy(null);
  }

  // delete
  async function del(id: number, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    setBusy(id);
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    await load();
    setBusy(null);
  }

  // open edit modal
  async function openEdit(row: Post) {
    setEditId(row.id);
    setEditForm({ title: row.title, content: "", featured: row.featured });
    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/${row.id}`);
      if (res.ok) {
        const data = await res.json();
        setEditForm({
          title: data.title ?? row.title,
          content: data.content ?? "",
          featured: data.featured ?? row.featured,
        });
      }
    } catch {
      // fallback: use list data, content stays empty
    } finally {
      setEditLoading(false);
    }
  }

  function closeEdit() {
    setEditId(null);
    setEditForm({ title: "", content: "", featured: false });
  }

  // save edit
  async function saveEdit() {
    if (!editForm.title.trim() || editId === null) return;
    setEditSaving(true);
    await fetch(`/api/admin/blog/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    closeEdit();
    await load();
    setEditSaving(false);
  }

  const pages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog posts"
        description={`${total.toLocaleString()} post${total === 1 ? "" : "s"}. Publish news, guides and school stories.`}
        actions={
          <button onClick={() => setShowNew(true)} className="btn btn-primary">
            <Plus className="h-4 w-4" /> New post
          </button>
        }
      />

      {/* create new post form */}
      {showNew && (
        <div className="card overflow-hidden border-primary-200">
          <div className="card-header">
            <div>
              <h2 className="font-semibold text-ink">New blog post</h2>
              <p className="text-xs text-ink-soft">Write in plain text or HTML.</p>
            </div>
            <button onClick={() => setShowNew(false)} className="btn-icon" title="Close" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="card-pad space-y-4">
            <div>
              <label className="label">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Give your post a clear title"
                className="input"
              />
            </div>
            <div>
              <label className="label">Content</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Content (HTML or plain text)"
                rows={8}
                className="textarea font-mono"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                className="checkbox"
                checked={form.featured}
                onChange={(e) => setForm({ ...form, featured: e.target.checked })}
              />
              Featured post
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
            <button onClick={() => setShowNew(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={save} disabled={saving} className="btn btn-primary">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving..." : "Publish"}
            </button>
          </div>
        </div>
      )}

      {/* edit modal */}
      {editId !== null && (
        <div className="modal-backdrop">
          <div className="modal max-w-2xl">
            <div className="modal-header">
              <h2 className="text-lg font-semibold text-ink">Edit post</h2>
              <button onClick={closeEdit} disabled={editSaving} className="btn-icon" title="Close" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="modal-body">
              {editLoading ? (
                <p className="flex items-center gap-2 text-sm text-ink-soft">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading post...
                </p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="label">Title</label>
                    <input
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      placeholder="Title"
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="label">Content</label>
                    <textarea
                      value={editForm.content}
                      onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                      placeholder="Content (HTML or plain text)"
                      rows={10}
                      className="textarea font-mono"
                    />
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={editForm.featured}
                      onChange={(e) => setEditForm({ ...editForm, featured: e.target.checked })}
                    />
                    Featured post
                  </label>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={closeEdit} disabled={editSaving} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={editSaving || editLoading} className="btn btn-primary">
                {editSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title="No posts yet"
            description="Write your first post to share news and guides with parents."
            action={
              <button onClick={() => setShowNew(true)} className="btn btn-primary btn-sm">
                <Plus className="h-4 w-4" /> New post
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
                  <th>Featured</th>
                  <th className="hidden sm:table-cell">Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td className="max-w-xs truncate font-medium text-ink">{p.title}</td>
                    <td className="hidden text-ink-soft md:table-cell">
                      {p.school_name ?? <span className="text-slate-400">Streamflo</span>}
                    </td>
                    <td>
                      <button
                        onClick={() => toggleFeatured(p.id, p.featured)}
                        disabled={busy === p.id}
                        title={p.featured ? "Remove from featured" : "Mark as featured"}
                        className={`badge transition disabled:opacity-50 ${
                          p.featured ? "badge-amber hover:bg-amber-100" : "badge-gray hover:bg-slate-100"
                        }`}
                      >
                        <Star className={`h-3 w-3 ${p.featured ? "fill-current" : ""}`} />
                        {p.featured ? "Featured" : "Not featured"}
                      </button>
                    </td>
                    <td className="hidden text-ink-soft sm:table-cell">
                      {new Date(p.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          disabled={busy === p.id}
                          onClick={() => openEdit(p)}
                          className="btn-icon disabled:opacity-50"
                          title="Edit post"
                          aria-label="Edit post"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          disabled={busy === p.id}
                          onClick={() => del(p.id, p.title)}
                          className="btn-icon hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Delete post"
                          aria-label="Delete post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-ink-soft">Page {page} of {pages}</p>
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-icon disabled:opacity-40"
                title="Previous page"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-9 min-w-[36px] rounded-lg px-2 text-sm font-medium transition ${
                    page === p ? "bg-primary-700 text-white" : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(pages, page + 1))}
                disabled={page === pages}
                className="btn-icon disabled:opacity-40"
                title="Next page"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
