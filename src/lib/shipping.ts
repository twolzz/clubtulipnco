// Single source of truth for the shipping fee, imported by both the checkout
// page (to display it) and checkout.functions.ts (to actually charge it).
// One file means the number shown to the customer and the number Stripe
// charges can never drift apart — the exact kind of mismatch that caused the
// SITE_URL and env-project bugs earlier in this project.
//
// No secrets in here, just two numbers and a pure function — safe to import
// from client-side code.

export const FREE_SHIPPING_THRESHOLD_CENTS = 5000; // $50.00 — free shipping AT or above this
export const FLAT_SHIPPING_CENTS = 600; // $6.00 flat rate below the threshold

export function shippingCentsFor(subtotalCents: number): number {
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
}
