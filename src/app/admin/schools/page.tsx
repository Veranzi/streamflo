"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface School {
  id: number; name: string; county: string; type: string;
  curriculum: string; package: string; approved: boolean;
  featured: boolean; email: string; phone: string; created_at: string;
}

export default function AdminSchoolsPage() {
  const [rows, setRows] = useState<School[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
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
    const params = new URLSearchParams({ status, page: String(page) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    const res = await fetch(`/api/admin/schools?${params}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [status, page, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  async function approve(id: number) {
    setBusy(id);
    await fetch(`/api/admin/schools/${id}/approve`, { method: "POST" });
    await load();
    setBusy(null);
  }

  async function del(id: number, name: string) {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusy(id);
    await fetch(`/api/admin/schools/${id}`, { method: "DELETE" });
    await load();
    setBusy(null);
  }

  const pages = Math.ceil(total / 30);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Schools</h1>
          <p className="text-sm text-slate-500">{total} total</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-4 mb-5 flex flex-wrap gap-3">
        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name or county…"
          className="border border-slate-300 rounded px-3 py-2 text-sm flex-1 min-w-48" />
        {["all", "pending", "approved"].map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1); }}
            className={`px-3 py-2 rounded text-sm font-medium capitalize ${status === s ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 border-b">
            <tr>
              <th className="p-3">School</th>
              <th className="p-3">County</th>
              <th className="p-3">Type</th>
              <th className="p-3">Package</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">No schools found.</td></tr>
            ) : rows.map((s) => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3">
                  <div className="font-semibold text-slate-800">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.email}</div>
                </td>
                <td className="p-3 text-slate-600">{s.county}</td>
                <td className="p-3 text-slate-600 capitalize">{s.type}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.package === "premium" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                    {s.package}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.approved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {s.approved ? "Approved" : "Pending"}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2 whitespace-nowrap">
                  {!s.approved && (
                    <button disabled={busy === s.id} onClick={() => approve(s.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-50">
                      {busy === s.id ? "…" : "Approve"}
                    </button>
                  )}
                  <Link href={`/profile/${s.id}`} target="_blank"
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1 rounded text-xs font-semibold">
                    View
                  </Link>
                  <button disabled={busy === s.id} onClick={() => del(s.id, s.name)}
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
