import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { proxyToEdutena } from "@/lib/edutena";
import { logAdminAction } from "@/lib/audit";

/** Admin decisions on learning tool manual payments, recorded in the admin activity trail. */
const MANUAL_PAYMENT_DECISION = /^manual-payment\/(\d+)\/(approve|reject)$/;

async function handler(req: Request, { params }: { params: { path: string[] } }) {
  const subPath = params.path.join("/");
  const search = new URL(req.url).search;
  const res = await proxyToEdutena(req, `/api/subscription/${subPath}${search}`);

  const decision = req.method === "POST" ? MANUAL_PAYMENT_DECISION.exec(subPath) : null;
  if (decision && res.ok) {
    try {
      const session = await getServerSession(authOptions);
      if (session?.user?.role === "admin") {
        const [, paymentId, verb] = decision;
        await logAdminAction(session, {
          action: `ai_payment.${verb}`,
          targetType: "ai_manual_payment",
          targetId: paymentId,
          summary: `${verb === "approve" ? "Approved" : "Rejected"} learning tool payment #${paymentId}`,
        });
      }
    } catch (err) {
      console.error("[audit] could not read session for AI payment decision", (err as Error).message);
    }
  }

  return res;
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
