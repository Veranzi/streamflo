import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

/**
 * Image storage for blog images and school photos.
 *
 * Production: Supabase Storage (public bucket), because Vercel's disk is read only and
 * anything written there is lost. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and
 * optionally SUPABASE_PUBLIC_BUCKET (default "public-media"). The bucket must be public.
 *
 * Local development without those variables: files go to public/uploads/<folder>/.
 *
 * Callers store the returned `url` (a full URL in production, "/uploads/..." locally)
 * and should render it with `mediaUrl()`, which also understands legacy bare file names.
 */

const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
// Vercel rejects request bodies over about 4.5 MB, so keep uploads under that.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function supabase() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucket = process.env.SUPABASE_PUBLIC_BUCKET || "public-media";
  return url && key ? { url, key, bucket } : null;
}

export class UploadError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Validate an uploaded image (type by magic bytes, size) and return its extension. */
async function validate(file: File): Promise<{ bytes: Buffer; ext: string; type: string }> {
  if (!file || typeof file.arrayBuffer !== "function") throw new UploadError("No file uploaded.");
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("Image is too large. The maximum is 4 MB.", 413);
  const bytes = Buffer.from(await file.arrayBuffer());
  const sniffed =
    bytes[0] === 0xff && bytes[1] === 0xd8 ? "image/jpeg" :
    bytes[0] === 0x89 && bytes[1] === 0x50 ? "image/png" :
    bytes.slice(0, 4).toString() === "RIFF" && bytes.slice(8, 12).toString() === "WEBP" ? "image/webp" :
    bytes.slice(0, 3).toString() === "GIF" ? "image/gif" : null;
  if (!sniffed || !ALLOWED[sniffed]) throw new UploadError("Only JPG, PNG, WEBP or GIF images are allowed.", 415);
  return { bytes, ext: ALLOWED[sniffed], type: sniffed };
}

/**
 * Save an image under `folder` (e.g. "blog", "schools/12"). Returns the URL to store.
 * `folder` must be a server chosen value, never raw user input.
 */
export async function saveImage(file: File, folder: string): Promise<{ url: string; path: string }> {
  if (!/^[a-z0-9/_-]+$/i.test(folder) || folder.includes("..")) throw new UploadError("Invalid folder.", 500);
  const { bytes, ext, type } = await validate(file);
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const objectPath = `${folder}/${name}`;

  const sb = supabase();
  if (sb) {
    const res = await fetch(`${sb.url}/storage/v1/object/${sb.bucket}/${objectPath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${sb.key}`,
        apikey: sb.key,
        "Content-Type": type,
        "x-upsert": "true",
        "cache-control": "31536000",
      },
      body: new Uint8Array(bytes),
    });
    if (!res.ok) {
      console.error("Supabase upload failed", res.status, await res.text().catch(() => ""));
      throw new UploadError("Could not save the image. Please try again.", 502);
    }
    return { url: `${sb.url}/storage/v1/object/public/${sb.bucket}/${objectPath}`, path: objectPath };
  }

  if (process.env.NODE_ENV === "production") {
    console.error("Image upload attempted but SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set.");
    throw new UploadError("Image uploads are not configured yet.", 503);
  }
  console.warn("SUPABASE_URL not set: saving upload to local disk (development only).");
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), bytes);
  return { url: `/uploads/${objectPath}`, path: objectPath };
}

/** Delete a previously saved image. Accepts a stored URL. Never throws. */
export async function deleteImage(storedUrl: string | null | undefined): Promise<void> {
  if (!storedUrl) return;
  try {
    const sb = supabase();
    const marker = sb ? `/storage/v1/object/public/${sb.bucket}/` : null;
    if (sb && marker && storedUrl.includes(marker)) {
      const objectPath = storedUrl.split(marker)[1];
      await fetch(`${sb.url}/storage/v1/object/${sb.bucket}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${sb.key}`, apikey: sb.key, "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: [objectPath] }),
      });
      return;
    }
    if (storedUrl.startsWith("/uploads/") && process.env.NODE_ENV !== "production") {
      const p = path.join(process.cwd(), "public", storedUrl);
      if (p.startsWith(path.join(process.cwd(), "public", "uploads"))) await fs.unlink(p).catch(() => {});
    }
  } catch (err) {
    console.error("deleteImage failed", err);
  }
}

export { mediaUrl } from "./media";
