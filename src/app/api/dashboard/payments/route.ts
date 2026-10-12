import { NextRequest, NextResponse } from "next/server";
import { query, queryOne, insert } from "@/lib/db";
import { requireOwnSchoolApi } from "../_school";

/** Premium listing price in KES. Read from settings.premium_price when available. */
const DEFAULT_PRICE = 1250;

async function premiumPrice(): Promise<number> {
  try {
    const row = await queryOne<{ premium_price: string | number | null }>("SELECT premium_price FROM settings ORDER BY id LIMIT 1");
    const n = Number(row?.premium_price);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_PRICE;
  } catch {
    return DEFAULT_PRICE;
  }
}

type PaymentRow = { id: number; amount: string; package: string | null; method: string | null; reference: string | null; status: string; created_at: string };

export async function GET() {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;
  try {
    const [rows, price] = await Promise.all([
      query<PaymentRow>(
        "SELECT id, amount, package, method, reference, status, created_at FROM payments WHERE school_id = ? ORDER BY created_at DESC, id DESC LIMIT 50",
        [a.ctx.schoolId]
      ),
      premiumPrice(),
    ]);
    return NextResponse.json({ rows, price, account: `SCH${a.ctx.schoolId}`, package: a.ctx.school.package ?? "free" });
  } catch (err) {
    console.error("Dashboard payments GET failed:", err);
    return NextResponse.json({ error: "Could not load payments." }, { status: 500 });
  }
}

/** The school reports an M-Pesa payment: { code }. Recorded as pending for admin to confirm. */
export async function POST(req: NextRequest) {
  const a = await requireOwnSchoolApi();
  if (!a.ok) return a.res;
  let body: { code?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const code = String(body.code ?? "").trim().toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9]{8,12}$/.test(code)) {
    return NextResponse.json({ error: "Please enter the M-Pesa code from your confirmation SMS, for example SGH7K2LQ9X." }, { status: 400 });
  }
  try {
    const dup = await queryOne<{ id: number }>("SELECT id FROM payments WHERE UPPER(reference) = ?", [code]);
    if (dup) return NextResponse.json({ error: "This M-Pesa code has already been submitted." }, { status: 409 });

    const pending = await queryOne<{ c: number }>(
      "SELECT COUNT(*)::int AS c FROM payments WHERE school_id = ? AND status = 'pending'",
      [a.ctx.schoolId]
    );
    if (Number(pending?.c ?? 0) >= 3) {
      return NextResponse.json({ error: "You have payments waiting for confirmation. Please contact support if it is taking long." }, { status: 429 });
    }

    const price = await premiumPrice();
    const id = await insert(
      "INSERT INTO payments (school_id, amount, package, method, reference, status) VALUES (?, ?, 'premium', 'mpesa_paybill', ?, 'pending')",
      [a.ctx.schoolId, price, code]
    );
    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("Dashboard payments POST failed:", err);
    return NextResponse.json({ error: "Could not record your payment. Please try again or contact support." }, { status: 500 });
  }
}
