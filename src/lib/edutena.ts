/**
 * EduTena client — used by Streamflo server-side code (Next.js API routes and RSC).
 *
 * Users never talk to EduTena directly. Browsers hit Streamflo's `/api/ai/*` routes,
 * those routes call this client which:
 *   1. Reads the NextAuth session for the logged-in Streamflo user.
 *   2. Mints a short-lived "federation" JWT signed with the shared JWT_SECRET.
 *   3. Exchanges it at EduTena's auth-service for an EduTena JWT (caches per-session).
 *   4. Forwards the request to the EduTena gateway with the EduTena token.
 */

import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { requireEnv, requireOneOf } from "@/lib/env";

/** EduTena gateway URL. Dev falls back to localhost; production must set EDUTENA_API_URL. */
function edutenaUrl(): string {
  return requireEnv("EDUTENA_API_URL", "http://localhost:3100").replace(/\/+$/, "");
}

/** Shared secret for the federated exchange. No dev default is ever used in production. */
function sharedSecret(): string {
  return requireOneOf(["JWT_SECRET", "NEXTAUTH_SECRET"], "dev-shared-secret");
}

/** Cached EduTena tokens are reused for at most 1 hour. */
const TOKEN_CACHE_MS = 60 * 60 * 1000;

// In-process cache — rebuilt per Streamflo server process. Fine for small-medium traffic.
// For multi-instance deploys, move this to Redis or encode the EduTena token into the NextAuth JWT.
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

type StreamfloRole = "parent" | "student" | "institution" | "admin";

interface StreamfloSessionUser {
  id?: string;
  email: string;
  name: string;
  role: StreamfloRole;
  schoolId?: number;
  referralCode?: string;
}

async function loadSessionUser(): Promise<StreamfloSessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  // Pull referral + school from the Streamflo DB (session only has the basics)
  const extra = await queryOne<{ agent_code?: string; school_id?: number }>(
    `SELECT (SELECT agent_code FROM agents WHERE email = u.email LIMIT 1) AS agent_code,
            u.school_id
     FROM users u WHERE u.email = ? LIMIT 1`,
    [session.user.email]
  ).catch(() => null);

  // Role comes straight from the Streamflo DB via NextAuth. All four roles pass through
  // unchanged until the federated-exchange call maps institution → school for EduTena.
  const rawRole = session.user.role;
  const role: StreamfloRole =
    rawRole === "admin" ? "admin" :
    rawRole === "institution" ? "institution" :
    rawRole === "student" ? "student" : "parent";

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name ?? session.user.email,
    role,
    schoolId: session.user.schoolId ?? extra?.school_id,
    referralCode: extra?.agent_code ?? undefined,
  };
}

/** Streamflo role → EduTena role. Only transformation: institution → school. */
function streamfloToEdutenaRole(r: StreamfloRole): "parent" | "school" | "student" | "admin" {
  if (r === "institution") return "school";
  return r;
}

