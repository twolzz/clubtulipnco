import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

/**
 * Read-only pop-up data for the public /pop-ups calendar.
 *
 * The admin panel that used to live at /admin/pop-ups was removed, along with
 * createPopUp / updatePopUp / deletePopUp / listAllPopUps / checkIsAdmin and
 * the automated subscriber announcement that fired on publish.
 *
 * Pop-ups are now added by hand in the Supabase table editor:
 *   Table Editor > pop_ups > Insert row
 *
 * Required columns: name, location, event_date (YYYY-MM-DD).
 * Set is_published to true or the row will not appear on the site.
 * accent must be one of: poppy, sun, sage, denim.
 */
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
