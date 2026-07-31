// Server-only. Called by the pop-up database webhook — see
// src/routes/api/webhooks/pop-up-announce.ts for what triggers this.
//
// Only ever sent to people with unsubscribed_at IS NULL. This was the exact
// bug fixed in the previous (now-deleted) announce.server.ts: the query had
// no filter, so opted-out people kept receiving every blast. Do not remove
// the .is("unsubscribed_at", null) filter below.

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const RESEND_API_URL = "https://api.resend.com";
const FROM = "Tulip & Co. <hello@club.tulipnco.com>";
const REPLY_TO = "hello@tulipnco.com";

export type PopUpRow = {
  id: string;
  name: string;
  location: string;
  event_date: string; // YYYY-MM-DD
  start_time: string | null; // HH:MM:SS
  end_time: string | null;
  tag: string;
};

/**
 * Read inside a handler, never at module scope: Cloudflare Workers inject
 * bindings per request, so process.env is still empty when this module is
 * first evaluated.
 */
function siteUrl() {
  return process.env.SITE_URL ?? "https://club.tulipnco.com";
}

function adminClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  ) as any;
}

function esc(str: string) {
  return str.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" :
    c === "<" ? "&lt;" :
    c === ">" ? "&gt;" :
    c === '"' ? "&quot;" : "&#39;",
  );
}

function unsubscribeUrlFor(email: string) {
  return `${siteUrl()}/unsubscribe?email=${encodeURIComponent(email)}`;
}

