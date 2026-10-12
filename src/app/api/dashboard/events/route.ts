import { NextRequest, NextResponse } from "next/server";
import { query, insert } from "@/lib/db";
import { requireOwnSchoolApi } from "../_school";

type EventRow = { id: number; title: string; description: string | null; active: boolean; created_at: string };

export async function GET() {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;
  try {
    const rows = await query<EventRow>(
      "SELECT id, title, description, active, created_at FROM events WHERE school_id = ? ORDER BY created_at DESC, id DESC",
      [a.ctx.schoolId]
    );
    return NextResponse.json({ rows });
  } catch (err) {
    console.error("Dashboard events GET failed:", err);
    return NextResponse.json({ error: "Could not load events." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;
  let body: { title?: unknown; description?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const title = String(body.title ?? "").trim();
  const description = String(body.description ?? "").trim();
  if (!title) return NextResponse.json({ error: "Please add a title." }, { status: 400 });
  if (title.length > 255) return NextResponse.json({ error: "The title is too long." }, { status: 400 });
  if (description.length > 5000) return NextResponse.json({ error: "The description is too long." }, { status: 400 });
  try {
    const id = await insert(
      "INSERT INTO events (title, description, school_id, active) VALUES (?, ?, ?, TRUE)",
      [title, description || null, a.ctx.schoolId]
    );
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Dashboard events POST failed:", err);
    return NextResponse.json({ error: "Could not save the event." }, { status: 500 });
  }
}

/** Show or hide an own event: { id, active } */
export async function PATCH(req: NextRequest) {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;
  let body: { id?: unknown; active?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const id = Number(body.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Event id is required." }, { status: 400 });
  try {
    const rows = await query<{ id: number }>(
      "UPDATE events SET active = ? WHERE id = ? AND school_id = ? RETURNING id",
      [!!body.active, id, a.ctx.schoolId]
    );
    if (rows.length === 0) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Dashboard events PATCH failed:", err);
    return NextResponse.json({ error: "Could not update the event." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;
  let id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) {
    try {
      id = Number((await req.json())?.id);
    } catch {
      /* no body */
    }
  }
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Event id is required." }, { status: 400 });
  try {
    const rows = await query<{ id: number }>("DELETE FROM events WHERE id = ? AND school_id = ? RETURNING id", [id, a.ctx.schoolId]);
    if (rows.length === 0) return NextResponse.json({ error: "Event not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Dashboard events DELETE failed:", err);
    return NextResponse.json({ error: "Could not delete the event." }, { status: 500 });
  }
}
