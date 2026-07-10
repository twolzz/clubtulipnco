// Server-only. RESEND_API_KEY is read from process.env inside the handler —
// never bundled to the client. Sender uses the verified updates.tulipnco.com
// subdomain for list traffic, with replies routed back to hello@tulipnco.com.
import type { PopUp } from "./pop-ups.functions";

const RESEND_API_URL = "https://api.resend.com";
const FROM = "Tulip & Co. <hello@updates.tulipnco.com>";
const REPLY_TO = "hello@tulipnco.com";
const SENDER_ADDRESS = "hello@updates.tulipnco.com";
const SITE_URL = process.env.SITE_URL ?? "https://tulipnco.com";

type ProductRow = {
  name: string;
  category: string;
  price_cents: number;
  bg_color: string;
};

export type AnnounceResult = {
  attempted: number;
  succeeded: number;
  failed: number;
  empty?: boolean;
  errors: string[];
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

  // 1. Generate individual product cards matching the "Mindful Minimalism" aesthetic
  const cells = products
    .slice(0, 4)
    .map(
      (p) => `
      <td width="50%" style="padding: 8px; vertical-align: top;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="background: #FFFFFF; border: 3px solid #000000; border-radius: 12px; overflow: hidden; box-shadow: 4px 4px 0px #000000;">
          <tr>
            <!-- COLOR BLOCK HEADER (Uses dynamic category background colors) -->
            <td style="background: ${p.bg_color || '#F2B73F'}; height: 80px; border-bottom: 3px solid #000000; border-radius: 9px 9px 0 0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding: 16px; font-family: Helvetica, Arial, sans-serif;">
              <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; color: #666666; margin-bottom: 4px;">
                ${p.category}
              </div>
              <div style="font-size: 15px; font-weight: bold; color: #000000; margin-top: 4px; line-height: 1.3;">
                ${p.name}
              </div>
              <div style="font-size: 16px; font-weight: bold; color: #E05A36; margin-top: 10px;">
                ${fmtPrice(p.price_cents)}
              </div>
            </td>
          </tr>
        </table>
      </td>`,
    );

  // 2. Structural safety: Chunk the cells into rows of 2 for clean email table layouts
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 2) {
    rows.push(`<tr>${cells.slice(i, i + 2).join("")}</tr>`);
  }
  const productGridHtml = rows.join("");

  // 3. Output the beautifully structured full De Stijl canvas email
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>new pop-up announced! 🌷</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFFFF; font-family: Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- MAIN CANVAS -->
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; padding: 45px 20px;">
    <tr>
      <td align="center">

        <!-- DE STIJL BOX (4px Bold Black Outline, Warm Cream F9F6F0 Fill) -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #F9F6F0; border: 4px solid #000000; border-radius: 12px; overflow: hidden; text-align: left;">
          <tr>
            <td style="padding: 40px 35px;">

              <!-- BRAND EMBLEM -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <!-- 🚨 IMGUR LINK: Replace this placeholder with your direct Imgur logo link (ends in .png/.jpg) -->
                    <img src="https://i.imgur.com/ZFYdjIv.png" alt="tulip & co." style="max-width: 140px; height: auto; display: block; border: 0;">
                  </td>
                </tr>
              </table>

              <!-- MAIN ACCENT BADGE -->
              <div style="text-align: center; margin-bottom: 20px;">
                <span style="background-color: #E05A36; color: #FFFFFF; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; padding: 6px 16px; border: 2px solid #000000; border-radius: 20px; display: inline-block;">
                  live calendar drop
                </span>
              </div>

              <!-- HERO HEADLINE -->
              <h1 style="margin: 0 0 24px 0; font-size: 28px; font-weight: bold; color: #000000; line-height: 1.2; letter-spacing: -0.8px; text-align: center;">
                we're heading out live.
              </h1>

              <!-- BRIEF COPY -->
              <p style="margin: 0 0 32px 0; font-size: 16px; color: #000000; line-height: 1.6; text-align: center;">
                we are locking in weekend locations in San Diego's trendiest neighborhoods. come feel the fabrics, test the premium writing utensils, and explore our collections in person.
              </p>

              <!-- FEATURED EVENT DETAILS CARD -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #FFFFFF; border: 3px solid #000000; border-radius: 8px; margin-bottom: 32px; box-shadow: 4px 4px 0px #000000;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: bold; color: #E05A36; letter-spacing: 1px; text-transform: uppercase;">
                      featured event
                    </p>
                    <h2 style="margin: 0 0 12px 0; font-size: 22px; font-weight: bold; color: #000000;">
                      ${popUp.name}
                    </h2>
                    
                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 15px; color: #000000; font-family: Helvetica, Arial, sans-serif;">
                          <strong>date &amp; time:</strong> ${fmtDate(popUp.event_date)}${time ? ` (${time})` : ""}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 15px; color: #000000; font-family: Helvetica, Arial, sans-serif;">
                          <strong>location:</strong> ${popUp.location}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- PRODUCT SPOTLIGHT SECTION -->
              <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: bold; color: #000000; text-transform: uppercase; letter-spacing: 1px;">
                on the shelves:
              </p>
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 35px;">
                ${productGridHtml}
              </table>

              <!-- HIGH-CONVERSION CTA (Pill-shaped Terracotta Red Button) -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 40px;">
                <tr>
                  <td align="center">
                    <a href="${SITE_URL}/pop-ups" style="background-color: #E05A36; color: #FFFFFF; border: 3px solid #000000; border-radius: 50px; padding: 14px 36px; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; text-align: center; box-shadow: 0 4px 0px #000000;">
                      view upcoming dates
                    </a>
                  </td>
                </tr>
              </table>

              <!-- SOPHISTICATED BRAND STATEMENT -->
              <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold; color: #000000;">
                mindful minimalism.
              </p>
              <p style="margin: 0; font-size: 14px; color: #666666; line-height: 1.5;">
                tulip & co. bridges the gap between authentic, premium dutch craftsmanship and the southern california retail space. we hand-deliver curated, licensed design right to your neighborhood.
              </p>

            </td>
          </tr>
        </table>

        <!-- FOOTER -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; margin-top: 24px; text-align: center;">
          <tr>
            <td style="font-size: 12px; color: #888888; line-height: 1.6; padding: 0 10px; font-family: Helvetica, Arial, sans-serif;">
              you are receiving this because you subscribed to tulip & co. updates.<br>
              ${SENDER_ADDRESS}<br><br>
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

