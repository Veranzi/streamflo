"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Loader2, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Users, Info } from "lucide-react";
import { PageHeader, EmptyState, Badge } from "@/components/ui";

interface EduTenaUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  phone: string | null;
  email_verified: boolean;
  created_at: string;
}

interface ApiResponse {
  users: EduTenaUser[];
  total: number;
  page: number;
  pageSize: number;
}

const PAGE_SIZE = 20;

export default function EduTenaUsersPage() {
  const [users, setUsers] = useState<EduTenaUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input by 400ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (debouncedSearch.trim()) {
        params.set("search", debouncedSearch.trim());
      }
      const res = await fetch(`/api/admin/edutena-users?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Request failed with status ${res.status}`);
      }
      const data: ApiResponse = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return iso;
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="EduTena users"
        description="Learners and staff who use EduTena through their Streamflo account."
      />

      <div className="alert alert-info">
        <Info className="h-5 w-5 shrink-0" />
        <span>This list is read only. To change an account, use the Users page in the Streamflo admin.</span>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <span className="whitespace-nowrap text-sm text-ink-soft">
            {loading ? "Loading..." : `${total.toLocaleString()} user${total !== 1 ? "s" : ""} in total`}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-ink-soft">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading users...
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description={debouncedSearch ? `Nobody matches "${debouncedSearch}". Try another name or email.` : "EduTena users will appear here once they sign in."}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th className="hidden md:table-cell">Phone</th>
                  <th>Email status</th>
                  <th className="hidden sm:table-cell">Joined</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="font-medium text-ink">{user.name ?? <span className="text-slate-400">No name</span>}</div>
                      <div className="break-all text-xs text-ink-soft">{user.email}</div>
                    </td>
                    <td>
                      <span className="capitalize"><Badge tone="blue">{user.role}</Badge></span>
                    </td>
                    <td className="hidden whitespace-nowrap md:table-cell">
                      {user.phone ?? <span className="text-slate-400">Not set</span>}
                    </td>
                    <td className="whitespace-nowrap">
                      {user.email_verified ? (
                        <Badge tone="green"><CheckCircle2 className="h-3.5 w-3.5" /> Verified</Badge>
                      ) : (
                        <Badge tone="amber"><AlertCircle className="h-3.5 w-3.5" /> Unverified</Badge>
                      )}
                    </td>
                    <td className="hidden whitespace-nowrap text-ink-soft sm:table-cell">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-3 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>Page {page} of {totalPages}</span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="btn btn-secondary btn-sm"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | "ellipsis-start" | "ellipsis-end")[]>((acc, p, idx, arr) => {
                  if (idx > 0) {
                    const prev = arr[idx - 1] as number;
                    if ((p as number) - prev > 1) {
                      acc.push(p < page ? "ellipsis-start" : "ellipsis-end");
                    }
                  }
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  typeof item === "string" ? (
                    <span key={item + idx} className="select-none px-1">&hellip;</span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item)}
                      disabled={loading}
                      className={`h-8 min-w-[2rem] rounded-lg px-2 text-xs font-medium transition disabled:cursor-not-allowed ${
                        item === page
                          ? "bg-primary-700 text-white"
                          : "border border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="btn btn-secondary btn-sm"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
