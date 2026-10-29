import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit";
import { query } from "@/lib/db";
import { deleteImage } from "@/lib/storage";

function admin(s: unknown) {
  return (s as { user?: { role?: string } } | null)?.user?.role === "admin";
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions);
  if (!admin(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const rows = await query<{ filename: string | null; school_id: number; school_name: string | null }>(
    "DELETE FROM school_photos WHERE id=$1 RETURNING filename, school_id, (SELECT name FROM schools WHERE schools.id = school_photos.school_id) AS school_name",
    [params.id]
  );
  if (!rows.length) return NextResponse.json({ error: "Photo not found" }, { status: 404 });
  // Only full URLs / "/uploads/..." paths can be resolved by deleteImage; legacy bare names are left alone.
  const stored = rows[0].filename;
  if (stored && (/^https?:\/\//i.test(stored) || stored.startsWith("/uploads/"))) await deleteImage(stored);
  await logAdminAction(s, {
    action: "photo.delete",
    targetType: "school_photo",
    targetId: params.id,
    summary: `Deleted a photo of ${rows[0].school_name ? `"${rows[0].school_name}"` : `school #${rows[0].school_id}`}`,
    details: { school_id: rows[0].school_id },
  });
  return NextResponse.json({ ok: true });
}
