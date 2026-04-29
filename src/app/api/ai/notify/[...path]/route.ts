import { proxyToEdutena } from "@/lib/edutena";

async function handler(req: Request, { params }: { params: { path: string[] } }) {
  const subPath = params.path.join("/");
  const search = new URL(req.url).search;
  return proxyToEdutena(req, `/api/notify/${subPath}${search}`);
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