function renderText(popUp: PopUp, products: ProductRow[]) {
  const time =
    popUp.start_time && popUp.end_time
      ? `${popUp.start_time.slice(0, 5)} – ${popUp.end_time.slice(0, 5)}`
      : "";

  // 1. Format the top 4 featured products for clean plain-text readability
  const productList = products
    .slice(0, 4)
    .map((p) => `  • [${p.category.toUpperCase()}] ${p.name} — ${fmtPrice(p.price_cents)}`)
    .join("\n");

  // 2. Output the unified copy matching our redesigned De Stijl HTML layout
  return [
    `new pop-up announced! 🌷`,
    ``,
    `we are heading out live. we are locking in weekend locations in San Diego's trendiest neighborhoods. come feel the fabrics, test the premium writing utensils, and explore our collections in person.`,
    ``,
    `featured event:`,
    `  event: ${popUp.name}`,
    `  date & time: ${fmtDate(popUp.event_date)}${time ? ` (${time})` : ""}`,
    `  location: ${popUp.location}`,
    ``,
    `on the shelves:`,
    productList,
    ``,
    `view upcoming dates:`,
    `  ${SITE_URL}/pop-ups`,
    ``,
    `mindful minimalism.`,
    `tulip & co. bridges the gap between authentic, premium dutch craftsmanship and the southern california retail space. we hand-deliver curated, licensed design right to your neighborhood.`,
    ``,
    `— tulip & co.`,
    ``,
    `you are receiving this because you subscribed to tulip & co. updates.`,
    `${SENDER_ADDRESS}`,
    `unsubscribe: {{unsubscribe_url}}`,
  ].join("\n");
}

