import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

function adminOnly(s: unknown) {
  return (s as { user?: { role?: string } } | null)?.user?.role === "admin";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const row = await queryOne("SELECT * FROM settings LIMIT 1");
  return NextResponse.json(row ?? {});
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { site_name, premium_price, commission_rate } = await req.json();
  await query(
    `INSERT INTO settings (id, site_name, premium_price, commission_rate, updated_at)
     VALUES (1, $1, $2, $3, NOW())
     ON CONFLICT (id) DO UPDATE SET site_name=$1, premium_price=$2, commission_rate=$3, updated_at=NOW()`,
    [site_name, Number(premium_price), Number(commission_rate)]
  );
  return NextResponse.json({ ok: true });
}
