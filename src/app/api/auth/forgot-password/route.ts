import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { queryOne, insert } from "@/lib/db";
import { sendEmail, smtpConfigured } from "@/lib/email";
import { passwordResetEmail, googleSignInEmail } from "@/lib/email-templates";
import { isProduction, siteUrl } from "@/lib/env";
import { limitRequest } from "@/lib/rate-limit";

const NOT_CONFIGURED = "Email is not configured yet. Please contact support.";

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 *
 * Responds with the same generic message whether or not the email exists, so
 * attackers can't enumerate valid accounts. If the email exists and the user
 * isn't Google only, we generate a 1 hour reset token and email a reset link.
 *
 * In production, when SMTP is not configured, responds 503 for every request
 * (before looking the account up, so this does not reveal which emails exist).
 */
export async function POST(req: NextRequest) {
  const limited = limitRequest(req, "forgot-password", 5, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const { email } = await req.json();
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (isProduction && !smtpConfigured) {
      console.error("[forgot-password] SMTP is not configured; reset emails cannot be sent.");
      return NextResponse.json({ error: NOT_CONFIGURED }, { status: 503 });
    }

    const normalized = email.trim().toLowerCase();
    const user = await queryOne<{ id: number; password_hash: string; username: string }>(
      "SELECT id, password_hash, username FROM users WHERE LOWER(email) = ?",
      [normalized]
    );

    // Generic response either way (don't leak whether the account exists)
    const genericResponse = () => NextResponse.json({
      ok: true,
      message: "If an account exists for that email, a reset link has been sent.",
    });
    const sendFailed = (reason: string) =>
      reason === "not_configured"
        ? NextResponse.json({ error: NOT_CONFIGURED }, { status: 503 })
        : NextResponse.json({ error: "We could not send the email right now. Please try again shortly." }, { status: 503 });

    if (!user) return genericResponse();
    if (user.password_hash === "$google$") {
      // Google only account: send a friendly note via email instead of a reset link
      const tmpl = googleSignInEmail();
      const sent = await sendEmail({ to: normalized, ...tmpl });
      if (!sent.ok) return sendFailed(sent.reason);
      return genericResponse();
    }

    // Generate a 32 byte random hex token (64 chars) valid for 1 hour
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await insert(
      "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?,?,?)",
      [user.id, token, expiresAt]
    );

    const resetUrl = `${siteUrl()}/reset-password/${token}`;

    const tmpl = passwordResetEmail({ username: user.username, resetUrl, expiresInMinutes: 60 });
    const sent = await sendEmail({ to: normalized, ...tmpl });
    if (!sent.ok) return sendFailed(sent.reason);

    return genericResponse();
  } catch (err) {
    console.error("Forgot password error:", (err as Error).message);
    return NextResponse.json({ error: "Failed to send reset link. Please try again." }, { status: 500 });
  }
}
