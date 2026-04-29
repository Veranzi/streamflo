import { proxyToEdutena } from "@/lib/edutena";

// Proxies /api/ai/chat/* → EduTena gateway /api/chat/*
// (e.g. POST /api/ai/chat/conversations → POST :3100/api/chat/conversations)

async function handler(req: Request, { params }: { params: { path: string[] } }) {
  const subPath = params.path.join("/");
  const search = new URL(req.url).search;
  return proxyToEdutena(req, `/api/chat/${subPath}${search}`);
}

export { handler as GET, handler as POST, handler as PUT, handler as DELETE, handler as PATCH };
