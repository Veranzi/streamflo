import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { query, queryOne } from "@/lib/db";

function admin(s: unknown) {
  return (s as { user?: { role?: string } } | null)?.user?.role === "admin";
}

const COLUMNS = "id,title,grade,subject,type,published,author,created_at";

/** Partial update (published, type, title). Returns the updated note. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions);
  if (!admin(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { published, type, title } = (await req.json().catch(() => ({}))) as {
    published?: boolean;
    type?: string;
    title?: string;
  };
  const sets: string[] = [];
  const values: unknown[] = [];
  if (published !== undefined) { values.push(!!published); sets.push(`published=$${values.length}`); }
  if (type !== undefined) {
    if (type !== "note" && type !== "guide") return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    values.push(type); sets.push(`type=$${values.length}`);
  }
  if (title !== undefined) {
    if (!String(title).trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
    values.push(String(title).trim()); sets.push(`title=$${values.length}`);
  }
  if (!sets.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  sets.push("updated_at=NOW()");
  values.push(params.id);
  await query(`UPDATE edutena.content_notes SET ${sets.join(",")} WHERE id=$${values.length}`, values);
  const row = await queryOne(`SELECT ${COLUMNS} FROM edutena.content_notes WHERE id=$1`, [params.id]);
  if (!row) return NextResponse.json({ error: "Note not found" }, { status: 404 });
  const fields = sets.map((x) => x.split("=")[0]).filter((f) => f !== "updated_at");
  const noteTitle = (row as { title?: string }).title ?? `#${params.id}`;
  const onlyPublished = fields.length === 1 && fields[0] === "published";
  await logAdminAction(s, {
    action: onlyPublished ? (published ? "note.publish" : "note.unpublish") : "note.update",
    targetType: "note",
    targetId: params.id,
    summary: onlyPublished
      ? `${published ? "Published" : "Unpublished"} note "${noteTitle}"`
      : `Updated note "${noteTitle}"`,
    details: { fields },
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions);
  if (!admin(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const removed = await query<{ title: string }>("DELETE FROM edutena.content_notes WHERE id=$1 RETURNING title", [params.id]);
  if (removed.length) {
    await logAdminAction(s, {
      action: "note.delete",
      targetType: "note",
      targetId: params.id,
      summary: `Deleted note "${removed[0].title}"`,
    });
  }
  return NextResponse.json({ ok: true });
}
