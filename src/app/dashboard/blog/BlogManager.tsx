"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle, CircleCheck, Clock, Eye, ImagePlus, Loader2, Lock, Newspaper, Pencil, Plus, Star, Trash2, X,
} from "lucide-react";
import { EmptyState } from "@/components/ui";
import { mediaUrl } from "@/lib/media";
import { BLOG_FEATURE_DAYS, BLOG_FEATURE_PRICE, PAYBILL } from "@/lib/pricing";

type Post = {
  id: number; title: string; content_text: string; featured_image: string | null; created_at: string;
  featured_now: boolean; featured_until: string | null; feature_pending: boolean;
};

type Editing = { id: number | null; title: string; content: string; image: File | null; existingImage: string | null; removeImage: boolean };

type FeatureInfo = { price: number; days: number; paybill: string; account: string };

const MAX_BYTES = 4 * 1024 * 1024;

const fmtDate = (d: string) => new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

export default function BlogManager({ allowed: initialAllowed }: { allowed: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [allowed, setAllowed] = useState(initialAllowed);
  const [feature, setFeature] = useState<FeatureInfo>({ price: BLOG_FEATURE_PRICE, days: BLOG_FEATURE_DAYS, paybill: PAYBILL, account: "" });
  const [featuring, setFeaturing] = useState<Post | null>(null);
  const [featureCode, setFeatureCode] = useState("");
  const [featureSaving, setFeatureSaving] = useState(false);
  const [featureError, setFeatureError] = useState("");
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
      if (data.feature) setFeature(data.feature);
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

  function startFeature(p: Post) {
    setFeatureCode("");
    setFeatureError("");
    setNotice("");
    setFeaturing(p);
  }

  async function submitFeature(e: React.FormEvent) {
    e.preventDefault();
    if (!featuring) return;
    setFeatureSaving(true);
    setFeatureError("");
    try {
      const res = await fetch(`/api/dashboard/blog/${featuring.id}/feature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: featureCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not record your payment.");
      setNotice("Thank you. Your post will be featured as soon as we confirm the payment, usually within 24 hours.");
      setFeaturing(null);
      await load();
    } catch (err) {
      setFeatureError((err as Error).message);
    } finally {
      setFeatureSaving(false);
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
            title="Blog posting opens once your school is approved"
            description="Our team reviews new schools before they go live. After approval you can post events like graduations, open days and parents' days for free."
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
                    <p className="flex flex-wrap items-center gap-2 text-xs text-ink-soft">
                      {fmtDate(p.created_at)}
                      {p.featured_now && (
                        <span className="badge badge-green"><Star className="h-3 w-3" /> {p.featured_until ? `Featured until ${fmtDate(p.featured_until)}` : "Featured"}</span>
                      )}
                      {p.feature_pending && <span className="badge badge-amber"><Clock className="h-3 w-3" /> Feature payment being confirmed</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {allowed && !p.feature_pending && (
                      <button type="button" onClick={() => startFeature(p)} className="btn btn-secondary btn-sm">
                        <Star className="h-4 w-4" /> {p.featured_now ? "Extend" : "Feature"}
                      </button>
                    )}
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

      {featuring && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <form onSubmit={submitFeature} className="modal max-w-lg">
            <div className="modal-header">
              <h2 className="font-display text-lg font-semibold">Feature this post</h2>
              <button type="button" onClick={() => setFeaturing(null)} className="btn-icon" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="modal-body space-y-4">
              <p className="text-sm text-slate-700">
                <strong className="text-ink">{featuring.title}</strong> will be shown at the top of the Streamflo blog and on the
                home page for {feature.days} days{featuring.featured_now ? ", added to its current featured period" : ""}.
              </p>
              <ol className="space-y-2 text-sm text-slate-700">
                {[
                  "Open M-Pesa and choose Lipa na M-Pesa, then Pay Bill.",
                  <>Enter business number <strong>{feature.paybill}</strong>.</>,
                  <>Enter account number <strong>{feature.account}</strong>.</>,
                  <>Enter the amount <strong>KES {feature.price.toLocaleString("en-KE")}</strong>, then your M-Pesa PIN.</>,
                  "Enter the M-Pesa code from the confirmation SMS below.",
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-50 text-xs font-bold text-primary-700">{i + 1}</span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
              {featureError && <div className="alert alert-error"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{featureError}</span></div>}
              <div>
                <label htmlFor="ft-code" className="label">M-Pesa confirmation code</label>
                <input
                  id="ft-code"
                  required
                  autoFocus
                  maxLength={12}
                  value={featureCode}
                  onChange={(e) => setFeatureCode(e.target.value.toUpperCase())}
                  className="input font-mono uppercase tracking-wider"
                  placeholder="e.g. SGH7K2LQ9X"
                />
                <p className="help-text">The post is featured once our team confirms the payment, usually within 24 hours.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setFeaturing(null)} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={featureSaving} className="btn btn-primary">
                {featureSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {featureSaving ? "Submitting..." : "Submit payment"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
