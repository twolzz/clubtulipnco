import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/SiteLayout";
import { JoinClubDialog } from "@/components/JoinClubDialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tulip & Co. — Authentic Dutch Design in Southern California" },
      {
        name: "description",
        content:
          "Curated Dutch design, stationery, and Miffy collectibles. Premium, minimalist, and proudly based in San Diego.",
      },
      { property: "og:title", content: "Tulip & Co. — Authentic Dutch Design" },
      {
        property: "og:description",
        content: "Premium Dutch stationery and Miffy collectibles, curated in San Diego.",
      },
    ],
  }),
  component: Home,
});

const COLLECTIONS = [
  {
    title: "Plushies",
    blurb: "Eco-corduroy bunnies & friends",
    color: "bg-poppy",
    shadow: "tc-card-sun",
    emoji: "🐰",
  },
  {
    title: "Stationery",
    blurb: "Journals, pens & desk goods",
    color: "bg-denim",
    shadow: "tc-card-poppy",
    emoji: "✏️",
  },
  {
    title: "Accessories",
    blurb: "Keychains, pins & pouches",
    color: "bg-sage",
    shadow: "tc-card-denim",
    emoji: "🔑",
  },
] as const;

function Home() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="px-5 md:px-8 py-16 md:py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.3fr_1fr] gap-10 items-center">
          <div>
            <h1 className="text-5xl md:text-7xl font-extrabold lowercase leading-[1.02] tracking-tight">
              test dutch design is coming to <span className="text-poppy">san diego.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-ink/80 max-w-xl">
              Tulip &amp; Co. is your curated home for premium Dutch stationery, minimalist
              plushies, and quiet design objects — sourced directly from the Netherlands.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <JoinClubDialog className="tc-btn tc-btn-sun inline-flex">
                Join the Club!
              </JoinClubDialog>
              <Link to="/shop" className="tc-btn tc-btn-cream">Browse the Shop →</Link>
            </div>
          </div>

          {/* Hero card cluster */}
          <div className="grid grid-cols-2 gap-5">
            <div className="tc-card tc-card-poppy aspect-[3/4] flex items-end p-5 bg-sun">
              <span className="font-display text-2xl">Holland.</span>
            </div>
            <div className="tc-card tc-card-denim aspect-[3/4] flex items-end p-5 mt-8 bg-poppy text-white">
              <span className="font-display text-2xl">Tulip & Co.</span>
            </div>
            <div className="tc-card tc-card-sage aspect-square flex items-end p-5 bg-denim text-white col-span-2">
              <span className="font-display text-xl">De Stijl, brought home.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="bg-sun border-y-4 border-ink py-16 md:py-24 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold">Curated Collections</h2>
              <p className="mt-2 text-ink/80">{"\n"}</p>
            </div>
            <Link to="/shop" className="tc-btn tc-btn-cream">Shop All</Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {COLLECTIONS.map((c) => (
              <Link
                key={c.title}
                to="/shop"
                className={`tc-card ${c.shadow} overflow-hidden flex flex-col hover:-translate-y-1 transition-transform`}
              >
                <div className={`${c.color} aspect-[4/3] flex items-center justify-center text-7xl`}>
                  <span aria-hidden>{c.emoji}</span>
                </div>
                <div className="p-6 border-t-4 border-ink bg-white">
                  <h3 className="text-2xl font-extrabold">{c.title}</h3>
                  <p className="text-ink/70 mt-1">{c.blurb}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pop-up sneak peek */}
      <section className="px-5 md:px-8 py-16 md:py-24">
        <div className="max-w-5xl mx-auto tc-card tc-card-sage p-8 md:p-12 bg-sage text-white">
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <span className="inline-block px-3 py-1 mb-4 rounded-full bg-sun border-[3px] border-ink text-ink text-sm font-bold">
                This Weekend
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold">
                Find Us Live in San Diego.
              </h2>
              <p className="mt-4 text-white/90 max-w-xl text-lg">
                Select Saturdays. Feel the corduroy, test the pens,
                and meet Miffy in person.
              </p>
            </div>
            <Link to="/pop-ups" className="tc-btn tc-btn-sun whitespace-nowrap">
              See Pop-up Calendar
            </Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
