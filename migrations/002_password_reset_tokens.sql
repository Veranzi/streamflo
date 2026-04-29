-- Migration 002: password reset tokens.
-- Run this in your Supabase SQL editor.

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id          SERIAL PRIMARY KEY,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prt_token   ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_prt_user    ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_prt_expires ON password_reset_tokens(expires_at);
