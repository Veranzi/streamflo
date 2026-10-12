import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, insert } from "@/lib/db";
import { getOwnSchool } from "../_school";

/**
 * A school editing its own listing. Only the columns below can be changed here.
 * approved, featured, package and agent_id are admin controlled and are never written.
 */
const TEXT_FIELDS: Record<string, number> = {
  name: 255,
  type: 50,
  ownership: 50,
  curriculum: 50,
  boarding: 50,
  gender: 50,
  county: 100,
  subcounty: 150,
  phone: 50,
  email: 150,
  website: 255,
  description: 5000,
  facilities: 2000,
};

const SELECT_COLS =
  "id, name, type, ownership, curriculum, boarding, gender, county, subcounty, lat, lng, phone, email, website, description, facilities, package, featured, approved";

async function auth() {
  try {
    const own = await getOwnSchool();
    if (own === null) return { res: NextResponse.json({ error: "Please sign in." }, { status: 401 }) };
    if (own === "forbidden") return { res: NextResponse.json({ error: "Only school accounts can do this." }, { status: 403 }) };
    return { own };
  } catch (err) {
    console.error("Dashboard profile auth failed:", err);
    return { res: NextResponse.json({ error: "Could not load your account. Please try again." }, { status: 500 }) };
  }
}

export async function GET() {
  const a = await auth();
  if (!a.own) return a.res;
  if (!a.own.schoolId) return NextResponse.json({ school: null });
  try {
    const school = await queryOne(`SELECT ${SELECT_COLS} FROM schools WHERE id = ?`, [a.own.schoolId]);
    return NextResponse.json({ school });
  } catch (err) {
    console.error("Dashboard profile GET failed:", err);
    return NextResponse.json({ error: "Could not load your school profile." }, { status: 500 });
  }
}

function cleanCoord(v: unknown, min: number, max: number): number | null | "bad" {
  if (v === null || v === undefined || String(v).trim() === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || n > max) return "bad";
  return Math.round(n * 1e7) / 1e7;
}

export async function PUT(req: NextRequest) {
  const a = await auth();
  if (!a.own) return a.res;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const values: Record<string, string | number | null> = {};
  for (const [key, max] of Object.entries(TEXT_FIELDS)) {
    if (!(key in body)) continue;
    const raw = body[key];
    const s = raw === null || raw === undefined ? "" : String(raw).trim();
    if (s.length > max) return NextResponse.json({ error: `The ${key} field is too long.` }, { status: 400 });
    values[key] = s === "" ? null : s;
  }

  if ("name" in values && !values.name) {
    return NextResponse.json({ error: "School name is required." }, { status: 400 });
  }
  if ("county" in values && !values.county) {
    return NextResponse.json({ error: "County is required." }, { status: 400 });
  }
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.email))) {
    return NextResponse.json({ error: "Please enter a valid school email." }, { status: 400 });
  }
  if (values.website) {
    let w = String(values.website);
    if (!/^https?:\/\//i.test(w)) w = `https://${w}`;
    try {
      const u = new URL(w);
      if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("bad");
      values.website = u.toString();
    } catch {
      return NextResponse.json({ error: "Please enter a valid website address." }, { status: 400 });
    }
  }

  if ("lat" in body || "lng" in body) {
    const lat = cleanCoord(body.lat, -90, 90);
    const lng = cleanCoord(body.lng, -180, 180);
    if (lat === "bad" || lng === "bad") {
      return NextResponse.json({ error: "Latitude or longitude is not valid." }, { status: 400 });
    }
    if ((lat === null) !== (lng === null)) {
      return NextResponse.json({ error: "Enter both latitude and longitude, or leave both empty." }, { status: 400 });
    }
    values.lat = lat;
    values.lng = lng;
  }

  const keys = Object.keys(values);
  if (keys.length === 0) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });

  try {
    if (!a.own.schoolId) {
      // Account without a school yet: create a new, unapproved, free listing and link it.
      if (!values.name || !values.county) {
        return NextResponse.json({ error: "School name and county are required." }, { status: 400 });
      }
      const cols = keys.join(", ");
      const marks = keys.map(() => "?").join(", ");
      const id = await insert(
        `INSERT INTO schools (${cols}, approved, featured, package) VALUES (${marks}, FALSE, FALSE, 'free')`,
        keys.map((k) => values[k])
      );
      await query("UPDATE users SET school_id = ? WHERE id = ? AND role = 'institution' AND school_id IS NULL", [id, a.own.userId]);
      const school = await queryOne(`SELECT ${SELECT_COLS} FROM schools WHERE id = ?`, [id]);
      return NextResponse.json({ ok: true, created: true, school });
    }

    const sets = keys.map((k) => `${k} = ?`).join(", ");
    await query(`UPDATE schools SET ${sets} WHERE id = ?`, [...keys.map((k) => values[k]), a.own.schoolId]);
    const school = await queryOne(`SELECT ${SELECT_COLS} FROM schools WHERE id = ?`, [a.own.schoolId]);
    return NextResponse.json({ ok: true, school });
  } catch (err) {
    console.error("Dashboard profile PUT failed:", err);
    return NextResponse.json({ error: "Could not save your profile. Please try again." }, { status: 500 });
  }
}
