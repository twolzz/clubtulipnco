// Server-only delivery for the /support contact form.
//
// Before this file existed, the form called preventDefault(), showed a success
// toast, and threw the message away. Customers were being told "we'll be in
// touch within 24-48 hours" about messages that were never sent anywhere.
//
// RESEND_API_KEY is read from process.env inside the handler, so it is never
// bundled into the browser build.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RESEND_API_URL = "https://api.resend.com";
const FROM = "Tulip & Co. <hello@updates.tulipnco.com>";
const INBOX = "hello@tulipnco.com";

const supportInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  message: z.string().trim().min(1).max(5000),
});

export type SupportResult = { ok: true } | { ok: false; error: "invalid" | "server" };

function esc(str: string) {
  return str.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" :
    c === "<" ? "&lt;" :
    c === ">" ? "&gt;" :
    c === '"' ? "&quot;" : "&#39;",
  );
}

export const sendSupportMessage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => supportInput.parse(input))
  .handler(async ({ data }): Promise<SupportResult> => {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error("[support] ALERT: missing RESEND_API_KEY, message dropped", {
        from: data.email,
      });
      return { ok: false, error: "server" };
    }

    const name = esc(data.name);
    const email = esc(data.email);
    const message = esc(data.message).replace(/\n/g, "<br>");

    const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:24px;background-color:#F9F6F0;font-family:Arial,Helvetica,sans-serif;color:#000000;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;margin:0 auto;">
    <tr><td>
      <p style="font-size:20px;font-weight:900;margin:0 0 24px;letter-spacing:-0.5px;">New support message</p>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
        <tr>
          <td width="33%" height="4" style="background-color:#E05A36;"></td>
          <td width="33%" height="4" style="background-color:#F2B73F;"></td>
          <td width="34%" height="4" style="background-color:#3D6E97;"></td>
        </tr>
      </table>
      <p style="font-size:15px;line-height:1.7;margin:0 0 6px;"><strong>From:</strong> ${name}</p>
      <p style="font-size:15px;line-height:1.7;margin:0 0 24px;"><strong>Email:</strong> <a href="mailto:${email}" style="color:#3D6E97;">${email}</a></p>
      <div style="background-color:#FFFFFF;border:3px solid #000000;border-radius:16px;padding:20px;font-size:15px;line-height:1.7;">
        ${message}
      </div>
      <p style="font-size:13px;color:#666666;margin:24px 0 0;">Reply directly to this email to answer ${name}.</p>
    </td></tr>
  </table>
</body>
</html>`;

    const text = [
      `New support message`,
      ``,
      `From:  ${data.name}`,
      `Email: ${data.email}`,
      ``,
      data.message,
    ].join("\n");

    try {
      const res = await fetch(`${RESEND_API_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: FROM,
          to: [INBOX],
          // Hitting reply in the inbox answers the customer, not the robot.
          reply_to: data.email,
          subject: `Support: ${data.name}`,
          html,
          text,
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error("[support] resend send failed", {
          httpStatus: res.status,
          detail: detail.slice(0, 500),
          from: data.email,
        });
        return { ok: false, error: "server" };
      }

      return { ok: true };
    } catch (err) {
      const e = err as Error;
      console.error("[support] resend threw", { name: e.name, message: e.message });
      return { ok: false, error: "server" };
    }
  });
