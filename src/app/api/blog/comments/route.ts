import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { post_id, name, content } = await req.json();

    if (!post_id || !name?.trim() || !content?.trim()) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    await query(
      "INSERT INTO blog_comments (post_id, author_name, content) VALUES (?,?,?)",
      [post_id, name.trim(), content.trim()]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Comment error:", err);
    return NextResponse.json({ error: "Failed to post comment." }, { status: 500 });
  }
}
