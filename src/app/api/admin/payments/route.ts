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

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 30;
  const offset = (page - 1) * limit;

  const rows = await query(
    `SELECT p.id, p.amount, p.method, p.reference, p.status, p.created_at,
            s.name AS school_name, s.county
     FROM payments p
     LEFT JOIN schools s ON s.id = p.school_id
     ORDER BY p.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const [totals] = await query<{ total: number; revenue: string }>(
    `SELECT COUNT(*)::int AS total, COALESCE(SUM(amount) FILTER (WHERE status='success'), 0) AS revenue FROM payments`
  );

  return NextResponse.json({ rows, total: totals?.total ?? 0, revenue: Number(totals?.revenue ?? 0), page, limit });
}
