"use client";

import { useEffect, useState } from "react";

export default function AdminSettingsPage() {
  const [form, setForm] = useState({ site_name: "Streamflo", premium_price: "1250", commission_rate: "20" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.site_name) setForm({ site_name: d.site_name, premium_price: String(d.premium_price ?? "1250"), commission_rate: String(d.commission_rate ?? "20") });
        setLoading(false);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (loading) return <div className="text-slate-400 p-8">Loading…</div>;

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Site Settings</h1>

      {saved && (
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm p-3 rounded mb-5">
          Settings saved successfully.
        </div>
      )}

      <form onSubmit={save} className="bg-white rounded-xl shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Site Name</label>
          <input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 text-sm w-full" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Premium Price (KES / year)</label>
          <input type="number" value={form.premium_price} onChange={(e) => setForm({ ...form, premium_price: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 text-sm w-full" required min="0" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1">Agent Commission Rate (%)</label>
          <input type="number" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
            className="border border-slate-300 rounded px-3 py-2 text-sm w-full" required min="0" max="100" />
        </div>
        <button type="submit" disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
