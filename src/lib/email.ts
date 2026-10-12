import nodemailer from "nodemailer";
import { isProduction } from "./env";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT ?? 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM = process.env.SMTP_FROM ?? "Streamflo <noreply@streamflo.co.ke>";

const smtpConfigured = !!(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporter: nodemailer.Transporter | null = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export type SendEmailResult =
  | { ok: true; messageId: string }
  | { ok: false; messageId: null; reason: "not_configured" | "send_failed" };

/**
 * Send an email. Never throws: check `result.ok`.
 *
 * When SMTP is not configured:
 *  - development: the full email (including any links) is logged to the server console
 *    so developers can follow reset links, and the call counts as sent.
 *  - production: nothing about the message body is logged (it may contain a reset token)
 *    and the call returns { ok: false, reason: "not_configured" }.
 */
export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  if (!smtpConfigured) {
    if (isProduction) {
      console.error(`[email] SMTP is not configured (SMTP_HOST, SMTP_USER, SMTP_PASS). Email "${opts.subject}" was not sent.`);
      return { ok: false, messageId: null, reason: "not_configured" };
    }
    console.warn(
      `\n[email] SMTP not configured, logging email instead (development only).\n  TO: ${opts.to}\n  SUBJECT: ${opts.subject}\n  ----- BODY -----\n${opts.text ?? opts.html}\n  ----------------\n`
    );
    return { ok: true, messageId: "console-fallback" };
  }

  try {
    const info = await getTransporter().sendMail({
      from: SMTP_FROM,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      replyTo: opts.replyTo,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[email] failed to send "${opts.subject}":`, (err as Error).message);
    return { ok: false, messageId: null, reason: "send_failed" };
  }
}

export { smtpConfigured };
