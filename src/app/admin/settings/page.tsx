"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Save } from "lucide-react";
import { PageHeader } from "@/components/ui";

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

  if (loading) {
    return (
      <p className="flex items-center gap-2 text-sm text-ink-soft">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading settings...
      </p>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Site settings" description="General settings and pricing used across Streamflo." />

      {saved && (
        <div className="alert alert-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Settings saved successfully.</span>
        </div>
      )}

      <form onSubmit={save} className="card overflow-hidden">
        <div className="card-header">
          <div>
            <h2 className="font-semibold text-ink">General</h2>
            <p className="text-xs text-ink-soft">These values apply to the whole platform.</p>
          </div>
        </div>
        <div className="card-pad space-y-5">
          <div>
            <label className="label" htmlFor="site_name">Site name</label>
            <input
              id="site_name"
              value={form.site_name}
              onChange={(e) => setForm({ ...form, site_name: e.target.value })}
              className="input"
              required
            />
            <p className="help-text">Shown in page titles and emails.</p>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="premium_price">Premium price (KES per year)</label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">KES</span>
                <input
                  id="premium_price"
                  type="number"
                  value={form.premium_price}
                  onChange={(e) => setForm({ ...form, premium_price: e.target.value })}
                  className="input pl-12"
                  required
                  min="0"
                />
              </div>
              <p className="help-text">Yearly price for a premium school listing.</p>
            </div>
            <div>
              <label className="label" htmlFor="commission_rate">Agent commission rate</label>
              <div className="relative">
                <input
                  id="commission_rate"
                  type="number"
                  value={form.commission_rate}
                  onChange={(e) => setForm({ ...form, commission_rate: e.target.value })}
                  className="input pr-9"
                  required
                  min="0"
                  max="100"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
              </div>
              <p className="help-text">Share of each sale paid to agents, from 0 to 100.</p>
            </div>
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
