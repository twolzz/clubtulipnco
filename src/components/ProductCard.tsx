// STEP 1 of 2
// Goes in: src/components/ProductCard.tsx  (replace the whole file)

import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products.functions";
import { cart, cartDrawer } from "@/lib/cart-store";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const REVEAL_STAGGER_MS = 60;
// Stagger resets every 4 cards (the widest grid is lg:grid-cols-4) so a big
// catalog doesn't accumulate an ever-growing delay on later rows — each row
// staggers in fresh as it scrolls into view instead.
const REVEAL_STAGGER_CYCLE = 4;

export function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

/** "Plushies" -> "plushies". Used for the ?collection= URL param. */
export function collectionSlug(category: string) {
  return category.trim().toLowerCase().replace(/\s+/g, "-");
}

export const BG_CLASS: Record<string, string> = {
  "#E05A36": "bg-poppy",
  "#F2B73F": "bg-sun",
  "#3D6E97": "bg-denim",
  "#5D7A51": "bg-sage",
  "#F6F2E7": "bg-cream",
};

/* ------------------------------------------------------------------ */
/* Colour helpers                                                      */
/*                                                                     */
/* The old icons went muddy whenever fg_color was dark — a #333333     */
/* journal filled solid black and read as a blob at cart size. These   */
/* two helpers pick a fill that stands apart from the tile behind it,  */
/* and a detail colour that stays visible on top of that fill.         */
/* ------------------------------------------------------------------ */

const INK = "#000000";
const CREAM = "#F6F2E7";

function luminance(hex: string): number {
  const clean = hex.replace("#", "").trim();
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean.padEnd(6, "0").slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;
  if ([r, g, b].some(Number.isNaN)) return 0.5;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Swap the fill when it would disappear into the tile behind it. */
function pickFill(fg: string, bg: string): string {
  const lf = luminance(fg);
  const lb = luminance(bg);
  if (Math.abs(lf - lb) > 0.18) return fg;
  return lb > 0.5 ? "#1F1F1F" : CREAM;
}

/** Eyes, zips and page lines — always legible on top of the fill. */
function pickDetail(fill: string): string {
  return luminance(fill) > 0.5 ? INK : CREAM;
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/*                                                                     */
/* Bold silhouettes with heavy outlines, matching the brutalist chrome */
/* elsewhere on the site. They stay readable down to about 40px, which */
/* is the checkout summary thumbnail.                                  */
/* ------------------------------------------------------------------ */

export function ProductGlyph({
  shape,
  fg,
  bg = CREAM,
}: {
  shape: string;
  fg: string;
  bg?: string;
}) {
  const fill = pickFill(fg, bg);
  const detail = pickDetail(fill);
  const body = {
    fill,
    stroke: INK,
    strokeWidth: 4,
    strokeLinejoin: "round" as const,
  };

  switch (shape) {
    case "bunny":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <ellipse cx="44" cy="34" rx="11" ry="24" {...body} />
          <ellipse cx="76" cy="34" rx="11" ry="24" {...body} />
          <circle cx="60" cy="76" r="30" {...body} />
          <circle cx="49" cy="72" r="3.5" fill={detail} />
          <circle cx="71" cy="72" r="3.5" fill={detail} />
          <path
            d="M55 84 L65 92 M65 84 L55 92"
            stroke={detail}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>
      );

    case "journal":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <rect x="26" y="18" width="68" height="84" rx="9" {...body} />
          <line x1="43" y1="20" x2="43" y2="100" stroke={INK} strokeWidth="4" />
          <line x1="57" y1="44" x2="82" y2="44" stroke={detail} strokeWidth="4" strokeLinecap="round" />
          <line x1="57" y1="60" x2="82" y2="60" stroke={detail} strokeWidth="4" strokeLinecap="round" />
          <line x1="57" y1="76" x2="72" y2="76" stroke={detail} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "pen":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <g transform="rotate(18 60 60)">
            <rect x="49" y="14" width="23" height="66" rx="7" {...body} />
            <polygon points="49,80 72,80 60.5,104" {...body} />
            <line x1="49" y1="38" x2="72" y2="38" stroke={INK} strokeWidth="4" />
            <polygon points="56,94 65,94 60.5,104" fill={INK} />
          </g>
        </svg>
      );

    case "keychain":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <circle cx="38" cy="36" r="17" fill="none" stroke={INK} strokeWidth="7" />
          <rect x="46" y="50" width="46" height="50" rx="12" {...body} />
          <circle cx="69" cy="75" r="7" fill={detail} stroke={INK} strokeWidth="3" />
        </svg>
      );

    case "pin":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <line x1="60" y1="76" x2="60" y2="106" stroke={INK} strokeWidth="6" strokeLinecap="round" />
          <circle cx="60" cy="52" r="30" {...body} />
          <path
            d="M60 34 L65 47 L78 52 L65 57 L60 70 L55 57 L42 52 L55 47 Z"
            fill={detail}
            stroke={INK}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "pouch":
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <path d="M40 46 Q40 24 60 24 Q80 24 80 46" fill="none" stroke={INK} strokeWidth="5" />
          <rect x="18" y="44" width="84" height="56" rx="15" {...body} />
          <line x1="22" y1="61" x2="98" y2="61" stroke={INK} strokeWidth="4" />
          <circle cx="60" cy="61" r="7" fill={detail} stroke={INK} strokeWidth="3" />
        </svg>
      );

    default:
      // Tulip — the house fallback for anything without its own icon.
      return (
        <svg viewBox="0 0 120 120" className="w-3/5 h-3/5" aria-hidden>
          <line x1="60" y1="70" x2="60" y2="104" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <path d="M60 92 Q42 90 34 76" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <path d="M60 86 Q78 84 86 70" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          <path
            d="M36 34 C36 62 44 76 60 80 C76 76 84 62 84 34 C75 44 68 32 60 26 C52 32 45 44 36 34 Z"
            {...body}
          />
        </svg>
      );
  }
}

