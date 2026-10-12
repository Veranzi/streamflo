import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Public comment submission. Comments are saved unapproved and only appear on the
 * article after an admin approves them in the admin portal.
 * The "website" field is a honeypot: real visitors never see it, bots fill it in.
 */
export async function POST(req: NextRequest) {
  try {
    const { post_id, name, content, website } = await req.json();

    // Honeypot: pretend success so the bot learns nothing.
    if (typeof website === "string" && website.trim() !== "") {
      return NextResponse.json({ success: true, pending: true });
    }

    const postId = Number(post_id);
    const author = typeof name === "string" ? name.trim() : "";
    const text = typeof content === "string" ? content.trim() : "";
    if (!Number.isInteger(postId) || postId <= 0 || !author || !text) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }
    if (author.length > 100) return NextResponse.json({ error: "Name is too long." }, { status: 400 });
    if (text.length > 5000) return NextResponse.json({ error: "Comment is too long." }, { status: 400 });

    try {
      await query(
        "INSERT INTO blog_comments (post_id, author_name, content, approved) VALUES (?,?,?,FALSE)",
        [postId, author, text]
      );
    } catch (err) {
      // Moderation migration not run yet (no "approved" column): save the old way.
      if ((err as { code?: string })?.code !== "42703") throw err;
      console.warn("blog_comments.approved missing: run migrations/2026-10-12-blog-comment-moderation.sql");
      await query("INSERT INTO blog_comments (post_id, author_name, content) VALUES (?,?,?)", [postId, author, text]);
    }

    return NextResponse.json({ success: true, pending: true });
  } catch (err) {
    console.error("Comment error:", err);
    return NextResponse.json({ error: "Failed to post comment." }, { status: 500 });
  }
}
