import { NextRequest, NextResponse } from "next/server";

/**
 * Send visitors on the production *.vercel.app address to the real domain, so search
 * engines see one copy of the site. Preview deployments keep their own addresses.
 */
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://streamflo.avytria.com").replace(/\/+$/, "");
const CANONICAL_HOST = new URL(SITE_URL).host;

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const isGetLike = req.method === "GET" || req.method === "HEAD";
  if (
    isGetLike &&
    process.env.VERCEL_ENV === "production" &&
    host.endsWith(".vercel.app") &&
    host !== CANONICAL_HOST
  ) {
    const target = new URL(req.nextUrl.pathname + req.nextUrl.search, SITE_URL);
    return NextResponse.redirect(target, 308);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
