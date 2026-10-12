"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Building2, Check, CircleCheck, Loader2, MapPin, Phone, Save, Sparkles } from "lucide-react";
import type { CountiesData } from "@/lib/types";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const FACILITIES = ["Library", "Laboratory", "Computer Lab", "Sports Grounds", "Swimming Pool"];

// Same option values as the register page. Older listings may hold "CBC", shown as CBE.
const SELECTS: { key: keyof FormState; label: string; options: { value: string; label: string }[] }[] = [
  { key: "type", label: "Type", options: ["Pre-Primary", "Kindergarten", "Nursery", "Junior Secondary", "Senior Secondary", "Technical Institute", "College", "University", "Online"].map((o) => ({ value: o, label: o })) },
  { key: "ownership", label: "Ownership", options: ["Public", "Private", "Faith-Based", "Freelancer"].map((o) => ({ value: o, label: o === "Faith-Based" ? "Faith based" : o })) },
  { key: "curriculum", label: "Curriculum", options: [{ value: "CBE", label: "CBE" }, { value: "IGCSE", label: "IGCSE" }, { value: "8-4-4", label: "8.4.4" }, { value: "IB", label: "IB" }, { value: "A-Levels", label: "A Levels" }] },
  { key: "boarding", label: "Boarding", options: ["Yes", "No"].map((o) => ({ value: o, label: o })) },
  { key: "gender", label: "Gender", options: ["Boys", "Girls", "Mixed"].map((o) => ({ value: o, label: o })) },
];

type FormState = {
  name: string; type: string; ownership: string; curriculum: string; boarding: string; gender: string;
  county: string; subcounty: string; phone: string; email: string; website: string; description: string;
  lat: string; lng: string;
};

const EMPTY: FormState = {
  name: "", type: "", ownership: "", curriculum: "", boarding: "", gender: "",
  county: "", subcounty: "", phone: "", email: "", website: "", description: "", lat: "", lng: "",
};

type SchoolRow = Partial<Record<keyof FormState | "facilities" | "package", string | number | null>> & {
  approved?: boolean; featured?: boolean;
};

