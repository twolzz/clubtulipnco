import { useEffect } from "react";

/**
 * Wraps every word of the visible prose under the given roots in
 * `<span class="word word-heading">` / `<span class="word word-body">`, so
 * CSS alone can lift each word a few px on hover (see .word rules in
 * styles.css — lift only, no color: every brand color is also in use as
 * some card's background somewhere on the site, so a color tint would go
 * invisible against a same-colored surface — orange-on-orange, blue-on-
 * blue). Runs directly on the DOM after mount rather than as a JSX
 * transform, so it works automatically on any page without every component
 * needing to opt in.
 *
 * Entry points are deliberately narrow — h1–h6, p, li, label, dt/dd,
 * blockquote, figcaption, a — rather than every element in the tree, for
 * two reasons: (1) that's "headings, paragraphs, labels" from the brief
 * plus content links (product/article titles, footer links, nav links,
 * "next article" teasers — anything that reads as a piece of text you can
 * click, not a button), and (2) it's what keeps this safe. A handful of
 * spots render a bare <span> whose text value changes after mount (cart
 * quantity, line totals, the "N items" count) sitting directly in a flex
 * row, not inside any of these containers — replacing a live text node
 * with wrapper spans detaches the exact Text node React's fiber holds a
 * reference to, so a later state-driven update silently writes to a node
 * no longer in the document instead of the one on screen. Starting only
 * from prose/link containers means those bare dynamic spans are never
 * reached. The few dynamic spots that DO sit inside a <p> (Shop's item
 * count, checkout status copy, form field errors) are opted out
 * explicitly via `data-no-word-hover` at the call site — same escape
 * hatch used for mini tags/pills (a category tag, a stock-status pill, a
 * date tile) and the logo (its own distinct hover instead — see
 * SiteLayout/`.tc-logo`), just for different reasons each time.
 *
 * Skipped entirely (subtree included): <button>, <input>, <textarea>,
 * <select>, <svg>, <script>, <style>, anything carrying the `.tc-btn` or
 * `.tc-press` class (a link styled and behaving as a button — "Shop
 * Miffy", filter/tab pills, "Join the Club!"), and anything under
 * `data-no-word-hover`. Those already carry their own hover motion (press
 * physics, lift), so layering per-word lift on top would compound into two
 * competing animations. Plain content links (no button styling) — including
 * the primary nav now — DO get word-hover; it composes fine with a simple
 * `hover:text-*` color transition on the link itself, since that's a
 * `color` change on the *link* while word-hover's lift lands on each
 * `.word` span one level down — not the same property on the same element.
 *
 * Idempotent and self-healing: a MutationObserver re-runs the pass whenever
 * the DOM changes (route change, tab switch, async data landing, a fresh
 * mount inside an entry-point container), but only ever touches text nodes
 * that aren't already wrapped, so it never re-wraps or duplicates content.
 */

const ENTRY_SELECTOR =
  "h1, h2, h3, h4, h5, h6, p, li, label, dt, dd, blockquote, figcaption, a";

const BUTTON_LIKE_SELECTOR = ".tc-btn, .tc-press";

const SKIP_TAGS = new Set([
  "BUTTON",
  "INPUT",
  "TEXTAREA",
  "SELECT",
  "SVG",
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
]);

const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);

function wrapTextNode(node: Text, kind: "heading" | "body") {
  const text = node.textContent ?? "";
  if (!text.trim()) return;

  const parts = text.split(/(\s+)/);
  const frag = document.createDocumentFragment();
  for (const part of parts) {
    if (part === "") continue;
    if (/^\s+$/.test(part)) {
      frag.appendChild(document.createTextNode(part));
    } else {
      const span = document.createElement("span");
      span.className = kind === "heading" ? "word word-heading" : "word word-body";
      span.textContent = part;
      frag.appendChild(span);
    }
  }
  node.replaceWith(frag);
}

function walk(node: Node, kind: "heading" | "body") {
  if (node.nodeType === Node.TEXT_NODE) {
    wrapTextNode(node as Text, kind);
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as HTMLElement;
  if (SKIP_TAGS.has(el.tagName)) return;
  if (el.dataset.noWordHover !== undefined) return;
  if (el.classList.contains("word")) return; // already-wrapped leaf
  if (el.matches(BUTTON_LIKE_SELECTOR)) return; // button-styled link

  // Re-derive kind at every level rather than just inheriting it: now that
  // <a> is an entry point too, a heading can sit *inside* a link entry
  // (a card's whole-card <Link> wrapping its <h2> title) and would
  // otherwise inherit that link's "body" kind and lift 2px instead of the
  // 3px a heading word should get.
  const nextKind = HEADING_TAGS.has(el.tagName) ? "heading" : kind;

  // Snapshot children first — wrapping a text node replaces it with a
  // fragment, which would otherwise shift the live childNodes list mid-walk.
  const children = Array.from(el.childNodes);
  for (const child of children) walk(child, nextKind);
}

function runPass(roots: (Element | null)[]) {
  for (const root of roots) {
    if (!root) continue;
    const entries = root.querySelectorAll<HTMLElement>(ENTRY_SELECTOR);
    for (const entry of entries) {
      if (entry.dataset.noWordHover !== undefined) continue;
      if (entry.closest("[data-no-word-hover]")) continue;
      // An entry point can itself sit inside a button, or be one (a filter
      // pill, a "Join the Club!" link) — that already has its own press
      // physics, so skip it here too, not just when a button shows up
      // *inside* a heading/paragraph.
      if (entry.closest("button")) continue;
      if (entry.closest(BUTTON_LIKE_SELECTOR)) continue;
      const kind = HEADING_TAGS.has(entry.tagName) ? "heading" : "body";
      walk(entry, kind);
    }
  }
}

export function useWordHoverScope() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // document.body, not just <main>/<footer>: Radix portals (CartDrawer,
    // JoinClubDialog) mount their content as siblings appended to <body>,
    // not inside the app's own DOM subtree, so a scope narrower than body
    // would silently never reach them. Safety here comes from the entry
    // selector and per-element checks above, not from which root is
    // scanned, so widening the root doesn't reopen the risks those guard
    // against. The header/mobile-nav is excluded via its own
    // `data-no-word-hover` (see SiteLayout) now that scope alone can't do
    // that job.
    const roots = [document.body];
    runPass(roots);

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      queueMicrotask(() => {
        scheduled = false;
        runPass(roots);
      });
    });

    for (const root of roots) {
      if (!root) continue;
      observer.observe(root, { childList: true, subtree: true, characterData: true });
    }

    return () => observer.disconnect();
  }, []);
}
