import { SiteLayout } from "./SiteLayout";

export function PlaceholderPage({ title, blurb }: { title: string; blurb: string }) {
  return (
    <SiteLayout>
      <section className="px-5 md:px-8 py-20 md:py-32">
        <div className="max-w-4xl mx-auto tc-card tc-card-denim p-10 md:p-16 bg-white">
          <span className="inline-block px-3 py-1 mb-5 rounded-full bg-sun border-[3px] border-ink text-sm font-bold">
            Coming Soon
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold">{title}</h1>
          <p className="mt-5 text-lg text-ink/80 max-w-2xl">{blurb}</p>
        </div>
      </section>
    </SiteLayout>
  );
}
