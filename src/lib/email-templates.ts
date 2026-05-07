/**
 * Branded HTML email templates. Built with table-based layout + inline styles for
 * cross-client compatibility (Gmail strips <style> blocks, Outlook ignores flexbox,
 * etc). Width capped at 600px — the standard for HTML email.
 *
 * Public API:
 *   - brandedEmail(opts)      — wraps any content in the Streamflo shell
 *   - passwordResetEmail(...) — pre-baked password reset template
 *   - googleSignInEmail(...)  — friendly note for Google-auth accounts
 */

const SITE_URL  = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXTAUTH_URL ?? "https://streamflo.co.ke";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "Streamflo";
const SUPPORT   = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "support@streamflo.co.ke";

/** HTML-encode untrusted strings before embedding into the email. */
function esc(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface BrandedEmailOpts {
  /** Pre-header (hidden text shown in inbox preview) */
  preheader?: string;
  /** Big heading at top of the card */
  heading: string;
  /** Intro paragraph(s). Pass HTML (already safely escaped). */
  intro: string;
  /** Optional CTA button — shown if both text + url provided */
  cta?: { text: string; url: string };
  /** Body content shown after the CTA (HTML). */
  body?: string;
  /** Sign-off line (optional) */
  signoff?: string;
}

export function brandedEmail(opts: BrandedEmailOpts): string {
  const { preheader = "", heading, intro, cta, body = "", signoff = `Thanks,<br/>The ${SITE_NAME} team` } = opts;

  const ctaBlock = cta ? `
    <tr>
      <td align="center" style="padding: 8px 0 24px 0;">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td bgcolor="#1d4ed8" style="border-radius: 8px;">
              <a href="${esc(cta.url)}" target="_blank"
                 style="display: inline-block; padding: 14px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                ${esc(cta.text)}
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>` : "";

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${esc(heading)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a;">

  <!-- Pre-header (hidden, shows in inbox preview) -->
  <div style="display: none; max-height: 0; overflow: hidden; mso-hide: all; visibility: hidden; opacity: 0; color: transparent;">
    ${esc(preheader || heading)}
  </div>

  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- 600px column -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width: 600px; width: 100%;">

          <!-- Brand header -->
          <tr>
            <td align="left" style="padding: 0 0 16px 0;">
              <a href="${esc(SITE_URL)}" target="_blank"
                 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 800; color: #1d4ed8; text-decoration: none; letter-spacing: -0.5px;">
                ${esc(SITE_NAME)}
              </a>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td bgcolor="#ffffff" style="border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04);">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">

                <!-- Top accent stripe -->
                <tr>
                  <td bgcolor="#1d4ed8" height="4" style="font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>

                <!-- Card body -->
                <tr>
                  <td style="padding: 36px 32px 32px 32px;">
                    <h1 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 24px; line-height: 1.3; font-weight: 700; color: #0f172a;">
                      ${esc(heading)}
                    </h1>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; line-height: 1.6; color: #334155;">
                      ${intro}
                    </div>
                  </td>
                </tr>

                ${ctaBlock}

                ${body ? `
                <tr>
                  <td style="padding: 0 32px 24px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #475569;">
                    ${body}
                  </td>
                </tr>` : ""}

                <!-- Sign-off -->
                <tr>
                  <td style="padding: 0 32px 32px 32px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; line-height: 1.6; color: #475569;">
                    ${signoff}
                  </td>
                </tr>

              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 8px 0 8px; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.5; color: #94a3b8;">
              <p style="margin: 0 0 6px 0;">${esc(SITE_NAME)} — Find your school. Forecast your future.</p>
              <p style="margin: 0 0 6px 0;">
                <a href="${esc(SITE_URL)}" target="_blank" style="color: #64748b; text-decoration: underline;">${esc(SITE_URL.replace(/^https?:\/\//, ""))}</a>
                &nbsp;·&nbsp;
                <a href="mailto:${esc(SUPPORT)}" style="color: #64748b; text-decoration: underline;">${esc(SUPPORT)}</a>
              </p>
              <p style="margin: 8px 0 0 0; color: #cbd5e1;">You're receiving this because someone (hopefully you) used your email on ${esc(SITE_NAME)}. If it wasn't you, you can safely ignore this message.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ---------- specific templates ----------

export function passwordResetEmail(opts: { username: string; resetUrl: string; expiresInMinutes?: number }): { html: string; text: string; subject: string } {
  const minutes = opts.expiresInMinutes ?? 60;
  const html = brandedEmail({
    preheader: `Reset your ${SITE_NAME} password — link valid for ${minutes} minutes.`,
    heading: "Reset your password",
    intro: `<p style="margin: 0 0 12px 0;">Hi <strong>${esc(opts.username)}</strong>,</p>
            <p style="margin: 0 0 12px 0;">Tap the button below to set a new password. The link is valid for <strong>${minutes} minutes</strong>, then it expires for security reasons.</p>`,
    cta: { text: "Reset password", url: opts.resetUrl },
    body: `<p style="margin: 0 0 8px 0;">Or copy this URL into your browser:</p>
           <p style="margin: 0; word-break: break-all;"><a href="${esc(opts.resetUrl)}" style="color: #1d4ed8; text-decoration: underline;">${esc(opts.resetUrl)}</a></p>`,
  });
  const text =
    `Hi ${opts.username},\n\n` +
    `Reset your ${SITE_NAME} password using this link (valid for ${minutes} minutes):\n` +
    `${opts.resetUrl}\n\n` +
    `If you didn't request this, ignore this email.\n` +
    `— ${SITE_NAME}`;
  return { html, text, subject: `Reset your ${SITE_NAME} password` };
}

export function googleSignInEmail(): { html: string; text: string; subject: string } {
  const html = brandedEmail({
    preheader: `Your ${SITE_NAME} account uses Google sign-in.`,
    heading: "Use Google to sign in",
    intro: `<p style="margin: 0 0 12px 0;">You requested a password reset, but your ${esc(SITE_NAME)} account is linked to <strong>Google sign-in</strong> — there's no password to reset.</p>
            <p style="margin: 0 0 12px 0;">Just head to the login page and click <strong>Continue with Google</strong>.</p>`,
    cta: { text: "Go to login", url: `${SITE_URL}/login` },
  });
  const text =
    `You requested a password reset, but your ${SITE_NAME} account uses Google sign-in. ` +
    `Just visit ${SITE_URL}/login and click "Continue with Google".\n— ${SITE_NAME}`;
  return { html, text, subject: `${SITE_NAME} — sign in with Google` };
}
