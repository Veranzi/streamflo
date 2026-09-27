"use client";

import { useEffect, useState, useCallback } from "react";
import { ShieldAlert, UserPlus, Trash2, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { PageHeader, EmptyState, Badge } from "@/components/ui";

interface Admin {
  id: number;
  username: string;
  created_at: string;
}

interface FormState {
  username: string;
  password: string;
  confirmPassword: string;
}

const EMPTY_FORM: FormState = { username: "", password: "", confirmPassword: "" };

export default function AdminAdminsPage() {
  const [rows, setRows] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Fetch the session to know who is currently logged in (for self-delete guard).
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data?.user?.name) setCurrentUsername(data.user.name);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/admins");
    const data = await res.json();
    setRows(Array.isArray(data) ? data : (data.rows ?? []));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleFormChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError(null);
    setFormSuccess(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    const username = form.username.trim();
    if (!username) { setFormError("Username is required."); return; }
    if (form.password.length < 8) { setFormError("Password must be at least 8 characters."); return; }
    if (form.password !== form.confirmPassword) { setFormError("Passwords do not match."); return; }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Failed to create admin account.");
      } else {
        setFormSuccess(`Admin account "${username}" created successfully.`);
        setForm(EMPTY_FORM);
        await load();
      }
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, username: string) {
    if (currentUsername && username === currentUsername) {
      alert("You cannot delete your own admin account.");
      return;
    }
    if (!confirm(`Delete admin account "${username}"? This cannot be undone.`)) return;
    setBusy(id);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error ?? "Failed to delete admin account.");
      } else {
        await load();
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin accounts"
        description={`People who can sign in to this admin portal. ${rows.length} account${rows.length !== 1 ? "s" : ""} in total.`}
      />

      <div className="alert alert-warning">
        <ShieldAlert className="h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Security notice</p>
          <p className="mt-0.5 text-amber-700">
            Admin accounts have full site access. Only create accounts for trusted staff.
            Never share credentials, and use strong, unique passwords.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <div className="card xl:col-span-2">
          <div className="card-header">
            <div>
              <h2 className="font-semibold text-ink">Create an admin account</h2>
              <p className="text-xs text-ink-soft">The new admin can sign in straight away.</p>
            </div>
          </div>
          <form onSubmit={handleCreate} noValidate className="card-pad space-y-4">
            <div>
              <label htmlFor="admin-username" className="label">Username</label>
              <input
                id="admin-username"
                name="username"
                type="text"
                autoComplete="off"
                value={form.username}
                onChange={handleFormChange}
                placeholder="For example, jdoe"
                className="input"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
              <div>
                <label htmlFor="admin-password" className="label">Password</label>
                <input
                  id="admin-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={handleFormChange}
                  placeholder="At least 8 characters"
                  className="input"
                />
                <p className="help-text">Use at least 8 characters.</p>
              </div>
              <div>
                <label htmlFor="admin-confirm-password" className="label">Confirm password</label>
                <input
                  id="admin-confirm-password"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={handleFormChange}
                  placeholder="Type the password again"
                  className="input"
                />
              </div>
            </div>

            {formError && (
              <div className="alert alert-error">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}
            {formSuccess && (
              <div className="alert alert-success">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</> : <><UserPlus className="h-4 w-4" /> Create account</>}
              </button>
            </div>
          </form>
        </div>

        <div className="card overflow-hidden xl:col-span-3">
          <div className="card-header">
            <div>
              <h2 className="font-semibold text-ink">All admins</h2>
              <p className="text-xs text-ink-soft">You cannot delete the account you are signed in with.</p>
            </div>
            <Badge tone="gray">{rows.length}</Badge>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-ink-soft">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading admins...
            </div>
          ) : rows.length === 0 ? (
            <EmptyState icon={ShieldCheck} title="No admin accounts found" description="Create the first admin account using the form." />
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="hidden sm:table-cell">ID</th>
                    <th>Username</th>
                    <th>Created</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((admin) => {
                    const isSelf = currentUsername !== null && admin.username === currentUsername;
                    return (
                      <tr key={admin.id}>
                        <td className="hidden font-mono text-xs text-slate-400 sm:table-cell">{admin.id}</td>
                        <td>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-semibold uppercase text-primary-700">
                              {admin.username.slice(0, 2)}
                            </span>
                            <span className="font-semibold text-ink">{admin.username}</span>
                            {isSelf && <Badge tone="blue">You</Badge>}
                          </div>
                        </td>
                        <td className="whitespace-nowrap text-ink-soft">
                          {new Date(admin.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="text-right">
                          <button
                            disabled={busy === admin.id || isSelf}
                            onClick={() => handleDelete(admin.id, admin.username)}
                            title={isSelf ? "You cannot delete your own account." : `Delete ${admin.username}`}
                            className="btn-icon text-red-500 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            {busy === admin.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
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
    </div>
  );
}
