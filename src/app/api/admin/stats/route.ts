import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [schools, users, blog, subs] = await Promise.all([
    queryOne<{ total: number; pending: number }>(
      `SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE approved = FALSE)::int AS pending FROM schools`
    ),
    queryOne<{ total: number }>(`SELECT COUNT(*)::int AS total FROM users`),
    queryOne<{ total: number }>(`SELECT COUNT(*)::int AS total FROM blog_posts`),
    queryOne<{ revenue: string }>(`SELECT COALESCE(SUM(amount),0) AS revenue FROM payments WHERE status = 'success'`),
  ]);

  return NextResponse.json({
    schools_total: schools?.total ?? 0,
    schools_pending: schools?.pending ?? 0,
    users_total: users?.total ?? 0,
    blog_total: blog?.total ?? 0,
    revenue_total: Number(subs?.revenue ?? 0),
  });
}
