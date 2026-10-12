import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions);
  if (!admin(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await query("DELETE FROM edutena.content_notes WHERE id=$1", [params.id]);
  return NextResponse.json({ ok: true });
}
