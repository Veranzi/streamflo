"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Search, SlidersHorizontal, X, MapPin, Loader2, RotateCcw, SearchX } from "lucide-react";
import SchoolCard from "@/components/SchoolCard";
import { EmptyState } from "@/components/ui";
import type { MapMarker } from "@/components/Map";
import type { CountiesData } from "@/lib/types";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => <div className="skeleton h-[300px] w-full md:h-[420px]" />,
});

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
  { id: "curriculum", label: "Curriculum", options: ["CBE", "8-4-4", "IGCSE", "IB", "A-Levels"] },
  { id: "gender", label: "Gender", options: ["Boys", "Girls", "Mixed"] },
  { id: "boarding", label: "Boarding", options: ["Yes", "No"] },
];

const FILTER_LABELS: Record<string, string> = {
  type: "Type",
  ownership: "Ownership",
  curriculum: "Curriculum",
  gender: "Gender",
  boarding: "Boarding",
  county: "County",
  subcounty: "Sub county",
};

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

  useEffect(() => {
    document.body.style.overflow = mobileFiltersOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileFiltersOpen]);

  function updateFilter(key: string, value: string) {
    setFilters((f) => ({ ...f, [key]: value, ...(key === "county" ? { subcounty: "" } : {}) }));
  }

  function clearFilters() {
    setFilters({ name: "", type: "", ownership: "", curriculum: "", gender: "", boarding: "", county: "", subcounty: "" });
  }

  const activeFilters = Object.entries(filters).filter(([k, v]) => k !== "name" && v);
  const activeCount = activeFilters.length + (filters.name ? 1 : 0);
  const schoolWord = total === 1 ? "school" : "schools";

  // Rendered as a plain function (not a nested component) so inputs keep focus while typing.
  const renderFilterControls = (idPrefix: string) => (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-name`} className="label">School name</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id={`${idPrefix}-name`}
            value={filters.name}
            onChange={(e) => updateFilter("name", e.target.value)}
            placeholder="Search by name"
            className="input pl-9"
          />
        </div>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-county`} className="label">County</label>
        <select
          id={`${idPrefix}-county`}
          value={filters.county}
          onChange={(e) => updateFilter("county", e.target.value)}
          className="select"
        >
          <option value="">All counties</option>
          {Object.keys(counties).map((c) => <option key={c}>{c}</option>)}
        </select>
      </div>

      {filters.county && counties[filters.county] && (
        <div>
          <label htmlFor={`${idPrefix}-subcounty`} className="label">Sub county</label>
          <select
            id={`${idPrefix}-subcounty`}
            value={filters.subcounty}
            onChange={(e) => updateFilter("subcounty", e.target.value)}
            className="select"
          >
            <option value="">All sub counties</option>
            {counties[filters.county].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      )}

      {FILTER_SELECTS.map(({ id, label, options }) => (
        <div key={id}>
          <label htmlFor={`${idPrefix}-${id}`} className="label">{label}</label>
          <select
            id={`${idPrefix}-${id}`}
            value={(filters as Record<string, string>)[id]}
            onChange={(e) => updateFilter(id, e.target.value)}
            className="select"
          >
            <option value="">Any</option>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">

      {/* Desktop sidebar filters */}
      <aside className="hidden lg:block">
        <div className="card sticky top-20">
          <div className="card-header">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <SlidersHorizontal className="h-4 w-4 text-primary-700" /> Filters
            </h2>
            {activeCount > 0 && (
              <span className="badge badge-blue">{activeCount} active</span>
            )}
          </div>
          <div className="card-pad">
            {renderFilterControls("d")}
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button onClick={clearFilters} className="btn btn-secondary">
                <RotateCcw className="h-4 w-4" /> Clear
              </button>
              <button onClick={() => fetchSchools(true)} className="btn btn-primary">
                Apply
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 space-y-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-bold text-ink">
              <span className="tabular-nums">{total.toLocaleString("en-KE")}</span> {schoolWord} found
            </h2>
            {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="btn btn-secondary lg:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" /> Filters
            {activeCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary-700 px-1.5 text-[11px] font-bold text-white">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* Active filter chips */}
        {activeCount > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {filters.name && (
              <FilterChip label={`Name: ${filters.name}`} onRemove={() => updateFilter("name", "")} />
            )}
            {activeFilters.map(([k, v]) => (
              <FilterChip key={k} label={`${FILTER_LABELS[k] ?? k}: ${v}`} onRemove={() => updateFilter(k, "")} />
            ))}
            <button onClick={clearFilters} className="ml-1 text-xs font-medium text-primary-700 hover:underline">
              Clear all
            </button>
          </div>
        )}

        {/* Map */}
        <div className="card overflow-hidden">
          <div className="card-header py-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <MapPin className="h-4 w-4 text-primary-700" /> Map view
            </h3>
            <span className="text-xs text-ink-soft">
              {markers.length} of {results.length} on the map
            </span>
          </div>
          <div className="p-2 sm:p-3">
            <Map markers={markers} onMarkerClick={setHighlightId} highlightId={highlightId} />
          </div>
        </div>

        {/* Results */}
        {loading && results.length === 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card card-pad space-y-3">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-9 w-full" />
              </div>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={SearchX}
              title="No schools found"
              description="Try a different name or remove some filters to see more schools."
              action={
                activeCount > 0 ? (
                  <button onClick={clearFilters} className="btn btn-secondary">
                    <RotateCcw className="h-4 w-4" /> Clear filters
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {results.map((s) => (
              <SchoolCard key={s.id} school={s} onMapClick={setHighlightId} />
            ))}
          </div>
        )}

        {/* Load more */}
        {results.length < total && (
          <div className="flex flex-col items-center gap-2 pt-2">
            <p className="text-xs text-ink-soft">
              Showing {results.length} of {total.toLocaleString("en-KE")}
            </p>
            <button
              onClick={() => fetchSchools(false)}
              disabled={loading}
              className="btn btn-secondary"
            >
              {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Loading...</>) : "Load more schools"}
            </button>
          </div>
        )}
      </main>

      {/* Mobile filters sheet */}
      {mobileFiltersOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileFiltersOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl lg:hidden">
            <div className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-slate-200" />
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h3 className="flex items-center gap-2 font-semibold">
                <SlidersHorizontal className="h-4 w-4 text-primary-700" /> Filters
              </h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="btn-icon" aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {renderFilterControls("m")}
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
              <button onClick={clearFilters} className="btn btn-secondary">
                <RotateCcw className="h-4 w-4" /> Clear
              </button>
              <button
                onClick={() => { fetchSchools(true); setMobileFiltersOpen(false); }}
                className="btn btn-primary"
              >
                Show {total.toLocaleString("en-KE")} {schoolWord}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="badge badge-blue py-1 pl-3 pr-1">
      <span className="max-w-[200px] truncate">{label}</span>
      <button
        onClick={onRemove}
        className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-primary-100"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
