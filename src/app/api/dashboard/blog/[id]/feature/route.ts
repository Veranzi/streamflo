import { NextRequest, NextResponse } from "next/server";
import { queryOne, insert } from "@/lib/db";
import { requireOwnSchoolApi, canBlog } from "../../../_school";
import { BLOG_FEATURE_PACKAGE, BLOG_FEATURE_PRICE } from "@/lib/pricing";

/**
 * The school reports the M-Pesa payment for featuring one of its posts: { code }.
 * Recorded as a pending "blog_feature" payment; an admin confirms it under Payments,
 * which features the post for BLOG_FEATURE_DAYS.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;
  if (!canBlog(a.ctx.school)) {
    return NextResponse.json({ error: "You can post on the blog once your school is approved." }, { status: 403 });
  }
  const postId = Number(params.id);
  if (!Number.isInteger(postId) || postId <= 0) return NextResponse.json({ error: "Invalid post." }, { status: 400 });

  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const code = String(body.code ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9]{8,12}$/.test(code)) {
    return NextResponse.json({ error: "Please enter the M-Pesa code from your confirmation SMS, for example SGH7K2LQ9X." }, { status: 400 });
  }

  try {
    const post = await queryOne<{ id: number }>("SELECT id FROM blog_posts WHERE id = ? AND school_id = ?", [postId, a.ctx.schoolId]);
    if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

    const dup = await queryOne<{ id: number }>("SELECT id FROM payments WHERE UPPER(reference) = ?", [code]);
    if (dup) return NextResponse.json({ error: "This M-Pesa code has already been submitted." }, { status: 409 });

    const pending = await queryOne<{ id: number }>(
      "SELECT id FROM payments WHERE blog_post_id = ? AND status = 'pending'",
      [postId]
    );
    if (pending) return NextResponse.json({ error: "A payment for featuring this post is already waiting for confirmation." }, { status: 409 });

    const id = await insert(
      "INSERT INTO payments (school_id, amount, package, method, reference, status, blog_post_id) VALUES (?, ?, ?, 'mpesa_paybill', ?, 'pending', ?)",
      [a.ctx.schoolId, BLOG_FEATURE_PRICE, BLOG_FEATURE_PACKAGE, code, postId]
    );
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Blog feature payment failed:", err);
    return NextResponse.json({ error: "Could not record your payment. Please try again or contact support." }, { status: 500 });
  }
}
