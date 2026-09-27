"use client";

import { useEffect, useState, useCallback } from "react";
import { Trash2, Loader2, ImageIcon, ImageOff } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/ui";

interface SchoolPhoto {
  id: number;
  school_name: string;
  filename: string;
  caption: string | null;
  created_at: string;
}

export default function AdminPhotosPage() {
  const [rows, setRows] = useState<SchoolPhoto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/school-photos");
    const data = await res.json();
    setRows(data.rows ?? data ?? []);
    setTotal(data.total ?? (data.rows ?? data ?? []).length);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function del(id: number, filename: string) {
    if (!confirm(`Delete photo "${filename}"? This cannot be undone.`)) return;
    setBusy(id);
    await fetch(`/api/admin/school-photos/${id}`, { method: "DELETE" });
    setFailedImages((prev) => { const next = new Set(prev); next.delete(id); return next; });
    await load();
    setBusy(null);
  }

  function handleImageError(id: number) {
    setFailedImages((prev) => new Set(prev).add(id));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="School photos"
        description={`${total.toLocaleString()} photo${total === 1 ? "" : "s"} uploaded by schools. Remove anything that is not suitable.`}
      />

      <div className="card overflow-hidden">
        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="skeleton h-16 w-16 shrink-0" />
                <div className="skeleton h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No photos found"
            description="Photos that schools upload to their profiles will show up here."
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Photo</th>
                  <th>School</th>
                  <th className="hidden lg:table-cell">Filename</th>
                  <th className="hidden md:table-cell">Caption</th>
                  <th className="hidden sm:table-cell">Uploaded</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((photo) => (
                  <tr key={photo.id}>
                    <td>
                      {failedImages.has(photo.id) ? (
                        <span
                          className="flex h-16 w-16 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400"
                          title="Image not available"
                        >
                          <ImageOff className="h-5 w-5" />
                        </span>
                      ) : (
                        <img
                          src={`/uploads/school/${photo.filename}`}
                          alt={photo.caption ?? photo.filename}
                          className="h-16 w-16 rounded-lg border border-slate-200 bg-slate-100 object-cover"
                          onError={() => handleImageError(photo.id)}
                        />
                      )}
                    </td>
                    <td className="font-medium text-ink">{photo.school_name}</td>
                    <td className="hidden max-w-xs truncate font-mono text-xs text-ink-soft lg:table-cell">
                      {photo.filename}
                    </td>
                    <td className="hidden max-w-xs truncate md:table-cell">
                      {photo.caption ?? <span className="text-slate-400">None</span>}
                    </td>
                    <td className="hidden whitespace-nowrap text-ink-soft sm:table-cell">
                      {new Date(photo.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          disabled={busy === photo.id}
                          onClick={() => del(photo.id, photo.filename)}
                          className="btn-icon hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Delete photo"
                          aria-label="Delete photo"
                        >
                          {busy === photo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
