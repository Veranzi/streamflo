import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
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
    const comment = rows[0] as { author_name?: string; post_id?: number };
    await logAdminAction(s, {
      action: approved ? "comment.approve" : "comment.unapprove",
      targetType: "comment",
      targetId: params.id,
      summary: `${approved ? "Approved" : "Unapproved"} a comment by "${comment.author_name ?? "unknown"}"`,
      details: { post_id: comment.post_id },
    });
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
  const removed = await query<{ author_name: string; post_id: number }>(
    "DELETE FROM blog_comments WHERE id=$1 RETURNING author_name, post_id",
    [params.id]
  );
  refreshBlog();
  if (removed.length) {
    await logAdminAction(s, {
      action: "comment.delete",
      targetType: "comment",
      targetId: params.id,
      summary: `Deleted a comment by "${removed[0].author_name}"`,
      details: { post_id: removed[0].post_id },
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
