"use client";

import { useEffect, useMemo, useState } from "react";
import { curriculumLabel } from "@/lib/curriculum";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ChevronLeft, BookOpen, BookMarked, Search, FileText, X, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { EmptyState } from "@/components/ui";

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

  // Open on Guides tab if linked with ?tab=guide (teachers only)
  useEffect(() => {
    if (canViewGuides && typeof window !== "undefined") {
      const p = new URLSearchParams(window.location.search);
      if (p.get("tab") === "guide") setActiveTab("guide");
    }
  }, [canViewGuides]);
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [grade, setGrade] = useState<number | "">("");
  const [subject, setSubject] = useState<string>("");
  const [search, setSearch] = useState("");
  const [openNote, setOpenNote] = useState<NoteFull | null>(null);
  const [openLoading, setOpenLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ type: activeTab });
    if (grade) params.set("grade", String(grade));
    if (subject) params.set("subject", subject);
    fetch(`/api/ai/content/notes?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.warn("[notes] could not load:", data.error);
          setNotes([]);
          return;
        }
        setNotes(data);
      })
      .catch((e) => { console.warn("[notes] fetch error:", e.message); setNotes([]); })
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
      console.warn("[notes] openOne failed:", (e as Error).message);
    } finally { setOpenLoading(false); }
  }

  const kind = activeTab === "note" ? "notes" : "guides";

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/ai" className="link inline-flex items-center gap-1 text-sm">
          <ChevronLeft className="h-4 w-4" /> Learning tools
        </Link>
        <div className="mb-6 mt-4 flex items-start gap-4">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 sm:flex">
            {activeTab === "note" ? <BookOpen className="h-6 w-6" /> : <BookMarked className="h-6 w-6" />}
          </span>
          <div>
            <h1 className="page-title">CBE Notes Library</h1>
            <p className="page-subtitle">
              {activeTab === "note"
                ? "Original study notes for Kenyan CBE students, Grade 1 to 10. Filter by grade and subject."
                : "Teacher guides: curriculum schemes, lesson resources, and subject guides. Visible to teachers and admins only."}
            </p>
          </div>
        </div>

        {/* Tabs: Guides tab only visible to institution / admin (teachers) */}
        {canViewGuides && (
          <div className="tabs mb-5">
            <button
              onClick={() => { setActiveTab("note"); setGrade(""); setSubject(""); setSearch(""); }}
              className={`tab inline-flex items-center gap-1.5 ${activeTab === "note" ? "tab-active" : ""}`}
            >
              <BookOpen className="h-4 w-4" /> Notes
            </button>
            <button
              onClick={() => { setActiveTab("guide"); setGrade(""); setSubject(""); setSearch(""); }}
              className={`tab inline-flex items-center gap-1.5 ${activeTab === "guide" ? "tab-active" : ""}`}
            >
              <BookMarked className="h-4 w-4" /> Guides
              <span className={`badge ${activeTab === "guide" ? "bg-white/15 text-white ring-white/30" : "badge-amber"}`}>
                Teachers only
              </span>
            </button>
          </div>
        )}

        <div className="card mb-6 grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.5fr]">
          <div>
            <label className="label">Grade</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value === "" ? "" : Number(e.target.value))}
              className="select">
              <option value="">All grades</option>
              {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className="select">
              <option value="">All subjects</option>
              {subjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="label">Search</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Title or subject"
                className="input pl-9" />
            </div>
          </div>
        </div>

        {loading ? (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="card card-pad space-y-3">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </li>
            ))}
          </ul>
        ) : filtered.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={activeTab === "note" ? BookOpen : BookMarked}
              title={`No ${kind} found`}
              description={`No ${kind} match those filters. Try clearing them, or contact support to add more material.`}
            />
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((n) => (
              <li key={n.id}>
                <button onClick={() => openOne(n.id)}
                  className="card card-hover group flex h-full w-full flex-col p-4 text-left">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                      <FileText className="h-[18px] w-[18px]" />
                    </span>
                    <span className="flex-1 font-semibold leading-snug text-ink group-hover:text-primary-800">{n.title}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 pl-12">
                    <span className="badge badge-blue">Grade {n.grade}</span>
                    <span className="badge badge-gray">{n.subject}</span>
                    {n.curriculum && <span className="text-xs text-ink-soft">{curriculumLabel(n.curriculum)}</span>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {!loading && (
          <p className="mt-6 text-xs text-slate-400">
            Showing {filtered.length} of {notes.length} loaded {kind}.
          </p>
        )}
      </div>

      {(openNote || openLoading) && (
        <div className="modal-backdrop"
          onClick={() => { if (!openLoading) setOpenNote(null); }}>
          <div className="modal max-w-3xl"
            onClick={(e) => e.stopPropagation()}>
            <div className="modal-header items-start gap-4">
              {openNote ? (
                <div className="min-w-0">
                  <h2 className="text-xl font-bold">{openNote.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="badge badge-blue">Grade {openNote.grade}</span>
                    <span className="badge badge-gray">{openNote.subject}</span>
                    {openNote.curriculum && <span className="badge badge-gray">{curriculumLabel(openNote.curriculum)}</span>}
                  </div>
                </div>
              ) : (
                <span className="flex items-center gap-2 text-sm text-ink-soft">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                </span>
              )}
              <button onClick={() => setOpenNote(null)} disabled={openLoading}
                className="btn-icon shrink-0" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="modal-body scroll-thin">
              {openLoading && !openNote ? (
                <div className="space-y-3">
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-11/12" />
                  <div className="skeleton h-4 w-4/5" />
                </div>
              ) : (
                <div className="prose-content mx-auto max-w-2xl whitespace-pre-wrap text-[15px]">
                  {openNote?.content ?? ""}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
