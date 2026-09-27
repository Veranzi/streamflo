"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
import {
  ChevronLeft, Compass, User, Users, Upload, FileText, Loader2, CircleCheck, Plus, X,
  Sparkles, TrendingUp, Target, Briefcase, Download, FileSpreadsheet, Trophy, TriangleAlert,
  GraduationCap, Info,
} from "lucide-react";
import Navbar from "@/components/Navbar";

interface Subject { subject: string; score: number; }
interface PredictionResponse {
  id: number;
  predicted_pathway: string;
  predicted_careers: string[];
  strength_areas: string[];
  improvement_areas: string[];
  confidence: number;
  rationale: string;
}

interface BroadsheetRow {
  student_name: string;
  grade: number;
  subjects: { subject: string; score: number }[];
}

type CbePathway = "STEM" | "Social Sciences" | "Arts and Sports Science";

interface PerStudent {
  student_name: string;
  grade: number;
  avg_score: number;
  predicted_pathway: CbePathway;
  reason: string;
}

interface BroadsheetResult {
  id: number;
  class_name: string;
  total_students: number;
  pathway_distribution: Record<CbePathway, number>;
  per_student: PerStudent[];
  top_performers: { student_name: string; score: number; predicted_pathway: CbePathway }[];
  needs_attention: { student_name: string; score: number; predicted_pathway: CbePathway }[];
  note?: string;
}

const PATHWAY_COLOR: Record<CbePathway, string> = {
  "STEM":                     "badge badge-blue",
  "Social Sciences":          "badge badge-amber",
  "Arts and Sports Science":  "badge badge-purple",
};

const PATHWAY_BAR: Record<CbePathway, string> = {
  "STEM":                     "bg-primary-600",
  "Social Sciences":          "bg-amber-500",
  "Arts and Sports Science":  "bg-violet-500",
};

type Mode = "single" | "broadsheet";

// Official CBE subjects per grade band (KICD curriculum designs).
// Used to drive the subject picker so users don't have to type, and so subject names
// are consistent (better grounding for the LLM and for matching with content notes).
const CBE_SUBJECTS_BY_GRADE: { range: [number, number]; subjects: string[] }[] = [
  { range: [1, 3],  subjects: ["English", "Kiswahili", "Mathematics", "Environmental Activities", "Hygiene & Nutrition", "Religious Education", "Creative Arts", "Movement & Health"] },
  { range: [4, 6],  subjects: ["English", "Kiswahili", "Mathematics", "Science & Technology", "Social Studies", "Religious Education", "Agriculture", "Home Science", "Creative Arts"] },
  { range: [7, 9],  subjects: ["English", "Kiswahili", "Mathematics", "Integrated Science", "Pre-Technical Studies", "Social Studies", "Religious Education", "Agriculture", "Life Skills", "Sports & Physical Education", "Business Studies"] },
  { range: [10, 12], subjects: ["English", "Kiswahili", "Mathematics", "Chemistry", "Physics", "Biology", "Computer Science", "General Science", "Business Studies", "History & Citizenship", "Geography", "Religious Education", "Agriculture", "Home Science", "Theatre & Film", "Literature in English", "Community Service Learning"] },
];

function subjectsForGrade(grade: number): string[] {
  for (const band of CBE_SUBJECTS_BY_GRADE) {
    if (grade >= band.range[0] && grade <= band.range[1]) return band.subjects;
  }
  return CBE_SUBJECTS_BY_GRADE[2].subjects; // sensible default = Junior Sec
}

export default function PredictPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("single");

  useEffect(() => { if (status === "unauthenticated") router.push("/login?callbackUrl=/ai/predict"); }, [status, router]);

  const role = session?.user?.role;
  const canBroadsheet = role === "institution" || role === "admin";

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/ai" className="link inline-flex items-center gap-1 text-sm">
          <ChevronLeft className="h-4 w-4" /> Learning tools
        </Link>
        <div className="mb-6 mt-4 flex items-start gap-4">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-50 text-accent-700 sm:flex">
            <Compass className="h-6 w-6" />
          </span>
          <div>
            <h1 className="page-title">Career Pathway Predictor</h1>
            <p className="page-subtitle">
              {canBroadsheet
                ? "Predict CBE senior school pathways, strengths and Kenyan market careers for one student or a whole class."
                : "Predict CBE senior school pathways, strengths and Kenyan market careers from a student's grades."}
            </p>
          </div>
        </div>

        {canBroadsheet && (
          <div className="tabs mb-6">
            <button
              onClick={() => setMode("single")}
              className={`tab inline-flex items-center gap-1.5 ${mode === "single" ? "tab-active" : ""}`}>
              <User className="h-4 w-4" /> Single student
            </button>
            <button
              onClick={() => setMode("broadsheet")}
              className={`tab inline-flex items-center gap-1.5 ${mode === "broadsheet" ? "tab-active" : ""}`}>
              <Users className="h-4 w-4" /> Class broadsheet
            </button>
          </div>
        )}

        {canBroadsheet && mode === "broadsheet" ? <BroadsheetForm /> : <SingleStudentForm />}
      </div>
    </>
  );
}

