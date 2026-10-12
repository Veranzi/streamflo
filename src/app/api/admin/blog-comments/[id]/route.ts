import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

function admin(s: unknown) {
  return (s as { user?: { role?: string } } | null)?.user?.role === "admin";
}

/** Approve or unapprove a comment: body { approved: boolean }. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions);
  if (!admin(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { approved } = (await req.json().catch(() => ({}))) as { approved?: boolean };
  if (typeof approved !== "boolean") return NextResponse.json({ error: "approved must be true or false" }, { status: 400 });
  try {
    const rows = await query("UPDATE blog_comments SET approved=$1 WHERE id=$2 RETURNING *", [approved, params.id]);
    if (!rows.length) return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    refreshBlog();
    return NextResponse.json(rows[0]);
  } catch (err) {
    if ((err as { code?: string })?.code === "42703") {
      console.error("blog_comments.approved missing: run migrations/2026-10-12-blog-comment-moderation.sql");
      return NextResponse.json({ error: "Comment moderation is not set up yet. Please run the database migration." }, { status: 503 });
    }
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions);
  if (!admin(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await query("DELETE FROM blog_comments WHERE id=$1", [params.id]);
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
