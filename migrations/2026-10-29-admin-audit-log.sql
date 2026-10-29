-- Admin activity trail: who approved, confirmed, changed or deleted what, and when.
-- Rows are only ever added. Safe to run more than once.
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id              SERIAL PRIMARY KEY,
  admin_username  VARCHAR(150) NOT NULL,
  action          VARCHAR(60)  NOT NULL,   -- e.g. school.approve, payment.confirm
  target_type     VARCHAR(40),             -- school, payment, blog_post, ...
  target_id       VARCHAR(40),
  summary         TEXT,                    -- one readable line, e.g. 'Approved school "Lakeland"'
  details         JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_admin   ON admin_audit_log (admin_username, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_target  ON admin_audit_log (target_type, target_id);

-- Like the other public tables: no access through Supabase's public data API. The website
-- connects as the table owner, which row level security does not restrict.
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;
