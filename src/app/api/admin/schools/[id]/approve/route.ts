import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await query("UPDATE schools SET approved = TRUE WHERE id = $1", [params.id]);
  return NextResponse.json({ ok: true });
}
