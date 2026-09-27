import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, insert } from "@/lib/db";

function adminOnly(s: unknown) {
  return (s as { user?: { role?: string } } | null)?.user?.role === "admin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await query(
    `SELECT e.*, s.name AS school_name FROM events e
     LEFT JOIN schools s ON s.id = e.school_id
     ORDER BY e.created_at DESC LIMIT 100`
  );
  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { title, description } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });
  const id = await insert("INSERT INTO events (title, description, active) VALUES (?, ?, TRUE)", [title.trim(), description ?? ""]);
  return NextResponse.json({ id });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id, title, description, active } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (title !== undefined) {
    if (!String(title).trim()) return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
    sets.push(`title = $${idx++}`);
    params.push(String(title).trim());
  }
  if (description !== undefined) {
    sets.push(`description = $${idx++}`);
    params.push(description);
  }
  if (active !== undefined) {
    sets.push(`active = $${idx++}`);
    params.push(!!active);
  }

  if (sets.length === 0) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

  params.push(id);
  await query(`UPDATE events SET ${sets.join(", ")} WHERE id = $${idx}`, params);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await query("DELETE FROM events WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
