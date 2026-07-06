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
  const status = searchParams.get("status") ?? "all";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 30;
  const offset = (page - 1) * limit;

  const where = status === "all" ? "1=1" : `mp.status = '${status}'`;

  const rows = await query(
    `SELECT mp.id, mp.user_id, u.email, u.name AS user_name,
            p.name AS plan_name, p.subscriber_type, p.billing_period,
            mp.phone, mp.mpesa_code, mp.amount_kes,
            mp.status, mp.reject_reason, mp.reviewed_at, mp.created_at
     FROM edutena.manual_payments mp
     JOIN edutena.users u ON u.id = mp.user_id
     JOIN edutena.subscription_plans p ON p.id = mp.plan_id
     WHERE ${where}
     ORDER BY mp.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const [counts] = await query<{ total: number; pending: number; approved: number; rejected: number; revenue: string }>(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
       COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
       COUNT(*) FILTER (WHERE status = 'rejected')::int AS rejected,
       COALESCE(SUM(amount_kes) FILTER (WHERE status = 'approved'), 0) AS revenue
     FROM edutena.manual_payments`
  );

  return NextResponse.json({
    rows,
    total: counts?.total ?? 0,
    pending: counts?.pending ?? 0,
    approved: counts?.approved ?? 0,
    rejected: counts?.rejected ?? 0,
    revenue: Number(counts?.revenue ?? 0),
    page,
    limit,
  });
}
