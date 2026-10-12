// Safe to import from client components (no Node APIs).

/**
 * Turn a stored image value into something an <img src> can use.
 * Handles full URLs, "/uploads/..." paths, and legacy bare file names (which lived in
 * `legacyFolder`, e.g. "blog" for blog_posts.featured_image).
 */
export function mediaUrl(value: string | null | undefined, legacyFolder: string): string | null {
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || value.startsWith("/")) return value;
  return `/uploads/${legacyFolder}/${value}`;
}
