import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { queryOne, insert } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { passwordResetEmail, googleSignInEmail } from "@/lib/email-templates";

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 *
 * Always responds 200 with the same message, whether or not the email exists,
 * so attackers can't enumerate valid accounts. If the email exists and the user
 * isn't Google-only, we generate a 1-hour reset token and email a reset link.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const normalized = email.trim().toLowerCase();
    const user = await queryOne<{ id: number; password_hash: string; username: string }>(
      "SELECT id, password_hash, username FROM users WHERE LOWER(email) = ?",
      [normalized]
    );

    // Generic response either way (don't leak whether the account exists)
    const genericResponse = NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });

    if (!user) return genericResponse;
    if (user.password_hash === "$google$") {
      // Google-only account: send a friendly note via email instead of a reset link
      const tmpl = googleSignInEmail();
      await sendEmail({ to: normalized, ...tmpl });
      return genericResponse;
    }

    // Generate a 32-byte random hex token (64 chars) valid for 1 hour
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await insert(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?,?,?)",
      [user.id, token, expiresAt]
    );

    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password/${token}`;

    const tmpl = passwordResetEmail({ username: user.username, resetUrl, expiresInMinutes: 60 });
    await sendEmail({ to: normalized, ...tmpl });

    return genericResponse;
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Failed to send reset link. Please try again." }, { status: 500 });
  }
}
