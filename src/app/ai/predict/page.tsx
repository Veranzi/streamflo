"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as XLSX from "xlsx";
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
  "STEM":                     "bg-blue-100 text-blue-800 border-blue-200",
  "Social Sciences":          "bg-amber-100 text-amber-800 border-amber-200",
  "Arts and Sports Science":  "bg-pink-100 text-pink-800 border-pink-200",
};

const PATHWAY_BAR: Record<CbePathway, string> = {
  "STEM":                     "bg-blue-600",
  "Social Sciences":          "bg-amber-500",
  "Arts and Sports Science":  "bg-pink-500",
};

type Mode = "single" | "broadsheet";

// Official CBE subjects per grade band (KICD curriculum designs).
// Used to drive the subject picker so users don't have to type — and so subject names
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
      <div className="max-w-5xl mx-auto px-6 py-10">
        <Link href="/ai" className="text-sm text-blue-600 hover:underline">← AI Tools</Link>
        <h1 className="text-3xl font-bold mt-2 mb-2">Career Pathway Predictor</h1>
        <p className="text-slate-600 mb-6">
          {canBroadsheet
            ? "Predict CBE senior-school pathways, strengths and Kenyan-market careers — for one student or a whole class."
            : "Predict CBE senior-school pathways, strengths and Kenyan-market careers from a student's grades."}
        </p>

        {canBroadsheet && (
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 mb-6">
            <button
              onClick={() => setMode("single")}
              className={`px-4 py-2 text-sm font-semibold rounded-md ${mode === "single" ? "bg-blue-600 text-white" : "text-slate-600"}`}>
              Single student
            </button>
            <button
              onClick={() => setMode("broadsheet")}
              className={`px-4 py-2 text-sm font-semibold rounded-md ${mode === "broadsheet" ? "bg-blue-600 text-white" : "text-slate-600"}`}>
              Class broadsheet
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
      setExtractNotice(`Read ${parsed.subjects.length} subject${parsed.subjects.length === 1 ? "" : "s"} from the slip — please review before predicting.`);
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
    <>
      <div className="bg-blue-50 border border-blue-200 rounded p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[14rem]">
            <p className="font-semibold text-blue-900 text-sm">Have a results slip?</p>
            <p className="text-xs text-blue-800">Upload a photo or PDF — we&apos;ll fill in the subjects automatically. You can edit before predicting.</p>
          </div>
          <input ref={slipRef} type="file" accept="image/*,application/pdf"
            disabled={extracting}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSlip(f); }}
            className="text-sm text-slate-700 file:mr-3 file:px-3 file:py-2 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer file:disabled:opacity-50" />
        </div>
        {extracting && <p className="text-xs text-blue-800 mt-2">📄 Reading slip…</p>}
        {extractNotice && <p className="text-xs text-emerald-800 mt-2">✓ {extractNotice}</p>}
      </div>

      <form onSubmit={submit} className="bg-white rounded shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Student name</label>
            <input required value={studentName} onChange={(e) => setStudentName(e.target.value)}
              className="w-full border p-2 rounded mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium">Grade</label>
            <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}
              className="w-full border p-2 rounded mt-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((g) =>
                <option key={g} value={g}>Grade {g}</option>
              )}
            </select>
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <label className="text-sm font-medium">Subjects & scores</label>
              <p className="text-xs text-slate-500">Pick from the CBE list for Grade {grade} (or type a custom subject).</p>
            </div>
            <button type="button" onClick={addSubject} className="text-sm text-blue-600 hover:underline">+ Add subject</button>
          </div>

          {/* Quick-add chips: tap a subject to add it with score 0 */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {subjectsForGrade(grade)
              .filter((cbe) => !subjects.some((s) => s.subject === cbe))
              .map((cbe) => (
                <button key={cbe} type="button"
                  onClick={() => setSubjects((s) => [...s, { subject: cbe, score: 0 }])}
                  className="text-xs px-2 py-1 rounded border border-slate-300 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700">
                  + {cbe}
                </button>
              ))}
          </div>

          <datalist id={`cbe-subjects-grade-${grade}`}>
            {subjectsForGrade(grade).map((cbe) => <option key={cbe} value={cbe} />)}
          </datalist>

          <div className="space-y-2">
            {subjects.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  list={`cbe-subjects-grade-${grade}`}
                  value={s.subject}
                  onChange={(e) => updateSubject(i, "subject", e.target.value)}
                  placeholder="Pick or type a subject"
                  className="flex-1 border p-2 rounded"
                  autoComplete="off"
                />
                <input type="number" min={0} max={100} value={s.score}
                  onChange={(e) => updateSubject(i, "score", Number(e.target.value))}
                  className="w-24 border p-2 rounded" />
                {subjects.length > 1 && (
                  <button type="button" onClick={() => removeSubject(i)} className="text-red-500 px-2">✕</button>
                )}
              </div>
            ))}
          </div>
        </div>
        {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{error}</p>}
        <button type="submit" disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-60 font-semibold">
          {loading ? "Analyzing…" : "Predict Pathway"}
        </button>
      </form>

      {result && (
        <div className="bg-white rounded shadow p-6 mt-6 space-y-4">
          <div>
            <p className="text-sm text-slate-500">Recommended Pathway</p>
            <p className="text-2xl font-bold text-blue-800">{result.predicted_pathway}</p>
            <p className="text-xs text-slate-400 mt-1">Confidence: {Math.round(result.confidence * 100)}%</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-1">Rationale</p>
            <p className="text-slate-600">{result.rationale}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-semibold text-green-700 mb-2">✓ Strengths</p>
              <ul className="text-sm space-y-1">
                {result.strength_areas.map((s, i) => <li key={i} className="text-slate-700">• {s}</li>)}
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-700 mb-2">△ Improvement areas</p>
              <ul className="text-sm space-y-1">
                {result.improvement_areas.map((s, i) => <li key={i} className="text-slate-700">• {s}</li>)}
              </ul>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-2">Career suggestions</p>
            <div className="flex flex-wrap gap-2">
              {result.predicted_careers.map((c, i) =>
                <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm px-3 py-1 rounded-full">{c}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
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
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-1">Upload a class broadsheet</h2>
        <p className="text-sm text-slate-600 mb-4">
          Excel (.xlsx) or CSV with one row per student. First column = student name; remaining columns = subjects.
          {" "}<button onClick={downloadTemplate} className="text-blue-600 hover:underline">Download template</button>.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-1">
            <label className="text-sm font-medium">Class name</label>
            <input value={className} onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. Grade 9 East" className="w-full border p-2 rounded mt-1" />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Broadsheet file</label>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              className="block w-full text-sm text-slate-700 file:mr-3 file:px-3 file:py-2 file:rounded file:border-0 file:bg-blue-600 file:text-white file:cursor-pointer mt-1" />
          </div>
        </div>

        {parseError && <p className="text-red-600 text-sm bg-red-50 p-3 rounded">{parseError}</p>}

        {rows.length > 0 && (
          <>
            <p className="text-sm text-slate-700 mt-4 mb-2">
              <strong>{rows.length}</strong> students parsed. Preview:
            </p>
            <div className="overflow-x-auto border border-slate-200 rounded max-h-80">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Grade</th>
                    {rows[0].subjects.map((s) => <th key={s.subject} className="p-2 text-left">{s.subject}</th>)}
                    <th className="p-2 text-right">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const avg = r.subjects.reduce((a, s) => a + s.score, 0) / r.subjects.length;
                    return (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="p-2">{r.student_name}</td>
                        <td className="p-2">{r.grade}</td>
                        {r.subjects.map((s) => <td key={s.subject} className="p-2">{s.score}</td>)}
                        <td className="p-2 text-right font-semibold">{avg.toFixed(1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button onClick={submit} disabled={loading}
              className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded hover:bg-blue-700 disabled:opacity-60 font-semibold">
              {loading ? "Analysing class…" : `Predict pathways for ${rows.length} students`}
            </button>
          </>
        )}

        {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded mt-3">{error}</p>}
      </div>

      {result && (
        <div className="bg-white rounded shadow p-6 space-y-6">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-sm text-slate-500">Class report</p>
              <h2 className="text-2xl font-bold text-slate-800">{result.class_name}</h2>
              <p className="text-sm text-slate-500">{result.total_students} students</p>
            </div>
            <button onClick={exportResults} className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-semibold">
              ↓ Export to Excel
            </button>
          </div>

          {result.note && (
            <p className="text-xs text-slate-500 italic bg-slate-50 border border-slate-200 rounded p-2">{result.note}</p>
          )}

          <div>
            <h3 className="font-semibold text-slate-700 mb-3">Pathway distribution</h3>
            <div className="space-y-2">
              {(Object.entries(result.pathway_distribution) as [CbePathway, number][]).map(([pathway, count]) => (
                <div key={pathway} className="flex items-center gap-3 text-sm">
                  <span className="w-48 text-slate-700">{pathway}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                    <div className={`${PATHWAY_BAR[pathway]} h-5 rounded-full transition-all`}
                      style={{ width: `${(count / totalForChart) * 100}%` }} />
                  </div>
                  <span className="w-20 text-right font-semibold text-slate-800">
                    {count} <span className="text-xs text-slate-500 font-normal">({Math.round((count / result.total_students) * 100)}%)</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-slate-700 mb-3">Per-student predictions</h3>
            <div className="overflow-x-auto border border-slate-200 rounded max-h-96">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0 text-slate-600">
                  <tr>
                    <th className="p-2 text-left">Student</th>
                    <th className="p-2 text-left">Grade</th>
                    <th className="p-2 text-right">Avg</th>
                    <th className="p-2 text-left">Predicted pathway</th>
                  </tr>
                </thead>
                <tbody>
                  {result.per_student.map((s, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="p-2 text-slate-800">{s.student_name}</td>
                      <td className="p-2 text-slate-600">{s.grade}</td>
                      <td className="p-2 text-right font-semibold text-slate-800">{Math.round(s.avg_score)}</td>
                      <td className="p-2">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${PATHWAY_COLOR[s.predicted_pathway]}`}>
                          {s.predicted_pathway}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded p-4">
              <h3 className="font-semibold text-emerald-800 mb-2">✓ Top performers</h3>
              <ul className="text-sm space-y-1">
                {result.top_performers.map((p, i) =>
                  <li key={i} className="flex justify-between gap-2">
                    <span className="truncate">{p.student_name}</span>
                    <span className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded border ${PATHWAY_COLOR[p.predicted_pathway]}`}>{p.predicted_pathway}</span>
                      <span className="font-semibold w-8 text-right">{Math.round(p.score)}</span>
                    </span>
                  </li>
                )}
              </ul>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded p-4">
              <h3 className="font-semibold text-amber-800 mb-2">△ Needs attention</h3>
              <ul className="text-sm space-y-1">
                {result.needs_attention.map((p, i) =>
                  <li key={i} className="flex justify-between gap-2">
                    <span className="truncate">{p.student_name}</span>
                    <span className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded border ${PATHWAY_COLOR[p.predicted_pathway]}`}>{p.predicted_pathway}</span>
                      <span className="font-semibold w-8 text-right">{Math.round(p.score)}</span>
                    </span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
