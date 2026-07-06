"use client";

import { useEffect, useState, useCallback } from "react";

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

  const roleColor: Record<string, string> = {
    parent: "bg-blue-100 text-blue-700",
    student: "bg-green-100 text-green-700",
    institution: "bg-purple-100 text-purple-700",
    admin: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Users</h1>
          <p className="text-sm text-slate-500">{total} total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-5 flex flex-wrap gap-3">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or email…"
          className="border border-slate-300 rounded px-3 py-2 text-sm flex-1 min-w-48" />
        {ROLES.map((r) => (
          <button key={r} onClick={() => { setRole(r); setPage(1); }}
            className={`px-3 py-2 rounded text-sm font-medium capitalize ${role === r ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {r}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 border-b">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Role</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Joined</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-slate-400">No users found.</td></tr>
            ) : rows.map((u) => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3">
                  <div className="font-semibold text-slate-800">{u.username}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleColor[u.role] ?? "bg-slate-100 text-slate-600"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-3 text-slate-500">{u.phone ?? "—"}</td>
                <td className="p-3 text-slate-400">{new Date(u.created_at).toLocaleDateString("en-KE")}</td>
                <td className="p-3 text-right">
                  <button disabled={busy === u.id} onClick={() => del(u.id, u.username)}
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