export async function sendPopUpAnnouncement(
  popUp: PopUp,
): Promise<AnnounceResult> {
  const result: AnnounceResult = {
    attempted: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      const msg = `[announce] ALERT: missing RESEND_API_KEY — cannot send.`;
      console.error(msg);
      result.errors.push(msg);
      return result;
    }

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const admin = supabaseAdmin as any;

    // ---- Subscribers ----
    const { data: subs, error: subErr } = await admin
      .from("subscribers")
      .select("email");
    if (subErr) {
      console.error("[announce] subscribers query failed:", {
        code: (subErr as any).code,
        message: subErr.message,
        details: (subErr as any).details,
        hint: (subErr as any).hint,
      });
      result.errors.push(`subscribers query failed: ${subErr.message}`);
      return result;
    }

    const emails = Array.from(
      new Set(
        ((subs as { email: string }[] | null) ?? [])
          .map((s) => (s.email ?? "").trim().toLowerCase())
          .filter((e) => e.length > 0),
      ),
    );

    if (emails.length === 0) {
      console.warn(
        "[announce] ALERT: subscribers table returned 0 rows — nothing to send for pop-up:",
        { id: popUp.id, name: popUp.name },
      );
      result.empty = true;
      return result;
    }

    // ---- Products (optional; failure logged but does not abort send) ----
    let products: ProductRow[] = [];
    try {
      const { data: prods, error: prodErr } = await admin
        .from("products")
        .select("name, category, price_cents, bg_color")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(4);
      if (prodErr) {
        console.error("[announce] products query failed (non-fatal):", {
          code: (prodErr as any).code,
          message: prodErr.message,
        });
      } else {
        products = ((prods as ProductRow[] | null) ?? []) as ProductRow[];
      }
    } catch (e) {
      console.error("[announce] products query threw (non-fatal):", e);
    }

    const html = renderHtml(popUp, products);
    const text = renderText(popUp, products);
    const subject = `new san diego pop-up — ${fmtDate(popUp.event_date)}`;
    const headers = {
      "List-Unsubscribe": `<mailto:${REPLY_TO}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };

    result.attempted = emails.length;
    console.log("[announce] attempt", {
      popUp: popUp.name,
      recipients: emails.length,
      from: FROM,
    });

    // ---- Resend batch API: up to 100 individual messages per call ----
    const BATCH = 100;
    for (let i = 0; i < emails.length; i += BATCH) {
      const chunk = emails.slice(i, i + BATCH);
      const payload = chunk.map((to) => ({
        from: FROM,
        to: [to],
        reply_to: REPLY_TO,
        subject,
        html,
        text,
        headers,
      }));

      try {
        const res = await fetch(`${RESEND_API_URL}/emails/batch`, {
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
          console.error("[announce] resend batch failed", {
            httpStatus: res.status,
            statusCode: parsed?.statusCode,
            name: parsed?.name,
            message: parsed?.message ?? raw,
            chunkIndex: i / BATCH,
            chunkSize: chunk.length,
          });
          result.failed += chunk.length;
          result.errors.push(
            `batch ${i / BATCH}: ${parsed?.name ?? res.status} — ${parsed?.message ?? raw ?? "unknown"}`,
          );
          continue;
        }

        // Success shape: { data: [{ id }, ...] }
        const body = (await res.json().catch(() => null)) as {
          data?: Array<{ id?: string }>;
        } | null;
        const ids = body?.data?.filter((d) => d?.id).length ?? chunk.length;
        result.succeeded += ids;
        if (ids < chunk.length) result.failed += chunk.length - ids;
      } catch (err) {
        const e = err as Error;
        console.error("[announce] resend batch threw", {
          name: e.name,
          message: e.message,
          stack: e.stack,
          chunkIndex: i / BATCH,
          chunkSize: chunk.length,
        });
        result.failed += chunk.length;
        result.errors.push(`batch ${i / BATCH} threw: ${e.message}`);
      }
    }

    console.log("[announce] sent", {
      popUp: popUp.name,
      attempted: result.attempted,
      succeeded: result.succeeded,
      failed: result.failed,
    });
    return result;
  } catch (err) {
    const e = err as Error;
    console.error("[announce] fatal error", {
      name: e.name,
      message: e.message,
      stack: e.stack,
    });
    result.errors.push(`fatal: ${e.message}`);
    return result;
  }
}
