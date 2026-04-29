import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;

  const where: string[] = ["approved = TRUE"];
  const params: unknown[] = [];

  const strFilters: [string, string][] = [
    ["name", p.get("name") ?? ""],
    ["type", p.get("type") ?? ""],
    ["ownership", p.get("ownership") ?? ""],
    ["curriculum", p.get("curriculum") ?? ""],
    ["boarding", p.get("boarding") ?? ""],
    ["gender", p.get("gender") ?? ""],
    ["county", p.get("county") ?? ""],
    ["subcounty", p.get("subcounty") ?? ""],
  ];

  strFilters.forEach(([col, val]) => {
    if (val.trim()) {
      where.push(`${col} ILIKE ?`);          // ILIKE = case-insensitive in Postgres
      params.push(`%${val.trim()}%`);
    }
  });

  const limit = Math.min(Number(p.get("limit") ?? 20), 100);
  const offset = Number(p.get("offset") ?? 0);

  const whereSQL = `WHERE ${where.join(" AND ")}`;

  try {
    const countRow = await queryOne<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM schools ${whereSQL}`,
      params
    );
    const total = Number(countRow?.total ?? 0);

    const rows = await query(
      `SELECT id, name, county, subcounty, package, lat, lng
       FROM schools ${whereSQL}
       ORDER BY featured DESC, name ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({ results: rows, total });
  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ results: [], total: 0 }, { status: 500 });
  }
}
