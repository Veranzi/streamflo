import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { authOptions } from "@/lib/auth";
import { transaction } from "@/lib/db";

/**
 * Confirm or reject a school listing payment (table `payments`).
 * Confirming marks it successful and upgrades the school to the paid package
 * (Premium includes a featured listing). Learning tool payments are handled
 * under Subscription requests, not here.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string } | undefined)?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Invalid payment." }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const action = body?.action;
  if (action !== "confirm" && action !== "reject") {
    return NextResponse.json({ error: "Action must be confirm or reject." }, { status: 400 });
  }

  try {
    const result = await transaction(async (client) => {
      const { rows } = await client.query<{ id: number; school_id: number; package: string | null }>(
        `UPDATE payments SET status = $2
         WHERE id = $1 AND status = 'pending'
         RETURNING id, school_id, package`,
        [id, action === "confirm" ? "success" : "failed"]
      );
      const payment = rows[0];
      if (!payment) return null;
      if (action === "confirm") {
        const pkg = payment.package === "enterprise" ? "enterprise" : "premium";
        await client.query(`UPDATE schools SET package = $2, featured = TRUE WHERE id = $1`, [payment.school_id, pkg]);
      }
      return payment;
    });

    if (!result) {
      return NextResponse.json({ error: "This payment is no longer pending." }, { status: 409 });
    }
    revalidatePath("/");
    return NextResponse.json({ ok: true, status: action === "confirm" ? "success" : "failed" });
  } catch (err) {
    console.error("Payment update failed", err);
    return NextResponse.json({ error: "Could not update the payment." }, { status: 500 });
  }
}
