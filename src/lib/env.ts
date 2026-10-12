/**
 * Small environment helpers.
 *
 * Rule: in production we never fall back to development defaults for secrets or
 * URLs that point at localhost. A missing variable must not crash the whole site;
 * instead the feature that needs it fails closed (logs a clear line and throws
 * when it is actually used, so the route can return a 503/500 JSON error).
 */

export const isProduction = process.env.NODE_ENV === "production";

export const DEFAULT_SITE_URL = "https://streamflo.avytria.com";
export const DEFAULT_SUPPORT_EMAIL = "info@streamflo.co.ke";

function stripSlash(u: string): string {
  return u.replace(/\/+$/, "");
}

/** Public base URL of the website, without a trailing slash. */
export function siteUrl(): string {
  const v = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL;
  return stripSlash(v);
}

/** Support email shown to users. */
export function supportEmail(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL || DEFAULT_SUPPORT_EMAIL;
}

/** Where contact form notifications are sent. */
export function contactNotifyEmail(): string {
  return process.env.CONTACT_NOTIFY_EMAIL || supportEmail();
}

export class MissingEnvError extends Error {
  constructor(public readonly envName: string) {
    super(`Missing required environment variable ${envName}`);
    this.name = "MissingEnvError";
  }
}

/**
 * Read a required env var. Call this lazily (inside the function that needs it),
 * never at module load, so a missing var only breaks that one feature.
 *
 * In production: logs and throws MissingEnvError when missing.
 * In development: returns `devFallback` when given (with a warning), else throws.
 */
export function requireEnv(name: string, devFallback?: string): string {
  const v = process.env[name];
  if (v) return v;
  if (!isProduction && devFallback !== undefined) {
    console.warn(`[env] ${name} is not set, using development fallback.`);
    return devFallback;
  }
  console.error(`[env] ${name} is not set. The feature that needs it is disabled until it is configured.`);
  throw new MissingEnvError(name);
}

/** First env var that is set among `names`, with the same semantics as requireEnv. */
export function requireOneOf(names: string[], devFallback?: string): string {
  for (const n of names) {
    const v = process.env[n];
    if (v) return v;
  }
  if (!isProduction && devFallback !== undefined) {
    console.warn(`[env] none of ${names.join(", ")} is set, using development fallback.`);
    return devFallback;
  }
  console.error(`[env] none of ${names.join(", ")} is set. The feature that needs it is disabled until it is configured.`);
  throw new MissingEnvError(names[0]);
}

/**
 * Only allow internal relative paths for post login redirects (prevents open redirects).
 * Accepts values starting with "/" but not "//" or "/\"; anything else becomes "/".
 */
export function safeCallbackUrl(value: string | null | undefined, fallback = "/"): string {
  if (typeof value !== "string" || !value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
