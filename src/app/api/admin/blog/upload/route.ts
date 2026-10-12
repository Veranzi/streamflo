import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { saveImage, UploadError } from "@/lib/storage";

export const runtime = "nodejs";

/** Upload a blog featured image. Multipart form field "file". Returns { url }. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if ((session?.user as { role?: string } | undefined)?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!file || typeof file === "string") return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    const { url } = await saveImage(file, "blog");
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof UploadError) return NextResponse.json({ error: err.message }, { status: err.status });
    console.error("Blog image upload failed", err);
    return NextResponse.json({ error: "Could not upload the image." }, { status: 500 });
  }
}
