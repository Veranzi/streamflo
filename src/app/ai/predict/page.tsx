"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

export default function PredictPage() {
  const { status } = useSession();
  const router = useRouter();
  const [studentName, setStudentName] = useState("");
  const [grade, setGrade] = useState(9);
  const [subjects, setSubjects] = useState<Subject[]>([
    { subject: "Mathematics", score: 80 },
    { subject: "English", score: 75 },
    { subject: "Integrated Science", score: 85 },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => { if (status === "unauthenticated") router.push("/login?callbackUrl=/ai/predict"); }, [status, router]);

  function addSubject() { setSubjects((s) => [...s, { subject: "", score: 0 }]); }
  function removeSubject(i: number) { setSubjects((s) => s.filter((_, idx) => idx !== i)); }
  function updateSubject(i: number, field: keyof Subject, value: string | number) {
    setSubjects((s) => s.map((x, idx) => idx === i ? { ...x, [field]: value } : x));
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <div className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/ai" className="text-sm text-blue-600 hover:underline">← AI Tools</Link>
        <h1 className="text-3xl font-bold mt-2 mb-2">Career Pathway Predictor</h1>
        <p className="text-slate-600 mb-8">
          Enter a student&apos;s grades. We return a recommended CBC senior-school pathway, strengths,
          and career suggestions tailored to the Kenyan market.
        </p>

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
              <label className="text-sm font-medium">Subjects & scores</label>
              <button type="button" onClick={addSubject} className="text-sm text-blue-600 hover:underline">
                + Add subject
              </button>
            </div>
            <div className="space-y-2">
              {subjects.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input value={s.subject} onChange={(e) => updateSubject(i, "subject", e.target.value)}
                    placeholder="Subject" className="flex-1 border p-2 rounded" />
                  <input type="number" min={0} max={100} value={s.score}
                    onChange={(e) => updateSubject(i, "score", Number(e.target.value))}
                    className="w-24 border p-2 rounded" />
                  {subjects.length > 1 && (
                    <button type="button" onClick={() => removeSubject(i)}
                      className="text-red-500 px-2">✕</button>
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
              <p className="text-sm font-semibold text-slate-700 mb-2">Career suggestions (Kenyan market)</p>
              <div className="flex flex-wrap gap-2">
                {result.predicted_careers.map((c, i) =>
                  <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-sm px-3 py-1 rounded-full">
                    {c}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
