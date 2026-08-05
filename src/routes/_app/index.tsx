// STEP 5 of 7
// Goes in: src/routes/index.tsx  (replace the whole file)
// This is the HOME page — not the checkout one (that's step 7).

import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { JoinClubDialog } from "@/components/JoinClubDialog";

export const Route = createFileRoute("/_app/")({
  head: () => ({
    meta: [
      { title: "Tulip & Co. — Your Online Boutique for Dutch Design & Miffy Collectibles" },
      {
        name: "description",
        content:
          "Curated Dutch design and everyday Miffy magic—shipped nationwide straight to your door",
      },
      { property: "og:title", content: "Tulip & Co. — Authentic Dutch Design & Miffy Goods" },
      {
        property: "og:description",
        content: "Curated Dutch design and Miffy stationery & collectibles, shipped across the US",
      },
    ],
  }),
  component: Home,
});

/**
 * `slug` must match the product's category lowercased — that's what the shop
 * route reads out of ?collection=. Category "Plushies" -> slug "plushies".
 */
const COLLECTIONS = [
  {
    title: "Plushies",
    slug: "plushies",
    blurb: "Eco-corduroy bunnies & friends",
    color: "bg-poppy",
    shadow: "tc-card-sage",
  },
  {
    title: "Stationery",
    slug: "stationery",
    blurb: "Journals, pens & desk goods",
    color: "bg-denim",
    shadow: "tc-card-poppy",
  },
  {
    title: "Accessories",
    slug: "accessories",
    blurb: "Keychains, pins & pouches",
    color: "bg-sage",
    shadow: "tc-card-denim",
  },
] as const;

function Home() {
  return (
    <>
      {/* Hero */}
      <section className="px-5 md:px-8 py-10 md:py-14">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.55fr_1fr] gap-10 lg:gap-14 items-center">
          <div>
            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.02] tracking-tight">
              Dutch design is coming to <span className="text-poppy">San Diego</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-ink/80 max-w-2xl">
              Tulip &amp; Co. is your curated online home for authentic Dutch design, Miffy plushies &amp; stationery — shipped nationwide straight to your door.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <JoinClubDialog className="tc-btn tc-btn-sun inline-flex">
                Join the Club!
              </JoinClubDialog>
              <Link to="/shop" className="tc-btn tc-btn-cream">
                Browse the Shop
              </Link>
            </div>
          </div>

          {/* Hero card cluster */}
          <div className="grid grid-cols-2 gap-5">
            <div className="tc-card tc-card-poppy aspect-[3/4] flex items-end p-5 bg-sun">
              <span className="font-display text-2xl">Holland</span>
            </div>
            <div className="tc-card tc-card-denim aspect-[3/4] flex items-end p-5 mt-8 bg-poppy text-white">
              <span className="font-display text-2xl">Tulip & Co.</span>
            </div>
            <div className="tc-card tc-card-sage aspect-[3/2] flex items-end p-5 bg-denim text-white col-span-2">
              <span className="font-display text-xl">De Stijl, brought home</span>
            </div>
          </div>
        </div>
      </section>

      {/* Collections — solid colour blocks, each one a filtered shop link */}
      <section className="bg-sun border-y-4 border-ink py-16 md:py-24 px-5 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between flex-wrap gap-4 mb-8 md:mb-10">
            <h2 className="text-4xl md:text-5xl font-extrabold">Curated Collections</h2>
            <Link to="/shop" className="tc-btn tc-btn-cream">
              Shop All
            </Link>
          </div>

          <div className="grid sm:grid-cols-3 gap-5 md:gap-8">
            {COLLECTIONS.map((c) => (
              <Link
                key={c.slug}
                to="/shop"
                search={{ collection: c.slug }}
                className={`tc-card ${c.shadow} ${c.color} text-white p-6 md:p-8 flex flex-col justify-between gap-8 min-h-[180px] md:min-h-[210px] tc-lift`}
              >
                <div>
                  <h3 className="text-2xl md:text-3xl font-extrabold leading-tight">{c.title}</h3>
                  <p className="mt-2 text-white/85 leading-snug">{c.blurb}</p>
                </div>
                <span className="inline-flex items-center gap-2 text-sm font-bold">
                  Shop {c.title}
                  <ArrowRight size={16} strokeWidth={3} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pop-up sneak peek */}
      <section className="px-5 md:px-8 py-16 md:py-24">
        <div className="max-w-5xl mx-auto tc-card tc-card-denim p-8 md:p-12 bg-sage text-white">
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <span className="inline-block px-3 py-1 mb-4 rounded-full bg-sun border-[3px] border-ink text-ink text-sm font-bold">
                Live Calendar
              </span>
              <h2 className="text-4xl md:text-5xl font-extrabold">Find Us Live in San Diego.</h2>
              <p className="mt-4 text-white/90 max-w-xl text-lg">
                New dates all year, all around San Diego. Come hang out with us!
              </p>
            </div>
            <Link to="/pop-ups" className="tc-btn tc-btn-sun whitespace-nowrap">
              See Pop-up Calendar
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
