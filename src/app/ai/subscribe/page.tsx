"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Users, School, Check, Star, Crown, Wallet, Smartphone, Loader2, ShieldCheck,
  TriangleAlert, CircleCheck, Info, CreditCard,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { EmptyState } from "@/components/ui";

const POCHI_NUMBER = process.env.NEXT_PUBLIC_POCHI_NUMBER ?? "";
const POCHI_NAME   = process.env.NEXT_PUBLIC_POCHI_NAME   ?? "Streamflo";

interface Plan {
  id: number;
  name: string;
  subscriber_type: "parent" | "school";
  price_kes: number;
  billing_period: string;
  features: { tier: string; uploads_per_month: number; text_chat: boolean };
}

function uploadsLine(p: Plan): string {
  const u = p.features?.uploads_per_month;
  if (u === -1) return "Unlimited file uploads";
  if (u === 0)  return "Text chat only, no uploads";
  return `${u} file uploads per month`;
}

function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  let n = digits;
  if (n.startsWith("254")) n = n.slice(3);
  else if (n.startsWith("0")) n = n.slice(1);
  if (!/^[17]\d{8}$/.test(n)) return null;
  return "254" + n;
}

type PaymentMethod = "pochi" | "stk";

export default function SubscribePage() {
  const { status } = useSession();
  const router = useRouter();

  const [type, setType] = useState<"parent" | "school">("parent");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selected, setSelected] = useState<Plan | null>(null);
  const [method, setMethod] = useState<PaymentMethod>("pochi");
  const [phone, setPhone] = useState("");
  const [mpesaCode, setMpesaCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; tone: "info" | "ok" | "err" } | null>(null);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/ai/subscribe");
  }, [status, router]);

  useEffect(() => {
    setPlansLoading(true);
    fetch(`/api/ai/subscription/plans?type=${type}`)
      .then((r) => r.json())
      .then((rows) => setPlans(Array.isArray(rows) ? rows : []))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, [type]);

  async function submitStkPush(plan: Plan) {
    const normalised = normalisePhone(phone);
    if (!normalised) {
      setMessage({ tone: "err", text: "Enter a valid Kenyan mobile number (07XXXXXXXX)." });
      return;
    }
    setSubmitting(true); setMessage(null);
    try {
      const res = await fetch("/api/ai/subscription/subscriptions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan.id, phone: normalised }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ tone: "err", text: data.error ?? "Could not start subscription." });
        return;
      }
      setMessage({ tone: "ok", text: "STK push sent. Check your phone and enter your M-Pesa PIN." });
    } catch (err) {
      setMessage({ tone: "err", text: (err as Error).message });
    } finally { setSubmitting(false); }
  }

  async function submitPochi(plan: Plan) {
    const code = mpesaCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,20}$/.test(code)) {
      setMessage({ tone: "err", text: "Enter the M-Pesa confirmation code from your SMS (letters and digits, 8 to 20 characters)." });
      return;
    }
    const normalised = normalisePhone(phone);
    if (!normalised) {
      setMessage({ tone: "err", text: "Enter the phone number you paid from." });
      return;
    }
    setSubmitting(true); setMessage(null);
    try {
      const res = await fetch("/api/ai/subscription/manual-payment", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan.id, phone: normalised, mpesa_code: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ tone: "err", text: data.error ?? "Could not submit payment." });
        return;
      }
      setMessage({ tone: "ok", text: "Payment received. Our team will verify it and activate your plan within an hour." });
      setMpesaCode("");
    } catch (err) {
      setMessage({ tone: "err", text: (err as Error).message });
    } finally { setSubmitting(false); }
  }

  function handleSubscribe(plan: Plan) {
    if (submitting) return;
    setSelected(plan);
    setMessage(null);
  }

  function handleConfirm() {
    if (!selected) return;
    if (method === "stk") submitStkPush(selected);
    else submitPochi(selected);
  }

  const hasPlusTier = plans.some((p) => p.features?.tier === "plus");
  const isRecommended = (p: Plan, idx: number) =>
    hasPlusTier ? p.features?.tier === "plus" : plans.length === 3 && idx === 1;
  const kes = (n: number) => `KES ${Number(n).toLocaleString()}`;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Link href="/ai/chat" className="link inline-flex items-center gap-1 text-sm">
          <ChevronLeft className="h-4 w-4" /> Back to chat
        </Link>

        <div className="mb-8 mt-4 text-center">
          <p className="eyebrow">Plans and pricing</p>
          <h1 className="page-title mt-1">Choose a plan</h1>
          <p className="page-subtitle">All plans bill monthly via M-Pesa. Cancel anytime.</p>

          <div className="tabs mt-5">
            <button onClick={() => { setType("parent"); setSelected(null); }}
              className={`tab inline-flex items-center gap-1.5 ${type === "parent" ? "tab-active" : ""}`}>
              <Users className="h-4 w-4" /> Parent
            </button>
            <button onClick={() => { setType("school"); setSelected(null); }}
              className={`tab inline-flex items-center gap-1.5 ${type === "school" ? "tab-active" : ""}`}>
              <School className="h-4 w-4" /> School
            </button>
          </div>
        </div>

        {plansLoading && plans.length === 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card card-pad space-y-4">
                <div className="skeleton h-4 w-1/3" />
                <div className="skeleton h-8 w-2/3" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-4/5" />
                <div className="skeleton h-10 w-full" />
              </div>
            ))}
          </div>
        ) : plans.length === 0 ? (
          <div className="card">
            <EmptyState icon={CreditCard} title="No plans available right now" description="Please check back soon or contact support." />
          </div>
        ) : (
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-3">
            {plans.map((p, idx) => {
              const isSelected = selected?.id === p.id;
              const recommended = isRecommended(p, idx);
              return (
                <div key={p.id}
                  className={`card relative flex flex-col p-6 transition ${
                    isSelected
                      ? "border-primary-600 ring-4 ring-primary-100"
                      : recommended
                        ? "border-primary-300 shadow-lift"
                        : ""
                  }`}>
                  {recommended && (
                    <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-primary-700 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      <Star className="h-3 w-3" /> Recommended
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${recommended ? "bg-primary-700 text-white" : "bg-primary-50 text-primary-700"}`}>
                      <Crown className="h-[18px] w-[18px]" />
                    </span>
                    <span className="font-semibold text-ink">{p.name}</span>
                  </div>
                  <div className="mb-5 mt-4">
                    <span className="font-display text-3xl font-bold tabular-nums text-ink">{kes(p.price_kes)}</span>
                    <span className="text-sm text-ink-soft"> per {p.billing_period}</span>
                  </div>
                  <ul className="mb-6 space-y-2.5 text-sm text-slate-700">
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" /> AI chat (text)
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent-600" /> {uploadsLine(p)}
                    </li>
                  </ul>
                  <button
                    onClick={() => handleSubscribe(p)}
                    className={`btn mt-auto w-full ${isSelected ? "btn-primary" : recommended ? "btn-primary" : "btn-secondary"}`}>
                    {isSelected ? <><Check className="h-4 w-4" /> Selected</> : "Choose plan"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {selected && (
          <div className="card mt-8">
            <div className="card-header">
              <div>
                <p className="eyebrow">Checkout</p>
                <h2 className="text-lg font-bold">Pay for {selected.name}</h2>
              </div>
              <span className="font-display text-xl font-bold tabular-nums text-primary-700">{kes(selected.price_kes)}</span>
            </div>

            <div className="p-5 sm:p-6">
              <p className="label">Payment method</p>
              <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => setMethod("pochi")}
                  className={`flex items-start gap-3 rounded-lg border p-4 text-left transition ${
                    method === "pochi" ? "border-primary-600 bg-primary-50 ring-2 ring-primary-100" : "border-slate-200 hover:border-slate-300"
                  }`}>
                  <Wallet className={`mt-0.5 h-5 w-5 shrink-0 ${method === "pochi" ? "text-primary-700" : "text-slate-400"}`} />
                  <span>
                    <span className="block text-sm font-semibold text-ink">Pay manually</span>
                    <span className="block text-xs text-ink-soft">Pochi la Biashara, then enter your code</span>
                  </span>
                </button>
                <button type="button" onClick={() => setMethod("stk")}
                  className={`flex items-start gap-3 rounded-lg border p-4 text-left transition ${
                    method === "stk" ? "border-primary-600 bg-primary-50 ring-2 ring-primary-100" : "border-slate-200 hover:border-slate-300"
                  }`}>
                  <Smartphone className={`mt-0.5 h-5 w-5 shrink-0 ${method === "stk" ? "text-primary-700" : "text-slate-400"}`} />
                  <span>
                    <span className="block text-sm font-semibold text-ink">M-Pesa STK push</span>
                    <span className="block text-xs text-ink-soft">Get a PIN prompt on your phone</span>
                  </span>
                </button>
              </div>

              {method === "pochi" ? (
                POCHI_NUMBER ? (
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                      <p className="mb-4 text-sm font-semibold text-ink">
                        Send {kes(selected.price_kes)} in 5 steps
                      </p>
                      <ol className="space-y-3 text-sm text-slate-700">
                        <PayStep n={1}>Open M-Pesa and choose <strong>Pochi la Biashara</strong></PayStep>
                        <PayStep n={2}>
                          Enter Pochi number <strong className="font-mono text-ink">{POCHI_NUMBER}</strong>
                          <span className="text-ink-soft"> ({POCHI_NAME})</span>
                        </PayStep>
                        <PayStep n={3}>Enter the amount: <strong>{kes(selected.price_kes)}</strong></PayStep>
                        <PayStep n={4}>Enter your M-Pesa PIN and send</PayStep>
                        <PayStep n={5}>Copy the confirmation code from the SMS and paste it here</PayStep>
                      </ol>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="label">Phone you paid from</label>
                        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX"
                          className="input" inputMode="tel" />
                      </div>
                      <div>
                        <label className="label">M-Pesa confirmation code</label>
                        <input value={mpesaCode} onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                          placeholder="ABC123XYZ"
                          className="input font-mono uppercase tracking-wide" />
                        <p className="help-text">From the M-Pesa confirmation SMS. Letters and digits only.</p>
                      </div>
                      <button onClick={handleConfirm} disabled={submitting} className="btn btn-accent w-full">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        {submitting ? "Submitting..." : "I've paid, submit for verification"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="alert alert-warning">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      Pochi payment isn&apos;t configured yet. Please use the <strong>M-Pesa STK push</strong> option above, or contact support.
                    </span>
                  </div>
                )
              ) : (
                <div className="max-w-md space-y-4">
                  <p className="text-sm text-slate-600">We&apos;ll send an STK push to your phone. Enter your M-Pesa PIN to pay.</p>
                  <div>
                    <label className="label">M-Pesa phone number</label>
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX"
                      className="input" inputMode="tel" />
                  </div>
                  <button onClick={handleConfirm} disabled={submitting} className="btn btn-primary w-full">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                    {submitting ? "Sending STK push..." : "Send STK push"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {message && (
          <div className={`alert mt-4 ${
            message.tone === "ok"  ? "alert-success" :
            message.tone === "err" ? "alert-error" :
            "alert-info"}`}>
            {message.tone === "ok"
              ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />
              : message.tone === "err"
                ? <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                : <Info className="mt-0.5 h-4 w-4 shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </>
  );
}

function PayStep({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent-600 text-xs font-bold text-white">
        {n}
      </span>
      <span className="pt-0.5">{children}</span>
    </li>
  );
}
