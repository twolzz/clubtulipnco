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
  return `<!doctype html>
<html><head><meta charset="utf-8" /><title>welcome to tulip &amp; co.</title></head>
<body style="margin:0;padding:0;background:#F6F2E7;font-family:Inter,Arial,sans-serif;color:#333333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F2E7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td style="padding:0 8px 24px 8px;">
          <div style="font-family:'Archivo',Inter,Arial,sans-serif;font-size:20px;font-weight:800;text-transform:lowercase;letter-spacing:-0.02em;">tulip &amp; co.</div>
        </td></tr>

        <!-- greeting + incentive -->
        <tr><td style="background:#F6F2E7;border:4px solid #333333;border-radius:16px;box-shadow:12px 12px 0 #F2B73F;padding:32px;">
          <div style="display:inline-block;background:#F2B73F;border:3px solid #333333;border-radius:999px;padding:4px 14px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">welcome</div>
          <h1 style="font-family:'Archivo',Inter,Arial,sans-serif;font-size:34px;line-height:1.05;font-weight:900;text-transform:lowercase;letter-spacing:-0.02em;margin:16px 0 8px 0;color:#333333;">hi ${name}, you're in.</h1>
          <p style="font-size:16px;line-height:1.55;margin:8px 0 24px 0;color:#333333;">
            welcome to the tulip &amp; co. club — a small circle of people who
            appreciate quiet, functional, hand-picked dutch design in san diego.
          </p>

          <div style="background:#ffffff;border:3px solid #333333;border-radius:12px;padding:20px 22px;margin:8px 0 20px 0;">
            <div style="font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;color:#555;">your welcome perk</div>
            <div style="font-size:22px;font-weight:900;color:#333333;margin:6px 0 4px 0;letter-spacing:-0.01em;">10% off your first order</div>
            <div style="font-size:14px;color:#333333;">use code
              <span style="display:inline-block;background:#F6F2E7;border:2px solid #333333;border-radius:6px;padding:2px 8px;font-weight:800;letter-spacing:1px;">${DISCOUNT_CODE}</span>
              at checkout.
            </div>
          </div>

          <a href="${SITE_URL}/shop?discount=${DISCOUNT_CODE}" style="display:inline-block;background:#E05A36;color:#ffffff;font-weight:800;text-transform:lowercase;text-decoration:none;padding:14px 28px;border:3px solid #333333;border-radius:999px;box-shadow:6px 6px 0 #333333;">
            shop now
          </a>
        </td></tr>

        <!-- brand philosophy -->
        <tr><td style="padding:32px 8px 8px 8px;">
          <h2 style="font-family:'Archivo',Inter,Arial,sans-serif;font-size:20px;font-weight:900;text-transform:lowercase;letter-spacing:-0.02em;margin:0 0 10px 0;color:#333333;">what we're about.</h2>
          <p style="font-size:15px;line-height:1.6;margin:0;color:#333333;">
            tulip &amp; co. is built on one idea: mindful minimalism. we import
            small runs of premium dutch stationery, eco-corduroy miffy plushies,
            and quiet everyday objects — and bring them, hand-delivered, to
            pop-ups across san diego. no fluff, no filler. just calm design that
            earns its place on your desk.
          </p>
        </td></tr>

        <!-- collection shortcuts -->
        <tr><td style="padding:24px 8px 8px 8px;">
          <h2 style="font-family:'Archivo',Inter,Arial,sans-serif;font-size:20px;font-weight:900;text-transform:lowercase;letter-spacing:-0.02em;margin:0 0 12px 0;color:#333333;">start here.</h2>
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="padding:0 8px 8px 0;">
              <a href="${SITE_URL}/shop?sort=new" style="display:inline-block;background:#ffffff;border:3px solid #333333;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:800;text-transform:lowercase;color:#333333;text-decoration:none;">new arrivals</a>
            </td>
            <td style="padding:0 8px 8px 0;">
              <a href="${SITE_URL}/shop?sort=bestsellers" style="display:inline-block;background:#ffffff;border:3px solid #333333;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:800;text-transform:lowercase;color:#333333;text-decoration:none;">best sellers</a>
            </td>
            <td style="padding:0 8px 8px 0;">
              <a href="${SITE_URL}/pop-ups" style="display:inline-block;background:#ffffff;border:3px solid #333333;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:800;text-transform:lowercase;color:#333333;text-decoration:none;">pop-up calendar</a>
            </td>
          </tr></table>
        </td></tr>

        <!-- whitelist prompt -->
        <tr><td style="padding:24px 8px 8px 8px;">
          <p style="font-size:13px;line-height:1.5;color:#555;margin:0;background:#ffffff;border:2px dashed #333333;border-radius:12px;padding:12px 14px;">
            quick favor: add <strong style="color:#333333;">${SENDER_ADDRESS}</strong>
            to your contacts so our next pop-up drop lands in your inbox, not the promo tab.
          </p>
        </td></tr>

        <!-- footer -->
        <tr><td style="padding:28px 8px 8px 8px;font-size:12px;color:#555;text-align:center;line-height:1.6;">
          <div>© ${new Date().getFullYear()} tulip &amp; co. — authentic dutch design, san diego, ca.</div>
          <div style="margin-top:6px;">
            <a href="${SITE_URL}/support?tab=contact" style="color:#3D6E97;text-decoration:underline;">contact us</a>
            &nbsp;·&nbsp;
            <a href="{{unsubscribe_url}}" style="color:#3D6E97;text-decoration:underline;">unsubscribe</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function renderText(firstName: string) {
  const name = firstName || "friend";
  return [
    `hi ${name}, welcome to the tulip & co. club.`,
    ``,
    `your welcome perk: 10% off your first order.`,
    `use code ${DISCOUNT_CODE} at checkout — ${SITE_URL}/shop?discount=${DISCOUNT_CODE}`,
    ``,
    `we import small runs of quiet, functional dutch design and bring them,`,
    `hand-delivered, to pop-ups across san diego.`,
    ``,
    `start here:`,
    `  new arrivals — ${SITE_URL}/shop?sort=new`,
    `  best sellers — ${SITE_URL}/shop?sort=bestsellers`,
    `  pop-up calendar — ${SITE_URL}/pop-ups`,
    ``,
    `add ${SENDER_ADDRESS} to your contacts so future drops don't hit the promo tab.`,
    ``,
    `— tulip & co.`,
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
