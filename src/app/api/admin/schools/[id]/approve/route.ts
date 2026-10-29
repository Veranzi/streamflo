import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { query } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await query<{ name: string }>("UPDATE schools SET approved = TRUE WHERE id = $1 RETURNING name", [params.id]);
  if (rows.length) {
    await logAdminAction(session, {
      action: "school.approve",
      targetType: "school",
      targetId: params.id,
      summary: `Approved school "${rows[0].name}"`,
    });
  }
  return NextResponse.json({ ok: true });
}
