#!/usr/bin/env node
/**
 * Set (or reset) an admin's password in the admins table.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... node scripts/set-admin-password.mjs <ADMIN_USERNAME> <NEW_PASSWORD> [--create]
 *
 *   --create   insert the admin if no row with that username exists yet
 *
 * The password is hashed with bcrypt (cost 12). Nothing is printed except the result.
 * Tip: put a space before the command so the password is not saved in shell history.
 */
import bcrypt from "bcryptjs";
import pg from "pg";

const args = process.argv.slice(2);
const create = args.includes("--create");
const [username, password] = args.filter((a) => a !== "--create");

if (!username || !password) {
  console.error("Usage: node scripts/set-admin-password.mjs <ADMIN_USERNAME> <NEW_PASSWORD> [--create]");
  process.exit(1);
}
if (password.length < 12) {
  console.error("Please use an admin password of at least 12 characters.");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const useSsl = /sslmode=require/.test(connectionString) || !/localhost|127\.0\.0\.1/.test(connectionString);
const client = new pg.Client({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

try {
  const hash = await bcrypt.hash(password, 12);
  await client.connect();
  const res = await client.query("UPDATE admins SET password_hash = $1 WHERE username = $2", [hash, username]);
  if (res.rowCount === 0) {
    if (!create) {
      console.error(`No admin named "${username}". Run again with --create to add it.`);
      process.exitCode = 1;
    } else {
      await client.query("INSERT INTO admins (username, password_hash) VALUES ($1, $2)", [username, hash]);
      console.log(`Admin "${username}" created.`);
    }
  } else {
    console.log(`Password updated for admin "${username}".`);
  }
} catch (err) {
  console.error("Failed:", err.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
