"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, Loader2, MessageSquare, Check, Undo2, AlertCircle } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui";

interface Comment {
  id: number;
  author_name: string;
  content: string;
  post_title: string;
  created_at: string;
  /** Missing before the moderation migration runs; those comments are all visible. */
  approved?: boolean;
}

type FilterTab = "all" | "pending" | "approved";

const isApproved = (c: Comment) => c.approved !== false;

export default function AdminBlogCommentsPage() {
  const [rows, setRows] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [tab, setTab] = useState<FilterTab>("all");
  const [moderation, setModeration] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blog-comments");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not load comments.");
      setRows(data.rows ?? []);
      setTotal(data.total ?? (data.rows?.length ?? 0));
      setModeration(data.moderation !== false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load comments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function setApproved(id: number, approved: boolean) {
    setBusy(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/blog-comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not update the comment.");
      // Update in place so the record stays in the list whatever tab is open.
      setRows((prev) => prev.map((c) => (c.id === id ? { ...c, approved } : c)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the comment.");
    } finally {
      setBusy(null);
    }
  }

  async function del(id: number, author: string) {
    if (!confirm(`Delete comment by "${author}"? This cannot be undone.`)) return;
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/admin/blog-comments/${id}`, { method: "DELETE" });
    if (!res.ok) setError("Could not delete the comment. Please try again.");
    await load();
    setBusy(null);
  }

  const pendingCount = rows.filter((c) => !isApproved(c)).length;
  const approvedCount = rows.length - pendingCount;
  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: rows.length },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "approved", label: "Approved", count: approvedCount },
  ];
  const visible = rows.filter((c) =>
    tab === "all" ? true : tab === "pending" ? !isApproved(c) : isApproved(c)
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog comments"
        description={`${total.toLocaleString()} comment${total === 1 ? "" : "s"} from readers. New comments appear on the blog only after you approve them.`}
      />

      {!moderation && (
        <div className="alert alert-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Comment moderation is not set up in the database yet, so all comments are currently visible. Ask your developer to run the blog comment moderation migration.</span>
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        {!loading && rows.length > 0 && (
          <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="tabs">
              {tabs.map((t) => {
                const active = tab === t.key;
                return (
                  <button key={t.key} onClick={() => setTab(t.key)} className={`tab ${active ? "tab-active" : ""}`}>
                    {t.label}
                    <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-ink-soft">{pendingCount} waiting for review</p>
          </div>
        )}

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={rows.length === 0 ? "No comments yet" : tab === "pending" ? "Nothing waiting for review" : "No comments here"}
            description={rows.length === 0 ? "Comments left on blog posts will show up here." : "Switch tabs to see other comments."}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Comment</th>
                  <th className="hidden md:table-cell">Post</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const approved = isApproved(c);
                  return (
                    <tr key={c.id}>
                      <td className="whitespace-nowrap font-medium text-ink">{c.author_name}</td>
                      <td className="max-w-sm">
                        <span className="line-clamp-3 block whitespace-pre-wrap">{c.content}</span>
                      </td>
                      <td className="hidden max-w-xs truncate whitespace-nowrap text-xs text-ink-soft md:table-cell">
                        {c.post_title}
                      </td>
                      <td>
                        <span className={`badge ${approved ? "badge-green" : "badge-amber"}`}>
                          {approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap text-ink-soft sm:table-cell">
                        {new Date(c.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          {moderation && (
                            approved ? (
                              <button
                                disabled={busy === c.id}
                                onClick={() => setApproved(c.id, false)}
                                className="btn btn-secondary btn-sm disabled:opacity-50"
                                title="Hide this comment from the blog"
                              >
                                {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
                                Unapprove
                              </button>
                            ) : (
                              <button
                                disabled={busy === c.id}
                                onClick={() => setApproved(c.id, true)}
                                className="btn btn-primary btn-sm disabled:opacity-50"
                                title="Show this comment on the blog"
                              >
                                {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                Approve
                              </button>
                            )
                          )}
                          <button
                            disabled={busy === c.id}
                            onClick={() => del(c.id, c.author_name)}
                            className="btn-icon hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            title="Delete comment"
                            aria-label="Delete comment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
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
