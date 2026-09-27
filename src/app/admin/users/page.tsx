"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Trash2, Loader2, Users as UsersIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader, EmptyState, Badge, type Tone } from "@/components/ui";

interface User {
  id: number; username: string; email: string; phone: string | null;
  role: string; school_id: number | null; created_at: string;
}

const ROLES = ["all", "parent", "student", "institution", "admin"];

export default function AdminUsersPage() {
  const [rows, setRows] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [role, setRole] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ role, page: String(page) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [role, page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  async function del(id: number, name: string) {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    await fetch("/api/admin/users", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
    setBusy(null);
  }

  const pages = Math.ceil(total / 40);

  const roleTone: Record<string, Tone> = {
    parent: "blue",
    student: "green",
    institution: "purple",
    admin: "red",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description={`${total.toLocaleString()} account${total === 1 ? "" : "s"} found. Parents, students, schools and admins.`}
      />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or email"
              className="input pl-9"
            />
          </div>
          <div className="tabs">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => { setRole(r); setPage(1); }}
                className={`tab capitalize ${role === r ? "tab-active" : ""}`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No users found"
            description={search ? "Try a different search term or role." : "People who sign up will show up here."}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th className="hidden md:table-cell">Phone</th>
                  <th className="hidden sm:table-cell">Joined</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-50 text-sm font-semibold uppercase text-primary-700">
                          {(u.username || u.email || "?").charAt(0)}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium text-ink">{u.username}</div>
                          <div className="truncate text-xs text-ink-soft">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge tone={roleTone[u.role] ?? "gray"}>
                        <span className="capitalize">{u.role}</span>
                      </Badge>
                    </td>
                    <td className="hidden md:table-cell">
                      {u.phone ?? <span className="text-slate-400">Not set</span>}
                    </td>
                    <td className="hidden text-ink-soft sm:table-cell">
                      {new Date(u.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <button
                          disabled={busy === u.id}
                          onClick={() => del(u.id, u.username)}
                          className="btn-icon hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Delete user"
                          aria-label="Delete user"
                        >
                          {busy === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
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
