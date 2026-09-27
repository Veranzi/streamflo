"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, Loader2, ArrowRight } from "lucide-react";

interface SchoolResult {
  id: number;
  name: string;
  county: string;
  subcounty: string;
}

export default function HomeSearch() {
  const router = useRouter();
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
      <form
        onSubmit={(e) => { e.preventDefault(); search(); }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by school name"
            aria-label="Search by school name"
            className="input py-3 pl-11 text-base"
          />
        </div>
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
          Search
        </button>
      </form>

      {!loading && searched && results.length === 0 && (
        <div className="mt-3 rounded-lg border border-dashed border-slate-300 px-4 py-4 text-sm text-ink-soft">
          No schools match &ldquo;{query}&rdquo;.{" "}
          <button onClick={() => router.push("/directory")} className="link">Browse the full directory</button>
        </div>
      )}

      {results.length > 0 && (
        <ul className="scroll-thin mt-3 max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
          {results.map((s) => (
            <li key={s.id}>
              <Link href={`/profile/${s.id}`} className="group flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-ink group-hover:text-primary-700">{s.name}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-ink-soft">
                    <MapPin className="h-3.5 w-3.5" />
                    {[s.county, s.subcounty].filter(Boolean).join(", ")}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-primary-600" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
