import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
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
  const updated = await query<{ name: string }>(
    "UPDATE contact_messages SET handled = $1 WHERE id = $2 RETURNING name",
    [!!handled, id]
  );
  if (updated.length) {
    await logAdminAction(session, {
      action: handled ? "contact.mark_handled" : "contact.mark_unhandled",
      targetType: "contact",
      targetId: id,
      summary: `Marked the message from "${updated[0].name}" as ${handled ? "handled" : "not handled"}`,
    });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await req.json();
  const removed = await query<{ name: string }>("DELETE FROM contact_messages WHERE id = $1 RETURNING name", [id]);
  if (removed.length) {
    await logAdminAction(session, {
      action: "contact.delete",
      targetType: "contact",
      targetId: id,
      summary: `Deleted the message from "${removed[0].name}"`,
    });
  }
  return NextResponse.json({ ok: true });
}
