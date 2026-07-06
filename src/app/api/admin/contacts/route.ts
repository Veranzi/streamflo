import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

function adminOnly(s: unknown) {
  return (s as { user?: { role?: string } } | null)?.user?.role === "admin";
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const handled = new URL(req.url).searchParams.get("handled");
  let where = "1=1";
  if (handled === "false") where = "handled = FALSE";
  else if (handled === "true") where = "handled = TRUE";

  const rows = await query(
    `SELECT * FROM contact_messages WHERE ${where} ORDER BY created_at DESC LIMIT 100`
  );
  const [count] = await query<{ unread: number }>(
    "SELECT COUNT(*)::int AS unread FROM contact_messages WHERE handled = FALSE"
  );
  return NextResponse.json({ rows, unread: count?.unread ?? 0 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id, handled } = await req.json();
  await query("UPDATE contact_messages SET handled = $1 WHERE id = $2", [!!handled, id]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await req.json();
  await query("DELETE FROM contact_messages WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
