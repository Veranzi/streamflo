/**
 * In-memory fixed window rate limiter.
 *
 * NOTE: state lives in the memory of a single serverless instance, so on Vercel this
 * is best effort only (each warm instance keeps its own counters, and counters reset
 * on cold start). It still stops simple scripted abuse. It can be swapped for a shared
 * store such as Upstash Redis (@upstash/ratelimit) later without changing callers.
 */

import { NextResponse } from "next/server";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  buckets.forEach((b, k) => {
    if (b.resetAt <= now) buckets.delete(k);
  });
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/** Count one hit against `key` and report whether it is within `limit` per `windowMs`. */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  return {
    ok: b.count <= limit,
    remaining: Math.max(0, limit - b.count),
    retryAfterSeconds: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
  };
}

type HeaderSource = { get(name: string): string | null } | Record<string, unknown> | undefined | null;

/** Client IP: first value of x-forwarded-for, then x-real-ip, else "unknown". */
export function getClientIp(headers: HeaderSource): string {
  if (!headers) return "unknown";
  let xff: unknown;
  let real: unknown;
  if (typeof (headers as { get?: unknown }).get === "function") {
    const h = headers as { get(name: string): string | null };
    xff = h.get("x-forwarded-for");
    real = h.get("x-real-ip");
  } else {
    const h = headers as Record<string, unknown>;
    xff = h["x-forwarded-for"];
    real = h["x-real-ip"];
  }
  if (Array.isArray(xff)) xff = xff[0];
  if (typeof xff === "string" && xff.trim()) return xff.split(",")[0].trim();
  if (Array.isArray(real)) real = real[0];
  if (typeof real === "string" && real.trim()) return real.trim();
  return "unknown";
}

export const TOO_MANY_MESSAGE = "Too many attempts. Please wait a few minutes and try again.";

/**
 * Convenience for route handlers. Returns a 429 response when the limit is hit,
 * otherwise null.
 *
 *   const limited = limitRequest(req, "contact", 5, 60 * 60 * 1000);
 *   if (limited) return limited;
 */
export function limitRequest(
  req: { headers: { get(name: string): string | null } },
  route: string,
  limit: number,
  windowMs: number
): NextResponse | null {
  const ip = getClientIp(req.headers);
  const r = rateLimit(`${route}:${ip}`, limit, windowMs);
  if (r.ok) return null;
  return NextResponse.json(
    { error: TOO_MANY_MESSAGE },
    { status: 429, headers: { "Retry-After": String(r.retryAfterSeconds) } }
  );
}
