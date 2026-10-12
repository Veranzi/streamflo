"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CircleCheck, ImagePlus, Images, Loader2, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { mediaUrl } from "@/lib/media";

type Photo = { id: number; filename: string; caption: string | null; created_at: string };

const MAX_BYTES = 4 * 1024 * 1024;

export default function PhotosManager({ schoolId }: { schoolId: number }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [max, setMax] = useState(12);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/photos", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not load photos.");
      setPhotos(data.rows ?? []);
      if (data.max) setMax(data.max);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remaining = Math.max(0, max - photos.length);

  async function handleFiles(list: FileList | null) {
    if (!list || list.length === 0) return;
    setError("");
    setNotice("");
    let files = Array.from(list);
    const tooBig = files.filter((f) => f.size > MAX_BYTES);
    files = files.filter((f) => f.size <= MAX_BYTES);
    const problems: string[] = [];
    if (tooBig.length) problems.push(`${tooBig.length} photo${tooBig.length === 1 ? " is" : "s are"} larger than 4 MB and ${tooBig.length === 1 ? "was" : "were"} skipped.`);
    if (files.length > remaining) {
      problems.push(`Only ${remaining} more photo${remaining === 1 ? "" : "s"} can be added, so the rest were skipped.`);
      files = files.slice(0, remaining);
    }

    // Upload one at a time to stay within request size limits.
    let done = 0;
    setUploading({ done, total: files.length });
    for (const file of files) {
      const body = new FormData();
      body.append("files", file);
      if (caption.trim()) body.append("caption", caption.trim());
      try {
        const res = await fetch("/api/dashboard/photos", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          problems.push(`${file.name}: ${data.error ?? "upload failed."}`);
          if (res.status === 400 && /limit|already have/i.test(String(data.error))) break;
        } else {
          done += 1;
          setPhotos((p) => [...(data.rows ?? []), ...p]);
        }
      } catch {
        problems.push(`${file.name}: upload failed. Check your connection.`);
      }
      setUploading({ done, total: files.length });
    }
    setUploading(null);
    if (inputRef.current) inputRef.current.value = "";
    if (done > 0) {
      setNotice(`${done} photo${done === 1 ? "" : "s"} uploaded.`);
      setCaption("");
    }
    if (problems.length) setError(problems.join(" "));
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this photo? This cannot be undone.")) return;
    setDeletingId(id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/dashboard/photos?id=${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not delete the photo.");
      setPhotos((p) => p.filter((x) => x.id !== id));
      setNotice("Photo deleted.");
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

      <div className="card card-pad">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1">
            <label htmlFor="ph-caption" className="label">Caption <span className="font-normal text-ink-soft">(optional, applies to this upload)</span></label>
            <input id="ph-caption" maxLength={255} value={caption} onChange={(e) => setCaption(e.target.value)} className="input" placeholder="e.g. Science laboratory" disabled={!!uploading} />
          </div>
          <div className="shrink-0">
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="sr-only"
              id="ph-files"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={!!uploading || remaining === 0}
            />
            <label
              htmlFor="ph-files"
              className={`btn btn-primary ${uploading || remaining === 0 ? "pointer-events-none opacity-60" : "cursor-pointer"}`}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {uploading ? `Uploading ${uploading.done + 1 > uploading.total ? uploading.total : uploading.done + 1} of ${uploading.total}` : "Upload photos"}
            </label>
          </div>
        </div>
        <p className="help-text">
          {photos.length} of {max} photos used. JPG, PNG, WEBP or GIF, up to 4 MB each. You can select several at once.
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton aspect-[4/3] w-full" />)}
        </div>
      ) : photos.length === 0 ? (
        <div className="card">
          <EmptyState icon={Images} title="No photos yet" description="Schools with photos get more attention from parents. Upload your first photo above." />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {photos.map((p) => (
            <figure key={p.id} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mediaUrl(p.filename, `schools/${schoolId}`) ?? ""} alt={p.caption ?? "School photo"} className="aspect-[4/3] w-full object-cover" />
              <figcaption className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5">
                <span className="truncate text-xs text-ink-soft">{p.caption || "No caption"}</span>
                <button
                  type="button"
                  onClick={() => handleDelete(p.id)}
                  disabled={deletingId === p.id}
                  className="btn-icon h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                  aria-label="Delete photo"
                  title="Delete photo"
                >
                  {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