/**
 * Square media block. Renders the bucket image when one exists, and falls
 * back to the icon above when a product has no photo yet.
 *
 * Shared by the shop grid, product page, cart drawer, cart page and checkout
 * summary, so a product looks identical everywhere.
 */
export function ProductMedia({
  product,
  src,
  className = "",
  priority = false,
}: {
  product: Product;
  src?: string;
  className?: string;
  priority?: boolean;
}) {
  const url = src ?? product.images[0];
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  const showImage = Boolean(url) && !failed;
  const bgClass = BG_CLASS[product.bg_color] ?? "";

  return (
    <div
      className={`${showImage ? "bg-white" : bgClass} aspect-square flex items-center justify-center overflow-hidden ${className}`}
      style={showImage || bgClass ? undefined : { background: product.bg_color }}
    >
      {showImage ? (
        <img
          src={url}
          alt={product.name}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="w-full h-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <ProductGlyph shape={product.shape} fg={product.fg_color} bg={product.bg_color} />
      )}
    </div>
  );
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const soldOut = product.stock_quantity <= 0;
  const reveal = useScrollReveal<HTMLElement>((index % REVEAL_STAGGER_CYCLE) * REVEAL_STAGGER_MS);

  function addToCart() {
    cart.add(product.id);
    // No toast — the drawer opening is the confirmation.
    cartDrawer.open();
  }

  return (
    <article
      ref={reveal.ref}
      style={reveal.style}
      className={`tc-card ${product.shadow} bg-white overflow-hidden flex flex-col tc-card-lift tc-reveal ${reveal.visible ? "tc-reveal-visible" : ""}`}
    >
      <Link
        to="/shop/$slug"
        params={{ slug: product.slug }}
        className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-denim"
      >
        <div className="relative">
          <ProductMedia
            product={product}
            className="border-b-[3px] sm:border-b-4 border-ink"
          />
          {soldOut && (
            <span className="absolute top-2 left-2 px-2 py-1 rounded-full bg-ink text-white text-[10px] font-bold uppercase tracking-widest">
              Sold Out
            </span>
          )}
        </div>

        <div className="px-3 sm:px-5 pt-3 sm:pt-5">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-ink/60">
            {product.category}
          </p>
          <h2 className="mt-1 text-sm sm:text-lg md:text-xl font-extrabold leading-tight hover:text-denim transition-colors">
            {product.name}
          </h2>
        </div>
      </Link>

      <div className="px-3 sm:px-5 pb-3 sm:pb-5 mt-auto pt-3 sm:pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
        <span className="text-lg sm:text-xl md:text-2xl font-extrabold">
          {formatPrice(product.price_cents)}
        </span>
        <button
          type="button"
          onClick={addToCart}
          disabled={soldOut}
          aria-label={`Add ${product.name} to cart`}
          className={`tc-btn ${soldOut ? "tc-btn-cream opacity-60 cursor-not-allowed" : "tc-btn-poppy"} w-full sm:w-auto text-xs sm:text-sm py-2 px-3 sm:px-4 shrink-0`}
        >
          {soldOut ? "Sold Out" : "Add to Cart"}
        </button>
      </div>
    </article>
  );
}
