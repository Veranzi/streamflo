-- Streamflo Postgres schema (run in Supabase SQL editor or any Postgres DB)
-- Database is created by Supabase automatically; just paste this into the SQL editor and run.

-- ============================================
-- SCHOOLS
-- ============================================
CREATE TABLE IF NOT EXISTS schools (
  id              SERIAL PRIMARY KEY,
  name            VARCHAR(255) NOT NULL,
  type            VARCHAR(50),
  ownership       VARCHAR(50),
  curriculum      VARCHAR(50),
  boarding        VARCHAR(50),
  gender          VARCHAR(50),
  county          VARCHAR(100),
  subcounty       VARCHAR(150),
  lat             NUMERIC(10,7),
  lng             NUMERIC(10,7),
  phone           VARCHAR(50),
  email           VARCHAR(150),
  website         VARCHAR(255),
  description     TEXT,
  facilities      TEXT,
  package         VARCHAR(50) DEFAULT 'free',
  featured        BOOLEAN DEFAULT FALSE,
  approved        BOOLEAN DEFAULT FALSE,
  agent_id        INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_schools_approved ON schools(approved);
CREATE INDEX IF NOT EXISTS idx_schools_county   ON schools(county);
CREATE INDEX IF NOT EXISTS idx_schools_featured ON schools(featured);

CREATE TABLE IF NOT EXISTS school_photos (
  id          SERIAL PRIMARY KEY,
  school_id   INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  filename    VARCHAR(255) NOT NULL,
  caption     VARCHAR(255),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS (parents, students, institutions, admins)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(100) NOT NULL,
  email           VARCHAR(150) UNIQUE NOT NULL,
  phone           VARCHAR(50),
  password_hash   VARCHAR(255) NOT NULL,
  role            VARCHAR(20) NOT NULL DEFAULT 'parent'
                  CHECK (role IN ('parent','student','institution','admin')),
  school_id       INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  student_grade   SMALLINT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS admins (
  id              SERIAL PRIMARY KEY,
  username        VARCHAR(100) UNIQUE NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  email             VARCHAR(150),
  phone             VARCHAR(50),
  agent_code        VARCHAR(50) UNIQUE NOT NULL,
  commission_rate   NUMERIC(5,2) DEFAULT 20.00,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BLOG
-- ============================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id              SERIAL PRIMARY KEY,
  title           VARCHAR(255) NOT NULL,
  content         TEXT,
  featured_image  VARCHAR(255),
  school_id       INTEGER REFERENCES schools(id) ON DELETE SET NULL,
  featured        BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_blog_featured ON blog_posts(featured);

CREATE TABLE IF NOT EXISTS blog_comments (
  id            SERIAL PRIMARY KEY,
  post_id       INTEGER NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  author_name   VARCHAR(100) NOT NULL,
  content       TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ANNOUNCEMENTS, EVENTS, CONTACT
-- ============================================
CREATE TABLE IF NOT EXISTS announcements (
  id          SERIAL PRIMARY KEY,
  message     VARCHAR(500) NOT NULL,
  active      BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id            SERIAL PRIMARY KEY,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  school_id     INTEGER REFERENCES schools(id) ON DELETE CASCADE,
  active        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NOT NULL,
  phone       VARCHAR(50),
  message     TEXT NOT NULL,
  handled     BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PAYMENTS, SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id            SERIAL PRIMARY KEY,
  school_id     INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  amount        NUMERIC(10,2) NOT NULL,
  package       VARCHAR(50),
  method        VARCHAR(50),
  reference     VARCHAR(100),
  status        VARCHAR(50) DEFAULT 'pending',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings (
  id              SERIAL PRIMARY KEY,
  site_name       VARCHAR(150) DEFAULT 'Streamflo',
  premium_price   NUMERIC(10,2) DEFAULT 1250.00,
  commission_rate NUMERIC(5,2) DEFAULT 20.00,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SEED
-- ============================================
-- Default admin (CHANGE THE PASSWORD HASH BEFORE PROD).
-- This bcrypt hash is for "admin123" — generated with bcrypt.hash('admin123', 12)
INSERT INTO admins (username, password_hash) VALUES
  ('admin', '$2a$12$u2zXAQfe.DPBk9HmrKW.8u9CYxzc6SUnoPjkJ3eEZ5Ba7xqzPZy5W')
ON CONFLICT (username) DO NOTHING;

INSERT INTO settings (site_name) VALUES ('Streamflo')
ON CONFLICT DO NOTHING;
