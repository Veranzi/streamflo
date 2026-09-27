"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, ClipboardList, TriangleAlert, Check, X, FileText, Upload, Loader2, Sparkles,
  Download, KeyRound, CircleCheck, RotateCcw, Lightbulb,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const GRADES = Array.from({ length: 10 }, (_, i) => i + 1);
const SUBJECTS = [
  "English", "Kiswahili", "Mathematics", "Chemistry", "Physics", "Biology",
  "Computer Science", "Business Studies", "General Science",
  "History and Citizenship", "Home Science", "Theatre and Film",
  "Literature", "Community Service",
];

interface Question {
  id: number;
  order_num: number;
  question: string;
  options: string[];
}

interface QuestionResult {
  id: number;
  question: string;
  options: string[];
  user_answer: string | null;
  correct_answer: string;
  is_correct: boolean;
  explanation: string | null;
}

interface SubmitResult {
  assessment_id: number;
  score: number;
  correct: number;
  total: number;
  results: QuestionResult[];
}

type Step = "setup" | "quiz" | "results";

export default function AssessmentPage() {
  const [step, setStep] = useState<Step>("setup");

  // Setup form
  const [grade, setGrade] = useState<number>(10);
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(10);
  const [docFile, setDocFile] = useState<File | null>(null);

  // Quiz state
  const [assessmentId, setAssessmentId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  // Results
  const [result, setResult] = useState<SubmitResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true); setError(null);
    try {
      let body: BodyInit;
      let headers: HeadersInit = {};

      if (docFile) {
        const fd = new FormData();
        fd.append("grade", String(grade));
        fd.append("subject", subject);
        if (topic.trim()) fd.append("topic", topic.trim());
        fd.append("count", String(count));
        fd.append("document", docFile);
        body = fd;
      } else {
        body = JSON.stringify({ grade, subject, topic: topic.trim() || undefined, count });
        headers = { "Content-Type": "application/json" };
      }

      const r = await fetch("/api/ai/content/assessments/generate", { method: "POST", headers, body });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed to generate assessment");
      setAssessmentId(data.assessment_id);
      setQuestions(data.questions);
      setAnswers({});
      setStep("quiz");
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  async function submit() {
    if (!assessmentId) return;
    const unanswered = questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(`Please answer all questions (${unanswered.length} remaining).`);
      return;
    }
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/ai/content/assessments/${assessmentId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed to submit");
      setResult(data);
      setStep("results");
    } catch (e) {
      setError((e as Error).message);
    } finally { setLoading(false); }
  }

  function downloadPdf(type: "student" | "teacher") {
    if (!assessmentId) return;
    window.open(`/api/ai/content/assessments/${assessmentId}/download?type=${type}`, "_blank");
  }

  function restart() {
    setStep("setup"); setAssessmentId(null); setQuestions([]);
    setAnswers({}); setResult(null); setError(null); setDocFile(null);
  }

  const scoreColor = result
    ? result.score >= 80 ? "text-accent-700" : result.score >= 50 ? "text-amber-600" : "text-red-600"
    : "";
  const scoreRing = result
    ? result.score >= 80 ? "stroke-accent-500" : result.score >= 50 ? "stroke-amber-500" : "stroke-red-500"
    : "";
  const answeredCount = Object.keys(answers).length;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/ai" className="link inline-flex items-center gap-1 text-sm">
          <ChevronLeft className="h-4 w-4" /> Learning tools
        </Link>
        <div className="mb-6 mt-4 flex items-start gap-4">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 sm:flex">
            <ClipboardList className="h-6 w-6" />
          </span>
          <div>
            <h1 className="page-title">Assessment Generator</h1>
            <p className="page-subtitle">
              Generate a CBE quiz for any grade and subject. Take it online for instant results, or download a
              printable PDF for classroom use.
            </p>
          </div>
        </div>

        {/* Progress steps */}
        <ol className="mb-6 flex items-center gap-2 text-sm">
          {(["setup", "quiz", "results"] as Step[]).map((s, idx) => {
            const order: Step[] = ["setup", "quiz", "results"];
            const done = order.indexOf(step) > idx;
            const current = step === s;
            return (
              <li key={s} className="flex items-center gap-2">
                {idx > 0 && <span className="h-px w-6 bg-slate-300 sm:w-10" />}
                <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                  current ? "bg-primary-700 text-white" : done ? "bg-accent-600 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {done ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </span>
                <span className={current ? "font-semibold text-ink" : "text-ink-soft"}>
                  {s === "setup" ? "Set up" : s === "quiz" ? "Take quiz" : "Results"}
                </span>
              </li>
            );
          })}
        </ol>

        {error && (
          <div className="alert alert-error mb-4">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* SETUP */}
        {step === "setup" && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-base font-semibold">Quiz settings</h2>
            </div>
            <div className="space-y-5 p-5 sm:p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Grade</label>
                  <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className="select">
                    {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Subject</label>
                  <select value={subject} onChange={(e) => setSubject(e.target.value)} className="select">
                    {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">
                  Topic <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Photosynthesis, Quadratic equations, World War II"
                  className="input" />
                <p className="help-text">Leave blank for a mixed quiz.</p>
              </div>

              <div>
                <label className="label">Number of questions</label>
                <div className="tabs">
                  {[5, 10, 15, 20].map((n) => (
                    <button key={n} onClick={() => setCount(n)}
                      className={`tab min-w-[3rem] ${count === n ? "tab-active" : ""}`}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Document upload */}
              <div>
                <label className="label">
                  Upload your own resource <span className="font-normal text-slate-400">(optional, PDF or Word doc)</span>
                </label>
                {docFile ? (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-primary-200 bg-primary-50 p-3">
                    <div className="flex min-w-0 items-center gap-3 text-sm">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-primary-700">
                        <FileText className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-primary-800">{docFile.name}</p>
                        <p className="text-xs text-ink-soft">{(docFile.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <button onClick={() => setDocFile(null)} className="btn btn-ghost btn-sm shrink-0 hover:text-red-600">
                      <X className="h-4 w-4" /> Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center transition hover:border-primary-300 hover:bg-primary-50/40">
                    <Upload className="mb-2 h-6 w-6 text-slate-400" />
                    <span className="text-sm text-slate-600">
                      Drop a PDF or Word doc here, or{" "}
                      <span className="font-semibold text-primary-700">browse</span>
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      className="hidden"
                      onChange={(e) => setDocFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
                <p className="help-text">
                  {docFile
                    ? "Questions will be generated from this document."
                    : "No file? Questions are sourced from online curriculum resources."}
                </p>
              </div>
            </div>
            <div className="rounded-b-xl border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
              <button onClick={generate} disabled={loading} className="btn btn-primary btn-lg w-full">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {loading ? "Generating..." : "Generate assessment"}
              </button>
            </div>
          </div>
        )}

        {/* QUIZ */}
        {step === "quiz" && (
          <div className="space-y-4">
            <div className="card sticky top-16 z-10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 text-sm">
                  <span className="badge badge-blue">Grade {grade}</span>
                  <span className="badge badge-gray">{subject}</span>
                  {topic && <span className="badge badge-gray">{topic}</span>}
                  {docFile && (
                    <span className="badge badge-gray max-w-[12rem]">
                      <FileText className="h-3 w-3 shrink-0" /> <span className="truncate">{docFile.name}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Download buttons visible even before submitting */}
                  <button onClick={() => downloadPdf("student")} className="btn btn-secondary btn-sm" title="Download student PDF">
                    <Download className="h-4 w-4" /> Student PDF
                  </button>
                  <button onClick={() => downloadPdf("teacher")} className="btn btn-secondary btn-sm" title="Download answer key">
                    <KeyRound className="h-4 w-4" /> Answer key
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-primary-600 transition-all"
                    style={{ width: `${questions.length ? (answeredCount / questions.length) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-medium tabular-nums text-ink-soft">
                  {answeredCount}/{questions.length} answered
                </span>
              </div>
            </div>

            {questions.map((q, i) => (
              <div key={q.id} className="card card-pad">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 font-semibold text-ink">{q.question}</p>
                </div>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const letter = opt.charAt(0);
                    const selected = answers[q.id] === letter;
                    return (
                      <label key={letter}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                          selected
                            ? "border-primary-500 bg-primary-50 ring-2 ring-primary-100"
                            : "border-slate-200 hover:border-primary-300 hover:bg-slate-50"
                        }`}>
                        <input type="radio" name={`q-${q.id}`} value={letter} checked={selected}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: letter }))}
                          className="sr-only" />
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                          selected ? "border-primary-700 bg-primary-700 text-white" : "border-slate-300 bg-white text-slate-500"
                        }`}>
                          {letter}
                        </span>
                        <span className={`text-sm ${selected ? "font-medium text-primary-900" : "text-slate-700"}`}>{optionText(opt)}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <button onClick={submit} disabled={loading} className="btn btn-accent btn-lg w-full">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CircleCheck className="h-5 w-5" />}
              {loading ? "Submitting..." : "Submit and get results"}
            </button>
          </div>
        )}

        {/* RESULTS */}
        {step === "results" && result && (
          <div className="space-y-4">
            <div className="card card-pad">
              <div className="flex flex-col items-center gap-6 sm:flex-row">
                <div className="relative h-32 w-32 shrink-0">
                  <svg viewBox="0 0 36 36" className="h-32 w-32 -rotate-90">
                    <circle cx="18" cy="18" r="15.9155" fill="none" className="stroke-slate-100" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9155" fill="none" className={scoreRing} strokeWidth="3"
                      strokeLinecap="round" strokeDasharray={`${Math.max(0, Math.min(100, result.score))} 100`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`font-display text-3xl font-bold tabular-nums ${scoreColor}`}>{result.score}%</span>
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="eyebrow">Your score</p>
                  <p className="mt-1 font-display text-xl font-bold text-ink">
                    {result.score >= 80
                      ? "Excellent work!"
                      : result.score >= 50
                      ? "Good effort. Review the ones you missed."
                      : "Keep practising. Check the explanations below."}
                  </p>
                  <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                    <span className="badge badge-green"><Check className="h-3 w-3" /> {result.correct} correct</span>
                    <span className="badge badge-red"><X className="h-3 w-3" /> {result.total - result.correct} missed</span>
                    <span className="badge badge-gray">{result.total} questions</span>
                  </div>
                </div>
              </div>

              {/* Download buttons on results */}
              <div className="mt-6 flex flex-wrap justify-center gap-2 border-t border-slate-100 pt-5 sm:justify-start">
                <button onClick={() => downloadPdf("student")} className="btn btn-secondary">
                  <Download className="h-4 w-4" /> Student PDF
                </button>
                <button onClick={() => downloadPdf("teacher")} className="btn btn-secondary">
                  <KeyRound className="h-4 w-4" /> Answer key
                </button>
                <button onClick={restart} className="btn btn-primary">
                  <RotateCcw className="h-4 w-4" /> New assessment
                </button>
              </div>
            </div>

            {result.results.map((q, i) => (
              <div key={q.id}
                className={`card card-pad border-l-4 ${q.is_correct ? "border-l-accent-500" : "border-l-red-500"}`}>
                <div className="mb-3 flex items-start gap-3">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    q.is_correct ? "bg-accent-50 text-accent-700" : "bg-red-50 text-red-600"
                  }`}>
                    {q.is_correct ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </span>
                  <p className="pt-0.5 font-semibold text-ink">
                    <span className="mr-1 text-slate-400">{i + 1}.</span> {q.question}
                  </p>
                </div>
                <div className="mb-3 space-y-1.5">
                  {q.options.map((opt) => {
                    const letter = opt.charAt(0);
                    const isCorrect = letter === q.correct_answer;
                    const isUserWrong = letter === q.user_answer && !q.is_correct;
                    return (
                      <div key={letter}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-sm ${
                          isCorrect ? "border-accent-200 bg-accent-50 font-medium text-accent-700"
                          : isUserWrong ? "border-red-200 bg-red-50 text-red-700"
                          : "border-slate-100 text-slate-600"
                        }`}>
                        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isCorrect ? "bg-accent-600 text-white" : isUserWrong ? "bg-red-600 text-white" : "bg-slate-100 text-slate-500"
                        }`}>
                          {letter}
                        </span>
                        <span className="flex-1">{optionText(opt)}</span>
                        {isCorrect && <span className="badge badge-green shrink-0"><Check className="h-3 w-3" /> Correct</span>}
                        {isUserWrong && <span className="badge badge-red shrink-0">Your answer</span>}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                    <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    <span>{q.explanation}</span>
                  </div>
                )}
              </div>
            ))}

            <div className="flex flex-col gap-2 sm:flex-row">
              <button onClick={() => downloadPdf("student")} className="btn btn-secondary flex-1">
                <Download className="h-4 w-4" /> Download student PDF
              </button>
              <button onClick={() => downloadPdf("teacher")} className="btn btn-secondary flex-1">
                <KeyRound className="h-4 w-4" /> Download answer key
              </button>
              <button onClick={restart} className="btn btn-primary flex-1">
                <RotateCcw className="h-4 w-4" /> New assessment
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/** Strip a leading "A." / "A)" / "A:" label for display; the letter is shown in its own circle. */
function optionText(opt: string): string {
  const stripped = opt.replace(/^[A-Za-z][.):]\s*/, "");
  return stripped || opt;
}
