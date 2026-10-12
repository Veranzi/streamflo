"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, CalendarDays, CircleCheck, EyeOff, Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui";

type EventRow = { id: number; title: string; description: string | null; active: boolean; created_at: string };
type Filter = "all" | "active" | "hidden";

export default function EventsManager() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/events", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not load events.");
      setRows(data.rows ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/dashboard/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save the event.");
      setTitle("");
      setDescription("");
      setNotice("Event added.");
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function toggle(row: EventRow) {
    setBusyId(row.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/dashboard/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, active: !row.active }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not update the event.");
      setRows((r) => r.map((x) => (x.id === row.id ? { ...x, active: !row.active } : x)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/dashboard/events?id=${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not delete the event.");
      setRows((r) => r.filter((x) => x.id !== id));
      setNotice("Event deleted.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusyId(null);
    }
  }

  const shown = rows.filter((r) => (filter === "all" ? true : filter === "active" ? r.active : !r.active));
  const counts = { all: rows.length, active: rows.filter((r) => r.active).length, hidden: rows.filter((r) => !r.active).length };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <form onSubmit={create} className="card card-pad h-fit space-y-4">
        <h2 className="font-display text-base font-semibold">Add an event</h2>
        <div>
          <label htmlFor="ev-title" className="label">Title</label>
          <input id="ev-title" required maxLength={255} value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="e.g. Open day on 14 November" />
        </div>
        <div>
          <label htmlFor="ev-desc" className="label">Details <span className="font-normal text-ink-soft">(optional)</span></label>
          <textarea id="ev-desc" rows={5} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} className="textarea" placeholder="Date, time, venue and anything parents should know" />
        </div>
        <button type="submit" disabled={saving} className="btn btn-primary w-full">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {saving ? "Saving..." : "Add event"}
        </button>
      </form>

      <div className="space-y-4 lg:col-span-2">
        {error && <div className="alert alert-error"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
        {notice && <div className="alert alert-success"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>{notice}</span></div>}

        <div className="tabs">
          {(["all", "active", "hidden"] as Filter[]).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={`tab ${filter === f ? "tab-active" : ""}`}>
              {f === "all" ? "All" : f === "active" ? "Visible" : "Hidden"} ({counts[f]})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="card card-pad space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}
          </div>
        ) : shown.length === 0 ? (
          <div className="card">
            <EmptyState icon={CalendarDays} title={rows.length === 0 ? "No events yet" : "Nothing here"} description={rows.length === 0 ? "Add your first event using the form." : "No events match this filter."} />
          </div>
        ) : (
          <ul className="space-y-3">
            {shown.map((r) => (
              <li key={r.id} className="card card-pad">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-ink">{r.title}</p>
                      {r.active ? <span className="badge badge-green">Visible</span> : <span className="badge badge-gray">Hidden</span>}
                    </div>
                    {r.description && <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{r.description}</p>}
                    <p className="mt-2 text-xs text-ink-soft">
                      Added {new Date(r.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => toggle(r)} disabled={busyId === r.id} className="btn-icon" aria-label={r.active ? "Hide event" : "Show event"} title={r.active ? "Hide event" : "Show event"}>
                      {r.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button type="button" onClick={() => remove(r.id)} disabled={busyId === r.id} className="btn-icon text-red-600 hover:bg-red-50 hover:text-red-700" aria-label="Delete event" title="Delete event">
                      {busyId === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
