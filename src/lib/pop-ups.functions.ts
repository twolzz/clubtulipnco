import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PopUp = {
  id: string;
  name: string;
  location: string;
  event_date: string; // ISO date
  start_time: string | null;
  end_time: string | null;
  tag: string;
  accent: "poppy" | "sun" | "sage" | "denim";
  is_published: boolean;
};

function publicClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    },
  ) as any;
}

const SELECT =
  "id, name, location, event_date, start_time, end_time, tag, accent, is_published";

export const listPopUps = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("pop_ups")
    .select(SELECT)
    .eq("is_published", true)
    .order("event_date", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PopUp[];
});

export const listAllPopUps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const client = context.supabase as unknown as any;
    const { data, error } = await client
      .from("pop_ups")
      .select(SELECT)
      .order("event_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as unknown as PopUp[];
  });

const popUpInput = z.object({
  name: z.string().trim().min(1).max(120),
  location: z.string().trim().min(1).max(200),
  event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  tag: z.string().trim().min(1).max(40),
  accent: z.enum(["poppy", "sun", "sage", "denim"]),
  is_published: z.boolean().default(true),
  send_announcement: z.boolean().default(true),
});

export const createPopUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => popUpInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const client = context.supabase as unknown as any;
    const { send_announcement, ...row } = data;
    const { data: inserted, error } = await client
      .from("pop_ups")
      .insert({ ...row, created_by: context.userId })
      .select(SELECT)
      .single();
    if (error) throw new Error(error.message);

    let announce: {
      attempted: number;
      succeeded: number;
      failed: number;
      empty?: boolean;
      errors: string[];
    } = { attempted: 0, succeeded: 0, failed: 0, errors: [] };
    // Send only on first publish (announced_at is null and row is published).
    if (send_announcement && data.is_published) {
      const { sendPopUpAnnouncement } = await import("./announce.server");
      announce = await sendPopUpAnnouncement(inserted as unknown as PopUp);
      if (announce.succeeded > 0) {
        await client
          .from("pop_ups")
          .update({ announced_at: new Date().toISOString() })
          .eq("id", (inserted as any).id);
      }
    }
    return {
      popUp: inserted as unknown as PopUp,
      announced: announce.succeeded,
      announce,
    };
  });

export const updatePopUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        resend_announcement: z.boolean().optional().default(false),
      })
      .merge(popUpInput.omit({ send_announcement: true }).partial())
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const client = context.supabase as unknown as any;
    const { id, resend_announcement, ...patch } = data;

    // Read current state to detect a false->true publish transition.
    const { data: before, error: beforeErr } = await client
      .from("pop_ups")
      .select("is_published, announced_at")
      .eq("id", id)
      .single();
    if (beforeErr) throw new Error(beforeErr.message);

    const { error } = await client.from("pop_ups").update(patch).eq("id", id);
    if (error) throw new Error(error.message);

    // Decide whether to send. Two paths:
    // 1) explicit admin re-blast (resend_announcement === true)
    // 2) first publish: is_published flipping false -> true AND announced_at null
    const nowPublished =
      typeof patch.is_published === "boolean" ? patch.is_published : before.is_published;
    const wasPublished = before.is_published;
    const firstPublish =
      nowPublished && !wasPublished && before.announced_at == null;

    let announce:
      | {
          attempted: number;
          succeeded: number;
          failed: number;
          empty?: boolean;
          errors: string[];
        }
      | undefined;

    if (nowPublished && (resend_announcement || firstPublish)) {
      const { data: full, error: fetchErr } = await client
        .from("pop_ups")
        .select(SELECT)
        .eq("id", id)
        .single();
      if (fetchErr) throw new Error(fetchErr.message);
      const { sendPopUpAnnouncement } = await import("./announce.server");
      announce = await sendPopUpAnnouncement(full as unknown as PopUp);
      if (announce.succeeded > 0) {
        await client
          .from("pop_ups")
          .update({ announced_at: new Date().toISOString() })
          .eq("id", id);
      }
    }

    return { ok: true, announce };
  });

export const deletePopUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    const client = context.supabase as unknown as any;
    const { error } = await client.from("pop_ups").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    return { isAdmin: Boolean(data) };
  });