/** Same redirect the public /pop-ups page uses — one implementation for both. */
function directionsUrlFor(location: string) {
  return `${siteUrl()}/api/public/maps?address=${encodeURIComponent(location)}`;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function fmtDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function fmtTimeRange(start: string | null, end: string | null) {
  if (!start || !end) return null;
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const hh = ((h + 11) % 12) + 1;
    const am = h < 12 ? "AM" : "PM";
    return `${hh}:${String(m).padStart(2, "0")} ${am}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

function renderHtml(popUp: PopUpRow, unsubscribeUrl: string) {
  const name = esc(popUp.name);
  const location = esc(popUp.location);
  const tag = esc(popUp.tag);
  const dateLine = esc(fmtDate(popUp.event_date));
  const timeRange = fmtTimeRange(popUp.start_time, popUp.end_time);
  const directionsUrl = directionsUrlFor(popUp.location);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — Tulip &amp; Co.</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F6F0; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #F9F6F0;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 440px; text-align: left;">
          <tr>
            <td>

              <!-- brand header, links home -->
              <p style="margin: 0 0 35px 0;">
                <a href="${siteUrl()}" style="color: #000000; text-decoration: none;">
                  <span style="color: #000000; font-size: 20px; font-weight: 900; letter-spacing: -0.5px; text-decoration: none;">Tulip &amp; Co.</span>
                </a>
              </p>

              <!-- de stijl color accent divider -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 40px;">
                <tr>
                  <td width="33%" height="4" style="background-color: #E05A36; border: 2px solid #000000;"></td>
                  <td width="33%" height="4" style="background-color: #F2B73F; border: 2px solid #000000; border-left: none;"></td>
                  <td width="34%" height="4" style="background-color: #3D6E97; border: 2px solid #000000; border-left: none;"></td>
                </tr>
              </table>

              <span style="display: inline-block; padding: 4px 14px; background-color: #F9F6F0; border: 2px solid #000000; border-radius: 999px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 20px;">
                ${tag}
              </span>

              <h1 style="color: #000000; font-size: 28px; font-weight: bold; margin: 16px 0 20px 0; letter-spacing: -0.5px;">
                ${name}
              </h1>

              <p style="color: #000000; font-size: 16px; line-height: 1.7; font-weight: 500; margin: 0 0 4px 0;">
                ${dateLine}${timeRange ? ` · ${timeRange}` : ""}
              </p>
              <p style="color: #000000; font-size: 16px; line-height: 1.7; font-weight: 500; margin: 0 0 40px 0;">
                ${location}
              </p>

              <!-- simple pill button -->
              <table cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="background-color: #E05A36; border: 2px solid #000000; border-radius: 50px; box-shadow: 3px 3px 0px 0px #000000;">
                    <a href="${directionsUrl}" style="display: block; padding: 14px 32px; color: #ffffff; font-size: 15px; font-weight: bold; text-decoration: none;">
                      Get directions
                    </a>
                  </td>
                </tr>
              </table>

              <!-- spacer -->
              <div style="height: 40px; line-height: 40px; font-size: 40px;">&nbsp;</div>

              <!-- clean footer & unsubscribe -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="border-top: 2px solid #000000; padding-top: 30px;">
                    <p style="color: #000000; font-size: 12px; line-height: 1.6; margin: 0; font-weight: 500;">
                      Tulip &amp; Co. — San Diego, CA.<br><br>
                      <a href="${unsubscribeUrl}" style="color: #000000; text-decoration: underline;">Unsubscribe</a>
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

function renderText(popUp: PopUpRow, unsubscribeUrl: string) {
  const timeRange = fmtTimeRange(popUp.start_time, popUp.end_time);
  return [
    `${popUp.tag}`,
    ``,
    popUp.name,
    `${fmtDate(popUp.event_date)}${timeRange ? ` · ${timeRange}` : ""}`,
    popUp.location,
    ``,
    `Get directions:`,
    `  ${directionsUrlFor(popUp.location)}`,
    ``,
    `--`,
    `Tulip & Co. — San Diego, CA.`,
    `unsubscribe: ${unsubscribeUrl}`,
  ].join("\n");
}

export type AnnounceResult =
  | { ok: true; sentTo: number }
  | { ok: false; error: string };

export async function sendPopUpAnnouncement(popUp: PopUpRow): Promise<AnnounceResult> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { ok: false, error: "missing RESEND_API_KEY" };
  }

  const admin = adminClient();

  // Only people who are still opted in.
  const { data: subs, error: subErr } = await admin
    .from("subscribers")
    .select("email")
    .is("unsubscribed_at", null);

  if (subErr) {
    console.error("[pop-up-announce] subscribers query failed:", subErr.message);
    return { ok: false, error: subErr.message };
  }

  const emails = (subs ?? []).map((s: { email: string }) => s.email).filter(Boolean);

  if (emails.length === 0) {
    console.warn("[pop-up-announce] 0 opted-in subscribers — nothing to send for:", popUp.id);
    return { ok: true, sentTo: 0 };
  }

  const subject = `new san diego pop-up — ${fmtDate(popUp.event_date)}`;
  const oneClickEndpoint = `${siteUrl()}/api/public/unsubscribe`;

  // Resend's batch endpoint accepts up to 100 emails per call.
  const CHUNK = 100;
  let sentTo = 0;

  for (let i = 0; i < emails.length; i += CHUNK) {
    const chunk = emails.slice(i, i + CHUNK);

    // Rendered per recipient: the unsubscribe link has to carry that
    // person's address, so one shared body cannot be reused across the batch.
    const payload = chunk.map((to: string) => {
      const unsubscribeUrl = unsubscribeUrlFor(to);
      return {
        from: FROM,
        to: [to],
        reply_to: REPLY_TO,
        subject,
        html: renderHtml(popUp, unsubscribeUrl),
        text: renderText(popUp, unsubscribeUrl),
        headers: {
          "List-Unsubscribe": `<${oneClickEndpoint}?email=${encodeURIComponent(to)}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });

    const res = await fetch(`${RESEND_API_URL}/emails/batch`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[pop-up-announce] resend batch failed", {
        httpStatus: res.status,
        detail: detail.slice(0, 500),
      });
      return { ok: false, error: `resend ${res.status}` };
    }

    sentTo += chunk.length;
  }

  console.log("[pop-up-announce] sent", { popUpId: popUp.id, sentTo });
  return { ok: true, sentTo };
}
