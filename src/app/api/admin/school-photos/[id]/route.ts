import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { deleteImage } from "@/lib/storage";

function admin(s: unknown) {
  return (s as { user?: { role?: string } } | null)?.user?.role === "admin";
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions);
  if (!admin(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await query<{ filename: string | null }>(
    "DELETE FROM school_photos WHERE id=$1 RETURNING filename",
    [params.id]
  );
  if (!rows.length) return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  // Only full URLs / "/uploads/..." paths can be resolved by deleteImage; legacy bare names are left alone.
  const stored = rows[0].filename;
  if (stored && (/^https?:\/\//i.test(stored) || stored.startsWith("/uploads/"))) await deleteImage(stored);
  return NextResponse.json({ ok: true });
}
