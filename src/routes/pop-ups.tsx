import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";

export const Route = createFileRoute("/pop-ups")({
  head: () => ({
    meta: [
      { title: "Pop-ups — Tulip & Co." },
      { name: "description", content: "Find Tulip & Co. live at San Diego weekend markets and pop-up festivals." },
      { property: "og:title", content: "Pop-ups — Tulip & Co." },
      { property: "og:description", content: "Find Tulip & Co. live at San Diego weekend markets." },
    ],
  }),
  component: PopUpsPage,
});

type Event = {
  date: string;
  day: string;
  month: string;
  name: string;
  location: string;
  time: string;
  tag: string;
  accent: "poppy" | "sun" | "sage" | "denim";
};

const EVENTS: Event[] = [
  { date: "Sat", day: "12", month: "Jul", name: "Neighborhood Farmers Market", location: "North Park, San Diego", time: "9:00 AM – 1:00 PM", tag: "This Weekend", accent: "poppy" },
  { date: "Sun", day: "20", month: "Jul", name: "Downtown Pop-up Festival", location: "Little Italy Piazza", time: "10:00 AM – 4:00 PM", tag: "Featured", accent: "sun" },
  { date: "Sat", day: "02", month: "Aug", name: "Coastal Makers Market", location: "Encinitas Boardwalk", time: "11:00 AM – 5:00 PM", tag: "New", accent: "sage" },
  { date: "Sun", day: "17", month: "Aug", name: "Sunday Stationery Social", location: "South Park Walkabout", time: "12:00 PM – 6:00 PM", tag: "RSVP", accent: "denim" },
  { date: "Sat", day: "06", month: "Sep", name: "Mercato Centrale", location: "Little Italy, San Diego", time: "9:00 AM – 1:30 PM", tag: "Returning", accent: "poppy" },
];

const ACCENT: Record<Event["accent"], { bg: string; shadow: string; text: string }> = {
  poppy: { bg: "bg-poppy", shadow: "tc-card-sun", text: "text-white" },
  sun: { bg: "bg-sun", shadow: "tc-card-denim", text: "text-ink" },
  sage: { bg: "bg-sage", shadow: "tc-card-poppy", text: "text-white" },
  denim: { bg: "bg-denim", shadow: "tc-card-sage", text: "text-white" },
};

function PopUpsPage() {
  return (
    <SiteLayout>
      {/* Hero */}
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
            <a
              href="https://formspree.io/f/mqeowzez"
              className="tc-btn tc-btn-sun mt-5 inline-block"
            >
              Join the Club!
            </a>
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="bg-sun border-y-4 border-ink py-16 md:py-24 px-5 md:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-10">Upcoming Pop-ups</h2>

          <ol className="flex flex-col gap-6">
            {EVENTS.map((e) => {
              const a = ACCENT[e.accent];
              return (
                <li
                  key={`${e.day}-${e.name}`}
                  className="tc-card tc-card-denim bg-white p-5 md:p-7 grid md:grid-cols-[auto_1fr_auto] gap-6 items-center"
                >
                  <div className={`${a.bg} ${a.text} border-4 border-ink rounded-2xl w-24 h-24 flex flex-col items-center justify-center shrink-0`}>
                    <span className="text-xs font-bold uppercase tracking-widest">{e.month}</span>
                    <span className="font-display text-4xl font-extrabold leading-none">{e.day}</span>
                    <span className="text-xs font-bold uppercase tracking-widest mt-1">{e.date}</span>
                  </div>

                  <div className="min-w-0">
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-cream border-2 border-ink text-xs font-bold mb-2">
                      {e.tag}
                    </span>
                    <h3 className="text-2xl font-extrabold leading-tight">{e.name}</h3>
                    <p className="mt-1 text-ink/80">{e.location}</p>
                    <p className="text-ink/60 text-sm font-semibold mt-0.5">{e.time}</p>
                  </div>

                  <a
                    href="https://formspree.io/f/mqeowzez"
                    className="tc-btn tc-btn-cream whitespace-nowrap"
                  >
                    Notify Me
                  </a>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 md:px-8 py-16 md:py-24">
        <div className="max-w-4xl mx-auto tc-card tc-card-sage bg-denim text-white p-8 md:p-12 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold">
            Be first in line.
          </h2>
          <p className="mt-4 text-white/90 text-lg max-w-xl mx-auto">
            Club members get pop-up dates a week early — plus first dibs on limited drops.
          </p>
          <a
            href="https://formspree.io/f/mqeowzez"
            className="tc-btn tc-btn-sun mt-7 inline-block"
          >
            Join the Club!
          </a>
        </div>
      </section>
    </SiteLayout>
  );
}
