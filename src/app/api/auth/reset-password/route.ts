import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne, query } from "@/lib/db";

/**
 * POST /api/auth/reset-password
 * Body: { token, password }
 *
 * Verifies the token is valid (exists, not used, not expired), then updates the
 * user's password_hash and marks the token used.
 */
export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (typeof token !== "string" || !token) {
      return NextResponse.json({ error: "Reset token is required." }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    const row = await queryOne<{ id: number; user_id: number; expires_at: string; used_at: string | null }>(
      "SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token = ?",
      [token]
    );

    if (!row) return NextResponse.json({ error: "Invalid reset link." }, { status: 400 });
    if (row.used_at) return NextResponse.json({ error: "This reset link was already used." }, { status: 400 });
    if (new Date(row.expires_at) < new Date()) {
      return NextResponse.json({ error: "This reset link has expired. Request a new one." }, { status: 400 });
    }

    const newHash = await bcrypt.hash(password, 12);
    await query("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, row.user_id]);
    await query("UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?", [row.id]);

    return NextResponse.json({ ok: true, message: "Password updated. You can now sign in." });
  } catch (err) {
    console.error("Reset password error:", err);
    return NextResponse.json({ error: "Failed to reset password. Please try again." }, { status: 500 });
  }
}

/**
 * GET /api/auth/reset-password?token=xxx
 * Quick token validity check used by the reset page on load — so we can show an
 * "expired or invalid" state before the user types a new password.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ valid: false, reason: "missing" });

  const row = await queryOne<{ expires_at: string; used_at: string | null }>(
    "SELECT expires_at, used_at FROM password_reset_tokens WHERE token = ?",
    [token]
  );

  if (!row) return NextResponse.json({ valid: false, reason: "not_found" });
  if (row.used_at) return NextResponse.json({ valid: false, reason: "used" });
  if (new Date(row.expires_at) < new Date()) return NextResponse.json({ valid: false, reason: "expired" });
  return NextResponse.json({ valid: true });
}
