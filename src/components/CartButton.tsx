import { ShoppingBag } from "lucide-react";
import { useCartCount, cartDrawer } from "@/lib/cart-store";
import { CartDrawer } from "./CartDrawer";

export function CartButton() {
  const count = useCartCount();

  return (
    <>
      <button
        type="button"
        aria-label={`Shopping cart, ${count} ${count === 1 ? "item" : "items"}`}
        onClick={() => cartDrawer.open()}
        className="relative inline-flex h-11 w-11 items-center justify-center gap-2 rounded-full border-[3px] border-ink bg-cream font-semibold text-ink shadow-[4px_4px_0_var(--ink)] transition-all hover:shadow-[6px_6px_0_var(--ink)] hover:-translate-x-[2px] hover:-translate-y-[2px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_var(--ink)] md:h-auto md:w-auto md:px-4 md:py-2"
      >
        <ShoppingBag size={18} strokeWidth={2.5} />
        <span className="hidden md:inline text-sm">Cart ({count})</span>

        {/* Count badge — mobile only, since the desktop label already shows it */}
        {count > 0 && (
          <span
            aria-hidden
            className="md:hidden absolute -top-1 -right-1 grid h-5 min-w-[20px] place-items-center rounded-full border-2 border-ink bg-poppy px-1 text-[11px] font-extrabold leading-none text-white"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>
      <CartDrawer />
    </>
  );
}
