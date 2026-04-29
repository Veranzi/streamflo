"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import SchoolCard from "@/components/SchoolCard";
import type { MapMarker } from "@/components/Map";
import type { CountiesData } from "@/lib/types";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

interface SchoolResult {
  id: number;
  name: string;
  county: string;
  subcounty: string;
  package?: string;
  lat?: number;
  lng?: number;
}

const LIMIT = 20;

const FILTER_SELECTS = [
  { id: "type", label: "Type", options: ["Primary", "Secondary", "Junior Secondary", "Senior Secondary", "College", "University", "Online"] },
  { id: "ownership", label: "Ownership", options: ["Public", "Private", "Faith-Based"] },
  { id: "curriculum", label: "Curriculum", options: ["CBC", "8-4-4", "IGCSE", "IB", "A-Levels"] },
  { id: "gender", label: "Gender", options: ["Boys", "Girls", "Mixed"] },
  { id: "boarding", label: "Boarding", options: ["Yes", "No"] },
];

export default function DirectoryClient() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    name: searchParams.get("name") ?? "",
    type: searchParams.get("type") ?? "",
    ownership: searchParams.get("ownership") ?? "",
    curriculum: searchParams.get("curriculum") ?? "",
    gender: searchParams.get("gender") ?? "",
    boarding: searchParams.get("boarding") ?? "",
    county: searchParams.get("county") ?? "",
    subcounty: "",
  });
  const [results, setResults] = useState<SchoolResult[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [counties, setCounties] = useState<CountiesData>({});
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const markers: MapMarker[] = results
    .filter((s) => s.lat && s.lng)
    .map((s) => ({ id: s.id, name: s.name, county: s.county, lat: s.lat!, lng: s.lng! }));

  useEffect(() => {
    fetch("/data/counties.json")
      .then((r) => r.json())
      .then(setCounties)
      .catch(() => {});
  }, []);

  const fetchSchools = useCallback(async (reset: boolean) => {
    setLoading(true);
    const off = reset ? 0 : offset;
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set("limit", String(LIMIT));
    params.set("offset", String(off));

    try {
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      if (reset) {
        setResults(data.results ?? []);
        setOffset((data.results ?? []).length);
      } else {
        setResults((prev) => [...prev, ...(data.results ?? [])]);
        setOffset(off + (data.results ?? []).length);
      }
      setTotal(data.total ?? 0);
    } catch {
      // keep existing results
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  useEffect(() => { fetchSchools(true); }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  function updateFilter(key: string, value: string) {
    setFilters((f) => ({ ...f, [key]: value, ...(key === "county" ? { subcounty: "" } : {}) }));
  }

  function clearFilters() {
    setFilters({ name: "", type: "", ownership: "", curriculum: "", gender: "", boarding: "", county: "", subcounty: "" });
  }

  const FilterControls = () => (
    <div className="space-y-3">
      <input
        value={filters.name}
        onChange={(e) => updateFilter("name", e.target.value)}
        placeholder="School name"
        className="w-full border p-2 rounded"
      />
      {FILTER_SELECTS.map(({ id, label, options }) => (
        <select key={id} value={(filters as Record<string, string>)[id]}
          onChange={(e) => updateFilter(id, e.target.value)}
          className="w-full border p-2 rounded">
          <option value="">{label}</option>
          {options.map((o) => <option key={o}>{o}</option>)}
        </select>
      ))}
      <select value={filters.county} onChange={(e) => updateFilter("county", e.target.value)} className="w-full border p-2 rounded">
        <option value="">County</option>
        {Object.keys(counties).map((c) => <option key={c}>{c}</option>)}
      </select>
      {filters.county && counties[filters.county] && (
        <select value={filters.subcounty} onChange={(e) => updateFilter("subcounty", e.target.value)} className="w-full border p-2 rounded">
          <option value="">Sub-county</option>
          {counties[filters.county].map((s) => <option key={s}>{s}</option>)}
        </select>
      )}
      <button onClick={() => fetchSchools(true)} className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700">
        Apply Filters
      </button>
      <button onClick={clearFilters} className="bg-slate-200 text-slate-700 w-full py-2 rounded hover:bg-slate-300">
        Clear Filters
      </button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

      {/* Desktop sidebar filters */}
      <aside className="bg-white p-4 rounded shadow hidden lg:block">
        <h3 className="font-semibold mb-3">Filters</h3>
        <FilterControls />
      </aside>

      {/* Main content */}
      <main className="lg:col-span-3 space-y-4">
        {/* Mobile filter header */}
        <div className="flex justify-between items-center lg:hidden">
          <span className="text-sm text-slate-500"><span className="font-semibold">{total}</span> schools found</span>
          <button onClick={() => setMobileFiltersOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">
            Filters
          </button>
        </div>

        <h1 className="text-2xl font-bold hidden lg:block">Schools ({total})</h1>

        {/* Map */}
        <div className="bg-white p-4 rounded shadow">
          <Map markers={markers} onMarkerClick={setHighlightId} highlightId={highlightId} />
        </div>

        {/* Results */}
        {loading && results.length === 0 ? (
          <div className="text-slate-500 py-8 text-center">Loading schools…</div>
        ) : results.length === 0 ? (
          <div className="text-slate-500 italic py-8 text-center">No schools found. Try adjusting your filters.</div>
        ) : (
          <div className="space-y-3">
            {results.map((s) => (
              <SchoolCard key={s.id} school={s} onMapClick={setHighlightId} />
            ))}
          </div>
        )}

        {/* Load more */}
        {results.length < total && (
          <div className="text-center pt-4">
            <button
              onClick={() => fetchSchools(false)}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Loading…" : "Load More"}
            </button>
          </div>
        )}
      </main>

      {/* Mobile filters panel */}
      {mobileFiltersOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 bg-white z-50 rounded-t-xl shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="font-semibold">Filters</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="text-xl">✕</button>
            </div>
            <div className="p-4">
              <FilterControls />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
