import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { queryOne, insert } from "@/lib/db";
import { sendEmail } from "@/lib/email";

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
      await sendEmail({
        to: normalized,
        subject: "Streamflo — sign in with Google",
        text: "You requested a password reset, but your Streamflo account uses Google sign-in. " +
              "Just use the 'Continue with Google' button on the login page — no password needed.",
        html: `<p>You requested a password reset, but your Streamflo account uses <strong>Google sign-in</strong>.</p>
               <p>Just use the <strong>Continue with Google</strong> button on the login page — no password needed.</p>`,
      });
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

    await sendEmail({
      to: normalized,
      subject: "Reset your Streamflo password",
      text: `Hi ${user.username},\n\nClick the link below to reset your Streamflo password. It expires in 1 hour:\n\n${resetUrl}\n\nIf you didn't request this, ignore this email.`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 480px;">
          <h2 style="color: #1d4ed8;">Reset your Streamflo password</h2>
          <p>Hi ${user.username},</p>
          <p>Click the button below to reset your password. The link expires in <strong>1 hour</strong>.</p>
          <p style="margin: 24px 0;">
            <a href="${resetUrl}" style="background: #1d4ed8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">Reset password</a>
          </p>
          <p style="color: #64748b; font-size: 14px;">Or copy this URL into your browser:<br><a href="${resetUrl}">${resetUrl}</a></p>
          <p style="color: #64748b; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
        </div>`,
    });

    return genericResponse;
  } catch (err) {
    console.error("Forgot password error:", err);
    return NextResponse.json({ error: "Failed to send reset link. Please try again." }, { status: 500 });
  }
}
