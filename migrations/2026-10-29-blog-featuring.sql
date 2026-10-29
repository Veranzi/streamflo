-- Paid featuring of school blog posts (KES 1,000 for 30 days, confirmed by an admin).
-- featured_until: when paid featuring ends; NULL = featured by an admin with no end date.
-- payments.blog_post_id: the post a "blog_feature" payment is for. Safe to run more than once.
BEGIN;

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS featured_until TIMESTAMPTZ;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS blog_post_id INTEGER REFERENCES blog_posts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_payments_blog_post ON payments(blog_post_id);

COMMIT;
