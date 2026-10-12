import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

function admin(s: unknown) {
  return (s as { user?: { role?: string } } | null)?.user?.role === "admin";
}

const SUBSCRIBER_TYPES = ["student", "teacher", "school", "parent"];
const BILLING_PERIODS = ["monthly", "termly", "annually"];

/** Partial update of a plan. Returns the updated row. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions);
  if (!admin(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => ({}))) as {
    name?: string;
    subscriber_type?: string;
    price_kes?: number | string;
    billing_period?: string;
    active?: boolean;
  };

  const sets: string[] = [];
  const values: unknown[] = [];
  const add = (col: string, v: unknown) => {
    values.push(v);
    sets.push(`${col}=$${values.length}`);
  };

  if (body.name !== undefined) {
    if (!String(body.name).trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
    add("name", String(body.name).trim());
  }
  if (body.subscriber_type !== undefined) {
    if (!SUBSCRIBER_TYPES.includes(body.subscriber_type)) return NextResponse.json({ error: "Invalid subscriber type" }, { status: 400 });
    add("subscriber_type", body.subscriber_type);
  }
  if (body.price_kes !== undefined) {
    const price = Number(body.price_kes);
    if (!Number.isFinite(price) || price < 0) return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    add("price_kes", price);
  }
  if (body.billing_period !== undefined) {
    if (!BILLING_PERIODS.includes(body.billing_period)) return NextResponse.json({ error: "Invalid billing period" }, { status: 400 });
    add("billing_period", body.billing_period);
  }
  if (body.active !== undefined) add("active", !!body.active);
  if (!sets.length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  values.push(params.id);
  await query(`UPDATE edutena.subscription_plans SET ${sets.join(",")} WHERE id=$${values.length}`, values);
  const row = await queryOne("SELECT * FROM edutena.subscription_plans WHERE id=$1", [params.id]);
  if (!row) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  return NextResponse.json(row);
}

/** Soft delete: deactivate the plan (same as the collection DELETE). */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const s = await getServerSession(authOptions);
  if (!admin(s)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await query("UPDATE edutena.subscription_plans SET active=FALSE WHERE id=$1", [params.id]);
  return NextResponse.json({ ok: true });
}
