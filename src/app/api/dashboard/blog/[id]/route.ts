import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { saveImage, deleteImage, UploadError } from "@/lib/storage";
import { requireOwnSchoolApi, isPaid } from "../../_school";
import { textToHtml } from "../_content";

type Ctx = { params: { id: string } };

function isOwnUpload(v: string | null) {
  return !!v && (/^https?:\/\//i.test(v) || v.startsWith("/uploads/"));
}

/** Update an own post. multipart: title, content, optional image, optional remove_image=true */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;
  if (!isPaid(a.ctx.school.package)) {
    return NextResponse.json({ error: "Blog posting is part of the Premium package." }, { status: 403 });
  }
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid post." }, { status: 400 });

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

  let newImage: string | null = null;
  try {
    const post = await queryOne<{ id: number; featured_image: string | null }>(
      "SELECT id, featured_image FROM blog_posts WHERE id = ? AND school_id = ?",
      [id, a.ctx.schoolId]
    );
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

    let featured = post.featured_image;
    const image = form.get("image");
    if (image && typeof image === "object" && (image as File).size > 0) {
      newImage = (await saveImage(image as File, "blog")).url;
      featured = newImage;
    } else if (form.get("remove_image") === "true") {
      featured = null;
    }

    await query(
      "UPDATE blog_posts SET title = ?, content = ?, featured_image = ? WHERE id = ? AND school_id = ?",
      [title, textToHtml(content), featured, id, a.ctx.schoolId]
    );
    if (featured !== post.featured_image && isOwnUpload(post.featured_image)) await deleteImage(post.featured_image);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (newImage) await deleteImage(newImage);
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Dashboard blog PUT failed:", err);
    return NextResponse.json({ error: "Could not save the post. Please try again." }, { status: 500 });
  }
}

/** Delete an own post. Allowed on any package so a school can always remove its content. */
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid post." }, { status: 400 });
  try {
    const post = await queryOne<{ id: number; featured_image: string | null }>(
      "SELECT id, featured_image FROM blog_posts WHERE id = ? AND school_id = ?",
      [id, a.ctx.schoolId]
    );
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });
    await query("DELETE FROM blog_posts WHERE id = ? AND school_id = ?", [id, a.ctx.schoolId]);
    if (isOwnUpload(post.featured_image)) await deleteImage(post.featured_image);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Dashboard blog DELETE failed:", err);
    return NextResponse.json({ error: "Could not delete the post." }, { status: 500 });
  }
}
