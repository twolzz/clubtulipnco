// STEP 2 of 3
// Goes in: src/routes/pop-ups.tsx  (replace the whole file)
//
// The blue "Be first in line." section at the bottom is gone. The "Never miss
// a Saturday" card up in the hero already carries the same Join the Club call,
// so nothing is lost.

import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/SiteLayout";
import { JoinClubDialog } from "@/components/JoinClubDialog";
import { listPopUps, type PopUp } from "@/lib/pop-ups.functions";

const popUpsQO = queryOptions({
  queryKey: ["pop-ups", "published"] as const,
  queryFn: () => listPopUps(),
});

export const Route = createFileRoute("/pop-ups")({
  head: () => ({
    meta: [
      { title: "Pop-ups — Tulip & Co." },
      { name: "description", content: "Find Tulip & Co. live at San Diego weekend markets and pop-up festivals." },
      { property: "og:title", content: "Pop-ups — Tulip & Co." },
      { property: "og:description", content: "Find Tulip & Co. live at San Diego weekend markets." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(popUpsQO),
  component: PopUpsPage,
  errorComponent: () => (
    <SiteLayout>
      <section className="px-5 md:px-8 py-24 text-center font-display text-2xl">
        Calendar loading — please refresh.
      </section>
    </SiteLayout>
  ),
});

const ACCENT: Record<PopUp["accent"], { bg: string; shadow: string; text: string }> = {
  poppy: { bg: "bg-poppy", shadow: "tc-card-sun", text: "text-white" },
  sun: { bg: "bg-sun", shadow: "tc-card-denim", text: "text-ink" },
  sage: { bg: "bg-sage", shadow: "tc-card-poppy", text: "text-white" },
  denim: { bg: "bg-denim", shadow: "tc-card-sage", text: "text-white" },
};

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function splitDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return { day: String(d.getDate()).padStart(2, "0"), month: MONTHS[d.getMonth()], weekday: DAYS[d.getDay()] };
}
function formatTime(start: string | null, end: string | null) {
  if (!start || !end) return "";
  const fmt = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const hh = ((h + 11) % 12) + 1;
    const am = h < 12 ? "AM" : "PM";
    return `${hh}:${String(m).padStart(2, "0")} ${am}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}

function PopUpsPage() {
  const { data: events } = useSuspenseQuery(popUpsQO);
  return (
    <SiteLayout>
      <section className="px-5 md:px-8 py-16 md:py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center">
          <div>
            <span className="inline-block px-3 py-1 mb-6 rounded-full bg-sun border-[3px] border-ink text-sm font-bold">
              Live Calendar
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.02]">
              Meet us at the <span className="text-poppy">market.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-ink/80 max-w-xl">
              Feel the corduroy. Test the pens. Take home a piece of quiet Dutch design —
              hand-delivered at weekend pop-ups around San Diego.
            </p>
          </div>
          <div className="tc-card tc-card-poppy bg-cream p-8 md:p-10">
            <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">
              Never miss a Saturday.
            </h2>
            <p className="mt-2 text-ink/80">
              Locals: get pop-up dates and early access to drops.
            </p>
            <JoinClubDialog className="tc-btn tc-btn-sun mt-5 inline-flex">
              Join the Club!
            </JoinClubDialog>
          </div>
        </div>
      </section>

      <section className="bg-sun border-y-4 border-ink py-16 md:py-24 px-5 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-10">Upcoming Pop-ups</h2>
          {events.length === 0 ? (
            <p className="text-ink/80 text-lg">New dates coming soon — join the Club for first notice.</p>
          ) : (
            <ol className="flex flex-col gap-6">
              {events.map((e) => {
                const a = ACCENT[e.accent] ?? ACCENT.poppy;
                const d = splitDate(e.event_date);
                return (
                  <li
                    key={e.id}
                    className="tc-card tc-card-denim bg-white p-5 md:p-7 grid md:grid-cols-[auto_1fr_auto] gap-6 items-center"
                  >
                    <div className={`${a.bg} ${a.text} border-4 border-ink rounded-2xl w-24 h-24 flex flex-col items-center justify-center shrink-0`}>
                      <span className="text-xs font-bold uppercase tracking-widest">{d.month}</span>
                      <span className="font-display text-4xl font-extrabold leading-none">{d.day}</span>
                      <span className="text-xs font-bold uppercase tracking-widest mt-1">{d.weekday}</span>
                    </div>
                    <div className="min-w-0">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-cream border-2 border-ink text-xs font-bold mb-2">
                        {e.tag}
                      </span>
                      <h3 className="text-2xl font-extrabold leading-tight">{e.name}</h3>
                      <p className="mt-1 text-ink/80">{e.location}</p>
                      <p className="text-ink/60 text-sm font-semibold mt-0.5">{formatTime(e.start_time, e.end_time)}</p>
                    </div>
                    <JoinClubDialog className="tc-btn tc-btn-cream whitespace-nowrap inline-flex">
                      Notify Me
                    </JoinClubDialog>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
