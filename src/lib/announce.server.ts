import type { PopUp } from "./pop-ups.functions";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM = "Tulip & Co. <onboarding@resend.dev>";
const REPLY_TO = "hello@tulipnco.com";
const SITE_URL = process.env.SITE_URL ?? "https://tulipnco.com";

type ProductRow = {
  name: string;
  category: string;
  price_cents: number;
  bg_color: string;
};

function fmtDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function fmtPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function renderHtml(popUp: PopUp, products: ProductRow[]) {
  const time =
    popUp.start_time && popUp.end_time
      ? `${popUp.start_time.slice(0, 5)} – ${popUp.end_time.slice(0, 5)}`
      : "";

  const productCells = products
    .slice(0, 4)
    .map(
      (p) => `
      <td width="50%" style="padding:8px;vertical-align:top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border:4px solid #333333;border-radius:16px;box-shadow:6px 6px 0 #F2B73F;">
          <tr>
            <td style="background:${p.bg_color};height:80px;border-bottom:4px solid #333333;border-radius:12px 12px 0 0;"></td>
          </tr>
          <tr>
            <td style="padding:12px 14px;font-family:Inter,Arial,sans-serif;">
              <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#555;">${p.category}</div>
              <div style="font-size:15px;font-weight:800;color:#333333;margin-top:4px;">${p.name}</div>
              <div style="font-size:16px;font-weight:800;color:#333333;margin-top:8px;">${fmtPrice(p.price_cents)}</div>
            </td>
          </tr>
        </table>
      </td>`,
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8" /><title>new pop-up: ${popUp.name}</title></head>
<body style="margin:0;padding:0;background:#F6F2E7;font-family:Inter,Arial,sans-serif;color:#333333;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F2E7;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;">
        <tr><td style="padding:0 8px 24px 8px;">
          <div style="font-family:'Archivo',Inter,Arial,sans-serif;font-size:20px;font-weight:800;text-transform:lowercase;letter-spacing:-0.02em;">tulip &amp; co.</div>
        </td></tr>

        <tr><td style="background:#F6F2E7;border:4px solid #333333;border-radius:16px;box-shadow:12px 12px 0 #E05A36;padding:32px;">
          <div style="display:inline-block;background:#F2B73F;border:3px solid #333333;border-radius:999px;padding:4px 14px;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:1.5px;">new pop-up</div>
          <h1 style="font-family:'Archivo',Inter,Arial,sans-serif;font-size:36px;line-height:1.05;font-weight:900;text-transform:lowercase;letter-spacing:-0.02em;margin:16px 0 8px 0;color:#333333;">${popUp.name}.</h1>
          <p style="font-size:18px;font-weight:600;margin:0 0 4px 0;color:#333333;">${fmtDate(popUp.event_date)}</p>
          <p style="font-size:16px;margin:0 0 4px 0;color:#333333;">${popUp.location}</p>
          ${time ? `<p style="font-size:14px;font-weight:600;margin:0 0 24px 0;color:#555;">${time}</p>` : ""}

          <p style="font-size:16px;line-height:1.55;margin:16px 0 28px 0;color:#333333;">
            feel the corduroy. test the pens. take home a piece of quiet dutch design —
            hand-delivered right here in san diego.
          </p>

          <a href="${SITE_URL}/pop-ups" style="display:inline-block;background:#F2B73F;color:#333333;font-weight:800;text-transform:lowercase;text-decoration:none;padding:14px 28px;border:3px solid #333333;border-radius:999px;box-shadow:6px 6px 0 #333333;">
            see the calendar
          </a>
        </td></tr>

        ${
          products.length
            ? `<tr><td style="padding:36px 8px 8px 8px;">
          <h2 style="font-family:'Archivo',Inter,Arial,sans-serif;font-size:22px;font-weight:900;text-transform:lowercase;letter-spacing:-0.02em;margin:0 0 12px 0;color:#333333;">a curated look at what we're bringing.</h2>
        </td></tr>
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>${productCells.slice(0, productCells.length / 2 + productCells.indexOf("</td>", productCells.length / 2))}</tr>
          </table>
        </td></tr>`
            : ""
        }

        <tr><td style="padding:36px 8px 8px 8px;font-size:12px;color:#555;text-align:center;">
          <div>© ${new Date().getFullYear()} tulip &amp; co. — authentic dutch design, san diego.</div>
          <div style="margin-top:6px;">
            <a href="${SITE_URL}/support?tab=contact" style="color:#3D6E97;text-decoration:underline;">contact us</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function renderText(popUp: PopUp) {
  const time =
    popUp.start_time && popUp.end_time
      ? ` (${popUp.start_time.slice(0, 5)}–${popUp.end_time.slice(0, 5)})`
      : "";
  return [
    `new pop-up: ${popUp.name}`,
    ``,
    `${fmtDate(popUp.event_date)}${time}`,
    `${popUp.location}`,
    ``,
    `see the calendar: ${SITE_URL}/pop-ups`,
    ``,
    `— tulip & co.`,
  ].join("\n");
}

export async function sendPopUpAnnouncement(popUp: PopUp): Promise<number> {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  if (!lovableKey || !resendKey) {
    console.warn("[announce] missing LOVABLE_API_KEY or RESEND_API_KEY");
    return 0;
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as unknown as ReturnType<
    typeof import("@supabase/supabase-js").createClient
  >;

  const { data: subs, error: subErr } = await admin
    .from("subscribers")
    .select("email");
  if (subErr) {
    console.error("[announce] subscribers query failed:", subErr.message);
    return 0;
  }
  const emails = ((subs as { email: string }[] | null) ?? [])
    .map((s) => s.email)
    .filter(Boolean);
  if (!emails.length) return 0;

  const { data: prods } = await admin
    .from("products")
    .select("name, category, price_cents, bg_color")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .limit(4);
  const products = ((prods as ProductRow[] | null) ?? []) as ProductRow[];

  const html = renderHtml(popUp, products);
  const text = renderText(popUp);
  const subject = `new san diego pop-up — ${fmtDate(popUp.event_date)}`;

  // Batch into groups of 50 as BCC
  const BATCH = 50;
  let ok = 0;
  for (let i = 0; i < emails.length; i += BATCH) {
    const bcc = emails.slice(i, i + BATCH);
    try {
      const res = await fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": resendKey,
        },
        body: JSON.stringify({
          from: FROM,
          to: [REPLY_TO],
          bcc,
          reply_to: REPLY_TO,
          subject,
          html,
          text,
          headers: {
            "List-Unsubscribe": `<mailto:${REPLY_TO}?subject=unsubscribe>`,
          },
        }),
      });
      if (res.ok) {
        ok += bcc.length;
      } else {
        const body = await res.text();
        console.error(`[announce] resend batch ${i} failed:`, res.status, body);
      }
    } catch (err) {
      console.error(`[announce] resend batch ${i} threw:`, err);
    }
  }
  return ok;
}
