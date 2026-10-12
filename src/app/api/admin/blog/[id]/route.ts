import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { deleteImage } from "@/lib/storage";

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
  const row = await queryOne("SELECT * FROM blog_posts WHERE id = $1", [params.id]);
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

  const existing = await queryOne<{ featured_image: string | null }>(
    "SELECT featured_image FROM blog_posts WHERE id = $1",
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
  if (body.featured !== undefined) add("featured", !!body.featured);
  if (body.featured_image !== undefined) add("featured_image", body.featured_image || null);
  if (!sets.length) return NextResponse.json({ ok: true });

  values.push(params.id);
  await query(`UPDATE blog_posts SET ${sets.join(", ")} WHERE id=$${values.length}`, values);

  if (body.featured_image !== undefined && existing.featured_image && existing.featured_image !== (body.featured_image || null)) {
    await removeStoredImage(existing.featured_image);
  }
  refreshBlog();
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await query<{ featured_image: string | null }>(
    "DELETE FROM blog_posts WHERE id = $1 RETURNING featured_image",
    [params.id]
  );
  await removeStoredImage(rows[0]?.featured_image);
  refreshBlog();
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
