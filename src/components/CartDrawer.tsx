import { useEffect, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { usePresence } from "@/hooks/use-presence";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Link } from "@tanstack/react-router";
import { X, Trash2, Plus, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { cart, cartDrawer, useCart, useCartDrawer } from "@/lib/cart-store";
import { listProducts } from "@/lib/products.functions";
import type { Product } from "@/lib/products.functions";
import { ProductMedia, formatPrice } from "@/components/ProductCard";

// A flick closes the drawer even from a small distance; a slow drag needs to
// clear roughly a third of the panel width. Both thresholds are ours to
// tune, since this is our own drag handler rather than an inherited default.
const CLOSE_TRAVEL_RATIO = 0.32;
const CLOSE_VELOCITY = 0.5; // px/ms

// Slightly longer than --dur-exit (280ms) so the slide-out finishes first.
const EXIT_MS = 320;
// Matches --dur-base (380ms) — see the focus useEffect below.
const ENTER_MS = 380;

export function CartDrawer() {
  const open = useCartDrawer();

  const panelRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ startX: 0, startT: 0, active: false });

  // Mounts closed, transitions in on a later frame, and stays mounted through
  // the slide-out. It must genuinely unmount once closed: Radix's cleanup
  // (restoring body pointer-events, releasing the scroll lock) is tied to
  // unmount, so staying mounted makes the whole page unclickable.
  const { present, visible } = usePresence(open, EXIT_MS);

  // Calling .focus() on the panel while its slide-in transform is still
  // interpolating is what was causing the drawer to animate smoothly partway,
  // then jump straight to its final position — focusing an element forces the
  // browser to resolve its layout/visibility synchronously, which can conflict
  // with an in-flight transform/translate transition on that same element.
  // Waiting until the transition has actually finished avoids it entirely.
  useEffect(() => {
    if (!visible) return;
    const t = window.setTimeout(() => panelRef.current?.focus(), ENTER_MS);
    return () => window.clearTimeout(t);
  }, [visible]);

  const { items } = useCart();
  const listFn = useServerFn(listProducts);
  const { data: products } = useQuery<Product[]>({
    queryKey: ["products", "all"],
    queryFn: () => listFn({}),
    staleTime: 60_000,
  });

  const productMap = new Map((products ?? []).map((p) => [p.id, p]));
  const lines = items
    .map((i) => ({ item: i, product: productMap.get(i.productId) }))
    .filter((l): l is { item: typeof l.item; product: Product } => Boolean(l.product));
  const subtotal = lines.reduce((s, l) => s + l.product.price_cents * l.item.qty, 0);

  // touch-action: pan-y on the panel means the browser itself arbitrates the
  // axis — a vertical drag scrolls natively (we never see it), a horizontal
  // drag is delivered to us with no scroll competition. This is what makes
  // dragging the item list and swiping the drawer closed both reliable.
  function onPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse") return;
    drag.current = { startX: e.clientX, startT: e.timeStamp, active: true };
    panelRef.current?.setPointerCapture(e.pointerId);
    panelRef.current?.setAttribute("data-dragging", "");
  }

  function onPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current.active || !panelRef.current || !overlayRef.current) return;
    const dx = Math.max(0, e.clientX - drag.current.startX); // right-only, no rubber-band
    const w = panelRef.current.offsetWidth;
    panelRef.current.style.transform = `translate3d(${dx}px,0,0)`;
    overlayRef.current.style.opacity = String(1 - Math.min(1, dx / w));
  }

  function onPointerUp(e: ReactPointerEvent<HTMLDivElement>) {
    if (!drag.current.active || !panelRef.current || !overlayRef.current) return;
    drag.current.active = false;
    panelRef.current.removeAttribute("data-dragging");
    const w = panelRef.current.offsetWidth;
    const dx = Math.max(0, e.clientX - drag.current.startX);
    const dt = Math.max(1, e.timeStamp - drag.current.startT);
    const velocity = dx / dt;
    panelRef.current.style.transform = "";
    overlayRef.current.style.opacity = "";
    if (dx > w * CLOSE_TRAVEL_RATIO || velocity > CLOSE_VELOCITY) {
      cartDrawer.close();
    }
  }

  if (!present) return null;

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => (next ? cartDrawer.open() : cartDrawer.close())}
    >
      <DialogPrimitive.Portal forceMount>
        <DialogPrimitive.Overlay
          ref={overlayRef}
          forceMount
          data-state={visible ? "open" : "closed"}
          className="fixed inset-0 z-[60] bg-ink/40 [will-change:opacity] transition-opacity duration-base ease-glide data-[state=closed]:opacity-0 data-[state=closed]:pointer-events-none data-[state=closed]:duration-exit"
        />
        <DialogPrimitive.Content
          ref={panelRef}
          forceMount
          tabIndex={-1}
          data-state={visible ? "open" : "closed"}
          inert={!open || undefined}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onOpenAutoFocus={(e) => {
            // Block Radix's default (focusing the close button) — the panel
            // itself gets focus instead, but only once the slide-in finishes
            // (see the useEffect above); doing it here, on Radix's own timing,
            // fires while the transform is still animating.
            e.preventDefault();
          }}
          className="fixed top-0 right-0 bottom-0 z-[61] w-full sm:w-[440px] bg-cream border-l-4 border-ink flex flex-col outline-none [touch-action:pan-y] [will-change:translate] transition-transform duration-base ease-glide data-[state=closed]:translate-x-full data-[state=closed]:duration-exit data-[dragging]:transition-none"
        >
          <DialogPrimitive.Title className="sr-only">Your Cart</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">
            Items in your shopping cart
          </DialogPrimitive.Description>

          <header className="flex items-center justify-between px-5 sm:px-6 py-5 border-b-4 border-ink">
            <h2 aria-hidden className="font-display text-2xl font-extrabold">
              Your Cart.
            </h2>
            <DialogPrimitive.Close
              aria-label="close cart"
              className="w-10 h-10 rounded-full border-[3px] border-ink bg-white flex items-center justify-center tc-press [--press-rest:3px] [--press-hover:5px] [--press-active:1px]"
            >
              <X size={18} strokeWidth={2.5} />
            </DialogPrimitive.Close>
          </header>

          <div className="flex-1 overflow-y-auto [overscroll-behavior:contain] px-5 sm:px-6 py-5 space-y-4">
            {lines.length === 0 ? (
              <div className="text-center py-16">
                <p className="font-display text-3xl font-extrabold mb-3">Your cart is empty.</p>
                <p className="text-ink/70 mb-6">Quiet things await.</p>
                <Link
                  to="/shop"
                  onClick={() => cartDrawer.close()}
                  className="tc-btn tc-btn-sun inline-flex"
                >
                  Browse the Shop
                </Link>
              </div>
            ) : (
              lines.map(({ item, product }) => (
                <div
                  key={item.productId}
                  className="flex gap-3 sm:gap-4 items-start rounded-2xl border-[3px] border-ink bg-white p-3 sm:p-4 shadow-[4px_4px_0_var(--ink)]"
                >
                  {/* Thumbnail — real photo, glyph fallback, tap to reopen product */}
                  <Link
                    to="/shop/$slug"
                    params={{ slug: product.slug }}
                    onClick={() => cartDrawer.close()}
                    aria-label={`View ${product.name}`}
                    className="w-16 h-16 shrink-0 rounded-xl border-2 border-ink overflow-hidden"
                  >
                    <ProductMedia product={product} className="w-full h-full" />
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-ink/60">
                          {product.category}
                        </p>
                        <Link
                          to="/shop/$slug"
                          params={{ slug: product.slug }}
                          onClick={() => cartDrawer.close()}
                          className="block font-semibold text-ink truncate hover:text-denim transition-colors"
                        >
                          {product.name}
                        </Link>
                      </div>
                      <span className="font-extrabold shrink-0">
                        {formatPrice(product.price_cents * item.qty)}
                      </span>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        aria-label="decrease quantity"
                        onClick={() => cart.setQty(item.productId, item.qty - 1)}
                        className="relative w-7 h-7 rounded-full border-2 border-ink bg-cream flex items-center justify-center hover:bg-sun transition-colors before:absolute before:-inset-2 before:content-['']"
                      >
                        <Minus size={12} strokeWidth={3} />
                      </button>
                      <span className="font-bold text-sm w-6 text-center tabular-nums">
                        {item.qty}
                      </span>
                      <button
                        type="button"
                        aria-label="increase quantity"
                        onClick={() => cart.setQty(item.productId, item.qty + 1)}
                        className="relative w-7 h-7 rounded-full border-2 border-ink bg-cream flex items-center justify-center hover:bg-sun transition-colors before:absolute before:-inset-2 before:content-['']"
                      >
                        <Plus size={12} strokeWidth={3} />
                      </button>
                      <button
                        type="button"
                        aria-label="remove item"
                        onClick={() => cart.remove(item.productId)}
                        className="relative ml-auto text-ink/60 hover:text-poppy transition-colors before:absolute before:-inset-3 before:content-['']"
                      >
                        <Trash2 size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {lines.length > 0 && (
            <footer
              className="p-5 sm:p-6 flex flex-col gap-4 border-t-4 border-ink bg-cream"
              style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-ink">Estimated Total</span>
                <span className="text-lg font-bold text-ink">{formatPrice(subtotal)}</span>
              </div>
              <Link
                to="/checkout"
                onClick={() => cartDrawer.close()}
                className="w-full tc-btn tc-btn-poppy text-center inline-flex justify-center"
              >
                Proceed to checkout
              </Link>
              <Link
                to="/cart"
                onClick={() => cartDrawer.close()}
                className="w-full tc-btn tc-btn-cream text-center"
              >
                View Full Cart
              </Link>
            </footer>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
