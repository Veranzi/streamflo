"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle, CircleCheck, Eye, ImagePlus, Loader2, Lock, Newspaper, Pencil, Plus, Rocket, Trash2, X,
} from "lucide-react";
import { EmptyState } from "@/components/ui";
import { mediaUrl } from "@/lib/media";

type Post = { id: number; title: string; content_text: string; featured_image: string | null; created_at: string };

type Editing = { id: number | null; title: string; content: string; image: File | null; existingImage: string | null; removeImage: boolean };

const MAX_BYTES = 4 * 1024 * 1024;

export default function BlogManager({ allowed: initialAllowed }: { allowed: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [allowed, setAllowed] = useState(initialAllowed);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/blog", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not load your posts.");
      setPosts(data.rows ?? []);
      setAllowed(!!data.allowed);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startNew() {
    setFormError("");
    setNotice("");
    setEditing({ id: null, title: "", content: "", image: null, existingImage: null, removeImage: false });
  }

  function startEdit(p: Post) {
    setFormError("");
    setNotice("");
    setEditing({ id: p.id, title: p.title, content: p.content_text, image: null, existingImage: p.featured_image, removeImage: false });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    if (editing.image && editing.image.size > MAX_BYTES) { setFormError("The image is larger than 4 MB."); return; }
    setSaving(true);
    setFormError("");
    const body = new FormData();
    body.append("title", editing.title);
    body.append("content", editing.content);
    if (editing.image) body.append("image", editing.image);
    if (editing.removeImage) body.append("remove_image", "true");
    try {
      const res = await fetch(editing.id ? `/api/dashboard/blog/${editing.id}` : "/api/dashboard/blog", {
        method: editing.id ? "PUT" : "POST",
        body,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save the post.");
      setNotice(editing.id ? "Post updated." : "Post published. It is now visible on the blog.");
      setEditing(null);
      await load();
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: number) {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    setDeletingId(id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/dashboard/blog/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not delete the post.");
      setPosts((p) => p.filter((x) => x.id !== id));
      setNotice("Post deleted.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && <div className="alert alert-error"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{error}</span></div>}
      {notice && <div className="alert alert-success"><CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /><span>{notice}</span></div>}

      {!allowed && !loading && (
        <div className="card">
          <EmptyState
            icon={Lock}
            title="Blog posting is a Premium feature"
            description="Upgrade to Premium to publish news and stories that parents can read on the Streamflo blog and on your school profile."
            action={
              <Link href="/dashboard/upgrade" className="btn btn-primary">
                <Rocket className="h-4 w-4" /> Upgrade to Premium
              </Link>
            }
          />
        </div>
      )}

      {allowed && (
        <div className="flex justify-end">
          <button type="button" onClick={startNew} className="btn btn-primary">
            <Plus className="h-4 w-4" /> New post
          </button>
        </div>
      )}

      {loading ? (
        <div className="card card-pad space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-14 w-full" />)}
        </div>
      ) : posts.length === 0 ? (
        allowed && (
          <div className="card">
            <EmptyState icon={Newspaper} title="No posts yet" description="Write your first post to share news from your school." action={<button type="button" onClick={startNew} className="btn btn-primary"><Plus className="h-4 w-4" /> New post</button>} />
          </div>
        )
      ) : (
        <div className="card">
          <div className="card-header">
            <h2 className="font-display text-base font-semibold">Your posts</h2>
            <span className="text-xs text-ink-soft">{posts.length} total</span>
          </div>
          <ul className="divide-y divide-slate-100">
            {posts.map((p) => {
              const img = mediaUrl(p.featured_image, "blog");
              return (
                <li key={p.id} className="flex items-center gap-4 px-5 py-3 sm:px-6">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={img} alt="" className="h-12 w-16 shrink-0 rounded-md object-cover" />
                  ) : (
                    <span className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400"><Newspaper className="h-5 w-5" /></span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-ink">{p.title}</p>
                    <p className="text-xs text-ink-soft">
                      {new Date(p.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link href={`/blog/${p.id}`} className="btn-icon" aria-label="View post" title="View post"><Eye className="h-4 w-4" /></Link>
                    {allowed && (
                      <button type="button" onClick={() => startEdit(p)} className="btn-icon" aria-label="Edit post" title="Edit post"><Pencil className="h-4 w-4" /></button>
                    )}
                    <button type="button" onClick={() => remove(p.id)} disabled={deletingId === p.id} className="btn-icon text-red-600 hover:bg-red-50 hover:text-red-700" aria-label="Delete post" title="Delete post">
                      {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {editing && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form onSubmit={save} className="modal max-w-2xl">
            <div className="modal-header">
              <h2 className="font-display text-lg font-semibold">{editing.id ? "Edit post" : "New post"}</h2>
              <button type="button" onClick={() => setEditing(null)} className="btn-icon" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="modal-body space-y-4">
              {formError && <div className="alert alert-error"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{formError}</span></div>}
              <div>
                <label htmlFor="bp-title" className="label">Title</label>
                <input id="bp-title" required maxLength={255} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} className="input" />
              </div>
              <div>
                <label htmlFor="bp-content" className="label">Content</label>
                <textarea id="bp-content" required rows={12} value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })} className="textarea" placeholder="Write your post. Leave an empty line between paragraphs." />
              </div>
              <div>
                <p className="label">Featured image <span className="font-normal text-ink-soft">(optional)</span></p>
                {editing.existingImage && !editing.removeImage && !editing.image && (
                  <div className="mb-2 flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl(editing.existingImage, "blog") ?? ""} alt="" className="h-16 w-24 rounded-md object-cover" />
                    <button type="button" onClick={() => setEditing({ ...editing, removeImage: true })} className="btn btn-sm btn-danger-soft">Remove image</button>
                  </div>
                )}
                <label className="btn btn-secondary cursor-pointer">
                  <ImagePlus className="h-4 w-4" /> {editing.image ? "Change image" : "Choose image"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={(e) => setEditing({ ...editing, image: e.target.files?.[0] ?? null, removeImage: false })}
                  />
                </label>
                {editing.image && <p className="help-text">{editing.image.name}</p>}
                <p className="help-text">JPG, PNG, WEBP or GIF, up to 4 MB.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setEditing(null)} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={saving} className="btn btn-primary">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {saving ? "Saving..." : editing.id ? "Save changes" : "Publish post"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
