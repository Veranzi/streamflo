"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle, Check, CircleCheck, Clock, Copy, Crown, Loader2, Mail, MapPin, MessageCircle, Newspaper, Phone, Smartphone, Star, Users, XCircle,
} from "lucide-react";

type Payment = { id: number; amount: string; package: string | null; reference: string | null; status: string; created_at: string };

const PAYBILL = "802200";
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "info@streamflo.co.ke";

const BENEFITS = [
  { icon: Star, title: "Featured listing", text: "Your school is shown first in search results and on the home page." },
  { icon: Users, title: "Unlimited enquiries", text: "Parents can contact you as often as they like." },
  { icon: Newspaper, title: "Blog posting", text: "Publish news, results and stories on the Streamflo blog." },
  { icon: MapPin, title: "Map pin", text: "Show parents exactly where your school is on the map." },
];

function StatusBadge({ status }: { status: string }) {
  if (status === "success" || status === "approved") return <span className="badge badge-green"><CircleCheck className="h-3 w-3" /> Confirmed</span>;
  if (status === "failed" || status === "reversed" || status === "rejected") return <span className="badge badge-red"><XCircle className="h-3 w-3" /> Not confirmed</span>;
  return <span className="badge badge-amber"><Clock className="h-3 w-3" /> Awaiting confirmation</span>;
}

export default function UpgradeClient({ schoolId, pkg }: { schoolId: number; pkg: string }) {
  const account = `SCH${schoolId}`;
  const [price, setPrice] = useState(1250);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState("");

  const isPaid = pkg === "premium" || pkg === "enterprise";

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/payments", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      setPayments(data.rows ?? []);
      if (data.price) setPrice(Number(data.price));
    } catch {
      /* the instructions still work without history */
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      /* ignore */
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const res = await fetch("/api/dashboard/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not record your payment.");
      setNotice("Thank you. We have received your M-Pesa code and will upgrade your school as soon as the payment is confirmed, usually within 24 hours.");
      setCode("");
      setShowForm(false);
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const priceText = `KES ${price.toLocaleString("en-KE")}`;
  const hasPending = payments.some((p) => p.status === "pending");

  return (
    <div className="space-y-6">
      {isPaid && (
        <div className="alert alert-success">
          <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Your school is on the <strong className="capitalize">{pkg}</strong> package. You can still renew below when your year is up.</span>
        </div>
      )}
      {notice && <div className="alert alert-success"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>{notice}</span></div>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Benefits */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="bg-gradient-to-br from-primary-800 to-primary-950 p-6 text-white">
            <p className="flex items-center gap-2 font-display text-lg font-bold text-white"><Crown className="h-5 w-5 text-amber-300" /> Premium listing</p>
            <p className="mt-3 font-display text-3xl font-bold text-white">{priceText} <span className="text-base font-medium text-primary-100">per year</span></p>
            {price === 1250 && <p className="mt-1 text-sm text-primary-100"><span className="line-through">KES 5,000</span> 75% off</p>}
          </div>
          <ul className="card-pad space-y-4">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-700"><Icon className="h-[18px] w-[18px]" /></span>
                <div>
                  <p className="font-semibold text-ink">{title}</p>
                  <p className="text-sm text-ink-soft">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* How to pay */}
        <div className="card lg:col-span-3">
          <div className="card-header">
            <h2 className="flex items-center gap-2 font-display text-base font-semibold"><Smartphone className="h-4 w-4 text-primary-700" /> Pay with M-Pesa</h2>
          </div>
          <div className="card-pad space-y-5">
            <ol className="space-y-3 text-sm text-slate-700">
              {[
                "Open M-Pesa on your phone and choose Lipa na M-Pesa, then Pay Bill.",
                <>Enter business number <strong>{PAYBILL}</strong>.</>,
                <>Enter account number <strong>{account}</strong>. This is how we match the payment to your school.</>,
                <>Enter the amount <strong>{priceText}</strong>, then your M-Pesa PIN.</>,
                "When you receive the confirmation SMS, tap I have paid below and enter the M-Pesa code.",
              ].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">{i + 1}</span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                { key: "paybill", label: "Paybill", value: PAYBILL },
                { key: "account", label: "Account number", value: account },
                { key: "amount", label: "Amount", value: String(price) },
              ].map((f) => (
                <div key={f.key} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs text-ink-soft">{f.label}</p>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <p className="font-display text-lg font-bold tabular-nums text-ink">{f.key === "amount" ? priceText : f.value}</p>
                    <button type="button" onClick={() => copy(f.value, f.key)} className="btn-icon h-8 w-8" aria-label={`Copy ${f.label.toLowerCase()}`} title="Copy">
                      {copied === f.key ? <Check className="h-4 w-4 text-accent-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {error && <div className="alert alert-error"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}

            {showForm ? (
              <form onSubmit={submit} className="rounded-lg border border-slate-200 p-4">
                <label htmlFor="up-code" className="label">M-Pesa confirmation code</label>
                <input
                  id="up-code"
                  required
                  autoFocus
                  maxLength={12}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="input font-mono uppercase tracking-wider"
                  placeholder="e.g. SGH7K2LQ9X"
                />
                <p className="help-text">The code is at the start of your M-Pesa confirmation SMS.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="submit" disabled={saving} className="btn btn-primary">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    {saving ? "Submitting..." : "Submit payment"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            ) : (
              <button type="button" onClick={() => { setShowForm(true); setError(""); }} className="btn btn-accent btn-lg w-full">
                <CircleCheck className="h-5 w-5" /> I have paid
              </button>
            )}

            {hasPending && (
              <p className="flex items-start gap-2 text-sm text-ink-soft">
                <Clock className="mt-0.5 h-4 w-4 shrink-0" /> We are confirming your payment. Your package is upgraded once our team verifies it.
              </p>
            )}

            <div className="border-t border-slate-200 pt-4 text-sm text-slate-700">
              <p className="font-semibold text-ink">Need help?</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a href={`https://wa.me/254783601773?text=${encodeURIComponent(`Hello Streamflo, I want to upgrade my school (account ${account}) to Premium.`)}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                  <MessageCircle className="h-4 w-4" /> WhatsApp 0783 601 773
                </a>
                <a href="tel:0771815511" className="btn btn-secondary btn-sm"><Phone className="h-4 w-4" /> Call 0771 815 511</a>
                <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Premium upgrade ${account}`)}`} className="btn btn-secondary btn-sm"><Mail className="h-4 w-4" /> {SUPPORT_EMAIL}</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {payments.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="font-display text-base font-semibold">Your payments</h2>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Date</th><th>M-Pesa code</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td>{new Date(p.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}</td>
                    <td className="font-mono">{p.reference ?? "Not given"}</td>
                    <td className="tabular-nums">KES {Number(p.amount).toLocaleString("en-KE")}</td>
                    <td><StatusBadge status={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
