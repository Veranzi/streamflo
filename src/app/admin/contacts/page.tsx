"use client";

import { useEffect, useState, useCallback } from "react";
import { Mail, Phone, Check, RotateCcw, Trash2, ChevronDown, ChevronUp, Inbox, Clock, Loader2 } from "lucide-react";
import { PageHeader, EmptyState, Badge } from "@/components/ui";

interface Msg {
  id: number; name: string; email: string; phone: string;
  message: string; handled: boolean; created_at: string;
}

export default function AdminContactsPage() {
  const [rows, setRows] = useState<Msg[]>([]);
  const [unread, setUnread] = useState(0);
  const [filter, setFilter] = useState("false");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/contacts?handled=${filter}`);
    const data = await res.json();
    setRows(data.rows ?? []);
    setUnread(data.unread ?? 0);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function markHandled(id: number, handled: boolean) {
    setBusy(id);
    await fetch("/api/admin/contacts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, handled }) });
    await load();
    setBusy(null);
  }

  async function del(id: number) {
    if (!confirm("Delete this message?")) return;
    setBusy(id);
    await fetch("/api/admin/contacts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    await load();
    setBusy(null);
  }

  const FILTERS: [string, string][] = [["false", "Unread"], ["true", "Handled"], ["all", "All"]];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact messages"
        description={
          unread > 0 ? (
            <span>
              Enquiries from the contact form.{" "}
              <span className="font-medium text-amber-700">{unread} unread</span>
            </span>
          ) : (
            "Enquiries from the contact form. You are all caught up."
          )
        }
        actions={
          <div className="tabs">
            {FILTERS.map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v)} className={`tab ${filter === v ? "tab-active" : ""}`}>
                {l}
                {v === "false" && unread > 0 && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                      filter === v ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card card-pad space-y-2">
              <div className="skeleton h-4 w-1/3" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Inbox}
            title="No messages"
            description={filter === "false" ? "There are no unread messages right now." : "Messages will show up here."}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((m) => (
            <div
              key={m.id}
              className={`card overflow-hidden ${m.handled ? "" : "border-l-4 border-l-primary-600"}`}
            >
              <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-ink">{m.name}</span>
                    {m.handled ? <Badge tone="gray">Handled</Badge> : <Badge tone="blue">New</Badge>}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
                    <a href={`mailto:${m.email}`} className="inline-flex items-center gap-1.5 hover:text-primary-700">
                      <Mail className="h-3.5 w-3.5" /> {m.email}
                    </a>
                    {m.phone && (
                      <a href={`tel:${m.phone}`} className="inline-flex items-center gap-1.5 hover:text-primary-700">
                        <Phone className="h-3.5 w-3.5" /> {m.phone}
                      </a>
                    )}
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(m.created_at).toLocaleString("en-KE", {
                        day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
                      })}
                    </span>
                  </div>
                  {expanded === m.id ? (
                    <p className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                      {m.message}
                    </p>
                  ) : (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-600">{m.message}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <button
                    onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    {expanded === m.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {expanded === m.id ? "Less" : "Read"}
                  </button>
                  <button
                    disabled={busy === m.id}
                    onClick={() => markHandled(m.id, !m.handled)}
                    className={`btn btn-sm ${m.handled ? "btn-secondary" : "btn-accent"}`}
                    title={m.handled ? "Move back to unread" : "Mark as handled"}
                  >
                    {busy === m.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : m.handled ? (
                      <RotateCcw className="h-3.5 w-3.5" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    {m.handled ? "Reopen" : "Done"}
                  </button>
                  <button
                    disabled={busy === m.id}
                    onClick={() => del(m.id)}
                    className="btn-icon hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    title="Delete message"
                    aria-label="Delete message"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
