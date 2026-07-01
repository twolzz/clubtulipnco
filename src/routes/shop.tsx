import { createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { SiteLayout } from "@/components/SiteLayout";
import { listProducts, type Product } from "@/lib/products.functions";
import { cart, cartDrawer } from "@/lib/cart-store";

const productsQO = queryOptions({
  queryKey: ["products", "all"],
  queryFn: () => listProducts(),
});

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [
      { title: "Shop — Tulip & Co." },
      { name: "description", content: "Curated Dutch plushies, stationery, and accessories." },
      { property: "og:title", content: "Shop — Tulip & Co." },
      { property: "og:description", content: "Curated Dutch plushies, stationery, and accessories." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQO),
  component: ShopPage,
  errorComponent: () => (
    <SiteLayout>
      <section className="px-5 md:px-8 py-24 text-center">
        <p className="font-display text-3xl font-extrabold lowercase">
          the shop is loading slowly — please refresh.
        </p>
      </section>
    </SiteLayout>
  ),
});

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

function ProductGlyph({ shape, fg }: { shape: string; fg: string }) {
  const stroke = { stroke: "#333333", strokeWidth: 4, fill: fg } as const;
  switch (shape) {
    case "bunny":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <ellipse cx="42" cy="30" rx="10" ry="22" {...stroke} />
          <ellipse cx="78" cy="30" rx="10" ry="22" {...stroke} />
          <circle cx="60" cy="72" r="32" {...stroke} />
          <circle cx="50" cy="70" r="3" fill="#333" />
          <circle cx="70" cy="70" r="3" fill="#333" />
          <path d="M55 82 Q60 86 65 82" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "journal":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <rect x="24" y="20" width="72" height="84" rx="6" {...stroke} />
          <line x1="36" y1="20" x2="36" y2="104" stroke="#333" strokeWidth="4" />
          <line x1="48" y1="42" x2="86" y2="42" stroke="#333" strokeWidth="3" />
          <line x1="48" y1="56" x2="86" y2="56" stroke="#333" strokeWidth="3" />
          <line x1="48" y1="70" x2="74" y2="70" stroke="#333" strokeWidth="3" />
        </svg>
      );
    case "pen":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <rect x="32" y="18" width="20" height="84" rx="4" {...stroke} />
          <polygon points="32,102 52,102 42,118" {...stroke} />
          <rect x="62" y="28" width="20" height="74" rx="4" {...stroke} />
          <polygon points="62,102 82,102 72,118" {...stroke} />
        </svg>
      );
    case "keychain":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <circle cx="42" cy="60" r="22" fill="none" stroke="#333" strokeWidth="6" />
          <line x1="62" y1="60" x2="86" y2="60" stroke="#333" strokeWidth="6" />
          <path d="M60 38 Q70 50 60 60 Q50 50 60 38 Z" {...stroke} />
          <path d="M52 60 Q60 78 68 60 Z" {...stroke} />
        </svg>
      );
    case "pouch":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <rect x="20" y="38" width="80" height="62" rx="8" {...stroke} />
          <path d="M40 38 Q40 22 60 22 Q80 22 80 38" fill="none" stroke="#333" strokeWidth="4" />
          <circle cx="60" cy="68" r="6" fill="#333" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <circle cx="60" cy="58" r="32" {...stroke} />
          <ellipse cx="52" cy="48" rx="5" ry="10" fill="#333" />
          <ellipse cx="68" cy="48" rx="5" ry="10" fill="#333" />
          <path d="M52 70 Q60 76 68 70" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      );
  }
}

const BG_CLASS: Record<string, string> = {
  "#E05A36": "bg-poppy",
  "#F2B73F": "bg-sun",
  "#3D6E97": "bg-denim",
  "#5D7A51": "bg-sage",
  "#F6F2E7": "bg-cream",
};

function ShopPage() {
  const { data: products } = useSuspenseQuery<Product[]>(productsQO);

  function addToCart(p: Product) {
    cart.add(p.id);
    toast.success(`added ${p.name.toLowerCase()} to cart.`);
    cartDrawer.open();
  }

  return (
    <SiteLayout>
      <section className="px-5 md:px-8 py-16 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <span className="inline-block px-3 py-1 mb-6 rounded-full bg-sun border-[3px] border-ink text-sm font-bold">
              The Shop
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.02]">
              Quiet things, <span className="text-poppy">built to last.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-ink/80">
              Curated essentials. Sourced direct from Dutch makers and shipped from San Diego.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-14">
            {products.map((p) => (
              <article
                key={p.id}
                className={`tc-card ${p.shadow} bg-white overflow-hidden flex flex-col`}
              >
                <div
                  className={`${BG_CLASS[p.bg_color] ?? ""} aspect-square flex items-center justify-center border-b-4 border-ink`}
                  style={BG_CLASS[p.bg_color] ? undefined : { background: p.bg_color }}
                >
                  <ProductGlyph shape={p.shape} fg={p.fg_color} />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs font-bold uppercase tracking-widest text-ink/60">
                    {p.category}
                  </p>
                  <h2 className="mt-1 text-xl font-extrabold leading-tight">{p.name}</h2>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="text-2xl font-extrabold">{formatPrice(p.price_cents)}</span>
                    <button
                      type="button"
                      onClick={() => addToCart(p)}
                      className="tc-btn tc-btn-poppy text-sm py-2 px-4"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