async function getEdutenaToken(user: StreamfloSessionUser, baseUrl: string): Promise<string> {
  // Role is part of the key so a role change never reuses a token minted for the old role.
  const cacheKey = `${user.email.toLowerCase()}|${user.role}|${user.schoolId ?? ""}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  // Mint a short-lived federation bearer so EduTena can trust the exchange call.
  const federationBearer = jwt.sign(
    { iss: "streamflo", sub: user.email, email: user.email, role: streamfloToEdutenaRole(user.role), scope: "federated-exchange" },
    sharedSecret(),
    { expiresIn: "5m" }
  );

  // Build payload omitting null/undefined fields — EduTena's schema rejects null on
  // optional number fields like streamflo_school_id when the user isn't tied to a school.
  const payload: Record<string, unknown> = {
    email: user.email,
    name: user.name,
    role: streamfloToEdutenaRole(user.role),
  };
  if (user.schoolId != null) payload.streamflo_school_id = user.schoolId;
  if (user.referralCode) payload.streamflo_referral_code = user.referralCode;

  const res = await fetch(`${baseUrl}/api/auth/federated-exchange`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${federationBearer}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`EduTena federated-exchange failed: ${res.status} ${text}`);
  }

  const { token } = (await res.json()) as { token: string };

  // EduTena tokens live longer than this, but we only reuse one for up to 1 hour so
  // role or plan changes are picked up quickly.
  tokenCache.set(cacheKey, { token, expiresAt: Date.now() + TOKEN_CACHE_MS });
  return token;
}

function jsonError(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { "Content-Type": "application/json" },
  });
}

/**
 * Call an EduTena endpoint on behalf of the currently logged-in Streamflo user.
 * Returns the raw Response so callers can stream / pass through status codes.
 * Errors are converted to JSON responses (no empty 500s — clients always get JSON).
 *
 * Caller is responsible for setting Content-Type when sending a body. If absent
 * and a body is present, defaults to application/json. Multipart callers MUST
 * pass the original Content-Type header (which includes the boundary).
 */
export async function edutenaFetch(path: string, init: RequestInit = {}): Promise<Response> {
  try {
    const user = await loadSessionUser();
    if (!user) return jsonError("Not authenticated", 401);

    let baseUrl: string;
    try {
      baseUrl = edutenaUrl();
      sharedSecret();
    } catch {
      return jsonError("AI service is not configured yet. Please try again later.", 503);
    }

    let token: string;
    try {
      token = await getEdutenaToken(user, baseUrl);
    } catch (err) {
      console.error("[edutena] federated-exchange failed. Check JWT_SECRET and that the gateway is running on", baseUrl, err);
      return jsonError("AI service temporarily unavailable. Please try again shortly.", 502);
    }

    // Merge headers: caller-provided wins; we just append Authorization, and add
    // a default Content-Type only when there's a body and the caller didn't supply one.
    const callerHeaders = new Headers(init.headers ?? {});
    callerHeaders.set("Authorization", `Bearer ${token}`);
    if (init.body && !callerHeaders.has("Content-Type")) {
      callerHeaders.set("Content-Type", "application/json");
    }

    try {
      return await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: callerHeaders,
      });
    } catch (err) {
      console.error("[edutena] upstream fetch failed. Is the gateway running at", baseUrl, err);
      return jsonError("AI service temporarily unavailable. Please try again shortly.", 502);
    }
  } catch (err) {
    console.error("[edutena] unexpected error:", err);
    return jsonError("AI service error. Please try again shortly.", 500);
  }
}

/**
 * Forward a Next.js Request to EduTena and relay the response.
 *
 * IMPORTANT: we MUST buffer the upstream response body before returning a new Response.
 * Returning the upstream Response object directly works in some Node runtimes but on
 * Vercel's serverless platform the streamed body is sometimes lost mid-flight, leaving
 * the client with the right status code but an empty body. Buffering avoids that.
 *
 * Preserves Content-Type (critical for multipart boundaries) on the way in, and forwards
 * the upstream Content-Type back so JSON responses parse correctly in the browser.
 */
export async function proxyToEdutena(req: Request, targetPath: string): Promise<Response> {
  const init: RequestInit = { method: req.method };

  if (req.method !== "GET" && req.method !== "HEAD") {
    const ct = req.headers.get("content-type");
    init.body = new Uint8Array(await req.arrayBuffer());
    if (ct) init.headers = { "Content-Type": ct };
  }

  const upstream = await edutenaFetch(targetPath, init);

  // Buffer the body so it survives Vercel's serverless response pipeline.
  const bodyBytes = new Uint8Array(await upstream.arrayBuffer());

  // Forward the relevant headers (Content-Type for parsing, Cache-Control if set).
  const headers = new Headers();
  const ct = upstream.headers.get("content-type");
  if (ct) headers.set("Content-Type", ct);
  const cc = upstream.headers.get("cache-control");
  if (cc) headers.set("Cache-Control", cc);

  return new Response(bodyBytes, { status: upstream.status, headers });
}
