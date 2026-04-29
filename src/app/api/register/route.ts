import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { queryOne, insert, query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const get = (k: string) => (form.get(k) as string | null) ?? "";

    const username = get("username").trim();
    const email = get("email").trim().toLowerCase();
    const phone = get("phone").trim();
    const password = get("password");
    const password2 = get("password2");
    const agent_code = get("agent_code").trim();
    const become_agent = get("become_agent") === "true";

    const school_name = get("school_name").trim();
    const type = get("type") || null;
    const ownership = get("ownership") || null;
    const curriculum = get("curriculum") || null;
    const boarding = get("boarding") || null;
    const gender = get("gender") || null;
    const county = get("county");
    const subcounty = get("subcounty") || null;
    const phone_school = get("phone_school") || null;
    const email_school = get("email_school") || null;
    const website = get("website") || null;
    const description = get("description") || null;
    const lat = get("lat") || null;
    const lng = get("lng") || null;
    const pkg = get("package") || "free";

    const facilities = form.getAll("facilities[]").map(String);
    const facilities_other = get("facilities_other");
    const allFacilities = [...facilities, ...(facilities_other ? [facilities_other] : [])].join(", ");

    if (!username || !email || !password || !school_name || !county) {
      return NextResponse.json({ error: "Required fields are missing." }, { status: 400 });
    }
    if (password !== password2) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }

    // Check email uniqueness
    const existing = await queryOne<{ id: number }>("SELECT id FROM users WHERE LOWER(email) = ?", [email]);
    if (existing) {
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);

    // Resolve agent_code → agent_id
    let agent_id: number | null = null;
    if (agent_code) {
      const agent = await queryOne<{ id: number }>("SELECT id FROM agents WHERE agent_code = ?", [agent_code]);
      if (agent) agent_id = agent.id;
    }

    // Insert school
    const school_id = await insert(
      `INSERT INTO schools (name, type, ownership, curriculum, boarding, gender, county, subcounty,
        phone, email, website, description, facilities, lat, lng, approved, featured, package, agent_id)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, FALSE, FALSE, ?, ?)`,
      [school_name, type, ownership, curriculum, boarding, gender, county, subcounty,
        phone_school, email_school, website, description, allFacilities, lat, lng, pkg, agent_id]
    );

    // Insert user (institution role since they're registering a school)
    await query(
      `INSERT INTO users (username, email, phone, password_hash, role, school_id) VALUES (?,?,?,?, 'institution', ?)`,
      [username, email, phone, password_hash, school_id]
    );

    // Become agent if requested
    if (become_agent) {
      const code = `AG-${Date.now().toString(36).toUpperCase()}`;
      await query(
        `INSERT INTO agents (name, email, phone, agent_code) VALUES (?,?,?,?)`,
        [username, email, phone, code]
      );
    }

    return NextResponse.json({ success: true, school_id });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
