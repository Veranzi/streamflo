"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

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

export default function SubscribePage() {
  const { status } = useSession();
  const router = useRouter();

  const [type, setType] = useState<"parent" | "school">("parent");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [phone, setPhone] = useState("");
  const [planId, setPlanId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login?callbackUrl=/ai/subscribe");
  }, [status, router]);

  useEffect(() => {
    fetch(`/api/ai/subscription/plans?type=${type}`)
      .then((r) => r.json())
      .then((rows) => setPlans(Array.isArray(rows) ? rows : []))
      .catch(() => setPlans([]));
  }, [type]);

  async function subscribe(plan: Plan) {
    if (submitting) return;
    if (!/^254\d{9}$/.test(phone)) {
      setMessage("Phone must be in 254XXXXXXXXX format (e.g. 254712345678).");
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch("/api/ai/subscription/subscriptions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: plan.id, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "Could not start subscription.");
        return;
      }
      setMessage(
        "STK push sent to your phone — enter your M-Pesa PIN to complete payment. " +
        "We'll activate your plan as soon as it's confirmed."
      );
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-8">
        <Link href="/ai/chat" className="text-sm text-blue-600 hover:underline">← Back to chat</Link>
        <h1 className="text-2xl font-bold text-slate-800 mt-2">Choose a plan</h1>
        <p className="text-slate-600 mt-1">All plans bill monthly via M-Pesa. Cancel anytime.</p>

        <div className="flex gap-2 mt-4 mb-6">
          <button onClick={() => setType("parent")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${type === "parent" ? "bg-blue-600 text-white" : "bg-white border border-slate-300 text-slate-700"}`}>
            Parent
          </button>
          <button onClick={() => setType("school")}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${type === "school" ? "bg-blue-600 text-white" : "bg-white border border-slate-300 text-slate-700"}`}>
            School
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p) => (
            <div key={p.id} className="bg-white rounded-xl shadow border border-slate-200 p-5 flex flex-col">
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
                onClick={() => { setPlanId(p.id); subscribe(p); }}
                disabled={submitting}
                className="mt-auto bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold">
                {submitting && planId === p.id ? "Sending STK push…" : "Subscribe"}
              </button>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow border border-slate-200 p-5 mt-6">
          <label className="block text-sm font-semibold text-slate-700 mb-1">M-Pesa phone number</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="254712345678"
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
          />
          <p className="text-xs text-slate-500 mt-1">Format: 254 followed by your 9-digit number, no plus or spaces.</p>
        </div>

        {message && (
          <div className="mt-4 p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-sm">
            {message}
          </div>
        )}
      </div>
    </>
  );
}
