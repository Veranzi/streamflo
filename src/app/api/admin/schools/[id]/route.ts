import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

function adminOnly(session: unknown) {
  return (session as { user?: { role?: string } } | null)?.user?.role === "admin";
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const row = await queryOne("SELECT * FROM schools WHERE id = $1", [params.id]);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, county, subcounty, type, curriculum, ownership, gender, boarding, package: pkg, featured, approved, email, phone, description } = body;

  await query(
    `UPDATE schools SET name=$1, county=$2, subcounty=$3, type=$4, curriculum=$5, ownership=$6,
     gender=$7, boarding=$8, package=$9, featured=$10, approved=$11, email=$12, phone=$13, description=$14
     WHERE id=$15`,
    [name, county, subcounty, type, curriculum, ownership, gender, boarding, pkg, !!featured, !!approved, email, phone, description, params.id]
  );
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!adminOnly(session)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await query("DELETE FROM schools WHERE id = $1", [params.id]);
  return NextResponse.json({ ok: true });
}
