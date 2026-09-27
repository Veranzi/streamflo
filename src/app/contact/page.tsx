"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Phone, Mail, MessageCircle, Wallet, CheckCircle2, AlertCircle, Loader2, Send, ArrowRight,
  ChevronDown, Headphones, type LucideIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";

const TOPICS = ["Parent enquiry", "School registration", "Learning tools", "Payments", "Other"];

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is it free for parents to search for schools?",
    a: <>Yes. Searching and comparing schools in the <Link href="/directory" className="link">directory</Link> is free.</>,
  },
  {
    q: "How do I list my school on Streamflo?",
    a: <>Fill in the <Link href="/register" className="link">school registration form</Link>. Our team verifies every school before it appears publicly.</>,
  },
  {
    q: "How much do the learning tools cost?",
    a: <>Family plans start from KES 500 per month and school plans cover all your students. See all <Link href="/#plans" className="link">plans and prices</Link>.</>,
  },
  {
    q: "How do I pay?",
    a: <>Pay with M-Pesa. Use Paybill <strong>802200</strong>, account <strong>0022020006871</strong>, or pay directly from the subscription page.</>,
  },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [topic, setTopic] = useState(TOPICS[0]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, message: `Topic: ${topic}\n\n${form.message}` }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to send."); }
      else { setDone(true); }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setForm({ name: "", email: "", phone: "", message: "" });
    setTopic(TOPICS[0]);
    setDone(false);
  }

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-primary-950 pb-24 text-white">
        <div aria-hidden className="bg-dots-dark absolute inset-0 opacity-60" />
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary-600/30 blur-3xl" />
        <div className="container-page relative py-12 text-center sm:py-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-primary-100">
            <Headphones className="h-3.5 w-3.5 text-accent-500" /> Contact us
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">How can we help?</h1>
          <p className="mx-auto mt-3 max-w-xl text-primary-100/90">
            Questions about schools, learning tools or payments? Call, chat on WhatsApp or send us a message.
          </p>
        </div>
      </section>

      {/* Quick actions */}
      <div className="container-page relative -mt-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <QuickCard icon={Phone} tone="bg-primary-50 text-primary-700" title="Call us" desc="Talk to our team">
            <a href="tel:0783601773" className="block font-semibold text-ink hover:text-primary-700">0783 601 773</a>
            <a href="tel:0771815511" className="block font-semibold text-ink hover:text-primary-700">0771 815 511</a>
          </QuickCard>
          <QuickCard icon={MessageCircle} tone="bg-accent-50 text-accent-700" title="WhatsApp" desc="Quick replies on chat">
            <a
              href="https://wa.me/254783601773"
              target="_blank"
              rel="noreferrer"
              className="btn btn-sm mt-1 bg-[#25D366] text-white hover:bg-[#1ebe5b]"
            >
              Start a chat <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </QuickCard>
          <QuickCard icon={Mail} tone="bg-violet-50 text-violet-700" title="Email" desc="For detailed enquiries">
            <a href="mailto:info@streamflo.co.ke" className="font-semibold text-ink hover:text-primary-700">info@streamflo.co.ke</a>
          </QuickCard>
        </div>
      </div>

      {/* Details + form */}
      <div className="container-page py-10 sm:py-12">
        <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card lg:grid-cols-5">
          {/* Info panel */}
          <aside className="relative overflow-hidden bg-primary-950 p-7 text-white sm:p-8 lg:col-span-2">
            <div aria-hidden className="absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-primary-700/40 blur-2xl" />
            <div className="relative">
              <h2 className="text-lg font-semibold text-white">Contact information</h2>
              <p className="mt-1 text-sm text-primary-100/80">Reach us on any of these and we will get back to you.</p>

              <ul className="mt-8 space-y-6 text-sm">
                <InfoRow icon={Phone} label="Phone">
                  <a href="tel:0783601773" className="block hover:underline">0783 601 773</a>
                  <a href="tel:0771815511" className="block hover:underline">0771 815 511</a>
                </InfoRow>
                <InfoRow icon={Mail} label="Email">
                  <a href="mailto:info@streamflo.co.ke" className="hover:underline">info@streamflo.co.ke</a>
                </InfoRow>
                <InfoRow icon={MessageCircle} label="WhatsApp">
                  <a href="https://wa.me/254783601773" target="_blank" rel="noreferrer" className="hover:underline">0783 601 773</a>
                </InfoRow>
                <InfoRow icon={Wallet} label="M-Pesa Paybill">
                  <span className="block">Paybill <strong className="tabular-nums">802200</strong></span>
                  <span className="block">Account <strong className="tabular-nums">0022020006871</strong></span>
                </InfoRow>
              </ul>
            </div>
          </aside>

          {/* Form */}
          <div className="p-6 sm:p-8 lg:col-span-3">
            {done ? (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 text-accent-600 ring-8 ring-accent-50/50">
                  <CheckCircle2 className="h-8 w-8" />
                </span>
                <h2 className="mt-5 text-xl font-semibold text-ink">Message sent</h2>
                <p className="mt-1 max-w-sm text-sm text-ink-soft">
                  Thank you for reaching out. Our team will reply to <strong className="text-ink">{form.email}</strong> soon.
                </p>
                <button onClick={reset} className="btn btn-secondary mt-6">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h2 className="text-lg font-semibold text-ink">Send us a message</h2>
                <p className="mt-1 text-sm text-ink-soft">Fill in the form and we will get back to you by email.</p>

                {error && (
                  <div className="alert alert-error mt-5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <fieldset className="mt-6">
                  <legend className="label">What is this about?</legend>
                  <div className="flex flex-wrap gap-2">
                    {TOPICS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTopic(t)}
                        aria-pressed={topic === t}
                        className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                          topic === t
                            ? "border-primary-700 bg-primary-700 text-white"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contact-name" className="label">Your name</label>
                    <input
                      id="contact-name"
                      required placeholder="Jane Wanjiku"
                      value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="label">Email</label>
                    <input
                      id="contact-email"
                      required type="email" placeholder="you@example.com"
                      value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="contact-phone" className="label">
                    Phone <span className="font-normal text-ink-soft">(optional)</span>
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    placeholder="07XX XXX XXX"
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input"
                  />
                </div>
                <div className="mt-4">
                  <label htmlFor="contact-message" className="label">Message</label>
                  <textarea
                    id="contact-message"
                    required placeholder="Tell us how we can help" rows={5}
                    value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="textarea"
                  />
                </div>
                <div className="mt-6 flex flex-col-reverse items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-ink-soft">We only use your details to reply to you.</p>
                  <button type="submit" disabled={loading} className="btn btn-primary btn-lg w-full sm:w-auto">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {loading ? "Sending..." : "Send message"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* FAQ */}
        <section className="mx-auto mt-14 max-w-3xl">
          <div className="text-center">
            <p className="eyebrow">Quick answers</p>
            <h2 className="section-title mt-1 sm:text-2xl">Frequently asked questions</h2>
          </div>
          <div className="mt-8 divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
            {FAQS.map((f) => (
              <details key={f.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-medium text-ink transition hover:bg-slate-50">
                  {f.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition group-open:rotate-180" />
                </summary>
                <div className="px-6 pb-5 text-sm leading-relaxed text-ink-muted">{f.a}</div>
              </details>
            ))}
          </div>
        </section>
      </div>

      <Footer />
      <WhatsAppFab />
    </>
  );
}

function QuickCard({
  icon: Icon, tone, title, desc, children,
}: {
  icon: LucideIcon;
  tone: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card flex items-start gap-4 p-5 shadow-lift">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone}`}>
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0 text-sm">
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="mb-1.5 text-xs text-ink-soft">{desc}</p>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, children }: { icon: LucideIcon; label: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-accent-500">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-primary-200">{label}</p>
        <div className="mt-1 text-white">{children}</div>
      </div>
    </li>
  );
}
