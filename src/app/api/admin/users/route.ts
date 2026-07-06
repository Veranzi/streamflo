import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") ?? "all";
  const search = (searchParams.get("search") ?? "").trim();
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 40;
  const offset = (page - 1) * limit;

  let where = "1=1";
  const params: unknown[] = [];
  let i = 1;

  if (role !== "all") { where += ` AND role = $${i++}`; params.push(role); }
  if (search) {
    where += ` AND (LOWER(username) LIKE $${i} OR LOWER(email) LIKE $${i})`;
    params.push(`%${search.toLowerCase()}%`);
    i++;
  }

  params.push(limit, offset);
  const rows = await query(
    `SELECT id, username, email, phone, role, school_id, created_at FROM users WHERE ${where} ORDER BY created_at DESC LIMIT $${i} OFFSET $${i + 1}`,
    params
  );
  const [countRow] = await query<{ total: number }>(
    `SELECT COUNT(*)::int AS total FROM users WHERE ${where}`,
    params.slice(0, -2)
  );

  return NextResponse.json({ rows, total: countRow?.total ?? 0, page, limit });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await req.json();
  await query("DELETE FROM users WHERE id = $1", [id]);
  return NextResponse.json({ ok: true });
}
