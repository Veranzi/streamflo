import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

/** Admin activity trail, newest first. Filters: ?admin=<username>&type=<target_type>&page=N */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string } | undefined)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const sp = new URL(req.url).searchParams;
  const page = Math.max(1, Math.trunc(Number(sp.get("page") ?? 1)) || 1);
  const limit = 50;
  const admin = (sp.get("admin") ?? "").trim();
  const type = (sp.get("type") ?? "").trim();

  const where: string[] = [];
  const params: unknown[] = [];
  if (admin) { where.push("admin_username = ?"); params.push(admin); }
  if (type) { where.push("target_type = ?"); params.push(type); }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  try {
    const [rows, count, admins, types] = await Promise.all([
      query(
        `SELECT id, admin_username, action, target_type, target_id, summary, details, created_at
         FROM admin_audit_log ${whereSql}
         ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
        [...params, limit, (page - 1) * limit]
      ),
      query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM admin_audit_log ${whereSql}`, params),
      query<{ admin_username: string }>("SELECT DISTINCT admin_username FROM admin_audit_log ORDER BY 1"),
      query<{ target_type: string }>("SELECT DISTINCT target_type FROM admin_audit_log WHERE target_type IS NOT NULL ORDER BY 1"),
    ]);
    return NextResponse.json({
      rows,
      total: count[0]?.total ?? 0,
      page,
      limit,
      admins: admins.map((a) => a.admin_username),
      types: types.map((t) => t.target_type),
    });
  } catch (err) {
    console.error("Activity log GET failed:", err);
    return NextResponse.json({ error: "Could not load the activity log." }, { status: 500 });
  }
}
