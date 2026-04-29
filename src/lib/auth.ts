import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { queryOne } from "./db";
import pool from "./db";

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const identifier = credentials.email.trim().toLowerCase();

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
            email: credentials.email,
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

      const email = user.email.toLowerCase();
      const existing = await queryOne<{ id: number }>(
        "SELECT id FROM users WHERE LOWER(email) = ?",
        [email]
      ).catch(() => null);

      if (!existing) {
        const cookieStore = cookies();
        const pendingRole = cookieStore.get("pending_signup_role")?.value;
        const role = pendingRole === "student" ? "student"
                   : pendingRole === "institution" ? "institution"
                   : "parent";

        const conn = await pool.getConnection();
        try {
          await conn.execute(
            `INSERT INTO users (username, email, password_hash, role) VALUES (?,?,?,?)`,
            [user.name ?? email, email, "$google$", role]
          );
        } finally {
          conn.release();
        }
      }
      return true;
    },

    /**
     * Populate the JWT with role/schoolId from DB.
     * For credentials login this is set on `user`; for Google we look it up by email.
     */
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as Record<string, unknown>).role as DbUser["role"] | undefined;
        token.schoolId = (user as Record<string, unknown>).schoolId as number | undefined;
      }

      // Always ensure role is fresh from DB if missing or stale (Google flow, or role updated)
      if (token.email && (!token.role || !token.sub)) {
        const dbUser = await queryOne<{ id: number; role: DbUser["role"]; school_id: number | null }>(
          "SELECT id, role, school_id FROM users WHERE LOWER(email) = ?",
          [String(token.email).toLowerCase()]
        ).catch(() => null);
        if (dbUser) {
          token.sub = String(dbUser.id);
          token.role = dbUser.role;
          token.schoolId = dbUser.school_id ?? undefined;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub;
        (session.user as Record<string, unknown>).role = token.role;
        (session.user as Record<string, unknown>).schoolId = token.schoolId;
      }
      return session;
    },
  },

  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
