// Server-only in practice: only imported by the Stripe webhook route handler.
// RESEND_API_KEY is read from process.env inside the handler and never
// bundled to the client.
//
// This is a TRANSACTIONAL email. It carries no unsubscribe link and no
// List-Unsubscribe headers, and buying does not subscribe anyone to the
// marketing list — that stays opt-in through the subscribe form.

const RESEND_API_URL = "https://api.resend.com";
const FROM = "Tulip & Co. <hello@updates.tulipnco.com>";
const REPLY_TO = "hello@tulipnco.com";
const SITE_URL = process.env.SITE_URL ?? "https://club.tulipnco.com";

export type OrderLine = {
  product_name: string | null;
  quantity: number;
  price_at_purchase: number;
};

export type ShippingAddress = {
  name?: string | null;
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
};

export type ConfirmationResult = {
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

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Short, human-quotable order reference taken from the order UUID. */
export function orderRef(orderId: string) {
  return orderId.replace(/-/g, "").slice(0, 8).toUpperCase();
}

function firstNameFrom(shipping: ShippingAddress | null) {
  const full = (shipping?.name ?? "").trim();
  if (!full) return "there";
  return full.split(/\s+/)[0];
}

function addressBlock(shipping: ShippingAddress | null) {
  if (!shipping) return "";
  const parts = [
    shipping.name,
    shipping.line1,
    shipping.line2,
    [shipping.city, shipping.state, shipping.postal_code].filter(Boolean).join(", "),
  ].filter(Boolean) as string[];
  return parts.map((p) => esc(p)).join("<br>");
}

function renderHtml(
  orderId: string,
  lines: OrderLine[],
  amountCents: number,
  shipping: ShippingAddress | null,
) {
  const name = esc(firstNameFrom(shipping));
  const ref = orderRef(orderId);

  const itemRows = lines
    .map((l) => {
      const label = esc(l.product_name ?? "Item");
      const qty = l.quantity;
      const lineTotal = money(l.price_at_purchase * l.quantity);
      return `
                  <tr>
                    <td style="padding: 14px 0; border-bottom: 1px solid #00000022; color: #000000; font-size: 15px; font-weight: 500; line-height: 1.5;">
                      ${label}<br>
                      <span style="font-size: 13px; color: #00000099;">Qty ${qty}</span>
                    </td>
                    <td align="right" style="padding: 14px 0; border-bottom: 1px solid #00000022; color: #000000; font-size: 15px; font-weight: bold; white-space: nowrap;">
                      ${lineTotal}
                    </td>
                  </tr>`;
    })
    .join("");

  const shipHtml = addressBlock(shipping);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Tulip &amp; Co. order</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F6F0; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #F9F6F0;">
    <tr>
      <td align="center" style="padding: 60px 20px;">

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
                Thank you, ${name}.
              </h1>

              <p style="color: #000000; font-size: 16px; line-height: 1.7; font-weight: 500; margin: 0 0 20px 0;">
                Your order is confirmed. We're getting it wrapped and on its way to you.
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.7; font-weight: 500; margin: 0 0 40px 0;">
                Order <strong>#${ref}</strong> — keep this handy if you need to reach us about it.
              </p>

              <!-- order summary -->
              <p style="color: #000000; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 8px 0;">
                Your order
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top: 2px solid #000000; margin-bottom: 8px;">
                ${itemRows}
                <tr>
                  <td style="padding: 18px 0 0 0; color: #000000; font-size: 16px; font-weight: bold;">
                    Total
                  </td>
                  <td align="right" style="padding: 18px 0 0 0; color: #000000; font-size: 20px; font-weight: bold; white-space: nowrap;">
                    ${money(amountCents)}
                  </td>
                </tr>
              </table>

              <div style="height: 40px; line-height: 40px; font-size: 40px;">&nbsp;</div>

              ${
                shipHtml
                  ? `<!-- shipping -->
              <p style="color: #000000; font-size: 12px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin: 0 0 8px 0;">
                Shipping to
              </p>
              <p style="color: #000000; font-size: 15px; line-height: 1.7; font-weight: 500; margin: 0 0 40px 0;">
                ${shipHtml}
              </p>`
                  : ""
              }

              <p style="color: #000000; font-size: 16px; line-height: 1.7; font-weight: 500; margin: 0 0 40px 0;">
                We'll send another note the moment it ships. If anything looks wrong, just reply to this email — it comes straight to me.
              </p>

              <!-- simple pill button -->
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="background-color: #E05A36; border: 2px solid #000000; border-radius: 50px; box-shadow: 3px 3px 0px 0px #000000;">
                    <a href="${SITE_URL}/shop" style="display: block; padding: 14px 32px; color: #ffffff; font-size: 15px; font-weight: bold; text-decoration: none;">
                      Keep browsing
                    </a>
                  </td>
                </tr>
              </table>

              <div style="height: 70px; line-height: 70px; font-size: 70px;">&nbsp;</div>

              <!-- clean footer -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="border-top: 2px solid #000000; padding-top: 30px;">
                    <p style="color: #000000; font-size: 12px; line-height: 1.6; margin: 0; font-weight: 500;">
                      Tulip &amp; Co. — San Diego, CA.<br>
                      Questions? <a href="mailto:${REPLY_TO}" style="color: #000000; text-decoration: underline;">${REPLY_TO}</a>
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

function renderText(
  orderId: string,
  lines: OrderLine[],
  amountCents: number,
  shipping: ShippingAddress | null,
) {
  const name = firstNameFrom(shipping);
  const ref = orderRef(orderId);

  const itemLines = lines.map(
    (l) =>
      `  ${l.product_name ?? "Item"} x${l.quantity} — ${money(
        l.price_at_purchase * l.quantity,
      )}`,
  );

  const ship = shipping
    ? [
        ``,
        `Shipping to:`,
        ...[
          shipping.name,
          shipping.line1,
          shipping.line2,
          [shipping.city, shipping.state, shipping.postal_code]
            .filter(Boolean)
            .join(", "),
        ]
          .filter(Boolean)
          .map((p) => `  ${p}`),
      ]
    : [];

  return [
    `Thank you, ${name}.`,
    ``,
    `Your order is confirmed. We're getting it wrapped and on its way to you.`,
    ``,
    `Order #${ref}`,
    ``,
    `Your order:`,
    ...itemLines,
    ``,
    `Total: ${money(amountCents)}`,
    ...ship,
    ``,
    `We'll send another note the moment it ships. If anything looks wrong, just reply to this email — it comes straight to me.`,
    ``,
    `Keep browsing:`,
    `  ${SITE_URL}/shop`,
    ``,
    `Thanks again,`,
    `Thimo`,
    ``,
    `--`,
    `Tulip & Co. — San Diego, CA.`,
    `Questions? ${REPLY_TO}`,
  ].join("\n");
}

export async function sendOrderConfirmationEmail(params: {
  orderId: string;
  email: string;
  amountCents: number;
  lines: OrderLine[];
  shipping: ShippingAddress | null;
}): Promise<ConfirmationResult> {
  const { orderId, email, amountCents, lines, shipping } = params;

  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      const msg = `[order-confirmation] ALERT: missing RESEND_API_KEY — cannot send receipt.`;
      console.error(msg);
      return { ok: false, skipped: true, error: msg };
    }

    const to = email.trim().toLowerCase();
    if (!to) {
      console.warn("[order-confirmation] empty email — skipping.", { orderId });
      return { ok: false, skipped: true, error: "empty email" };
    }

    const payload = {
      from: FROM,
      to: [to],
      reply_to: REPLY_TO,
      subject: `Your Tulip & Co. order #${orderRef(orderId)}`,
      html: renderHtml(orderId, lines, amountCents, shipping),
      text: renderText(orderId, lines, amountCents, shipping),
    };

    console.log("[order-confirmation] attempt", { to, orderId });
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
      console.error("[order-confirmation] resend send failed", {
        httpStatus: res.status,
        statusCode: parsed?.statusCode,
        name: parsed?.name,
        message: parsed?.message ?? raw,
        to,
        orderId,
      });
      return {
        ok: false,
        error: `${parsed?.name ?? res.status}: ${parsed?.message ?? raw ?? "unknown"}`,
      };
    }

    const body = (await res.json().catch(() => null)) as { id?: string } | null;
    console.log("[order-confirmation] sent", { to, orderId, id: body?.id });
    return { ok: true };
  } catch (err) {
    const e = err as Error;
    console.error("[order-confirmation] fatal error", {
      name: e.name,
      message: e.message,
      stack: e.stack,
    });
    return { ok: false, error: `fatal: ${e.message}` };
  }
}
