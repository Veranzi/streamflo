"use client";

import { useEffect, useState, useCallback } from "react";

interface Payment {
  id: number; amount: number; method: string; reference: string;
  status: string; created_at: string; school_name: string | null; county: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  success: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
  reversed: "bg-slate-100 text-slate-500",
};

export default function AdminPaymentsPage() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [total, setTotal] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/payments?page=${page}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setTotal(data.total ?? 0);
    setRevenue(data.revenue ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const pages = Math.ceil(total / 30);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
          <p className="text-sm text-slate-500">{total} total · KES {revenue.toLocaleString()} collected</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
          <p className="text-sm text-slate-500">Total Revenue</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">KES {revenue.toLocaleString()}</p>
          <p className="text-xs text-slate-400 mt-1">Successful payments only</p>
        </div>
        <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
          <p className="text-sm text-slate-500">Total Transactions</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{total}</p>
          <p className="text-xs text-slate-400 mt-1">All statuses</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500 border-b">
            <tr>
              <th className="p-3">School</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Method</th>
              <th className="p-3">Reference</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={6} className="p-8 text-center text-slate-400">No payments yet.</td></tr>
            ) : rows.map((p) => (
              <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50">
                <td className="p-3">
                  <div className="font-medium text-slate-800">{p.school_name ?? "—"}</div>
                  <div className="text-xs text-slate-400">{p.county}</div>
                </td>
                <td className="p-3 font-semibold text-slate-800">KES {Number(p.amount).toLocaleString()}</td>
                <td className="p-3 text-slate-600 capitalize">{p.method ?? "—"}</td>
                <td className="p-3 font-mono text-slate-600 text-xs">{p.reference ?? "—"}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[p.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-3 text-slate-400">{new Date(p.created_at).toLocaleDateString("en-KE")}</td>
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
