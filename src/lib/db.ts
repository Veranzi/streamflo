import { Pool, PoolClient } from "pg";

/**
 * Postgres connection (Supabase / Neon / RDS / etc.).
 * Set DATABASE_URL — e.g. postgresql://user:pass@host:5432/dbname?sslmode=require
 */
const connectionString =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  // back-compat: build connection string from discrete vars if someone still has the old shape
  `postgresql://${process.env.DB_USER ?? "postgres"}:${process.env.DB_PASSWORD ?? ""}@${process.env.DB_HOST ?? "localhost"}:${process.env.DB_PORT ?? 5432}/${process.env.DB_NAME ?? "postgres"}`;

const useSsl =
  /sslmode=require/.test(connectionString) ||
  process.env.DB_SSL === "true" ||
  process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

export default pool;

/** Translate MySQL-style ? placeholders to Postgres $1, $2, ... */
function toPg(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export async function query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(toPg(sql), params);
  return res.rows as T[];
}

export async function queryOne<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/**
 * Run an INSERT and return the new row's id.
 * Appends `RETURNING id` if the SQL doesn't already have a RETURNING clause.
 */
export async function insert(sql: string, params: unknown[] = []): Promise<number> {
  const text = /\bRETURNING\b/i.test(sql)
    ? toPg(sql)
    : `${toPg(sql.replace(/;\s*$/, ""))} RETURNING id`;
  const res = await pool.query(text, params);
  return res.rows[0]?.id;
}

/** Execute multiple statements in a transaction. */
export async function transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function setting(key: string): Promise<string | null> {
  const row = await queryOne<Record<string, string>>("SELECT * FROM settings LIMIT 1");
  return row?.[key] ?? null;
}
