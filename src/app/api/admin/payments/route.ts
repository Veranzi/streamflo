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

  // Unified view: Streamflo school payments + EduTena AI subscription payments
  const rows = await query(
    `SELECT * FROM (
       -- Streamflo school payments
       SELECT
         p.id,
         'school' AS source,
         s.name AS payer_name,
         s.county AS payer_detail,
         p.amount AS amount_kes,
         p.method,
         p.reference AS mpesa_code,
         p.status,
         p.created_at
       FROM payments p
       LEFT JOIN schools s ON s.id = p.school_id

       UNION ALL

       -- EduTena AI subscription payments (approved manual Pochi)
       SELECT
         mp.id,
         'ai_subscription' AS source,
         u.name AS payer_name,
         u.email AS payer_detail,
         mp.amount_kes,
         'pochi' AS method,
         mp.mpesa_code,
         mp.status,
         mp.created_at
       FROM edutena.manual_payments mp
       JOIN edutena.users u ON u.id = mp.user_id
     ) combined
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  // Total counts and revenue from both sources
  const [schoolTotals] = await query<{ total: number; revenue: string }>(
    `SELECT COUNT(*)::int AS total,
            COALESCE(SUM(amount) FILTER (WHERE status='success'), 0) AS revenue
     FROM payments`
  );
  const [aiTotals] = await query<{ total: number; revenue: string }>(
    `SELECT COUNT(*)::int AS total,
            COALESCE(SUM(amount_kes) FILTER (WHERE status='approved'), 0) AS revenue
     FROM edutena.manual_payments`
  );

  const totalRevenue = Number(schoolTotals?.revenue ?? 0) + Number(aiTotals?.revenue ?? 0);
  const totalCount = (schoolTotals?.total ?? 0) + (aiTotals?.total ?? 0);

  return NextResponse.json({
    rows,
    total: totalCount,
    revenue: totalRevenue,
    school_revenue: Number(schoolTotals?.revenue ?? 0),
    ai_revenue: Number(aiTotals?.revenue ?? 0),
    page,
    limit,
  });
}
