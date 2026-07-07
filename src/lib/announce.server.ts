// Server-only. RESEND_API_KEY is read from process.env inside the handler —
// never bundled to the client. Sender uses the verified updates.tulipnco.com
// subdomain for list traffic, with replies routed back to hello@tulipnco.com.
import type { PopUp } from "./pop-ups.functions";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";
const FROM = "Tulip & Co. <hello@updates.tulipnco.com>";
const REPLY_TO = "hello@tulipnco.com";
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

  const cells = products
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
    );

  // pair cells into rows of 2
  const rows: string[] = [];
  for (let i = 0; i < cells.length; i += 2) {
    rows.push(`<tr>${cells[i] ?? ""}${cells[i + 1] ?? ""}</tr>`);
  }

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
          rows.length
            ? `<tr><td style="padding:36px 8px 8px 8px;">
          <h2 style="font-family:'Archivo',Inter,Arial,sans-serif;font-size:22px;font-weight:900;text-transform:lowercase;letter-spacing:-0.02em;margin:0 0 12px 0;color:#333333;">a curated look at what we're bringing.</h2>
        </td></tr>
        <tr><td>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rows.join("")}
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
    const lovableKey = process.env.LOVABLE_API_KEY;
    const resendKey = process.env.RESEND_API_KEY;
    if (!lovableKey || !resendKey) {
      const msg = `[announce] ALERT: missing ${!lovableKey ? "LOVABLE_API_KEY" : ""}${!lovableKey && !resendKey ? " and " : ""}${!resendKey ? "RESEND_API_KEY" : ""} — cannot send.`;
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
    const text = renderText(popUp);
    const subject = `new san diego pop-up — ${fmtDate(popUp.event_date)}`;
    const headers = {
      "List-Unsubscribe": `<mailto:${REPLY_TO}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };

    result.attempted = emails.length;

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
        const res = await fetch(`${GATEWAY_URL}/emails/batch`, {
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
