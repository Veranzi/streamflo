import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, query } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { current, next } = await req.json();
  if (typeof current !== "string" || typeof next !== "string") {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (next.length < 6) {
    return NextResponse.json({ error: "New password must be at least 6 characters." }, { status: 400 });
  }

  const user = await queryOne<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM users WHERE LOWER(email) = ?",
    [session.user.email.toLowerCase()]
  );
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (user.password_hash === "$google$") {
    return NextResponse.json({ error: "This account uses Google sign-in — password is managed by Google." }, { status: 400 });
  }

  const ok = await bcrypt.compare(current, user.password_hash);
  if (!ok) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });

  const newHash = await bcrypt.hash(next, 12);
  await query("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, user.id]);

  return NextResponse.json({ success: true });
}
