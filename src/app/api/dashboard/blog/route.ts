import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { saveImage, deleteImage, UploadError } from "@/lib/storage";
import { requireOwnSchoolApi, canBlog } from "../_school";
import { textToHtml, htmlToText } from "./_content";
import { BLOG_FEATURE_DAYS, BLOG_FEATURE_PRICE, FEATURED_NOW_SQL, PAYBILL } from "@/lib/pricing";

type PostRow = {
  id: number; title: string; content: string | null; featured_image: string | null; created_at: string;
  featured_now: boolean; featured_until: string | null; feature_pending: boolean;
};

export async function GET() {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;
  const allowed = canBlog(a.ctx.school);
  try {
    const rows = await query<PostRow>(
      `SELECT b.id, b.title, b.content, b.featured_image, b.created_at,
              ${FEATURED_NOW_SQL} AS featured_now, b.featured_until,
              EXISTS (SELECT 1 FROM payments p WHERE p.blog_post_id = b.id AND p.status = 'pending') AS feature_pending
       FROM blog_posts b WHERE b.school_id = ? ORDER BY b.created_at DESC, b.id DESC`,
      [a.ctx.schoolId]
    );
    return NextResponse.json({
      allowed,
      approved: a.ctx.school.approved,
      package: a.ctx.school.package ?? "free",
      feature: { price: BLOG_FEATURE_PRICE, days: BLOG_FEATURE_DAYS, paybill: PAYBILL, account: `SCH${a.ctx.schoolId}` },
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
  if (!canBlog(a.ctx.school)) {
    return NextResponse.json({ error: "You can post on the blog once your school is approved." }, { status: 403 });
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
