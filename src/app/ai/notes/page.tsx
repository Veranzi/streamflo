"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Navbar from "@/components/Navbar";

interface NoteListItem {
  id: number;
  title: string;
  grade: number;
  subject: string;
  curriculum: string;
  tags: string[] | string | null;
  author: string | null;
  created_at: string;
}

interface NoteFull extends NoteListItem {
  content: string;
}

const GRADES = Array.from({ length: 10 }, (_, i) => i + 1);

export default function NotesPage() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const canViewGuides = role === "institution" || role === "admin";

  const [activeTab, setActiveTab] = useState<"note" | "guide">("note");
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grade, setGrade] = useState<number | "">("");
  const [subject, setSubject] = useState<string>("");
  const [search, setSearch] = useState("");
  const [openNote, setOpenNote] = useState<NoteFull | null>(null);
  const [openLoading, setOpenLoading] = useState(false);

  useEffect(() => {
    setLoading(true); setError(null);
    const params = new URLSearchParams({ type: activeTab });
    if (grade) params.set("grade", String(grade));
    if (subject) params.set("subject", subject);
    fetch(`/api/ai/content/notes?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) { setError(data.error ?? "Could not load notes"); setNotes([]); return; }
        setNotes(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [grade, subject, activeTab]);

  const subjects = useMemo(() => {
    const s = new Set<string>();
    notes.forEach((n) => s.add(n.subject));
    return Array.from(s).sort();
  }, [notes]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) =>
      n.title.toLowerCase().includes(q) ||
      n.subject.toLowerCase().includes(q)
    );
  }, [notes, search]);

  async function openOne(id: number) {
    setOpenLoading(true);
    try {
      const r = await fetch(`/api/ai/content/notes/${id}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed to load note");
      setOpenNote(data);
    } catch (e) {
      setError((e as Error).message);
    } finally { setOpenLoading(false); }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-8">
        <Link href="/ai" className="text-sm text-blue-600 hover:underline">← AI Tools</Link>
        <h1 className="text-3xl font-bold mt-2 mb-1">CBE Notes Library</h1>
        <p className="text-slate-600 mb-5">
          {activeTab === "note"
            ? "Original study notes for Kenyan CBC students — Grade 1 to 10. Filter by grade and subject."
            : "Career pathway guides and subject combination resources for schools."}
        </p>

        {/* Tabs — guides tab only visible to institution / admin */}
        <div className="flex gap-1 mb-6 border-b border-slate-200">
          <button
            onClick={() => { setActiveTab("note"); setGrade(""); setSubject(""); setSearch(""); }}
            className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition ${
              activeTab === "note"
                ? "border-blue-600 text-blue-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Notes
          </button>
          {canViewGuides && (
            <button
              onClick={() => { setActiveTab("guide"); setGrade(""); setSubject(""); setSearch(""); }}
              className={`px-4 py-2 text-sm font-medium rounded-t border-b-2 transition ${
                activeTab === "guide"
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              School Guides
            </button>
          )}
        </div>

        <div className="bg-white rounded shadow border border-slate-200 p-4 mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Grade</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full border border-slate-300 rounded px-2 py-2 text-sm">
              <option value="">All grades</option>
              {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-slate-300 rounded px-2 py-2 text-sm">
              <option value="">All subjects</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Search</label>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title or subject…"
              className="w-full border border-slate-300 rounded px-2 py-2 text-sm" />
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-900 text-sm p-3 rounded mb-4">{error}</div>}

        {loading ? (
          <p className="text-slate-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded p-6 text-center text-amber-900">
            No {activeTab === "note" ? "notes" : "guides"} match those filters. Try clearing them, or contact support to add more material.
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((n) => (
              <li key={n.id}>
                <button onClick={() => openOne(n.id)}
                  className="w-full text-left bg-white rounded shadow border border-slate-200 p-4 hover:shadow-md hover:border-blue-300 transition">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold text-slate-800">{n.title}</span>
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">G{n.grade}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{n.subject} · {n.curriculum}</div>
                </button>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-slate-400 mt-8">
          Showing {filtered.length} of {notes.length} loaded {activeTab === "note" ? "notes" : "guides"}.
        </p>
      </div>

      {(openNote || openLoading) && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => { if (!openLoading) setOpenNote(null); }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b border-slate-200">
              {openNote ? (
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{openNote.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">Grade {openNote.grade} · {openNote.subject} · {openNote.curriculum}</p>
                </div>
              ) : <span className="text-slate-500">Loading…</span>}
              <button onClick={() => setOpenNote(null)} disabled={openLoading}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none">×</button>
            </div>
            <div className="overflow-y-auto p-5 prose prose-sm max-w-none whitespace-pre-wrap text-slate-700">
              {openNote?.content ?? ""}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
