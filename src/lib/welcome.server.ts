// Server-only. Sends the "welcome to the club" email through the Lovable
// Resend connector gateway. RESEND_API_KEY / LOVABLE_API_KEY are read from
// process.env inside the handler and never bundled to the client.

const RESEND_API_URL = "https://api.resend.com";
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
  <title>Welcome to Tulip & Co.</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F6F0; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #F9F6F0;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        
        <!-- open, airy layout -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 440px; text-align: left;">
          <tr>
            <td>
              
              <!-- brand header -->
              <p style="color: #000000; font-size: 20px; font-weight: 900; margin: 0 0 35px 0; letter-spacing: -0.5px;">
                Tulip &amp; Co.
              </p>

              <!-- de stijl color accent divider -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 40px;">
                <tr>
                  <td width="33%" height="4" style="background-color: #E05A36; border: 2px solid #000000;"></td>
                  <td width="33%" height="4" style="background-color: #F2B73F; border: 2px solid #000000; border-left: none;"></td>
                  <td width="34%" height="4" style="background-color: #3D6E97; border: 2px solid #000000; border-left: none;"></td>
                </tr>
              </table>

              <!-- greeting -->
              <h1 style="color: #000000; font-size: 28px; font-weight: bold; margin: 0 0 20px 0; letter-spacing: -0.5px;">
                Hi ${name},
              </h1>

              <!-- optimized founder note -->
              <p style="color: #000000; font-size: 16px; line-height: 1.7; font-weight: 500; margin: 0 0 20px 0;">
                I'm Thimo. Thanks for joining us.
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.7; font-weight: 500; margin: 0 0 20px 0;">
                I started Tulip &amp; Co. to share a piece of my home in the Netherlands right here in San Diego. We just love simple, well-made Dutch design that gives you a little room to breathe.
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.7; font-weight: 500; margin: 0 0 20px 0;">
                I just wanted to send a quick note to say I’m glad you’re here. I'll email you when we have new products in the shop or upcoming pop-up market dates.
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.7; font-weight: 500; margin: 0 0 40px 0;">
                No spam, just the good stuff.
              </p>

              <!-- simple pill button -->
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="background-color: #E05A36; border: 2px solid #000000; border-radius: 50px; box-shadow: 3px 3px 0px 0px #000000;">
                    <a href="${SITE_URL}" style="display: block; padding: 14px 32px; color: #ffffff; font-size: 15px; font-weight: bold; text-decoration: none;">
                      Visit the shop
                    </a>
                  </td>
                </tr>
              </table>

              <!-- spacer -->
              <div style="height: 70px; line-height: 70px; font-size: 70px;">&nbsp;</div>

              <!-- clean footer & unsubscribe -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="border-top: 2px solid #000000; padding-top: 30px;">
                    <p style="color: #000000; font-size: 12px; line-height: 1.6; margin: 0; font-weight: 500;">
                      Tulip &amp; Co. — San Diego, CA.<br><br>
                      <a href="${SITE_URL}/unsubscribe" style="color: #000000; text-decoration: underline;">Unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>

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
      subject: "you're in! welcome to the tulip & co. club. 🌷",
      html: renderHtml(firstName),
      text: renderText(firstName),
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
