import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, insert } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const page = Math.max(1, Number(new URL(req.url).searchParams.get("page") ?? 1));
  const limit = 20;
  const offset = (page - 1) * limit;

  const rows = await query(
    `SELECT b.id, b.title, b.featured, b.featured_image, b.created_at, s.name AS school_name
     FROM blog_posts b LEFT JOIN schools s ON s.id = b.school_id
     ORDER BY b.created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  const [countRow] = await query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM blog_posts`);
  return NextResponse.json({ rows, total: countRow?.total ?? 0, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string })?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, content, featured, featured_image } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const id = await insert(
    "INSERT INTO blog_posts (title, content, featured, featured_image) VALUES (?, ?, ?, ?)",
    [title.trim(), content ?? "", !!featured, featured_image || null]
  );
  refreshBlog();
  return NextResponse.json({ id });
}

/** Refresh cached public blog pages after a change. */
function refreshBlog() {
  try {
    revalidatePath("/blog");
    revalidatePath("/blog/[id]", "page");
    revalidatePath("/");
  } catch (err) {
    console.error("revalidatePath failed", err);
  }
}
