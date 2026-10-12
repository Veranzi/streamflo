import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { saveImage, deleteImage, UploadError } from "@/lib/storage";
import { requireOwnSchoolApi, isPaid } from "../_school";
import { textToHtml, htmlToText } from "./_content";

type PostRow = { id: number; title: string; content: string | null; featured_image: string | null; created_at: string };

export async function GET() {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;
  const allowed = isPaid(a.ctx.school.package);
  try {
    const rows = await query<PostRow>(
      "SELECT id, title, content, featured_image, created_at FROM blog_posts WHERE school_id = ? ORDER BY created_at DESC, id DESC",
      [a.ctx.schoolId]
    );
    return NextResponse.json({
      allowed,
      package: a.ctx.school.package ?? "free",
      rows: rows.map((r) => ({ ...r, content_text: htmlToText(r.content) })),
    });
  } catch (err) {
    console.error("Dashboard blog GET failed:", err);
    return NextResponse.json({ error: "Could not load your posts." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;
  if (!isPaid(a.ctx.school.package)) {
    return NextResponse.json({ error: "Blog posting is part of the Premium package." }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const title = String(form.get("title") ?? "").trim();
  const content = String(form.get("content") ?? "").trim();
  if (!title) return NextResponse.json({ error: "Please add a title." }, { status: 400 });
  if (title.length > 255) return NextResponse.json({ error: "The title is too long." }, { status: 400 });
  if (!content) return NextResponse.json({ error: "Please write some content." }, { status: 400 });
  if (content.length > 50000) return NextResponse.json({ error: "The post is too long." }, { status: 400 });

  const image = form.get("image");
  let imageUrl: string | null = null;
  try {
    if (image && typeof image === "object" && (image as File).size > 0) {
      imageUrl = (await saveImage(image as File, "blog")).url;
    }
    const id = await insert(
      "INSERT INTO blog_posts (title, content, featured_image, school_id, featured) VALUES (?, ?, ?, ?, FALSE)",
      [title, textToHtml(content), imageUrl, a.ctx.schoolId]
    );
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    if (imageUrl) await deleteImage(imageUrl);
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Dashboard blog POST failed:", err);
    return NextResponse.json({ error: "Could not publish the post. Please try again." }, { status: 500 });
  }
}
