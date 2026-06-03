"use client";

import { useState } from "react";
import Link from "next/link";
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
      const r = await fetch("/api/ai/content/assessments/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, subject, topic: topic.trim() || undefined, count }),
      });
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

  function restart() {
    setStep("setup"); setAssessmentId(null); setQuestions([]);
    setAnswers({}); setResult(null); setError(null);
  }

  const scoreColor = result
    ? result.score >= 80 ? "text-green-700" : result.score >= 50 ? "text-amber-600" : "text-red-600"
    : "";

  return (
    <>
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-8">
        <Link href="/ai" className="text-sm text-blue-600 hover:underline">← AI Tools</Link>
        <h1 className="text-3xl font-bold mt-2 mb-1">Assessment Generator</h1>
        <p className="text-slate-600 mb-6">
          Generate a custom CBC quiz for any grade and subject. Get instant scores and explanations.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-900 text-sm p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* ── SETUP ── */}
        {step === "setup" && (
          <div className="bg-white rounded shadow border border-slate-200 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Grade</label>
                <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Subject</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-sm">
                  {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">
                Topic <span className="font-normal text-slate-400">(optional — leave blank for a mixed quiz)</span>
              </label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Photosynthesis, Quadratic equations, World War II…"
                className="w-full border border-slate-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Number of questions</label>
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((n) => (
                  <button key={n} onClick={() => setCount(n)}
                    className={`px-4 py-2 rounded border text-sm font-medium transition ${
                      count === n
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-slate-300 text-slate-600 hover:border-blue-400"
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={generate} disabled={loading}
              className="w-full bg-blue-600 text-white rounded py-3 font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition">
              {loading ? "Generating…" : "Generate Assessment"}
            </button>
          </div>
        )}

        {/* ── QUIZ ── */}
        {step === "quiz" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Grade {grade} · {subject}{topic ? ` · ${topic}` : ""} · {questions.length} questions
              </p>
              <span className="text-sm text-slate-500">
                {Object.keys(answers).length}/{questions.length} answered
              </span>
            </div>

            {questions.map((q, i) => (
              <div key={q.id} className="bg-white rounded shadow border border-slate-200 p-5">
                <p className="font-semibold text-slate-800 mb-3">
                  <span className="text-blue-600 mr-1">{i + 1}.</span> {q.question}
                </p>
                <div className="space-y-2">
                  {q.options.map((opt) => {
                    const letter = opt.charAt(0);
                    const selected = answers[q.id] === letter;
                    return (
                      <label key={letter}
                        className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition ${
                          selected
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                        }`}>
                        <input type="radio" name={`q-${q.id}`} value={letter} checked={selected}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: letter }))}
                          className="mt-0.5 accent-blue-600" />
                        <span className="text-sm text-slate-700">{opt}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <button onClick={submit} disabled={loading}
              className="w-full bg-green-600 text-white rounded py-3 font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition">
              {loading ? "Submitting…" : "Submit Assessment"}
            </button>
          </div>
        )}

        {/* ── RESULTS ── */}
        {step === "results" && result && (
          <div className="space-y-5">
            <div className="bg-white rounded shadow border border-slate-200 p-6 text-center">
              <p className="text-slate-500 text-sm mb-1">Your score</p>
              <p className={`text-6xl font-bold ${scoreColor}`}>{result.score}%</p>
              <p className="text-slate-600 mt-2">
                {result.correct} correct out of {result.total} questions
              </p>
              <p className="text-sm mt-1 text-slate-500">
                {result.score >= 80 ? "Excellent work!" : result.score >= 50 ? "Good effort — review the ones you missed." : "Keep practising — check the explanations below."}
              </p>
              <button onClick={restart}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-blue-700 transition">
                New Assessment
              </button>
            </div>

            {result.results.map((q, i) => (
              <div key={q.id}
                className={`bg-white rounded shadow border p-5 ${q.is_correct ? "border-green-300" : "border-red-300"}`}>
                <div className="flex items-start gap-2 mb-3">
                  <span className={`text-lg font-bold ${q.is_correct ? "text-green-600" : "text-red-500"}`}>
                    {q.is_correct ? "✓" : "✗"}
                  </span>
                  <p className="font-semibold text-slate-800">
                    <span className="text-slate-400 mr-1">{i + 1}.</span> {q.question}
                  </p>
                </div>
                <div className="space-y-1 mb-3">
                  {q.options.map((opt) => {
                    const letter = opt.charAt(0);
                    const isCorrect = letter === q.correct_answer;
                    const isUserWrong = letter === q.user_answer && !q.is_correct;
                    return (
                      <div key={letter}
                        className={`text-sm px-3 py-2 rounded border ${
                          isCorrect ? "bg-green-50 border-green-400 text-green-800 font-medium"
                          : isUserWrong ? "bg-red-50 border-red-300 text-red-700"
                          : "border-slate-100 text-slate-600"
                        }`}>
                        {opt}
                        {isCorrect && <span className="ml-2 text-xs text-green-600">← correct</span>}
                        {isUserWrong && <span className="ml-2 text-xs text-red-500">← your answer</span>}
                      </div>
                    );
                  })}
                </div>
                {q.explanation && (
                  <p className="text-xs text-slate-500 bg-slate-50 rounded p-2">{q.explanation}</p>
                )}
              </div>
            ))}

            <button onClick={restart}
              className="w-full bg-blue-600 text-white rounded py-3 font-semibold text-sm hover:bg-blue-700 transition">
              New Assessment
            </button>
          </div>
        )}
      </div>
    </>
  );
}
