"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppFab from "@/components/WhatsAppFab";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
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
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to send."); }
      else { setDone(true); }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-blue-800 mb-2">Contact Us</h1>
        <p className="text-slate-600 mb-8">We&apos;d love to hear from you. Fill out the form or reach us directly.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact info */}
          <div className="bg-blue-50 border border-blue-200 rounded p-6 space-y-4">
            <div>
              <h3 className="font-bold text-blue-800 mb-1">Phone</h3>
              <a href="tel:0783601773" className="text-blue-600 hover:underline">0783 601 773</a>
            </div>
            <div>
              <h3 className="font-bold text-blue-800 mb-1">Email</h3>
              <a href="mailto:info@streamflo.co.ke" className="text-blue-600 hover:underline">info@streamflo.co.ke</a>
            </div>
            <div>
              <h3 className="font-bold text-blue-800 mb-1">WhatsApp</h3>
              <a href="https://wa.me/254783601773" target="_blank" rel="noreferrer" className="text-green-600 hover:underline">
                Chat on WhatsApp
              </a>
            </div>
            <div>
              <h3 className="font-bold text-blue-800 mb-1">M-Pesa Paybill</h3>
              <p className="text-sm">Paybill: <strong>802200</strong></p>
              <p className="text-sm">Account: <strong>0022020006871</strong></p>
            </div>
          </div>

          {/* Form */}
          {done ? (
            <div className="bg-green-50 border border-green-200 rounded p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">✅</div>
                <p className="text-green-700 font-semibold">Message sent! We&apos;ll get back to you soon.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 space-y-4">
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <input
                required placeholder="Your name"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <input
                required type="email" placeholder="Your email"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <input
                placeholder="Phone (optional)"
                value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <textarea
                required placeholder="Your message" rows={5}
                value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full border p-2 rounded"
              />
              <button
                type="submit" disabled={loading}
                className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 disabled:opacity-60 font-semibold"
              >
                {loading ? "Sending…" : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>

      <Footer />
      <WhatsAppFab />
    </>
  );
}
