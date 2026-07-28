import { loadStripe, type Stripe, type Appearance } from "@stripe/stripe-js";

/**
 * Stripe.js is loaded once per page, not once per render.
 * The publishable key is safe to expose — that is what it is for.
 */
let stripePromise: Promise<Stripe | null> | null = null;

export function getStripe() {
  if (!stripePromise) {
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);
  }
  return stripePromise;
}

/** Fallbacks mirror :root in styles.css, used during SSR. */
const INK = "#000000";
const CREAM = "#F6F2E7";
const POPPY = "#E05A36";
const DENIM = "#3D6E97";

/** Read a CSS custom property off :root, falling back to the token above. */
function cssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

/**
 * Elements appearance mirroring the .tc-input and .tc-card rules in
 * styles.css: 3px ink border, 999px pill radius, no resting shadow, and a
 * 4px hard-offset shadow on focus. Body copy is Inter (--font-sans);
 * Quicksand (--font-display) is reserved for headings and labels.
 *
 * Called at render time (not module scope) so the stylesheet has loaded.
 */
export function buildAppearance(): Appearance {
  const ink = cssVar("--ink", INK);
  const cream = cssVar("--cream", CREAM);
  const poppy = cssVar("--poppy", POPPY);
  const denim = cssVar("--denim", DENIM);

  return {
    theme: "flat",
    variables: {
      colorPrimary: poppy,
      colorBackground: "#FFFFFF",
      colorText: ink,
      colorTextSecondary: ink,
      colorDanger: poppy,
      fontFamily: 'Inter, "Helvetica Neue", ui-sans-serif, system-ui, sans-serif',
      fontSizeBase: "16px",
      fontWeightNormal: "500",
      borderRadius: "16px",
      spacingUnit: "4px",
    },
    rules: {
      // Matches .tc-input exactly.
      ".Input": {
        backgroundColor: "#FFFFFF",
        border: `3px solid ${ink}`,
        borderRadius: "999px",
        boxShadow: "none",
        padding: "0.85rem 1.25rem",
        fontWeight: "500",
        color: ink,
      },
      // .tc-input:focus keeps the ink border and adds the hard shadow.
      ".Input:focus": {
        border: `3px solid ${ink}`,
        boxShadow: `4px 4px 0 ${ink}`,
        outline: "none",
      },
      ".Input--invalid": {
        border: `3px solid ${poppy}`,
        boxShadow: `4px 4px 0 ${poppy}`,
        color: ink,
      },
      ".Input::placeholder": {
        color: "#00000066",
      },
      // Labels use the display face, like headings.
      ".Label": {
        fontFamily: 'Quicksand, Inter, "Helvetica Neue", sans-serif',
        fontWeight: "700",
        fontSize: "12px",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: ink,
        opacity: "0.7",
        marginBottom: "8px",
      },
      // Payment method tabs follow the card radius, not the input pill.
      ".Tab": {
        backgroundColor: cream,
        border: `3px solid ${ink}`,
        borderRadius: "16px",
        boxShadow: `4px 4px 0 ${ink}`,
        color: ink,
        fontFamily: 'Quicksand, Inter, "Helvetica Neue", sans-serif',
        fontWeight: "700",
      },
      ".Tab:hover": {
        backgroundColor: "#FFFFFF",
        boxShadow: `6px 6px 0 ${ink}`,
        color: ink,
      },
      ".Tab--selected": {
        backgroundColor: denim,
        border: `3px solid ${ink}`,
        boxShadow: `4px 4px 0 ${ink}`,
        color: "#FFFFFF",
      },
      ".Tab--selected:focus": {
        boxShadow: `4px 4px 0 ${ink}`,
        color: "#FFFFFF",
      },
      ".TabIcon--selected": {
        fill: "#FFFFFF",
      },
      ".Block": {
        backgroundColor: "#FFFFFF",
        border: `3px solid ${ink}`,
        borderRadius: "16px",
        boxShadow: "none",
      },
      ".Error": {
        fontWeight: "700",
        color: poppy,
        marginTop: "8px",
      },
      ".CheckboxInput": {
        backgroundColor: "#FFFFFF",
        border: `2px solid ${ink}`,
        borderRadius: "6px",
      },
      ".CheckboxInput--checked": {
        backgroundColor: poppy,
        border: `2px solid ${ink}`,
      },
    },
  };
}
