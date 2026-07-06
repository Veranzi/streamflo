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
  const statusFilter = searchParams.get("status") ?? "all";
  const limit = 30;
  const offset = (page - 1) * limit;

  // Map UI filter to SQL conditions for each source
  // School statuses: pending, success, failed, reversed
  // AI statuses:     pending, approved, rejected
  let schoolWhere = "1=1";
  let aiWhere = "1=1";
  if (statusFilter === "pending")  { schoolWhere = "p.status = 'pending'";  aiWhere = "mp.status = 'pending'"; }
  if (statusFilter === "success")  { schoolWhere = "p.status = 'success'";  aiWhere = "mp.status = 'approved'"; }
  if (statusFilter === "failed")   { schoolWhere = "p.status IN ('failed','reversed')"; aiWhere = "mp.status = 'rejected'"; }

  const rows = await query(
    `SELECT * FROM (
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
       WHERE ${schoolWhere}

       UNION ALL

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
       WHERE ${aiWhere}
     ) combined
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  // Always return full counts (unfiltered) for the summary cards
  const [schoolTotals] = await query<{ total: number; pending: number; revenue: string }>(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status='pending')::int AS pending,
            COALESCE(SUM(amount) FILTER (WHERE status='success'), 0) AS revenue
     FROM payments`
  );
  const [aiTotals] = await query<{ total: number; pending: number; revenue: string }>(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status='pending')::int AS pending,
            COALESCE(SUM(amount_kes) FILTER (WHERE status='approved'), 0) AS revenue
     FROM edutena.manual_payments`
  );

  // Filtered count for pagination
  const [filteredCount] = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM (
       SELECT p.id FROM payments p WHERE ${schoolWhere}
       UNION ALL
       SELECT mp.id FROM edutena.manual_payments mp
       JOIN edutena.users u ON u.id = mp.user_id
       WHERE ${aiWhere}
     ) c`
  );

  return NextResponse.json({
    rows,
    total: filteredCount?.total ?? 0,
    all_total: (schoolTotals?.total ?? 0) + (aiTotals?.total ?? 0),
    pending_total: (schoolTotals?.pending ?? 0) + (aiTotals?.pending ?? 0),
    revenue: Number(schoolTotals?.revenue ?? 0) + Number(aiTotals?.revenue ?? 0),
    school_revenue: Number(schoolTotals?.revenue ?? 0),
    ai_revenue: Number(aiTotals?.revenue ?? 0),
    page,
    limit,
  });
}
