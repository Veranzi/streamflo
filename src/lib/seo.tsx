/** Public address of the site, without a trailing slash. Used for canonical links and structured data. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://streamflo.avytria.com").replace(/\/+$/, "");

/** Turn a site path or a stored media value into a full URL. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

/** Plain text excerpt of stored HTML or text, for meta descriptions (about 155 characters). */
export function metaExcerpt(htmlOrText: string | null | undefined, max = 155): string {
  const text = (htmlOrText ?? "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  return text.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
}

/**
 * Structured data for search engines (schema.org JSON-LD).
 * "<" is escaped so text from the database can never close the script tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
