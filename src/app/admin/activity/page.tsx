"use client";

import { useCallback, useEffect, useState } from "react";
import { History } from "lucide-react";
import { PageHeader, EmptyState, Badge, type Tone } from "@/components/ui";

interface Entry {
  id: number;
  admin_username: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  summary: string | null;
  created_at: string;
}

/** Colour by what the action did (the part after the dot). */
function verbTone(action: string): Tone {
  const verb = action.split(".").pop() ?? "";
  if (["approve", "confirm", "create", "feature", "activate"].includes(verb)) return "green";
  if (["reject", "delete", "unfeature", "cancel", "deactivate"].includes(verb)) return "red";
  return "blue";
}

const fmt = (d: string) =>
  new Date(d).toLocaleString("en-KE", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default function AdminActivityPage() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [total, setTotal] = useState(0);
  const [admins, setAdmins] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [admin, setAdmin] = useState("");
  const [type, setType] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ page: String(page), admin, type });
      const res = await fetch(`/api/admin/activity?${qs}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not load the activity log.");
      setRows(data.rows ?? []);
      setTotal(data.total ?? 0);
      setAdmins(data.admins ?? []);
      setTypes(data.types ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [page, admin, type]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.max(1, Math.ceil(total / 50));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity log"
        description="Every approval, payment decision and change made by an administrator, newest first."
        actions={
          <>
            <select value={admin} onChange={(e) => { setAdmin(e.target.value); setPage(1); }} className="select w-auto" aria-label="Filter by administrator">
              <option value="">All administrators</option>
              {admins.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="select w-auto" aria-label="Filter by type">
              <option value="">Everything</option>
              {types.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </>
        }
      />

      {error && <div className="alert alert-error"><span>{error}</span></div>}

      <div className="card">
        {loading ? (
          <div className="card-pad space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState icon={History} title="No activity yet" description="Actions by administrators will appear here." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>When</th><th>Administrator</th><th>Action</th><th>What happened</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap text-sm text-ink-soft">{fmt(r.created_at)}</td>
                    <td className="font-medium text-ink">{r.admin_username}</td>
                    <td><Badge tone={verbTone(r.action)}>{r.action}</Badge></td>
                    <td className="text-sm text-slate-700">
                      {r.summary ?? `${r.target_type ?? ""} ${r.target_id ?? ""}`.trim()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm text-ink-soft">
          <span>Page {page} of {pages} ({total} entries)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="btn btn-secondary btn-sm">Previous</button>
            <button disabled={page >= pages} onClick={() => setPage((p) => p + 1)} className="btn btn-secondary btn-sm">Next</button>
          </div>
        </div>
      )}
    </div>
  );
}
