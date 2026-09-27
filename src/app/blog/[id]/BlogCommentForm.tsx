"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";

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

  if (done) {
    return (
      <div className="alert alert-success">
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="font-medium">Comment submitted. Thank you!</span>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="font-display text-base font-semibold">Leave a comment</h3>
      {error && (
        <div className="alert alert-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div>
        <label htmlFor="comment-name" className="label">Your name</label>
        <input
          id="comment-name"
          required placeholder="Jane Wanjiku"
          value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input sm:max-w-sm"
        />
      </div>
      <div>
        <label htmlFor="comment-content" className="label">Comment</label>
        <textarea
          id="comment-content"
          required placeholder="Share your thoughts"
          value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
          rows={4} className="textarea"
        />
      </div>
      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {loading ? "Posting..." : "Post comment"}
      </button>
    </form>
  );
}
