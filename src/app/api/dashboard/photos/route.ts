import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, insert } from "@/lib/db";
import { saveImage, deleteImage, UploadError } from "@/lib/storage";
import { requireOwnSchoolApi, MAX_PHOTOS } from "../_school";

type PhotoRow = { id: number; school_id: number; filename: string; caption: string | null; created_at: string };

export async function GET() {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;
  try {
    const rows = await query<PhotoRow>(
      "SELECT id, school_id, filename, caption, created_at FROM school_photos WHERE school_id = ? ORDER BY created_at DESC, id DESC",
      [a.ctx.schoolId]
    );
    return NextResponse.json({ rows, max: MAX_PHOTOS });
  } catch (err) {
    console.error("Dashboard photos GET failed:", err);
    return NextResponse.json({ error: "Could not load photos." }, { status: 500 });
  }
}

/** Upload one or more photos (form field "files", optional "caption"). */
export async function POST(req: NextRequest) {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;
  const schoolId = a.ctx.schoolId;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload." }, { status: 400 });
  }
  const files = [...form.getAll("files"), ...form.getAll("file")].filter(
    (f): f is File => typeof f === "object" && f !== null && typeof (f as File).arrayBuffer === "function"
  );
  const caption = String(form.get("caption") ?? "").trim().slice(0, 255) || null;
  if (files.length === 0) return NextResponse.json({ error: "Please choose at least one photo." }, { status: 400 });

  try {
    const countRow = await queryOne<{ c: number }>("SELECT COUNT(*)::int AS c FROM school_photos WHERE school_id = ?", [schoolId]);
    const remaining = MAX_PHOTOS - Number(countRow?.c ?? 0);
    if (remaining <= 0) {
      return NextResponse.json({ error: `You already have ${MAX_PHOTOS} photos. Delete one to add another.` }, { status: 400 });
    }
    if (files.length > remaining) {
      return NextResponse.json(
        { error: `You can add ${remaining} more photo${remaining === 1 ? "" : "s"}. The limit is ${MAX_PHOTOS} per school.` },
        { status: 400 }
      );
    }

    const saved: PhotoRow[] = [];
    for (const file of files) {
      const { url } = await saveImage(file, `schools/${schoolId}`);
      try {
        const id = await insert("INSERT INTO school_photos (school_id, filename, caption) VALUES (?, ?, ?)", [schoolId, url, caption]);
        saved.push({ id, school_id: schoolId, filename: url, caption, created_at: new Date().toISOString() });
      } catch (err) {
        await deleteImage(url);
        throw err;
      }
    }
    return NextResponse.json({ ok: true, rows: saved });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Dashboard photo upload failed:", err);
    return NextResponse.json({ error: "Could not upload the photo. Please try again." }, { status: 500 });
  }
}

/** Delete a photo by id (JSON body { id } or ?id=). Only the school's own photos. */
export async function DELETE(req: NextRequest) {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;

  let id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) {
    try {
      id = Number((await req.json())?.id);
    } catch {
      /* no body */
    }
  }
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Photo id is required." }, { status: 400 });

  try {
    const photo = await queryOne<PhotoRow>("SELECT id, school_id, filename FROM school_photos WHERE id = ? AND school_id = ?", [id, a.ctx.schoolId]);
    if (!photo) return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    await query("DELETE FROM school_photos WHERE id = ? AND school_id = ?", [id, a.ctx.schoolId]);
    // Only remove the stored file when it is a URL/path we created (legacy bare names stay on disk).
    if (/^https?:\/\//i.test(photo.filename) || photo.filename.startsWith("/uploads/")) {
      await deleteImage(photo.filename);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Dashboard photo delete failed:", err);
    return NextResponse.json({ error: "Could not delete the photo." }, { status: 500 });
  }
}
