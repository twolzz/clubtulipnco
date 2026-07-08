// Server-only. Sends the "welcome to the club" email through the Lovable
// Resend connector gateway. RESEND_API_KEY / LOVABLE_API_KEY are read from
// process.env inside the handler and never bundled to the client.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM = "Tulip & Co. <hello@updates.tulipnco.com>";
const REPLY_TO = "hello@tulipnco.com";
const SENDER_ADDRESS = "hello@updates.tulipnco.com";
const SITE_URL = process.env.SITE_URL ?? "https://tulipnco.com";
const DISCOUNT_CODE = "WELCOME10";

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

function renderHtml(firstName: string) {
  const name = esc(firstName || "friend");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>you're in! welcome to the tulip & co. club.</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFFFF; font-family: Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- MAIN CANVAS (Maintains the premium boutique atmosphere) -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; padding: 45px 20px;">
    <tr>
      <td align="center">

        <!-- DE STIJL BOX (4px Bold Black Outline, Warm Cream F9F6F0 Fill) -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #F9F6F0; border: 4px solid #000000; border-radius: 12px; overflow: hidden; text-align: left;">
          <tr>
            <td style="padding: 40px 35px;">

              <!-- BRAND EMBLEM (Your Imgur Logo Link) -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <!-- 🚨 IMGUR LINK: Replace the placeholder URL below with your raw direct Imgur link (ends in .png/.jpg) -->
                    <img src="https://i.imgur.com/ZFYdjIv.png" alt="tulip & co." style="max-width: 140px; height: auto; display: block; border: 0;">
                  </td>
                </tr>
              </table>

              <!-- HERO GREETING (Dick Bruna Style Typography) -->
              <h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: bold; color: #000000; line-height: 1.2; letter-spacing: -0.8px; text-align: center;">
                hi ${name}, you're in.
              </h1>

              <!-- SHORTENED BODY (Mindful, sophisticated copy to maximize reader completion rates) -->
              <p style="margin: 0 0 32px 0; font-size: 16px; color: #000000; line-height: 1.6; text-align: center;">
                welcome to the tulip & co. club — a small circle of people who appreciate quiet, functional, hand-picked dutch design in san diego.
              </p>

              <!-- WELCOME PERK CARD (Minimalist dashed border to grab immediate focus) -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border: 2px dashed #000000; border-radius: 8px; margin-bottom: 35px;">
                <tr>
                  <td style="padding: 24px; text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #000000; letter-spacing: 2px; text-transform: uppercase;">
                      your welcome perk
                    </p>
                    <h2 style="margin: 0 0 16px 0; font-size: 26px; font-weight: bold; color: #E05A36;">
                      10% off your first order
                    </h2>
                    <!-- INJECTED COUPON CODE -->
                    <div style="background-color: #F9F6F0; border: 2px solid #000000; display: inline-block; padding: 10px 24px; font-size: 18px; font-family: Courier, monospace; font-weight: bold; color: #000000; letter-spacing: 1px;">
                      ${DISCOUNT_CODE}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- HIGH-CONVERSION CTA (Pill-shaped Terracotta Red Button) -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 40px;">
                <tr>
                  <td align="center">
                    <!-- INJECTED TARGET SITE URL -->
                    <a href="${SITE_URL}" style="background-color: #E05A36; color: #FFFFFF; border: 3px solid #000000; border-radius: 50px; padding: 14px 36px; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; text-align: center; box-shadow: 0 4px 0px #000000;">
                      shop now
                    </a>
                  </td>
                </tr>
              </table>

              <!-- SOPHISTICATED BRAND STATEMENT (Supports authenticity and authority) -->
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #000000;">
                what we're about.
              </p>
              <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.5;">
                tulip & co. is built on one idea: mindful minimalism. we source authentic, licensed stationery and home goods to bridge the gap between premium dutch craftsmanship and the southern california retail space.
              </p>

            </td>
          </tr>
        </table>

        <!-- FOOTER (Contains legally required CAN-SPAM information and unsubscribe) -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; margin-top: 24px; text-align: center;">
          <tr>
            <td style="font-size: 12px; color: #888888; line-height: 1.6; padding: 0 10px;">
              <!-- INJECTED SENDER ADDRESS -->
              you are receiving this because you subscribed to tulip & co. updates.<br>
              ${SENDER_ADDRESS}<br><br>
              <!-- INJECTED UNSUBSCRIBE URL -->
              <a href="{{unsubscribe_url}}" style="color: #666666; text-decoration: underline;">
                Unsubscribe
              </a>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>

</body>
</html>`;
}

function renderText(firstName: string) {
  const name = firstName || "friend";
  return [
    `hi ${name}, you're in.`,
    ``,
    `welcome to the tulip & co. club — a small circle of people who appreciate quiet, functional, hand-picked dutch design in san diego.`,
    ``,
    `your welcome perk: 10% off your first order.`,
    `use code ${DISCOUNT_CODE} at checkout — ${SITE_URL}`,
    ``,
    `what we're about:`,
    `tulip & co. is built on one idea: mindful minimalism. we source authentic, licensed stationery and home goods to bridge the gap between premium dutch craftsmanship and the southern california retail space.`,
    ``,
    `shop now:`,
    `  ${SITE_URL}`,
    ``,
    `— tulip & co.`,
    ``,
    `you are receiving this because you subscribed to tulip & co. updates.`,
    `${SENDER_ADDRESS}`,
    `unsubscribe: {{unsubscribe_url}}`,
  ].join("\n");
}

export async function sendWelcomeEmail(
  firstName: string,
  email: string,
): Promise<WelcomeResult> {
  try {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    if (!lovableKey || !resendKey) {
      const msg = `[welcome] ALERT: missing ${!lovableKey ? "LOVABLE_API_KEY" : ""}${!lovableKey && !resendKey ? " and " : ""}${!resendKey ? "RESEND_API_KEY" : ""} — cannot send welcome email.`;
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
      subject: "you're in! welcome to the tulip & co. club. 🌷",
      html: renderHtml(firstName),
      text: renderText(firstName),
      headers: {
        "List-Unsubscribe": `<mailto:${REPLY_TO}?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    };

    const res = await fetch(`${GATEWAY_URL}/emails`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": resendKey,
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
