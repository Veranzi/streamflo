import nodemailer from "nodemailer";

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

export async function sendEmail(opts: { to: string; subject: string; html: string; text?: string }) {
  // Dev fallback: if SMTP isn't configured, log the email to the server console so devs
  // can grab the password-reset link without setting up a mail provider.
  if (!smtpConfigured) {
    console.warn(
      `\n[email] SMTP not configured — logging email instead.\n  TO: ${opts.to}\n  SUBJECT: ${opts.subject}\n  ----- BODY -----\n${opts.text ?? opts.html}\n  ----------------\n`
    );
    return { messageId: "console-fallback" };
  }

  const info = await getTransporter().sendMail({
    from: SMTP_FROM,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
  });
  return { messageId: info.messageId };
}

export { smtpConfigured };
