import { NextResponse } from "next/server";
import { queryOne } from "@/lib/db";
import { getOwnSchool } from "./_school";

export async function GET() {
  try {
    const own = await getOwnSchool();
    if (own === null) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (own === "forbidden") return NextResponse.json({ error: "Only school accounts can open the dashboard." }, { status: 403 });
    if (!own.schoolId || !own.school) return NextResponse.json({ school: null, photo_count: 0, blog_count: 0, event_count: 0, view_count: 0 });

    const schoolId = own.schoolId;
    const [photo_count, blog_count, event_count] = await Promise.all([
      queryOne<{ c: number }>("SELECT COUNT(*)::int as c FROM school_photos WHERE school_id = ?", [schoolId]),
      queryOne<{ c: number }>("SELECT COUNT(*)::int as c FROM blog_posts WHERE school_id = ?", [schoolId]),
      queryOne<{ c: number }>("SELECT COUNT(*)::int as c FROM events WHERE school_id = ?", [schoolId]),
    ]);

    return NextResponse.json({
      school: own.school,
      photo_count: Number(photo_count?.c ?? 0),
      blog_count: Number(blog_count?.c ?? 0),
      event_count: Number(event_count?.c ?? 0),
      view_count: 0,
    });
  } catch (err) {
    console.error("Dashboard error:", err);
    return NextResponse.json({ error: "Failed to load dashboard." }, { status: 500 });
  }
}
