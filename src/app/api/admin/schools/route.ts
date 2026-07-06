import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "all";
  const search = (searchParams.get("search") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 30;
  const offset = (page - 1) * limit;

  let where = "1=1";
  const params: unknown[] = [];
  let i = 1;

  if (status === "pending") { where += ` AND approved = FALSE`; }
  else if (status === "approved") { where += ` AND approved = TRUE`; }

  if (search) {
    where += ` AND (LOWER(name) LIKE $${i} OR LOWER(county) LIKE $${i})`;
    params.push(`%${search.toLowerCase()}%`);
    i++;
  }

  params.push(limit, offset);

  const rows = await query(
    `SELECT id, name, county, type, curriculum, package, approved, featured, email, phone, created_at
     FROM schools WHERE ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
    params
  );

  const [countRow] = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM schools WHERE ${where}`,
    params.slice(0, -2)
  );

  return NextResponse.json({ rows, total: countRow?.total ?? 0, page, limit });
}
