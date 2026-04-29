"use client";

import { useState } from "react";
import Link from "next/link";

interface SchoolResult {
  id: number;
  name: string;
  county: string;
  subcounty: string;
}

export default function HomeSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SchoolResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function search() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/search?name=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder="Quick search…"
          className="flex-1 border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button onClick={search} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700">
          Search
        </button>
      </div>

      {loading && <p className="mt-2 text-sm text-slate-500">Searching…</p>}

      {!loading && searched && results.length === 0 && (
        <p className="mt-2 text-sm text-slate-500 italic">No schools found.</p>
      )}

      {results.length > 0 && (
        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
          {results.map((s) => (
            <Link key={s.id} href={`/profile/${s.id}`}
              className="block p-3 border rounded hover:bg-slate-50">
              <span className="text-blue-600 font-semibold">{s.name}</span>
              <div className="text-sm text-slate-500">
                {s.county}{s.subcounty ? ` • ${s.subcounty}` : ""}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
