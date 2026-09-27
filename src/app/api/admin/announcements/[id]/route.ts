import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

function adminOnly(s: unknown) {
  return (s as { user?: { role?: string } } | null)?.user?.role === "admin";
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json() as { active?: boolean; message?: string };

  if (body.message !== undefined && body.active !== undefined) {
    await query(
      "UPDATE announcements SET message = $1, active = $2 WHERE id = $3",
      [body.message, !!body.active, params.id]
    );
  } else if (body.message !== undefined) {
    await query(
      "UPDATE announcements SET message = $1 WHERE id = $2",
      [body.message, params.id]
    );
  } else if (body.active !== undefined) {
    await query(
      "UPDATE announcements SET active = $1 WHERE id = $2",
      [!!body.active, params.id]
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await query("DELETE FROM announcements WHERE id = $1", [params.id]);
  return NextResponse.json({ ok: true });
}
