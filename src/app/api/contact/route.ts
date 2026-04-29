import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { name, email, phone, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Name, email and message are required." }, { status: 400 });
    }

    await query(
      `INSERT INTO contact_messages (name, email, phone, message) VALUES (?,?,?,?)`,
      [name.trim(), email.trim(), phone?.trim() ?? "", message.trim()]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact error:", err);
    return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
  }
}
