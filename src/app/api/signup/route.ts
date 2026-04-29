import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne, insert } from "@/lib/db";

/**
 * Parent / student self-service signup.
 * Schools go through /api/register (different flow — collects school details).
 * Admins are seeded in schema.sql and not self-serviceable.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const role = body.role === "student" ? "student" : body.role === "parent" ? "parent" : null;
    if (!role) return NextResponse.json({ error: "Invalid role. Must be 'parent' or 'student'." }, { status: 400 });

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = body.phone ? String(body.phone).trim() : null;
    const password = String(body.password ?? "");
    const grade = role === "student" && body.grade ? Number(body.grade) : null;

    if (!name) return NextResponse.json({ error: "Name is required." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    if (grade !== null && (grade < 1 || grade > 12)) {
      return NextResponse.json({ error: "Grade must be between 1 and 12." }, { status: 400 });
    }

    const existing = await queryOne<{ id: number }>(
      "SELECT id FROM users WHERE LOWER(email) = ?",
      [email]
    );
    if (existing) {
      return NextResponse.json({ error: "This email is already registered. Try signing in instead." }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const id = await insert(
      `INSERT INTO users (username, email, phone, password_hash, role, student_grade)
       VALUES (?,?,?,?,?,?)`,
      [name, email, phone, password_hash, role, grade]
    );

    return NextResponse.json({ success: true, user: { id, email, name, role } });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "Sign up failed. Please try again." }, { status: 500 });
  }
}
