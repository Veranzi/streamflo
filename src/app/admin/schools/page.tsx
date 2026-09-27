"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  X, Loader2, AlertCircle, Search, Check, Pencil, Eye, Trash2, School as SchoolIcon, ChevronLeft, ChevronRight,
} from "lucide-react";
import { PageHeader, EmptyState, Badge } from "@/components/ui";

interface School {
  id: number;
  name: string;
  county: string;
  subcounty: string;
  type: string;
  curriculum: string;
  ownership: string;
  gender: string;
  boarding: string;
  package: string;
  featured: boolean;
  approved: boolean;
  email: string;
  phone: string;
  created_at: string;
}

type EditForm = Omit<School, "id" | "created_at">;

const EMPTY_FORM: EditForm = {
  name: "",
  county: "",
  subcounty: "",
  type: "",
  curriculum: "",
  ownership: "",
  gender: "",
  boarding: "",
  package: "free",
  featured: false,
  approved: false,
  email: "",
  phone: "",
};

function EditModal({
  school,
  onClose,
  onSaved,
}: {
  school: School;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<EditForm>({
    name: school.name ?? "",
    county: school.county ?? "",
    subcounty: school.subcounty ?? "",
    type: school.type ?? "",
    curriculum: school.curriculum ?? "",
    ownership: school.ownership ?? "",
    gender: school.gender ?? "",
    boarding: school.boarding ?? "",
    package: school.package ?? "free",
    featured: school.featured ?? false,
    approved: school.approved ?? false,
    email: school.email ?? "",
    phone: school.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/schools/${school.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${res.status}`);
      }
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal max-w-2xl">
        <div className="modal-header">
          <div>
            <h2 className="text-lg font-semibold text-ink">Edit school</h2>
            <p className="text-xs text-ink-soft">Update the details shown in the public directory.</p>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close" title="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form id="edit-school-form" onSubmit={handleSave} className="modal-body space-y-5">
          <Field label="School name" required>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="County">
              <input value={form.county} onChange={(e) => set("county", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Sub-county">
              <input value={form.subcounty} onChange={(e) => set("subcounty", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type">
              <input
                value={form.type}
                onChange={(e) => set("type", e.target.value)}
                className={inputCls}
                placeholder="e.g. Primary, Secondary"
              />
            </Field>
            <Field label="Curriculum">
              <input
                value={form.curriculum}
                onChange={(e) => set("curriculum", e.target.value)}
                className={inputCls}
                placeholder="e.g. CBE, 8-4-4"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Ownership">
              <input
                value={form.ownership}
                onChange={(e) => set("ownership", e.target.value)}
                className={inputCls}
                placeholder="e.g. Public, Private"
              />
            </Field>
            <Field label="Gender">
              <input
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                className={inputCls}
                placeholder="e.g. Mixed, Boys, Girls"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Boarding">
              <input
                value={form.boarding}
                onChange={(e) => set("boarding", e.target.value)}
                className={inputCls}
                placeholder="e.g. Day, Boarding, Day & Boarding"
              />
            </Field>
            <Field label="Package">
              <select value={form.package} onChange={(e) => set("package", e.target.value)} className="select">
                <option value="free">Free</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email">
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Phone">
              <input type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
            </Field>
          </div>

          <div className="flex flex-wrap gap-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="checkbox"
              />
              Featured
            </label>
            <label className="flex cursor-pointer select-none items-center gap-2 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={form.approved}
                onChange={(e) => set("approved", e.target.checked)}
                className="checkbox"
              />
              Approved
            </label>
          </div>

          {error && (
            <div className="alert alert-error">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" form="edit-school-form" disabled={saving} className="btn btn-primary">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Utility sub-components */
const inputCls = "input";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

/* Main page */

export default function AdminSchoolsPage() {
  const [rows, setRows] = useState<School[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");

  // Open on the tab named in ?status= (the dashboard links to ?status=pending)
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("status");
    if (s) setStatus(s);
  }, []);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [editTarget, setEditTarget] = useState<School | null>(null);

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

  useEffect(() => {
    load();
  }, [load]);

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
    <div className="space-y-6">
      {editTarget && (
        <EditModal
          school={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={async () => {
            setEditTarget(null);
            await load();
          }}
        />
      )}

      <PageHeader
        title="Schools"
        description={`${total.toLocaleString()} school${total === 1 ? "" : "s"} found. Approve new registrations and keep details up to date.`}
      />

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name or county"
              className="input pl-9"
            />
          </div>
          <div className="tabs">
            {["all", "pending", "approved"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  setPage(1);
                }}
                className={`tab capitalize ${status === s ? "tab-active" : ""}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={SchoolIcon}
            title="No schools found"
            description={search ? "Try a different search term or filter." : "Schools that register will show up here."}
          />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>School</th>
                  <th className="hidden sm:table-cell">County</th>
                  <th className="hidden md:table-cell">Type</th>
                  <th className="hidden md:table-cell">Package</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="font-medium text-ink">{s.name}</div>
                      <div className="text-xs text-ink-soft">{s.email || "No email"}</div>
                    </td>
                    <td className="hidden sm:table-cell">
                      {s.county || <span className="text-slate-400">Not set</span>}
                    </td>
                    <td className="hidden capitalize md:table-cell">
                      {s.type || <span className="normal-case text-slate-400">Not set</span>}
                    </td>
                    <td className="hidden md:table-cell">
                      <Badge tone={s.package === "premium" ? "blue" : s.package === "enterprise" ? "purple" : "gray"}>
                        <span className="capitalize">{s.package || "free"}</span>
                      </Badge>
                    </td>
                    <td>
                      {s.approved ? <Badge tone="green">Approved</Badge> : <Badge tone="amber">Pending</Badge>}
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                        {!s.approved && (
                          <button
                            disabled={busy === s.id}
                            onClick={() => approve(s.id)}
                            className="btn btn-accent btn-sm"
                            title="Approve school"
                          >
                            {busy === s.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Check className="h-3.5 w-3.5" />
                            )}
                            Approve
                          </button>
                        )}
                        <button
                          disabled={busy === s.id}
                          onClick={() => setEditTarget(s)}
                          className="btn-icon disabled:opacity-50"
                          title="Edit school"
                          aria-label="Edit school"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <Link
                          href={`/profile/${s.id}`}
                          target="_blank"
                          className="btn-icon"
                          title="View public profile"
                          aria-label="View public profile"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <button
                          disabled={busy === s.id}
                          onClick={() => del(s.id, s.name)}
                          className="btn-icon hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          title="Delete school"
                          aria-label="Delete school"
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
            <p className="text-xs text-ink-soft">
              Page {page} of {pages}
            </p>
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
