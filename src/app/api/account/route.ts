import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne, query } from "@/lib/db";

interface DbUser {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  role: "parent" | "student" | "institution" | "admin";
  student_grade: number | null;
  school_id: number | null;
  password_hash: string;
  created_at: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await queryOne<DbUser>(
    `SELECT id, username, email, phone, role, student_grade, school_id, password_hash, created_at
     FROM users WHERE LOWER(email) = ?`,
    [session.user.email.toLowerCase()]
  );
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Fetch lightweight stats for parent/student dashboards
  let stats = { chats: 0, predictions: 0, subscriptions: 0 };
  if (user.role === "parent" || user.role === "student") {
    try {
      const edutenaUser = await queryOne<{ id: number }>(
        `SELECT id FROM edutena.users WHERE LOWER(email) = ?`,
        [user.email.toLowerCase()]
      );
      if (edutenaUser) {
        const [c, p, s] = await Promise.all([
          queryOne<{ c: number }>(`SELECT COUNT(*)::int AS c FROM edutena.conversations WHERE user_id = ?`, [edutenaUser.id]),
          queryOne<{ c: number }>(`SELECT COUNT(*)::int AS c FROM edutena.predictions WHERE user_id = ?`, [edutenaUser.id]),
          queryOne<{ c: number }>(`SELECT COUNT(*)::int AS c FROM edutena.subscriptions WHERE user_id = ?`, [edutenaUser.id]),
        ]);
        stats = { chats: Number(c?.c ?? 0), predictions: Number(p?.c ?? 0), subscriptions: Number(s?.c ?? 0) };
      }
    } catch { /* edutena schema may not exist yet — fall through with zeros */ }
  }

  return NextResponse.json({
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    role: user.role,
    student_grade: user.student_grade,
    school_id: user.school_id,
    created_at: user.created_at,
    has_password: user.password_hash !== "$google$",
    stats,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const username = typeof body.username === "string" ? body.username.trim() : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() : (body.phone === null ? null : undefined);
  const grade = body.student_grade !== undefined ? (body.student_grade === null ? null : Number(body.student_grade)) : undefined;

  if (username !== null && !username) {
    return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
  }
  if (grade !== undefined && grade !== null && (grade < 1 || grade > 12)) {
    return NextResponse.json({ error: "Grade must be between 1 and 12." }, { status: 400 });
  }

  const sets: string[] = [];
  const params: unknown[] = [];
  if (username !== null) { sets.push("username = ?"); params.push(username); }
  if (phone !== undefined) { sets.push("phone = ?"); params.push(phone); }
  if (grade !== undefined) { sets.push("student_grade = ?"); params.push(grade); }

  if (sets.length === 0) return NextResponse.json({ updated: false });

  params.push(session.user.email.toLowerCase());
  await query(`UPDATE users SET ${sets.join(", ")} WHERE LOWER(email) = ?`, params);

  return NextResponse.json({ updated: true });
}
