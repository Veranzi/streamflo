import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { limitRequest } from "@/lib/rate-limit";

/** Parse an integer query param; falls back when missing or not a number. */
function intParam(raw: string | null, fallback: number): number {
  if (raw === null || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export async function GET(req: NextRequest) {
  const limited = limitRequest(req, "search", 120, 60 * 1000);
  if (limited) return limited;

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
    // CBC was renamed CBE: match schools stored under either name
    if (col === "curriculum" && /^(cbc|cbe)$/i.test(val.trim())) {
      where.push(`(curriculum ILIKE ? OR curriculum ILIKE ?)`);
      params.push("%CBC%", "%CBE%");
      return;
    }
    if (val.trim()) {
      where.push(`${col} ILIKE ?`);          // ILIKE = case-insensitive in Postgres
      params.push(`%${val.trim()}%`);
    }
  });

  const limit = Math.min(100, Math.max(1, intParam(p.get("limit"), 20)));
  const offset = Math.max(0, intParam(p.get("offset"), 0));

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
