import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { query, queryOne } from "@/lib/db";
import { deleteImage } from "@/lib/storage";
import { FEATURED_NOW_SQL } from "@/lib/pricing";

function adminOnly(s: unknown) {
  return (s as { user?: { role?: string } } | null)?.user?.role === "admin";
}

/** Only images we stored ourselves (full URL or "/uploads/...") can be deleted. Legacy bare names are left alone. */
async function removeStoredImage(value: string | null | undefined) {
  if (value && (/^https?:\/\//i.test(value) || value.startsWith("/uploads/"))) await deleteImage(value);
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  // `featured` = featured right now (a paid featuring past its end date reads as not featured).
  const row = await queryOne(
    `SELECT b.id, b.title, b.content, b.featured_image, b.school_id, b.created_at, b.featured_until,
            ${FEATURED_NOW_SQL} AS featured
     FROM blog_posts b WHERE b.id = $1`,
    [params.id]
  );
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

/** Partial update: only fields present in the body are changed. */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    content?: string;
    featured?: boolean;
    featured_image?: string | null;
  };

  const existing = await queryOne<{ title: string; featured_image: string | null; featured_now: boolean }>(
    `SELECT b.title, b.featured_image, ${FEATURED_NOW_SQL} AS featured_now FROM blog_posts b WHERE b.id = $1`,
    [params.id]
  );
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const sets: string[] = [];
  const values: unknown[] = [];
  const add = (col: string, v: unknown) => { values.push(v); sets.push(`${col}=$${values.length}`); };

  if (body.title !== undefined) {
    if (!String(body.title).trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
    add("title", String(body.title).trim());
  }
  if (body.content !== undefined) add("content", body.content ?? "");
  // Only a real change touches featuring, so saving an edit never extends or ends a paid
  // featuring. An admin's choice has no end date.
  if (body.featured !== undefined && !!body.featured !== existing.featured_now) {
    add("featured", !!body.featured);
    add("featured_until", null);
  }
  if (body.featured_image !== undefined) add("featured_image", body.featured_image || null);
  if (!sets.length) return NextResponse.json({ ok: true });

  values.push(params.id);
  await query(`UPDATE blog_posts SET ${sets.join(", ")} WHERE id=$${values.length}`, values);

  if (body.featured_image !== undefined && existing.featured_image && existing.featured_image !== (body.featured_image || null)) {
    await removeStoredImage(existing.featured_image);
  }
  refreshBlog();

  const postTitle = body.title !== undefined ? String(body.title).trim() : existing.title;
  const changedFields = sets.map((x) => x.split("=")[0]).filter((f) => f !== "featured" && f !== "featured_until");
  if (changedFields.length) {
    await logAdminAction(session, {
      action: "blog.update",
      targetType: "blog_post",
      targetId: params.id,
      summary: `Edited blog post "${postTitle}"`,
      details: { fields: changedFields },
    });
  }
  if (sets.some((x) => x.startsWith("featured="))) {
    await logAdminAction(session, {
      action: body.featured ? "blog.feature" : "blog.unfeature",
      targetType: "blog_post",
      targetId: params.id,
      summary: `${body.featured ? "Featured" : "Unfeatured"} blog post "${postTitle}"`,
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await query<{ featured_image: string | null; title: string }>(
    "DELETE FROM blog_posts WHERE id = $1 RETURNING featured_image, title",
    [params.id]
  );
  await removeStoredImage(rows[0]?.featured_image);
  refreshBlog();
  if (rows.length) {
    await logAdminAction(session, {
      action: "blog.delete",
      targetType: "blog_post",
      targetId: params.id,
      summary: `Deleted blog post "${rows[0].title}"`,
    });
  }
  return NextResponse.json({ ok: true });
}

/** Refresh cached public blog pages after a change. */
function refreshBlog() {
  try {
    revalidatePath("/blog");
    revalidatePath("/blog/[id]", "page");
    revalidatePath("/");
  } catch (err) {
    console.error("revalidatePath failed", err);
  }
}