// ============================================================================
// SINGLE STUDENT
// ============================================================================
function SingleStudentForm() {
  const slipRef = useRef<HTMLInputElement>(null);
  const [studentName, setStudentName] = useState("");
  const [grade, setGrade] = useState(9);
  const [subjects, setSubjects] = useState<Subject[]>([
    { subject: "Mathematics", score: 80 },
    { subject: "English", score: 75 },
    { subject: "Integrated Science", score: 85 },
  ]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extractNotice, setExtractNotice] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");

  function addSubject() { setSubjects((s) => [...s, { subject: "", score: 0 }]); }
  function removeSubject(i: number) { setSubjects((s) => s.filter((_, idx) => idx !== i)); }
  function updateSubject(i: number, field: keyof Subject, value: string | number) {
    setSubjects((s) => s.map((x, idx) => idx === i ? { ...x, [field]: value } : x));
  }

  async function handleSlip(file: File) {
    if (file.size > 15 * 1024 * 1024) { setError("Slip is over 15 MB."); return; }
    setExtracting(true); setError(""); setExtractNotice(null); setResult(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ai/predict/individual/extract", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Could not read the slip."); return; }
      const parsed = data as { student_name: string; grade: number; subjects: { subject: string; score: number }[] };
      if (!parsed.subjects?.length) { setError("Couldn't read any subjects from that file. Try a clearer image, or fill in the form manually."); return; }
      if (parsed.student_name) setStudentName(parsed.student_name);
      if (parsed.grade > 0 && parsed.grade <= 10) setGrade(parsed.grade);
      setSubjects(parsed.subjects);
      setExtractNotice(`Read ${parsed.subjects.length} subject${parsed.subjects.length === 1 ? "" : "s"} from the slip. Please review before predicting.`);
    } catch (e) {
      setError(`Upload failed: ${(e as Error).message}`);
    } finally {
      setExtracting(false);
      if (slipRef.current) slipRef.current.value = "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/ai/predict/individual", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          student_name: studentName, grade, curriculum: "CBC",
          subjects: subjects.filter((s) => s.subject.trim() && s.score > 0),
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Prediction failed.");
      else setResult(data);
    } catch {
      setError("Could not reach the prediction service.");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      {/* Step 1: optional slip upload */}
      <section className="card card-pad">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
            <Upload className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">Have a results slip?</p>
            <p className="text-sm text-ink-soft">
              Upload a photo or PDF and we&apos;ll fill in the subjects automatically. You can edit them before predicting.
            </p>
          </div>
          <label className={`btn btn-secondary shrink-0 cursor-pointer ${extracting ? "pointer-events-none opacity-60" : ""}`}>
            {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {extracting ? "Reading slip..." : "Upload slip"}
            <input ref={slipRef} type="file" accept="image/*,application/pdf"
              disabled={extracting}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSlip(f); }}
              className="sr-only" />
          </label>
        </div>
        {extractNotice && (
          <div className="alert alert-success mt-4">
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{extractNotice}</span>
          </div>
        )}
      </section>

      <form onSubmit={submit} className="card">
        {/* Step 2: student details */}
        <div className="card-header">
          <div className="flex items-center gap-3">
            <StepNumber n={1} />
            <h2 className="text-base font-semibold">Student details</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <label className="label">Student name</label>
            <input required value={studentName} onChange={(e) => setStudentName(e.target.value)}
              className="input" placeholder="e.g. Amina Wanjiru" />
          </div>
          <div>
            <label className="label">Grade</label>
            <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className="select">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((g) =>
                <option key={g} value={g}>Grade {g}</option>
              )}
            </select>
          </div>
        </div>

        {/* Step 3: subjects */}
        <div className="card-header border-t">
          <div className="flex items-center gap-3">
            <StepNumber n={2} />
            <div>
              <h2 className="text-base font-semibold">Subjects and scores</h2>
              <p className="text-xs text-ink-soft">Pick from the CBE list for Grade {grade} or type a custom subject.</p>
            </div>
          </div>
          <button type="button" onClick={addSubject} className="btn btn-secondary btn-sm">
            <Plus className="h-4 w-4" /> Add subject
          </button>
        </div>
        <div className="p-5 sm:p-6">
          {/* Quick add chips: tap a subject to add it with score 0 */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {subjectsForGrade(grade)
              .filter((cbe) => !subjects.some((s) => s.subject === cbe))
              .map((cbe) => (
                <button key={cbe} type="button"
                  onClick={() => setSubjects((s) => [...s, { subject: cbe, score: 0 }])}
                  className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700">
                  <Plus className="h-3 w-3" /> {cbe}
                </button>
              ))}
          </div>

          <datalist id={`cbe-subjects-grade-${grade}`}>
            {subjectsForGrade(grade).map((cbe) => <option key={cbe} value={cbe} />)}
          </datalist>

          <div className="mb-1.5 hidden gap-2 px-0.5 text-xs font-medium uppercase tracking-wide text-slate-400 sm:flex">
            <span className="flex-1">Subject</span>
            <span className="w-24">Score (0 to 100)</span>
            <span className="w-9" />
          </div>
          <div className="space-y-2">
            {subjects.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  list={`cbe-subjects-grade-${grade}`}
                  value={s.subject}
                  onChange={(e) => updateSubject(i, "subject", e.target.value)}
                  placeholder="Pick or type a subject"
                  className="input flex-1"
                  autoComplete="off"
                />
                <input type="number" min={0} max={100} value={s.score}
                  onChange={(e) => updateSubject(i, "score", Number(e.target.value))}
                  className="input w-24 tabular-nums" aria-label="Score" />
                {subjects.length > 1 ? (
                  <button type="button" onClick={() => removeSubject(i)}
                    className="btn-icon shrink-0 hover:bg-red-50 hover:text-red-600" title="Remove subject" aria-label="Remove subject">
                    <X className="h-4 w-4" />
                  </button>
                ) : <span className="w-9 shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 rounded-b-xl">
          {error ? (
            <div className="alert alert-error flex-1">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : (
            <p className="text-xs text-ink-soft">Subjects with a score of 0 are left out of the prediction.</p>
          )}
          <button type="submit" disabled={loading} className="btn btn-primary shrink-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {loading ? "Analysing..." : "Predict pathway"}
          </button>
        </div>
      </form>

      {result && (
        <section className="card overflow-hidden">
          <div className="border-b border-slate-200 bg-primary-50/60 p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white">
                  <GraduationCap className="h-6 w-6" />
                </span>
                <div>
                  <p className="eyebrow">Recommended pathway</p>
                  <p className="font-display text-2xl font-bold text-ink">{result.predicted_pathway}</p>
                </div>
              </div>
              <div className="sm:w-48">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-soft">Confidence</span>
                  <span className="font-semibold text-ink tabular-nums">{Math.round(result.confidence * 100)}%</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-2 rounded-full bg-primary-600" style={{ width: `${Math.round(result.confidence * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            <div>
              <h3 className="mb-1.5 text-sm font-semibold">Why this pathway</h3>
              <p className="text-sm leading-relaxed text-slate-600">{result.rationale}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-accent-200 bg-accent-50/50 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-accent-700">
                  <TrendingUp className="h-4 w-4" /> Strengths
                </h3>
                <ul className="space-y-1.5 text-sm">
                  {result.strength_areas.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <Target className="h-4 w-4" /> Improvement areas
                </h3>
                <ul className="space-y-1.5 text-sm">
                  {result.improvement_areas.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" /> {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div>
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Briefcase className="h-4 w-4 text-slate-500" /> Career suggestions
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.predicted_careers.map((c, i) =>
                  <span key={i} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 shadow-sm">{c}</span>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

// ============================================================================
// BROADSHEET (class-level)
// ============================================================================
function BroadsheetForm() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [className, setClassName] = useState("");
  const [rows, setRows] = useState<BroadsheetRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<BroadsheetResult | null>(null);

  function handleFile(file: File) {
    setParseError(null); setResult(null); setError("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: null });
        if (aoa.length < 2) { setParseError("File has no data rows."); return; }

        const header = (aoa[0] as unknown[]).map((h) => String(h ?? "").trim());
        const lower = header.map((h) => h.toLowerCase());
        const nameIdx = lower.findIndex((h) => /name|student/.test(h));
        const gradeIdx = lower.findIndex((h) => /^grade$|class|form/.test(h));
        if (nameIdx < 0) { setParseError("Couldn't find a 'Student Name' column."); return; }

        const subjectIdxs = header
          .map((h, i) => ({ h, i }))
          .filter(({ i }) => i !== nameIdx && i !== gradeIdx && header[i]);

        const parsed: BroadsheetRow[] = [];
        for (let r = 1; r < aoa.length; r++) {
          const row = aoa[r] as unknown[];
          const name = String(row[nameIdx] ?? "").trim();
          if (!name) continue;
          const gradeRaw = gradeIdx >= 0 ? row[gradeIdx] : undefined;
          const grade = Number(String(gradeRaw ?? "").replace(/[^\d]/g, "")) || 9;
          const subjects = subjectIdxs
            .map(({ h, i }) => ({ subject: h, score: Number(row[i]) }))
            .filter((s) => Number.isFinite(s.score) && s.score > 0);
          if (subjects.length) parsed.push({ student_name: name, grade, subjects });
        }

        if (parsed.length < 2) { setParseError("Need at least 2 students with valid scores."); return; }
        if (parsed.length > 500) { setParseError(`File has ${parsed.length} students; maximum is 500 per upload. Split into smaller classes.`); return; }
        setRows(parsed);
      } catch (e) {
        setParseError(`Could not parse file: ${(e as Error).message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  async function submit() {
    if (!className.trim()) { setError("Enter a class name (e.g. Grade 9 East)."); return; }
    if (rows.length < 2) { setError("Upload a class roster first."); return; }
    setLoading(true); setError(""); setResult(null);
    try {
      const res = await fetch("/api/ai/predict/broadsheet", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_name: className,
          students: rows.map((r) => ({
            student_name: r.student_name, grade: r.grade, curriculum: "CBC", subjects: r.subjects,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Bulk prediction failed.");
      else setResult(data);
    } catch {
      setError("Could not reach the prediction service.");
    } finally { setLoading(false); }
  }

  function downloadTemplate() {
    const sample = [
      ["Student Name", "Grade", "Mathematics", "English", "Kiswahili", "Integrated Science", "Social Studies", "Pre-Technical", "CRE", "Creative Arts"],
      ["Sample Student A", 9, 82, 76, 70, 88, 65, 72, 80, 78],
      ["Sample Student B", 9, 65, 80, 85, 60, 78, 70, 82, 85],
      ["Sample Student C", 9, 90, 70, 65, 92, 60, 88, 70, 60],
    ];
    const ws = XLSX.utils.aoa_to_sheet(sample);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Class");
    XLSX.writeFile(wb, "class-broadsheet-template.xlsx");
  }

  function exportResults() {
    if (!result) return;
    const wb = XLSX.utils.book_new();

    const perAoa: (string | number)[][] = [["Student", "Grade", "Avg score", "Predicted pathway", "Reason"]];
    for (const s of result.per_student) {
      perAoa.push([s.student_name, s.grade, Math.round(s.avg_score), s.predicted_pathway, s.reason]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(perAoa), "Per student");

    const distAoa: (string | number)[][] = [["Pathway", "Students"]];
    for (const [k, v] of Object.entries(result.pathway_distribution)) distAoa.push([k, v]);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(distAoa), "Distribution");

    const topAoa: (string | number)[][] = [["Student", "Avg score", "Pathway"], ...result.top_performers.map((p) => [p.student_name, Math.round(p.score), p.predicted_pathway])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topAoa), "Top performers");

    const naAoa: (string | number)[][] = [["Student", "Avg score", "Pathway"], ...result.needs_attention.map((p) => [p.student_name, Math.round(p.score), p.predicted_pathway])];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(naAoa), "Needs attention");

    XLSX.writeFile(wb, `${result.class_name.replace(/\s+/g, "_")}-pathway-report.xlsx`);
  }

  const totalForChart = result ? Math.max(1, ...Object.values(result.pathway_distribution)) : 1;

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
              <FileSpreadsheet className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-semibold">Upload a class broadsheet</h2>
              <p className="text-xs text-ink-soft sm:text-sm">
                Excel (.xlsx) or CSV with one row per student. First column is the student name, remaining columns are subjects.
              </p>
            </div>
          </div>
          <button onClick={downloadTemplate} className="btn btn-secondary btn-sm shrink-0">
            <Download className="h-4 w-4" /> <span className="hidden sm:inline">Download template</span><span className="sm:hidden">Template</span>
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="label">Class name</label>
              <input value={className} onChange={(e) => setClassName(e.target.value)}
                placeholder="e.g. Grade 9 East" className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="label">Broadsheet file</label>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                className="block w-full rounded-lg border border-dashed border-slate-300 bg-slate-50 p-1.5 text-sm text-slate-600 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary-700 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-primary-800" />
            </div>
          </div>

          {parseError && (
            <div className="alert alert-error mt-4">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{parseError}</span>
            </div>
          )}

          {rows.length > 0 && (
            <>
              <p className="mb-2 mt-5 text-sm text-slate-700">
                <strong>{rows.length}</strong> students parsed. Preview:
              </p>
              <div className="table-wrap scroll-thin max-h-80 rounded-lg border border-slate-200">
                <table className="table text-xs">
                  <thead className="sticky top-0">
                    <tr>
                      <th>Name</th>
                      <th>Grade</th>
                      {rows[0].subjects.map((s) => <th key={s.subject}>{s.subject}</th>)}
                      <th className="text-right">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => {
                      const avg = r.subjects.reduce((a, s) => a + s.score, 0) / r.subjects.length;
                      return (
                        <tr key={i}>
                          <td className="font-medium text-ink">{r.student_name}</td>
                          <td>{r.grade}</td>
                          {r.subjects.map((s) => <td key={s.subject} className="tabular-nums">{s.score}</td>)}
                          <td className="text-right font-semibold tabular-nums">{avg.toFixed(1)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <button onClick={submit} disabled={loading} className="btn btn-primary mt-4">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {loading ? "Analysing class..." : `Predict pathways for ${rows.length} students`}
              </button>
            </>
          )}

          {error && (
            <div className="alert alert-error mt-4">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </section>

      {result && (
        <section className="card">
          <div className="card-header">
            <div>
              <p className="eyebrow">Class report</p>
              <h2 className="section-title">{result.class_name}</h2>
              <p className="text-sm text-ink-soft">{result.total_students} students</p>
            </div>
            <button onClick={exportResults} className="btn btn-accent btn-sm shrink-0">
              <Download className="h-4 w-4" /> Export to Excel
            </button>
          </div>

          <div className="space-y-8 p-5 sm:p-6">
            {result.note && (
              <div className="alert alert-info">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{result.note}</span>
              </div>
            )}

            <div>
              <h3 className="mb-3 text-sm font-semibold">Pathway distribution</h3>
              <div className="space-y-3">
                {(Object.entries(result.pathway_distribution) as [CbePathway, number][]).map(([pathway, count]) => (
                  <div key={pathway} className="flex flex-col gap-1.5 text-sm sm:flex-row sm:items-center sm:gap-3">
                    <span className="text-slate-700 sm:w-48">{pathway}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div className={`${PATHWAY_BAR[pathway]} h-3 rounded-full transition-all`}
                        style={{ width: `${(count / totalForChart) * 100}%` }} />
                    </div>
                    <span className="font-semibold tabular-nums text-ink sm:w-24 sm:text-right">
                      {count} <span className="text-xs font-normal text-ink-soft">({Math.round((count / result.total_students) * 100)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold">Per student predictions</h3>
              <div className="table-wrap scroll-thin max-h-96 rounded-lg border border-slate-200">
                <table className="table">
                  <thead className="sticky top-0">
                    <tr>
                      <th>Student</th>
                      <th>Grade</th>
                      <th className="text-right">Avg</th>
                      <th>Predicted pathway</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.per_student.map((s, i) => (
                      <tr key={i}>
                        <td className="font-medium text-ink">{s.student_name}</td>
                        <td>{s.grade}</td>
                        <td className="text-right font-semibold tabular-nums text-ink">{Math.round(s.avg_score)}</td>
                        <td>
                          <span className={PATHWAY_COLOR[s.predicted_pathway]}>{s.predicted_pathway}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-accent-200 bg-accent-50/50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-accent-700">
                  <Trophy className="h-4 w-4" /> Top performers
                </h3>
                <ul className="space-y-2 text-sm">
                  {result.top_performers.map((p, i) =>
                    <li key={i} className="flex justify-between gap-2">
                      <span className="truncate text-slate-700">{p.student_name}</span>
                      <span className="flex items-center gap-2">
                        <span className={PATHWAY_COLOR[p.predicted_pathway]}>{p.predicted_pathway}</span>
                        <span className="w-8 text-right font-semibold tabular-nums">{Math.round(p.score)}</span>
                      </span>
                    </li>
                  )}
                </ul>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-800">
                  <TriangleAlert className="h-4 w-4" /> Needs attention
                </h3>
                <ul className="space-y-2 text-sm">
                  {result.needs_attention.map((p, i) =>
                    <li key={i} className="flex justify-between gap-2">
                      <span className="truncate text-slate-700">{p.student_name}</span>
                      <span className="flex items-center gap-2">
                        <span className={PATHWAY_COLOR[p.predicted_pathway]}>{p.predicted_pathway}</span>
                        <span className="w-8 text-right font-semibold tabular-nums">{Math.round(p.score)}</span>
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-700 text-xs font-bold text-white">
      {n}
    </span>
  );
}
