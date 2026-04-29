import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const schoolId = session.user.schoolId;
  if (!schoolId) return NextResponse.json({ school: null });

  try {
    const [school, photo_count, blog_count] = await Promise.all([
      queryOne<{ id: number; name: string; approved: boolean; package: string }>(
        "SELECT id, name, approved, package FROM schools WHERE id = ?",
        [schoolId]
      ),
      queryOne<{ c: number }>("SELECT COUNT(*)::int as c FROM school_photos WHERE school_id = ?", [schoolId]),
      queryOne<{ c: number }>("SELECT COUNT(*)::int as c FROM blog_posts WHERE school_id = ?", [schoolId]),
    ]);

    return NextResponse.json({
      school,
      photo_count: Number(photo_count?.c ?? 0),
      blog_count: Number(blog_count?.c ?? 0),
      view_count: 0,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "Failed to load dashboard." }, { status: 500 });
  }
}
