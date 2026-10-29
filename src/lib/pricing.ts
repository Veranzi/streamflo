/** School payments go to this M-Pesa paybill, with account number SCH<school id>. */
export const PAYBILL = "802200";

/** Price and length of a paid "featured" spot for a school blog post. */
export const BLOG_FEATURE_PRICE = 1000;
export const BLOG_FEATURE_DAYS = 30;

/** payments.package value for a blog featuring payment (school listing payments use "premium"). */
export const BLOG_FEATURE_PACKAGE = "blog_feature";

/**
 * SQL condition for a post that is featured right now. Admin-featured posts have no end date;
 * paid featuring ends at featured_until. `b` is the blog_posts alias.
 */
export const FEATURED_NOW_SQL = "(b.featured = TRUE AND (b.featured_until IS NULL OR b.featured_until > NOW()))";
