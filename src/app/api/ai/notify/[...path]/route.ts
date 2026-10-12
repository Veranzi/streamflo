import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { proxyToEdutena } from "@/lib/edutena";

// Proxies /api/ai/notify/* to the EduTena gateway /api/notify/*.
// Sending notifications is an admin only action.

async function handler(req: Request, { params }: { params: { path: string[] } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }
  if (session.user.role !== "admin") {
    return Response.json({ error: "Admin access required" }, { status: 403 });
  }
  const subPath = params.path.join("/");
  const search = new URL(req.url).search;
  return proxyToEdutena(req, `/api/notify/${subPath}${search}`);
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
