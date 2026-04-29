"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { CountiesData } from "@/lib/types";
import PasswordInput from "@/components/PasswordInput";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const FACILITIES = ["Library", "Laboratory", "Computer Lab", "Sports Grounds", "Swimming Pool"];

const PACKAGE_INFO: Record<string, { label: string; description: React.ReactNode }> = {
  free: {
    label: "FREE – Only School Name + County appear publicly",
    description: (
      <span>
        <strong>FREE PACKAGE:</strong><br />
        ✔ Appears in Search<br />
        ✔ Basic listing (School name + County only)<br />
        ❌ No photos, no description, no enquiries
      </span>
    ),
  },
  premium: {
    label: "PREMIUM – KES 1,250/year (75% off)",
    description: (
      <span>
        <strong>PREMIUM PACKAGE (KES 1,250/year):</strong><br />
        ✔ Full profile (photos, description, facilities)<br />
        ✔ Featured listing priority<br />
        ✔ Unlimited parent enquiries<br />
        ✔ Blog posting access<br />
        ✔ Map location pin<br />
        <span className="text-xs text-red-600">Offer valid until 31st May 2026</span>
      </span>
    ),
  },
  customized: {
    label: "CUSTOMIZED – Tailored features",
    description: (
      <span>
        <strong>CUSTOM PACKAGE:</strong><br />
        ✔ Website setup<br />
        ✔ Custom school system integration<br />
        ✔ Extra features on request
      </span>
    ),
  },
};

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
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="bg-white p-8 rounded shadow max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-green-700 mb-2">Registration Successful!</h2>
          <p className="text-slate-600 mb-6">
            Your school has been registered. It will appear publicly after admin approval.
          </p>
          <Link href="/login" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-block">
            Login to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-100 min-h-screen p-6">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow">
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Back to Home</Link>
        <h1 className="text-2xl font-bold mb-6 mt-2">Register Your School</h1>

        {error && <p className="bg-red-50 text-red-700 p-3 rounded mb-4 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Account Details */}
          <h2 className="text-xl font-semibold border-b pb-2">Account Details</h2>
          <input required placeholder="Your name" value={form.username} onChange={(e) => set("username", e.target.value)} className="w-full border p-2 rounded" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => set("email", e.target.value)} className="w-full border p-2 rounded" />
          <input required placeholder="Phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="w-full border p-2 rounded" />
          <PasswordInput required placeholder="Password" value={form.password} onChange={(e) => set("password", e.target.value)} className="w-full border p-2 rounded" />
          <PasswordInput required placeholder="Confirm Password" value={form.password2} onChange={(e) => set("password2", e.target.value)} className="w-full border p-2 rounded" />

          <label className="font-semibold block">Agent Referral Code (optional)</label>
          <input
            placeholder="e.g. AG-12345"
            value={form.agent_code}
            onChange={(e) => set("agent_code", e.target.value)}
            readOnly={!!agentRef}
            className={`w-full border p-2 rounded ${agentRef ? "bg-slate-100 cursor-not-allowed" : ""}`}
          />
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.become_agent} onChange={(e) => set("become_agent", e.target.checked)} />
            <span className="text-sm">I want to become an agent and earn when I refer schools.</span>
          </label>
          {form.become_agent && (
            <div className="bg-green-50 p-3 rounded text-sm border border-green-200">
              🟢 <strong>Agent Earnings:</strong> Earn KES 1,000 (20% of Premium fee) for every school
              that pays using your referral code. Payments sent within 24 hours.
            </div>
          )}

          <hr />

          {/* School Details */}
          <h2 className="text-xl font-semibold border-b pb-2">School Details</h2>
          <input required placeholder="School Name" value={form.school_name} onChange={(e) => set("school_name", e.target.value)} className="w-full border p-2 rounded" />

          {[
            { key: "type", label: "Type", options: ["Pre-Primary","Kindergarten","Nursery","Junior Secondary","Senior Secondary","Technical Institute","College","University","Online"] },
            { key: "ownership", label: "Ownership", options: ["Public","Private","Faith-Based","Freelancer"] },
            { key: "curriculum", label: "Curriculum", options: ["CBC","IGCSE"] },
            { key: "boarding", label: "Boarding", options: ["Yes","No"] },
            { key: "gender", label: "Gender", options: ["Boys","Girls","Mixed"] },
          ].map(({ key, label, options }) => (
            <div key={key}>
              <label className="font-semibold block mb-1">{label} (optional)</label>
              <select value={(form as unknown as Record<string, string>)[key]} onChange={(e) => set(key, e.target.value)} className="w-full border p-2 rounded">
                <option value="">Select {label}</option>
                {options.map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}

          <div>
            <label className="font-semibold block mb-1">County</label>
            <select required value={form.county} onChange={(e) => set("county", e.target.value)} className="w-full border p-2 rounded">
              <option value="">Select County</option>
              {Object.keys(counties).map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {form.county && counties[form.county] && (
            <div>
              <label className="font-semibold block mb-1">Sub-County</label>
              <select required value={form.subcounty} onChange={(e) => set("subcounty", e.target.value)} className="w-full border p-2 rounded">
                <option value="">Select Sub-County</option>
                {counties[form.county].map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          )}

          <input placeholder="School Phone" value={form.phone_school} onChange={(e) => set("phone_school", e.target.value)} className="w-full border p-2 rounded" />
          <input placeholder="School Email" value={form.email_school} onChange={(e) => set("email_school", e.target.value)} className="w-full border p-2 rounded" />
          <input placeholder="Website (optional)" value={form.website} onChange={(e) => set("website", e.target.value)} className="w-full border p-2 rounded" />
          <textarea placeholder="School Description" value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className="w-full border p-2 rounded" />

          {/* Facilities */}
          <h3 className="font-semibold mt-4">Facilities</h3>
          {FACILITIES.map((f) => (
            <label key={f} className="flex items-center gap-2">
              <input type="checkbox" checked={form.facilities.includes(f)} onChange={() => toggleFacility(f)} />
              <span>{f}</span>
            </label>
          ))}
          <input placeholder="Other facilities (comma separated)" value={form.facilities_other} onChange={(e) => set("facilities_other", e.target.value)} className="w-full border p-2 rounded" />

          {/* Package */}
          <h3 className="font-semibold mt-4">Select Package</h3>
          <select value={form.package} onChange={(e) => set("package", e.target.value)} className="w-full border p-2 rounded">
            {Object.entries(PACKAGE_INFO).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <div className="text-sm p-3 rounded bg-blue-50 border border-blue-200">
            {PACKAGE_INFO[form.package]?.description}
          </div>

          {/* Map location picker */}
          <label className="font-semibold block mt-4">Location (click on map to set coordinates)</label>
          <div className="h-64 border rounded overflow-hidden mb-2">
            <Map
              markers={mapMarker ? [{ id: 0, name: form.school_name || "School", county: form.county, lat: mapMarker.lat, lng: mapMarker.lng }] : []}
              onMarkerClick={() => {}}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Latitude" value={form.lat} onChange={(e) => set("lat", e.target.value)} className="w-full border p-2 rounded" />
            <input placeholder="Longitude" value={form.lng} onChange={(e) => set("lng", e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <p className="text-xs text-slate-500">Or enter coordinates manually above.</p>

          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded mt-4 hover:bg-blue-700 disabled:opacity-60 font-semibold"
          >
            {loading ? "Registering…" : "Register School"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>}>
      <RegisterForm />
    </Suspense>
  );
}
