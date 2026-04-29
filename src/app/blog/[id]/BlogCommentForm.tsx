"use client";

import { useState } from "react";

interface Props {
  postId: number;
}

export default function BlogCommentForm({ postId }: Props) {
  const [form, setForm] = useState({ name: "", content: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId, ...form }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error ?? "Failed to post comment."); }
      else { setDone(true); }
    } catch {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (done) return <p className="text-green-600 font-semibold">Comment submitted. Thank you!</p>;

  return (
    <form onSubmit={submit} className="space-y-3">
      <h4 className="font-semibold">Leave a Comment</h4>
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <input
        required placeholder="Your name"
        value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full border p-2 rounded"
      />
      <textarea
        required placeholder="Your comment"
        value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
        rows={3} className="w-full border p-2 rounded"
      />
      <button type="submit" disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-60">
        {loading ? "Posting…" : "Post Comment"}
      </button>
    </form>
  );
}
