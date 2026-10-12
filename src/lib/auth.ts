import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { queryOne, query } from "./db";
import { isProduction } from "./env";
import { rateLimit, getClientIp, TOO_MANY_MESSAGE } from "./rate-limit";

if (isProduction && !process.env.NEXTAUTH_SECRET) {
  console.error(
    "[auth] NEXTAUTH_SECRET is not set. Sign in is disabled in production until it is configured in the hosting environment."
  );
}

/** How often (ms) the jwt callback re-reads the user's role from the database. */
const ROLE_REFRESH_MS = 5 * 60 * 1000;

/** Only these roles may be self assigned through the Google sign up cookie. */
const GOOGLE_SELF_SERVICE_ROLES = new Set(["parent", "student"]);

const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

type DbUser = {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  role: "parent" | "student" | "institution" | "admin";
  school_id: number | null;
  password_hash: string;
};

type DbAdmin = { id: number; username: string; password_hash: string };

/**
 * Unified login / sign-up.
 *  - CredentialsProvider: email + bcrypt for parent/student/institution; falls back to admins table.
 *  - GoogleProvider: one-click sign-in. First-time Google users get auto-provisioned in `users`,
 *    with their role taken from a `pending_signup_role` cookie (set by /signup/parent or /signup/student).
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;
        const identifier = credentials.email.trim().toLowerCase();

        // 10 attempts per 15 minutes per IP + identifier (best effort, see rate-limit.ts)
        const ip = getClientIp(req?.headers as Record<string, unknown> | undefined);
        const rl = rateLimit(`login:${ip}:${identifier}`, 10, 15 * 60 * 1000);
        if (!rl.ok) throw new Error(TOO_MANY_MESSAGE);

        const user = await queryOne<DbUser>(
          `SELECT id, username, email, phone, role, school_id, password_hash
           FROM users WHERE LOWER(email) = ?`,
          [identifier]
        ).catch(() => null);

        if (user) {
          const ok = await bcrypt.compare(credentials.password, user.password_hash);
          if (!ok) return null;
          return {
            id: String(user.id),
            name: user.username,
            email: user.email,
            role: user.role,
            schoolId: user.school_id ?? undefined,
          };
        }

        const admin = await queryOne<DbAdmin>(
          "SELECT id, username, password_hash FROM admins WHERE username = ?",
          [credentials.email]
        ).catch(() => null);

        if (admin) {
          const ok = await bcrypt.compare(credentials.password, admin.password_hash);
          if (!ok) return null;
          return {
            id: String(admin.id),
            name: admin.username,
            email: `${admin.username}@streamflo.local`,
            role: "admin" as const,
          };
        }

        return null;
      },
    }),

    // Only register Google when configured. Avoids `client_id is required` crashes
    // when the env vars are missing.
    ...(googleConfigured
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        })]
      : []),
  ],

  callbacks: {
    /**
     * For Google sign-ins: ensure a row exists in the `users` table.
     * Role comes from the `pending_signup_role` cookie set by /signup/parent or /signup/student.
     * If no cookie (e.g. user came via /login), default to 'parent'.
     */
    async signIn({ user, account }) {
      if (account?.provider !== "google" || !user.email) return true;
      if (isProduction && !process.env.NEXTAUTH_SECRET) return false;

      const email = user.email.toLowerCase();
      const existing = await queryOne<{ id: number }>(
        "SELECT id FROM users WHERE LOWER(email) = ?",
        [email]
      ).catch(() => null);

      if (!existing) {
        const cookieStore = cookies();
        const pendingRole = cookieStore.get("pending_signup_role")?.value ?? "";
        // Only parent or student may be chosen by the browser. Institutions register
        // through /register and need admin approval, so that role is never granted here.
        const role = GOOGLE_SELF_SERVICE_ROLES.has(pendingRole) ? pendingRole : "parent";

        await query(
          `INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)`,
          [user.name ?? email, email, "$google$", role]
        );
      }
      return true;
    },

    /**
     * Populate the JWT with role/schoolId from DB.
     * For credentials login this is set on `user`; for Google we look it up by email.
     * The role is re-read from the DB at most every 5 minutes so role changes
     * (or removed accounts) take effect without a fresh sign in.
     */
    async jwt({ token, user }) {
      const now = Date.now();
      if (user) {
        token.role = user.role;
        token.schoolId = user.schoolId;
        token.roleCheckedAt = now;
      }

      const lastChecked = typeof token.roleCheckedAt === "number" ? token.roleCheckedAt : 0;
      const stale = now - lastChecked > ROLE_REFRESH_MS;
      if (!token.email || !(stale || !token.role || !token.sub)) return token;

      try {
        const email = String(token.email).toLowerCase();
        if (token.role === "admin" && email.endsWith("@streamflo.local")) {
          // Admins from the admins table get the email `${username}@streamflo.local`.
          const username = String(token.name ?? email.replace(/@streamflo\.local$/, ""));
          const admin = await queryOne<{ id: number }>(
            "SELECT id FROM admins WHERE username = ?",
            [username]
          );
          if (!admin) {
            token.role = undefined;
            token.schoolId = undefined;
          }
        } else {
          const dbUser = await queryOne<{ id: number; role: DbUser["role"]; school_id: number | null }>(
            "SELECT id, role, school_id FROM users WHERE LOWER(email) = ?",
            [email]
          );
          if (dbUser) {
            token.sub = String(dbUser.id);
            token.role = dbUser.role;
            token.schoolId = dbUser.school_id ?? undefined;
          } else if (token.role) {
            // Account removed: drop privileges.
            token.role = undefined;
            token.schoolId = undefined;
          }
        }
        token.roleCheckedAt = now;
      } catch (err) {
        // DB unavailable: keep the current claims and retry on the next request.
        console.error("[auth] role refresh failed:", (err as Error).message);
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
        session.user.schoolId = token.schoolId;
      }
      return session;
    },
  },

  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