export default function ProfileForm({ hasSchool }: { hasSchool: boolean }) {
  const router = useRouter();
  const [counties, setCounties] = useState<CountiesData>({});
  const [form, setForm] = useState<FormState>(EMPTY);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [otherFacilities, setOtherFacilities] = useState("");
  const [meta, setMeta] = useState<{ approved: boolean; featured: boolean; package: string } | null>(null);
  const [loading, setLoading] = useState(hasSchool);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/data/counties.json").then((r) => r.json()).then(setCounties).catch(() => {});
  }, []);

  useEffect(() => {
    if (!hasSchool) return;
    fetch("/api/dashboard/profile")
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data.error ?? "Could not load your profile.");
        const s: SchoolRow | null = data.school;
        if (!s) return;
        const next = { ...EMPTY };
        (Object.keys(EMPTY) as (keyof FormState)[]).forEach((k) => {
          const v = s[k];
          next[k] = v === null || v === undefined ? "" : String(v);
        });
        if (/^cbc$/i.test(next.curriculum)) next.curriculum = "CBE";
        setForm(next);
        const list = String(s.facilities ?? "").split(",").map((f) => f.trim()).filter(Boolean);
        setFacilities(list.filter((f) => FACILITIES.includes(f)));
        setOtherFacilities(list.filter((f) => !FACILITIES.includes(f)).join(", "));
        setMeta({ approved: !!s.approved, featured: !!s.featured, package: String(s.package ?? "free") });
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [hasSchool]);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  }

  const pin = useMemo(() => {
    const lat = parseFloat(form.lat), lng = parseFloat(form.lng);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [form.lat, form.lng]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSaved(false);
    const allFacilities = [
      ...facilities,
      ...otherFacilities.split(",").map((f) => f.trim()).filter(Boolean),
    ].join(", ");
    try {
      const res = await fetch("/api/dashboard/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, facilities: allFacilities }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save your profile.");
      setSaved(true);
      if (data.school?.website !== undefined) set("website", data.school.website ?? "");
      if (data.created) router.refresh();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="card card-pad space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-10 w-full" />)}
        <p className="flex items-center gap-2 text-sm text-ink-soft"><Loader2 className="h-4 w-4 animate-spin" /> Loading your profile...</p>
      </div>
    );
  }

  const curriculumOptions = SELECTS.find((s) => s.key === "curriculum")!.options;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="alert alert-error"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>
      )}
      {saved && (
        <div className="alert alert-success"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>Your profile has been saved.</span></div>
      )}

      {meta && (
        <div className="card card-pad flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-soft">Listing status:</span>
          {meta.approved ? <span className="badge badge-green">Live</span> : <span className="badge badge-amber">Approval pending</span>}
          <span className={`badge ${meta.package === "free" ? "badge-gray" : "badge-blue"} capitalize`}>{meta.package} package</span>
          {meta.featured && <span className="badge badge-amber">Featured</span>}
          {meta.package !== "premium" && meta.package !== "enterprise" && (
            <Link href="/dashboard/upgrade" className="link ml-auto inline-flex items-center gap-1"><Sparkles className="h-4 w-4" /> Upgrade to Premium</Link>
          )}
        </div>
      )}

      <Section icon={Building2} title="School details" description="Name, type and a description parents will read.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="pf-name" className="label">School name</label>
            <input id="pf-name" required maxLength={255} value={form.name} onChange={(e) => set("name", e.target.value)} className="input" />
          </div>
          {SELECTS.map(({ key, label, options }) => {
            const opts = key === "curriculum" ? curriculumOptions : options;
            const current = form[key];
            const known = opts.some((o) => o.value === current);
            return (
              <div key={key}>
                <label htmlFor={`pf-${key}`} className="label">{label}</label>
                <select id={`pf-${key}`} value={current} onChange={(e) => set(key, e.target.value)} className="select">
                  <option value="">Select {label.toLowerCase()}</option>
                  {!known && current && <option value={current}>{current}</option>}
                  {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            );
          })}
          <div className="sm:col-span-2">
            <label htmlFor="pf-desc" className="label">Description</label>
            <textarea id="pf-desc" rows={6} maxLength={5000} value={form.description} onChange={(e) => set("description", e.target.value)} className="textarea" placeholder="Tell parents about your school, values and achievements" />
          </div>
        </div>

        <div className="mt-5">
          <p className="label">Facilities</p>
          <div className="flex flex-wrap gap-2">
            {FACILITIES.map((f) => {
              const on = facilities.includes(f);
              return (
                <label key={f} className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-primary-600 bg-primary-50 text-primary-800" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"}`}>
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => { setFacilities((p) => (on ? p.filter((x) => x !== f) : [...p, f])); setSaved(false); }} />
                  {on && <Check className="h-3.5 w-3.5" />}
                  {f}
                </label>
              );
            })}
          </div>
          <input placeholder="Other facilities (comma separated)" value={otherFacilities} onChange={(e) => { setOtherFacilities(e.target.value); setSaved(false); }} className="input mt-3" />
        </div>
      </Section>

      <Section icon={Phone} title="Contact details" description="How parents can reach your school.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-phone" className="label">School phone</label>
            <input id="pf-phone" maxLength={50} value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input" placeholder="07XX XXX XXX" />
          </div>
          <div>
            <label htmlFor="pf-email" className="label">School email</label>
            <input id="pf-email" type="email" maxLength={150} value={form.email} onChange={(e) => set("email", e.target.value)} className="input" placeholder="info@school.ac.ke" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pf-web" className="label">Website</label>
            <input id="pf-web" maxLength={255} value={form.website} onChange={(e) => set("website", e.target.value)} className="input" placeholder="https://www.school.ac.ke" />
          </div>
        </div>
      </Section>

      <Section icon={MapPin} title="Location" description="Choose your county, then click the exact spot of your school on the map.">
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-county" className="label">County</label>
            <select id="pf-county" required value={form.county} onChange={(e) => { set("county", e.target.value); set("subcounty", ""); }} className="select">
              <option value="">Select county</option>
              {form.county && !counties[form.county] && <option value={form.county}>{form.county}</option>}
              {Object.keys(counties).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="pf-sub" className="label">Sub county</label>
            <select id="pf-sub" value={form.subcounty} onChange={(e) => set("subcounty", e.target.value)} className="select" disabled={!form.county}>
              <option value="">Select sub county</option>
              {form.subcounty && !(counties[form.county] ?? []).includes(form.subcounty) && <option value={form.subcounty}>{form.subcounty}</option>}
              {(counties[form.county] ?? []).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <Map
          markers={pin ? [{ id: 0, name: form.name || "Your school", county: form.county, lat: pin.lat, lng: pin.lng }] : []}
          height={320}
          selectedCounty={pin ? undefined : form.county || undefined}
          onMapClick={(lat, lng) => { set("lat", lat.toFixed(6)); set("lng", lng.toFixed(6)); }}
        />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="pf-lat" className="label">Latitude</label>
            <input id="pf-lat" inputMode="decimal" value={form.lat} onChange={(e) => set("lat", e.target.value)} className="input" placeholder="-1.2864" />
          </div>
          <div>
            <label htmlFor="pf-lng" className="label">Longitude</label>
            <input id="pf-lng" inputMode="decimal" value={form.lng} onChange={(e) => set("lng", e.target.value)} className="input" placeholder="36.8172" />
          </div>
        </div>
        <p className="help-text">Tip: you can also copy coordinates from Google Maps by pressing and holding on your school.</p>
      </Section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <Link href="/dashboard" className="btn btn-secondary">Cancel</Link>
        <button type="submit" disabled={saving} className="btn btn-primary btn-lg">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : hasSchool ? "Save changes" : "Create school profile"}
        </button>
      </div>
    </form>
  );
}

function Section({
  icon: Icon, title, description, children,
}: {
  icon: typeof Building2;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card">
      <div className="flex items-start gap-3 border-b border-slate-200 px-5 py-4 sm:px-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
          {description && <p className="text-sm text-ink-soft">{description}</p>}
        </div>
      </div>
      <div className="card-pad">{children}</div>
    </section>
  );
}
