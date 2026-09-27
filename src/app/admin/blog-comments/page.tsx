"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, Loader2, MessageSquare } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui";

interface Comment {
  id: number;
  author_name: string;
  content: string;
  post_title: string;
  created_at: string;
}

export default function AdminBlogCommentsPage() {
  const [rows, setRows] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/blog-comments");
    const data = await res.json();
    setRows(data.rows ?? []);
    setTotal(data.total ?? (data.rows?.length ?? 0));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function del(id: number, author: string) {
    if (!confirm(`Delete comment by "${author}"?`)) return;
    setBusy(id);
    await fetch("/api/admin/blog-comments", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await load();
    setBusy(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blog comments"
        description={`${total.toLocaleString()} comment${total === 1 ? "" : "s"} from readers. Remove anything that is spam or unkind.`}
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No comments yet"
            description="Comments left on blog posts will show up here."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Author</th>
                  <th>Comment</th>
                  <th className="hidden md:table-cell">Post</th>
                  <th className="hidden sm:table-cell">Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td className="whitespace-nowrap font-medium text-ink">{c.author_name}</td>
                    <td className="max-w-sm">
                      <span className="line-clamp-2 block">{c.content}</span>
                    </td>
                    <td className="hidden max-w-xs truncate whitespace-nowrap text-xs text-ink-soft md:table-cell">
                      {c.post_title}
                    </td>
                    <td className="hidden whitespace-nowrap text-ink-soft sm:table-cell">
                      {new Date(c.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          disabled={busy === c.id}
                          onClick={() => del(c.id, c.author_name)}
                          className="btn-icon hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Delete comment"
                          aria-label="Delete comment"
                        >
                          {busy === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
