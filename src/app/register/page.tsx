"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  AlertCircle, Check, X, Loader2, ChevronDown, UserRound, Building2, MapPin, Crown,
  HandCoins, Megaphone, LayoutDashboard, Search, PartyPopper, Package,
} from "lucide-react";
import type { CountiesData } from "@/lib/types";
import PasswordInput from "@/components/PasswordInput";
import AuthShell, { AuthHeading, AccountTypeCards, type AuthBenefit } from "@/components/AuthShell";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

function SearchableSelect({
  value, onChange, options, placeholder, required, id,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  required?: boolean;
  id?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;

  return (
    <div className="relative" ref={wrapRef}>
      <input
        id={id}
        type="text"
        value={open ? query : value}
        placeholder={placeholder}
        required={required && !value}
        onFocus={() => { setQuery(""); setOpen(true); }}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
        className="input pr-9"
        autoComplete="off"
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      {open && (
        <ul className="scroll-thin absolute left-0 right-0 z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lift">
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-slate-400">No matches</li>
          ) : filtered.map((o) => (
            <li key={o}
              onMouseDown={(e) => { e.preventDefault(); onChange(o); setQuery(""); setOpen(false); }}
              className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-primary-50 ${o === value ? "bg-primary-50 font-semibold text-primary-800" : "text-slate-700"}`}>
              {o}
              {o === value && <Check className="h-4 w-4 text-primary-700" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const FACILITIES = ["Library", "Laboratory", "Computer Lab", "Sports Grounds", "Swimming Pool"];

const PACKAGE_INFO: Record<string, {
  label: string;
  price: string;
  features: { text: string; ok: boolean }[];
  note?: string;
}> = {
  free: {
    label: "Free",
    price: "KES 0",
    features: [
      { text: "Appears in search", ok: true },
      { text: "Basic listing: school name and county only", ok: true },
      { text: "No photos, description or enquiries", ok: false },
    ],
  },
  premium: {
    label: "Premium",
    price: "KES 1,250 per year (75% off)",
    features: [
      { text: "Full profile with photos, description and facilities", ok: true },
      { text: "Featured listing priority", ok: true },
      { text: "Unlimited parent enquiries", ok: true },
      { text: "Blog posting access", ok: true },
      { text: "Map location pin", ok: true },
    ],
    note: "Offer valid until 31st May 2026",
  },
  customized: {
    label: "Customized",
    price: "Tailored features",
    features: [
      { text: "Website setup", ok: true },
      { text: "Custom school system integration", ok: true },
      { text: "Extra features on request", ok: true },
    ],
  },
};

const SCHOOL_BENEFITS: AuthBenefit[] = [
  { icon: Search, title: "Get found by parents", text: "Appear in the national school directory." },
  { icon: Megaphone, title: "Receive enquiries", text: "Parents can contact your school directly." },
  { icon: LayoutDashboard, title: "Manage your profile", text: "Update photos, news and details from your dashboard." },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPkg = searchParams.get("package") ?? "free";
  const agentRef = searchParams.get("ref") ?? "";

  const [counties, setCounties] = useState<CountiesData>({});
  const [form, setForm] = useState({
    username: "", email: "", phone: "", password: "", password2: "",
    agent_code: agentRef, become_agent: false,
    school_name: "", type: "", ownership: "", curriculum: "",
    boarding: "", gender: "", county: "", subcounty: "",
    phone_school: "", email_school: "", website: "", description: "",
    facilities: [] as string[], facilities_other: "",
    package: defaultPkg, lat: "", lng: "",
  });
  const [mapMarker, setMapMarker] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);


  useEffect(() => {
    fetch("/data/counties.json").then((r) => r.json()).then(setCounties).catch(() => {});
  }, []);

  function set(key: string, value: unknown) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleFacility(f: string) {
    setForm((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(f)
        ? prev.facilities.filter((x) => x !== f)
        : [...prev.facilities, f],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.password2) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError("");

    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (Array.isArray(v)) {
        v.forEach((item) => body.append(`${k}[]`, item));
      } else {
        body.append(k, String(v));
      }
    });

    try {
      const res = await fetch("/api/register", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Registration failed."); }
      else { setSuccess(true); }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <AuthShell statement="Welcome to Streamflo." description="Your school is on its way to the directory." benefits={SCHOOL_BENEFITS}>
        <div className="text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 text-accent-600 ring-1 ring-accent-200">
            <PartyPopper className="h-8 w-8" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-bold">Registration successful</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Your school has been registered. It will appear publicly after admin approval.
          </p>
          <Link href="/login" className="btn btn-primary btn-lg mt-6 w-full">
            Sign in to your dashboard
          </Link>
        </div>
      </AuthShell>
    );
  }

  const selectFields = [
    { key: "type", label: "Type", options: ["Pre-Primary","Kindergarten","Nursery","Junior Secondary","Senior Secondary","Technical Institute","College","University","Online"] },
    { key: "ownership", label: "Ownership", options: ["Public","Private","Faith-Based","Freelancer"] },
    { key: "curriculum", label: "Curriculum", options: ["CBE","IGCSE"] },
    { key: "boarding", label: "Boarding", options: ["Yes","No"] },
    { key: "gender", label: "Gender", options: ["Boys","Girls","Mixed"] },
  ];

  return (
    <AuthShell
      statement="Put your school in front of Kenyan parents."
      description="Register in a few minutes. Your listing goes live once our team approves it."
      benefits={SCHOOL_BENEFITS}
      width="xl"
    >
      <AuthHeading title="Register your school" subtitle="Create a school account and set up your listing." />

      <div className="mb-8">
        <p className="label">Account type</p>
        <AccountTypeCards layout="row" active="school" />
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Account details */}
        <FormSection icon={UserRound} title="Account details" description="You will use these details to sign in.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="rg-username" className="label">Your name</label>
              <input id="rg-username" required placeholder="Jane Wanjiku" value={form.username} onChange={(e) => set("username", e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="rg-email" className="label">Email</label>
              <input id="rg-email" required type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="rg-phone" className="label">Phone</label>
              <input id="rg-phone" required placeholder="07XX XXX XXX" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="rg-password" className="label">Password</label>
              <PasswordInput id="rg-password" required placeholder="Create a password" autoComplete="new-password" value={form.password} onChange={(e) => set("password", e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="rg-password2" className="label">Confirm password</label>
              <PasswordInput id="rg-password2" required placeholder="Type it again" autoComplete="new-password" value={form.password2} onChange={(e) => set("password2", e.target.value)} className="input" />
            </div>
          </div>
        </FormSection>

        {/* Agent */}
        <FormSection icon={HandCoins} title="Agent referral" description="Optional. Add a referral code or join as an agent.">
          <div>
            <label htmlFor="rg-agent" className="label">Agent referral code</label>
            <input
              id="rg-agent"
              placeholder="e.g. AG-12345"
              value={form.agent_code}
              onChange={(e) => set("agent_code", e.target.value)}
              readOnly={!!agentRef}
              className={`input ${agentRef ? "cursor-not-allowed bg-slate-50 text-slate-500" : ""}`}
            />
            {agentRef && <p className="help-text">Filled in from your referral link.</p>}
          </div>
          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input type="checkbox" className="checkbox mt-0.5" checked={form.become_agent} onChange={(e) => set("become_agent", e.target.checked)} />
            <span className="text-sm text-slate-700">I want to become an agent and earn when I refer schools.</span>
          </label>
          {form.become_agent && (
            <div className="alert alert-success mt-3">
              <HandCoins className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>Agent earnings:</strong> Earn KES 1,000 (20% of the Premium fee) for every school
                that pays using your referral code. Payments are sent within 24 hours.
              </span>
            </div>
          )}
        </FormSection>

        {/* School details */}
        <FormSection icon={Building2} title="School details" description="This is what parents will see on your profile.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="rg-school" className="label">School name</label>
              <input id="rg-school" required placeholder="e.g. Sunrise Academy" value={form.school_name} onChange={(e) => set("school_name", e.target.value)} className="input" />
            </div>

            {selectFields.map(({ key, label, options }) => (
              <div key={key}>
                <label htmlFor={`rg-${key}`} className="label">
                  {label} <span className="font-normal text-ink-soft">(optional)</span>
                </label>
                <select id={`rg-${key}`} value={(form as unknown as Record<string, string>)[key]} onChange={(e) => set(key, e.target.value)} className="select">
                  <option value="">Select {label.toLowerCase()}</option>
                  {options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}

            <div>
              <label htmlFor="rg-county" className="label">County</label>
              <SearchableSelect
                id="rg-county"
                value={form.county}
                onChange={(v) => { set("county", v); set("subcounty", ""); }}
                options={Object.keys(counties)}
                placeholder="Search counties..."
                required
              />
            </div>

            {form.county && counties[form.county] && (
              <div>
                <label htmlFor="rg-subcounty" className="label">Sub county</label>
                <SearchableSelect
                  id="rg-subcounty"
                  value={form.subcounty}
                  onChange={(v) => set("subcounty", v)}
                  options={counties[form.county]}
                  placeholder="Search sub counties..."
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="rg-sphone" className="label">School phone</label>
              <input id="rg-sphone" placeholder="07XX XXX XXX" value={form.phone_school} onChange={(e) => set("phone_school", e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="rg-semail" className="label">School email</label>
              <input id="rg-semail" placeholder="info@school.ac.ke" value={form.email_school} onChange={(e) => set("email_school", e.target.value)} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rg-website" className="label">
                Website <span className="font-normal text-ink-soft">(optional)</span>
              </label>
              <input id="rg-website" placeholder="https://www.school.ac.ke" value={form.website} onChange={(e) => set("website", e.target.value)} className="input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="rg-desc" className="label">School description</label>
              <textarea id="rg-desc" placeholder="Tell parents about your school, values and achievements" value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className="textarea" />
            </div>
          </div>

          {/* Facilities */}
          <div className="mt-5">
            <p className="label">Facilities</p>
            <div className="flex flex-wrap gap-2">
              {FACILITIES.map((f) => {
                const on = form.facilities.includes(f);
                return (
                  <label
                    key={f}
                    className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                      on ? "border-primary-600 bg-primary-50 text-primary-800" : "border-slate-300 bg-white text-slate-600 hover:border-slate-400"
                    }`}
                  >
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleFacility(f)} />
                    {on && <Check className="h-3.5 w-3.5" />}
                    {f}
                  </label>
                );
              })}
            </div>
            <input placeholder="Other facilities (comma separated)" value={form.facilities_other} onChange={(e) => set("facilities_other", e.target.value)} className="input mt-3" />
          </div>
        </FormSection>

        {/* Package */}
        <FormSection icon={Package} title="Choose a package" description="You can upgrade at any time from your dashboard.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Package">
            {Object.entries(PACKAGE_INFO).map(([k, v]) => {
              const selected = form.package === k;
              return (
                <label
                  key={k}
                  className={`relative flex cursor-pointer flex-col rounded-xl border p-4 transition ${
                    selected ? "border-primary-600 bg-primary-50 ring-1 ring-primary-600" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="package"
                    value={k}
                    checked={selected}
                    onChange={() => set("package", k)}
                    className="sr-only"
                  />
                  <span className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 font-semibold text-ink">
                      {k === "premium" && <Crown className="h-4 w-4 text-amber-500" />}
                      {v.label}
                    </span>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${selected ? "border-primary-700 bg-primary-700 text-white" : "border-slate-300"}`}>
                      {selected && <Check className="h-3 w-3" />}
                    </span>
                  </span>
                  <span className="mt-1 text-xs font-medium text-primary-700">{v.price}</span>
                </label>
              );
            })}
          </div>

          {PACKAGE_INFO[form.package] && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-2 text-sm font-semibold text-ink">
                {PACKAGE_INFO[form.package].label} package includes
              </p>
              <ul className="space-y-1.5">
                {PACKAGE_INFO[form.package].features.map((f) => (
                  <li key={f.text} className="flex items-start gap-2 text-sm text-slate-700">
                    {f.ok
                      ? <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" />
                      : <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
                    {f.text}
                  </li>
                ))}
              </ul>
              {PACKAGE_INFO[form.package].note && (
                <p className="mt-2 text-xs font-medium text-red-600">{PACKAGE_INFO[form.package].note}</p>
              )}
            </div>
          )}
        </FormSection>

        {/* Location */}
        <FormSection icon={MapPin} title="Location" description="Enter your school's coordinates so parents can find you on the map.">
          <div className="mb-4 h-64 overflow-hidden rounded-lg">
            <Map
              markers={mapMarker ? [{ id: 0, name: form.school_name || "School", county: form.county, lat: mapMarker.lat, lng: mapMarker.lng }] : []}
              onMarkerClick={() => {}}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="rg-lat" className="label">Latitude</label>
              <input id="rg-lat" placeholder="-1.2864" value={form.lat} onChange={(e) => set("lat", e.target.value)} className="input" />
            </div>
            <div>
              <label htmlFor="rg-lng" className="label">Longitude</label>
              <input id="rg-lng" placeholder="36.8172" value={form.lng} onChange={(e) => set("lng", e.target.value)} className="input" />
            </div>
          </div>
          <p className="help-text">Tip: open Google Maps, press and hold on your school, then copy the numbers shown.</p>
        </FormSection>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-soft">
            Already registered? <Link href="/login" className="link">Sign in</Link>
          </p>
          <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Registering..." : "Register school"}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

function FormSection({
  icon: Icon, title, description, children,
}: {
  icon: typeof UserRound;
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center gap-2 text-sm text-ink-soft">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
