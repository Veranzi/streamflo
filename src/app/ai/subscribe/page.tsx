"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

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
  if (u === 0)  return "Text chat only — no uploads";
  return `${u} file uploads / month`;
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

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/ai/subscribe");
  }, [status, router]);

  useEffect(() => {
    fetch(`/api/ai/subscription/plans?type=${type}`)
      .then((r) => r.json())
      .then((rows) => setPlans(Array.isArray(rows) ? rows : []))
      .catch(() => setPlans([]));
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
      setMessage({ tone: "ok", text: "STK push sent — check your phone and enter your M-Pesa PIN." });
    } catch (err) {
      setMessage({ tone: "err", text: (err as Error).message });
    } finally { setSubmitting(false); }
  }

  async function submitPochi(plan: Plan) {
    const code = mpesaCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{8,20}$/.test(code)) {
      setMessage({ tone: "err", text: "Enter the M-Pesa confirmation code from your SMS (letters and digits, 8–20 chars)." });
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

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/ai/chat" className="text-sm text-blue-600 hover:underline">← Back to chat</Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">Choose a plan</h1>
        <p className="text-slate-600 mt-1">All plans bill monthly via M-Pesa. Cancel anytime.</p>

        <div className="flex gap-2 mt-4 mb-6">
          <button onClick={() => { setType("parent"); setSelected(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${type === "parent" ? "bg-blue-600 text-white" : "bg-white border border-slate-300 text-slate-700"}`}>Parent</button>
          <button onClick={() => { setType("school"); setSelected(null); }}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${type === "school" ? "bg-blue-600 text-white" : "bg-white border border-slate-300 text-slate-700"}`}>School</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => {
            const isSelected = selected?.id === p.id;
            return (
              <div key={p.id} className={`bg-white rounded-xl shadow border p-5 flex flex-col ${isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-slate-200"}`}>
                <div className="text-sm text-slate-500">{p.name}</div>
                <div className="text-2xl font-bold text-slate-800 my-2">
                  Ksh {Number(p.price_kes).toLocaleString()}
                  <span className="text-sm font-normal text-slate-500"> / {p.billing_period}</span>
                </div>
                <ul className="text-sm text-slate-700 space-y-1 mb-4">
                  <li>✓ AI chat (text)</li>
                  <li>✓ {uploadsLine(p)}</li>
                </ul>
                <button
                  onClick={() => handleSubscribe(p)}
                  className={`mt-auto py-2 rounded-lg font-semibold ${isSelected ? "bg-blue-700 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
                  {isSelected ? "Selected" : "Choose"}
                </button>
              </div>
            );
          })}
        </div>

        {selected && (
          <div className="bg-white rounded-xl shadow border border-slate-200 p-5 mt-6">
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Pay for {selected.name}</h2>
              <span className="text-blue-700 font-semibold">Ksh {Number(selected.price_kes).toLocaleString()}</span>
            </div>

            <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => setMethod("pochi")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border ${method === "pochi" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-300"}`}>
                Pay manually (Pochi la Biashara)
              </button>
              <button type="button" onClick={() => setMethod("stk")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold border ${method === "stk" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-300"}`}>
                M-Pesa STK push
              </button>
            </div>

            {method === "pochi" ? (
              POCHI_NUMBER ? (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-900">
                    <div className="font-semibold mb-2">Send <span className="font-bold">Ksh {Number(selected.price_kes).toLocaleString()}</span> to:</div>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Open M-Pesa → <strong>Pochi la Biashara</strong></li>
                      <li>Pochi number: <strong className="font-mono">{POCHI_NUMBER}</strong> ({POCHI_NAME})</li>
                      <li>Amount: <strong>Ksh {Number(selected.price_kes).toLocaleString()}</strong></li>
                      <li>Enter PIN, send</li>
                      <li>Copy the M-Pesa confirmation code from the SMS and paste it below</li>
                    </ol>
                  </div>

                  <label className="block text-sm font-semibold text-slate-700">Phone you paid from</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2" />

                  <label className="block text-sm font-semibold text-slate-700">M-Pesa confirmation code</label>
                  <input value={mpesaCode} onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                    placeholder="ABC123XYZ"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono uppercase tracking-wide" />
                  <p className="text-xs text-slate-500">From the M-Pesa confirmation SMS — letters and digits only.</p>

                  <button onClick={handleConfirm} disabled={submitting}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50">
                    {submitting ? "Submitting…" : "I've paid — submit for verification"}
                  </button>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
                  Pochi payment isn&apos;t configured yet. Please use the <strong>M-Pesa STK push</strong> tab above, or contact support.
                </div>
              )
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">We'll send an STK push to your phone — enter your M-Pesa PIN to pay.</p>
                <label className="block text-sm font-semibold text-slate-700">M-Pesa phone number</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XXXXXXXX"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2" />
                <button onClick={handleConfirm} disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50">
                  {submitting ? "Sending STK push…" : "Send STK push"}
                </button>
              </div>
            )}
          </div>
        )}

        {message && (
          <div className={`mt-4 p-4 rounded-lg border text-sm ${
            message.tone === "ok"  ? "bg-emerald-50 border-emerald-200 text-emerald-900" :
            message.tone === "err" ? "bg-red-50 border-red-200 text-red-900" :
            "bg-blue-50 border-blue-200 text-blue-900"}`}>
            {message.text}
          </div>
        )}
      </div>
    </>
  );
}
