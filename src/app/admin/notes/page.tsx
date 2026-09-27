"use client";

import { useEffect, useState, useCallback } from "react";
import { BookOpenText, GraduationCap, Eye, Trash2, Loader2, AlertCircle, RefreshCw, FileText } from "lucide-react";
import { PageHeader, StatCard, EmptyState } from "@/components/ui";

type NoteType = "note" | "guide";

interface Note {
  id: string;
  title: string;
  grade: string;
  subject: string;
  type: NoteType;
  published: boolean;
}

type FilterTab = "all" | "note" | "guide";

export default function AdminNotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/notes");
      if (!res.ok) throw new Error(`Failed to fetch notes (${res.status})`);
      const data: Note[] = await res.json();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const totalNotes = notes.filter((n) => n.type === "note").length;
  const totalGuides = notes.filter((n) => n.type === "guide").length;
  const totalPublished = notes.filter((n) => n.published).length;

  const filtered = notes.filter((n) => {
    if (activeTab === "all") return true;
    return n.type === activeTab;
  });

  const handleTogglePublished = async (note: Note) => {
    setActionLoading(`publish-${note.id}`);
    try {
      const res = await fetch(`/api/admin/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published: !note.published }),
      });
      if (!res.ok) throw new Error("Failed to update published status");
      const updated: Note = await res.json();
      setNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n))
      );
    } catch {
      alert("Could not update published status. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangeType = async (note: Note, newType: NoteType) => {
    if (note.type === newType) return;
    setActionLoading(`type-${note.id}`);
    try {
      const res = await fetch(`/api/admin/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType }),
      });
      if (!res.ok) throw new Error("Failed to update type");
      const updated: Note = await res.json();
      setNotes((prev) =>
        prev.map((n) => (n.id === updated.id ? updated : n))
      );
    } catch {
      alert("Could not update type. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoading(`delete-${id}`);
    try {
      const res = await fetch(`/api/admin/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      setNotes((prev) => prev.filter((n) => n.id !== id));
      setConfirmDeleteId(null);
    } catch {
      alert("Could not delete. Please try again.");
    } finally {
      setActionLoading(null);
    }
  };

  const tabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "All", count: notes.length },
    { key: "note", label: "Notes", count: totalNotes },
    { key: "guide", label: "Guides", count: totalGuides },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="CBE notes and teacher guides"
        description="Manage study notes and teacher guides for every grade and subject."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Study notes" value={totalNotes.toLocaleString()} hint="For learners" icon={BookOpenText} tone="blue" />
        <StatCard label="Teacher guides" value={totalGuides.toLocaleString()} hint="For teachers" icon={GraduationCap} tone="purple" />
        <StatCard label="Published" value={totalPublished.toLocaleString()} hint={`${notes.length - totalPublished} in draft`} icon={Eye} tone="green" />
      </div>

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="tabs">
            {tabs.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`tab ${active ? "tab-active" : ""}`}>
                  {tab.label}
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
          {!loading && !error && filtered.length > 0 && (
            <p className="text-sm text-ink-soft">
              Showing {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-ink-soft">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading notes...
          </div>
        ) : error ? (
          <div className="p-5 sm:p-6">
            <div className="alert alert-error items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={fetchNotes} className="btn btn-secondary btn-sm">
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </button>
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={FileText} title="Nothing here yet" description="No notes or guides match this filter." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th className="hidden sm:table-cell">Grade</th>
                  <th className="hidden md:table-cell">Subject</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((note) => (
                  <tr key={note.id}>
                    <td className="max-w-xs">
                      <div className="truncate font-medium text-ink" title={note.title}>{note.title}</div>
                      <div className="truncate text-xs text-ink-soft sm:hidden">
                        {note.grade} | {note.subject}
                      </div>
                    </td>
                    <td className="hidden whitespace-nowrap sm:table-cell">{note.grade}</td>
                    <td className="hidden md:table-cell">{note.subject}</td>

                    <td>
                      <select
                        value={note.type}
                        disabled={actionLoading === `type-${note.id}`}
                        onChange={(e) => handleChangeType(note, e.target.value as NoteType)}
                        className="select w-auto py-1.5 text-xs"
                        aria-label="Change type"
                      >
                        <option value="note">Note</option>
                        <option value="guide">Guide</option>
                      </select>
                    </td>

                    <td className="whitespace-nowrap">
                      <div className="flex items-center">
                        <button
                          onClick={() => handleTogglePublished(note)}
                          disabled={actionLoading === `publish-${note.id}`}
                          aria-label={note.published ? "Unpublish" : "Publish"}
                          title={note.published ? "Unpublish" : "Publish"}
                          className={[
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
                            "transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1",
                            "disabled:cursor-not-allowed disabled:opacity-50",
                            note.published ? "bg-accent-600" : "bg-slate-300",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow",
                              "transition duration-200 ease-in-out",
                              note.published ? "translate-x-4" : "translate-x-0",
                            ].join(" ")}
                          />
                        </button>
                        <span className={`ml-2 text-xs font-medium ${note.published ? "text-accent-700" : "text-slate-500"}`}>
                          {note.published ? "Published" : "Draft"}
                        </span>
                      </div>
                    </td>

                    <td className="whitespace-nowrap text-right">
                      {confirmDeleteId === note.id ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="text-xs text-ink-soft">Delete this item?</span>
                          <button
                            onClick={() => handleDelete(note.id)}
                            disabled={actionLoading === `delete-${note.id}`}
                            className="btn btn-danger btn-sm"
                          >
                            {actionLoading === `delete-${note.id}` ? (
                              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Deleting...</>
                            ) : (
                              "Yes, delete"
                            )}
                          </button>
                          <button onClick={() => setConfirmDeleteId(null)} className="btn btn-secondary btn-sm">
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(note.id)}
                          className="btn-icon text-red-500 hover:bg-red-50 hover:text-red-700"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
