import type { MetadataRoute } from "next";
import { query } from "@/lib/db";

export const revalidate = 3600;

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://streamflo.avytria.com").replace(/\/+$/, "");

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }[] = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/directory", priority: 0.9, changeFrequency: "daily" },
  { path: "/ai", priority: 0.8, changeFrequency: "weekly" },
  { path: "/ai/notes", priority: 0.8, changeFrequency: "weekly" },
  { path: "/blog", priority: 0.7, changeFrequency: "daily" },
  { path: "/contact", priority: 0.5, changeFrequency: "monthly" },
  { path: "/register", priority: 0.6, changeFrequency: "monthly" },
  { path: "/signup", priority: 0.5, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path === "/" ? "" : r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  try {
    const schools = await query<{ id: number }>(
      "SELECT id FROM schools WHERE approved = TRUE ORDER BY id"
    );
    for (const s of schools) {
      entries.push({ url: `${SITE_URL}/profile/${s.id}`, changeFrequency: "weekly", priority: 0.6 });
    }
  } catch (err) {
    console.error("[sitemap] could not load schools:", (err as Error).message);
  }

  try {
    const posts = await query<{ id: number; created_at: string | Date | null }>(
      "SELECT id, created_at FROM blog_posts ORDER BY created_at DESC"
    );
    for (const p of posts) {
      entries.push({
        url: `${SITE_URL}/blog/${p.id}`,
        lastModified: p.created_at ? new Date(p.created_at) : undefined,
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  } catch (err) {
    console.error("[sitemap] could not load blog posts:", (err as Error).message);
  }

  return entries;
}
