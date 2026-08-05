/**
 * Pending-state placeholders for the three routes whose loaders wait on
 * Supabase. They mirror the real chrome (same card borders, radii, grid) so
 * the swap to real content doesn't reflow the page.
 *
 * The loading signal is a flat opacity pulse rather than a gradient sweep —
 * a shimmer needs a soft blur, which this design system doesn't use.
 */

function Bar({ className = "" }: { className?: string }) {
  return <div className={`rounded-full bg-ink/[0.07] tc-shimmer ${className}`} />;
}

function ProductCardSkeleton() {
  return (
    <article className="tc-card bg-white overflow-hidden flex flex-col" data-motion="loop">
      <div className="aspect-square border-b-[3px] sm:border-b-4 border-ink bg-ink/[0.07] tc-shimmer" />
      <div className="px-3 sm:px-5 pt-3 sm:pt-5">
        <Bar className="h-2.5 w-16" />
        <Bar className="mt-2 h-5 w-3/4" />
      </div>
      <div className="px-3 sm:px-5 pb-3 sm:pb-5 mt-auto pt-3 sm:pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <Bar className="h-6 w-20" />
        <Bar className="h-9 w-full sm:w-28" />
      </div>
    </article>
  );
}

export function ShopSkeleton() {
  return (
    <section className="px-5 md:px-8 py-10 md:py-16">
      <div className="max-w-7xl mx-auto">
        <Bar className="h-6 w-24" />
        <Bar className="mt-5 h-12 md:h-16 w-full max-w-xl" />
        <Bar className="mt-4 h-4 w-full max-w-md" />

        <div className="mt-8 sm:mt-12 flex flex-wrap items-center gap-2 sm:gap-3">
          {["w-14", "w-24", "w-28", "w-28"].map((w, i) => (
            <Bar key={i} className={`h-9 ${w}`} />
          ))}
        </div>

        <Bar className="mt-4 h-4 w-20" />

        <div className="mt-8 md:mt-10 grid grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ProductDetailSkeleton() {
  return (
    <section className="px-5 md:px-8 py-10 md:py-16">
      <div className="max-w-6xl mx-auto">
        <Bar className="h-4 w-56" />

        <div className="mt-8 grid md:grid-cols-2 gap-8 md:gap-14">
          <div>
            <div
              className="tc-card bg-white aspect-square tc-shimmer !bg-ink/[0.07]"
              data-motion="loop"
            />
            <div className="mt-3 grid grid-cols-4 gap-2 sm:gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-lg border-[3px] border-ink bg-ink/[0.07] tc-shimmer"
                  data-motion="loop"
                />
              ))}
            </div>
          </div>

          <div>
            <Bar className="h-3 w-24" />
            <Bar className="mt-4 h-11 md:h-14 w-3/4" />
            <Bar className="mt-5 h-8 w-32" />
            <Bar className="mt-6 h-4 w-full" />
            <Bar className="mt-2 h-4 w-full" />
            <Bar className="mt-2 h-4 w-2/3" />
            <Bar className="mt-8 h-12 w-40" />
            <Bar className="mt-4 h-14 w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function PopUpsSkeleton() {
  return (
    <section className="px-5 md:px-8 py-10 md:py-16">
      <div className="max-w-6xl mx-auto">
        <Bar className="h-6 w-28" />
        <Bar className="mt-5 h-12 md:h-16 w-full max-w-lg" />
        <Bar className="mt-4 h-4 w-full max-w-md" />

        <div className="mt-10 md:mt-14 space-y-5 md:space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="tc-card bg-white p-5 md:p-7 flex flex-col sm:flex-row gap-5 md:gap-8"
              data-motion="loop"
            >
              <div className="shrink-0">
                <Bar className="h-20 w-20 !rounded-2xl" />
              </div>
              <div className="flex-1">
                <Bar className="h-6 w-2/3" />
                <Bar className="mt-3 h-4 w-1/2" />
                <Bar className="mt-2 h-4 w-1/3" />
              </div>
              <Bar className="h-11 w-full sm:w-36 self-center" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
