/**
 * Email templates (PF-011 / audit F-02).
 *
 * Version-controlled transactional emails for the auth lifecycle:
 * verify-email + reset-password. Both render a plain-text part and a
 * minimal, dependency-free HTML part (single-column, inline styles —
 * email clients strip stylesheets; no tracking pixels, no remote
 * images: the links are the payload).
 *
 * The action URL is built by the caller (auth service) from `APP_URL`
 * so templates stay pure functions of their inputs.
 */

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

/** Shared page chrome for both templates. */
function htmlPage(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f6f6f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;padding:32px;border:1px solid #e5e5e5;">
        <tr><td style="font-size:20px;font-weight:700;color:#111827;padding-bottom:4px;">RoyCSS</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;padding-bottom:20px;">1,959 production-ready CSS effects. Zero JavaScript runtime.</td></tr>
        ${bodyHtml}
        <tr><td style="font-size:11px;color:#9ca3af;padding-top:28px;line-height:1.6;">
          You received this email because a RoyCSS account action was requested for this address.
          If this wasn't you, you can safely ignore it — the link expires on its own.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function actionButton(url: string, label: string): string {
  return `<!--${label}--><a href="${url}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;">${label}</a>`;
}

/** Escape user-controlled text for HTML interpolation (emails are data). */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface VerifyEmailTemplateInput {
  to: string;
  /** Display name (optional — falls back to the email local part). */
  name: string | null;
  verifyUrl: string;
  /** Human-readable token lifetime, e.g. "30 minutes". */
  expiresInLabel: string;
}

export function verifyEmailTemplate(
  input: VerifyEmailTemplateInput,
): EmailMessage {
  const greetingName = escapeHtml(input.name ?? input.to.split("@")[0]!);
  const bodyHtml = `
        <tr><td style="font-size:15px;color:#111827;line-height:1.6;padding-bottom:20px;">Hi ${greetingName},</td></tr>
        <tr><td style="font-size:14px;color:#374151;line-height:1.7;padding-bottom:24px;">
          Confirm your email address to finish setting up your RoyCSS account.
          This link expires in ${escapeHtml(input.expiresInLabel)} and can only be used once.
        </td></tr>
        <tr><td style="padding-bottom:24px;">${actionButton(input.verifyUrl, "Verify email address")}</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;line-height:1.7;">
          Or paste this link into your browser:<br>
          <a href="${input.verifyUrl}" style="color:#16a34a;word-break:break-all;">${input.verifyUrl}</a>
        </td></tr>`;
  return {
    to: input.to,
    subject: "Verify your RoyCSS email address",
    text:
      `Hi ${input.name ?? input.to},\n\n` +
      `Confirm your email address to finish setting up your RoyCSS account.\n` +
      `This link expires in ${input.expiresInLabel} and can only be used once:\n\n` +
      `${input.verifyUrl}\n\n` +
      `If this wasn't you, you can safely ignore this email.\n` +
      `— The RoyCSS team`,
    html: htmlPage("Verify your email", bodyHtml),
  };
}

export interface ResetPasswordTemplateInput {
  to: string;
  name: string | null;
  resetUrl: string;
  expiresInLabel: string;
}

export function resetPasswordTemplate(
  input: ResetPasswordTemplateInput,
): EmailMessage {
  const greetingName = escapeHtml(input.name ?? input.to.split("@")[0]!);
  const bodyHtml = `
        <tr><td style="font-size:15px;color:#111827;line-height:1.6;padding-bottom:20px;">Hi ${greetingName},</td></tr>
        <tr><td style="font-size:14px;color:#374151;line-height:1.7;padding-bottom:24px;">
          We received a request to reset the password for your RoyCSS account.
          This link expires in ${escapeHtml(input.expiresInLabel)} and can only be used once.
          Resetting your password also signs out all your sessions.
        </td></tr>
        <tr><td style="padding-bottom:24px;">${actionButton(input.resetUrl, "Reset password")}</td></tr>
        <tr><td style="font-size:12px;color:#6b7280;line-height:1.7;">
          Or paste this link into your browser:<br>
          <a href="${input.resetUrl}" style="color:#16a34a;word-break:break-all;">${input.resetUrl}</a>
        </td></tr>
        <tr><td style="font-size:12px;color:#b91c1c;line-height:1.7;padding-top:16px;">
          If you did not request a password reset, ignore this email — your password stays unchanged.
        </td></tr>`;
  return {
    to: input.to,
    subject: "Reset your RoyCSS password",
    text:
      `Hi ${input.name ?? input.to},\n\n` +
      `We received a request to reset the password for your RoyCSS account.\n` +
      `This link expires in ${input.expiresInLabel} and can only be used once:\n\n` +
      `${input.resetUrl}\n\n` +
      `Resetting your password also signs out all your sessions.\n\n` +
      `If you did not request this, ignore this email — your password stays unchanged.\n` +
      `— The RoyCSS team`,
    html: htmlPage("Reset your password", bodyHtml),
  };
}
