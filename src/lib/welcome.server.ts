// Server-only. Sends the "welcome to the club" email via Resend directly.
// RESEND_API_KEY is read from process.env inside the handler and never
// bundled to the client.

const RESEND_API_URL = "https://api.resend.com";
const FROM = "Tulip & Co. <hello@club.tulipnco.com>";
const REPLY_TO = "hello@tulipnco.com";
const SENDER_ADDRESS = "hello@club.tulipnco.com";

/**
 * Read inside the render, not at module scope: Cloudflare Workers inject
 * bindings per request, so process.env is empty when this module loads.
 */
function siteUrl() {
  return process.env.SITE_URL ?? "https://club.tulipnco.com";
}

export type WelcomeResult = {
  ok: boolean;
  skipped?: boolean;
  error?: string;
};

function esc(str: string) {
  return str.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" :
    c === "<" ? "&lt;" :
    c === ">" ? "&gt;" :
    c === '"' ? "&quot;" : "&#39;",
  );
}

function renderHtml(firstName: string, email: string) {
  const unsubUrl = `${siteUrl()}/unsubscribe?email=${encodeURIComponent(email)}`;
  const name = esc(firstName || "friend");
  // Deliberately plain: no table layout, no colored divider, no styled
  // header, no button, no background color. Every one of those reads as
  // "template" to Gmail's Promotions classifier, independent of the wording.
  // This is meant to look like an email a person actually typed.
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Tulip & Co.</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, Helvetica, sans-serif; color: #000000; font-size: 15px; line-height: 1.6;">
  <div style="max-width: 480px; margin: 0 auto; padding: 24px 16px;">
    <p>Hi ${name},</p>
    <p>I'm Thimo. Thanks for joining us.</p>
    <p>I started Tulip &amp; Co. to share a piece of my home in the Netherlands right here in San Diego. We just love simple, well-made Dutch design that gives you a little room to breathe.</p>
    <p>I'll email you when we have new pieces in the collection or upcoming dates to meet up in person. No spam, just the good stuff.</p>
    <p>Talk soon,<br>Thimo</p>
    <p style="color: #666666; font-size: 12px; margin-top: 32px;">
      Tulip &amp; Co. — San Diego, CA.<br>
      <a href="${unsubUrl}" style="color: #666666;">Unsubscribe</a>
    </p>
  </div>
</body>
</html>`;
}

 
function renderText(firstName: string, email: string) {
  const unsubUrl = `${siteUrl()}/unsubscribe?email=${encodeURIComponent(email)}`;
  const name = firstName || "friend";
  return [
    `Hi ${name},`,
    ``,
    `I'm Thimo. Thanks for joining us.`,
    ``,
    `I started Tulip & Co. to share a piece of my home in the Netherlands right here in San Diego. We just love simple, well-made Dutch design that gives you a little room to breathe.`,
    ``,
    `I'll email you when we have new pieces in the collection or upcoming dates to meet up in person. No spam, just the good stuff.`,
    ``,
    `Talk soon,`,
    `Thimo`,
    ``,
    `--`,
    `Tulip & Co. — San Diego, CA.`,
    `Unsubscribe: ${unsubUrl}`,
  ].join("\n");
}

export async function sendWelcomeEmail(
  firstName: string,
  email: string,
): Promise<WelcomeResult> {
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      const msg = `[welcome] ALERT: missing RESEND_API_KEY — cannot send welcome email.`;
      console.error(msg);
      return { ok: false, skipped: true, error: msg };
    }

    const to = email.trim().toLowerCase();
    if (!to) {
      console.warn("[welcome] empty email — skipping.");
      return { ok: false, skipped: true, error: "empty email" };
    }

    const payload = {
      from: FROM,
      to: [to],
      reply_to: REPLY_TO,
      subject: "Welcome to Tulip & Co.",
      html: renderHtml(firstName, to),
      text: renderText(firstName, to),
      headers: {
        "List-Unsubscribe": `<mailto:${REPLY_TO}?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };

    console.log("[welcome] attempt", { to, from: FROM });
    const res = await fetch(`${RESEND_API_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      let parsed: any = null;
      let raw = "";
      try {
        parsed = await res.clone().json();
      } catch {
        raw = await res.text().catch(() => "");
      }
      console.error("[welcome] resend send failed", {
        httpStatus: res.status,
        statusCode: parsed?.statusCode,
        name: parsed?.name,
        message: parsed?.message ?? raw,
        to,
      });
      return {
        ok: false,
        error: `${parsed?.name ?? res.status}: ${parsed?.message ?? raw ?? "unknown"}`,
      };
    }

    const body = (await res.json().catch(() => null)) as { id?: string } | null;
    console.log("[welcome] sent", { to, id: body?.id });
    return { ok: true };
  } catch (err) {
    const e = err as Error;
    console.error("[welcome] fatal error", {
      name: e.name,
      message: e.message,
      stack: e.stack,
    });
    return { ok: false, error: `fatal: ${e.message}` };
  }
}
