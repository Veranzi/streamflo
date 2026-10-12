import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";

/**
 * Shared helpers for the school (institution) dashboard.
 * The link between a user and their school is users.school_id. We always read it from the
 * database (not the JWT) so a stale token can never point at another school.
 */

export type OwnSchool = {
  userId: number;
  schoolId: number | null;
  school: { id: number; name: string; approved: boolean; package: string | null } | null;
};

export const PAID_PACKAGES = ["premium", "enterprise"];
export const MAX_PHOTOS = 12;

export function isPaid(pkg: string | null | undefined) {
  return PAID_PACKAGES.includes(String(pkg ?? "").toLowerCase());
}

/** Resolve the signed in institution user and their school. Returns null if not allowed. */
export async function getOwnSchool(): Promise<OwnSchool | null | "forbidden"> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if (session.user.role !== "institution") return "forbidden";
  const userId = Number(session.user.id);
  if (!Number.isInteger(userId) || userId <= 0) return "forbidden";

  const user = await queryOne<{ id: number; school_id: number | null }>(
    "SELECT id, school_id FROM users WHERE id = ? AND role = 'institution'",
    [userId]
  );
  if (!user) return "forbidden";
  if (!user.school_id) return { userId, schoolId: null, school: null };

  const school = await queryOne<{ id: number; name: string; approved: boolean; package: string | null }>(
    "SELECT id, name, approved, package FROM schools WHERE id = ?",
    [user.school_id]
  );
  return { userId, schoolId: school ? school.id : null, school };
}

/**
 * For API routes. Returns either the owner context (with a school) or a ready JSON error.
 */
export async function requireOwnSchoolApi(): Promise<
  { ok: true; ctx: OwnSchool & { schoolId: number; school: NonNullable<OwnSchool["school"]> } } | { ok: false; res: NextResponse }
> {
  let own: Awaited<ReturnType<typeof getOwnSchool>>;
  try {
    own = await getOwnSchool();
  } catch (err) {
    console.error("Dashboard auth lookup failed:", err);
    return { ok: false, res: NextResponse.json({ error: "Could not load your account. Please try again." }, { status: 500 }) };
  }
  if (own === null) return { ok: false, res: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
  if (own === "forbidden") return { ok: false, res: NextResponse.json({ error: "Only school accounts can do this." }, { status: 403 }) };
  if (!own.schoolId || !own.school) {
    return { ok: false, res: NextResponse.json({ error: "No school is linked to this account." }, { status: 404 }) };
  }
  return { ok: true, ctx: { ...own, schoolId: own.schoolId, school: own.school } };
}

/** For server pages under /dashboard. Redirects when the visitor is not a school account. */
export async function requireInstitutionPage(path: string): Promise<OwnSchool> {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect(`/login?callbackUrl=${encodeURIComponent(path)}`);
  if (session.user.role === "admin") redirect("/admin");
  if (session.user.role !== "institution") redirect("/account");
  let own: Awaited<ReturnType<typeof getOwnSchool>> = null;
  try {
    own = await getOwnSchool();
  } catch (err) {
    console.error("Dashboard page auth lookup failed:", err);
    // Database unavailable: let the client page show its own error state.
    return { userId: Number(session.user.id), schoolId: session.user.schoolId ?? null, school: null };
  }
  if (own === null) redirect(`/login?callbackUrl=${encodeURIComponent(path)}`);
  if (own === "forbidden") redirect("/account");
  return own;
}
