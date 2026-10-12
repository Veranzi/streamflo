-- Blog comment moderation: new comments are hidden until an admin approves them.
-- Existing comments stay visible (approved = TRUE). Safe to run more than once.
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'blog_comments' AND column_name = 'approved'
  ) THEN
    ALTER TABLE blog_comments ADD COLUMN approved BOOLEAN NOT NULL DEFAULT FALSE;
    -- Only on first run, so later runs never re-approve comments an admin unapproved.
    UPDATE blog_comments SET approved = TRUE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_blog_comments_post_approved ON blog_comments (post_id, approved);

COMMIT;
