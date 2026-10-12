import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { contactNotificationEmail } from "@/lib/email-templates";
import { contactNotifyEmail } from "@/lib/env";
import { limitRequest } from "@/lib/rate-limit";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: NextRequest) {
  const limited = limitRequest(req, "contact", 5, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await req.json();

    // Honeypot: real users never see or fill this field. Pretend success, store nothing.
    if (str(body?.website, 500)) {
      return NextResponse.json({ success: true });
    }

    const name = str(body?.name, 200);
    const email = str(body?.email, 200);
    const phone = str(body?.phone, 50);
    const message = str(body?.message, 5000);

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required." }, { status: 400 });
    }

    await query(
      `INSERT INTO contact_messages (name, email, phone, message) VALUES (?,?,?,?)`,
      [name, email, phone, message]
    );

    // Notify the support inbox. A failure here must not fail the request:
    // the message is already saved and visible in the admin portal.
    try {
      const tmpl = contactNotificationEmail({ name, email, phone, message });
      const replyTo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
      const sent = await sendEmail({ to: contactNotifyEmail(), replyTo, ...tmpl });
      if (!sent.ok) console.warn("[contact] notification email not sent:", sent.reason);
    } catch (err) {
      console.warn("[contact] notification email error:", (err as Error).message);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact error:", err);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
