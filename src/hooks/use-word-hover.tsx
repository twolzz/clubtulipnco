import { useEffect, type RefObject } from "react";

/**
 * Wraps every word of the visible prose under the given roots in
 * `<span class="word word-heading">` / `<span class="word word-body">`, so
 * CSS alone can lift + tint individual words on hover (see .word rules in
 * styles.css). Runs directly on the DOM after mount rather than as a JSX
 * transform, so it works automatically on any page without every component
 * needing to opt in.
 *
 * Entry points are deliberately narrow — h1–h6, p, li, label, dt/dd,
 * blockquote, figcaption — rather than every element in the tree, for two
 * reasons: (1) that's exactly "headings, paragraphs, labels" from the brief,
 * and (2) it's what keeps this safe. A handful of spots render a bare
 * <span> whose text value changes after mount (cart quantity, line totals,
 * the "N items" count) sitting directly in a flex row, not inside any of
 * these containers — replacing a live text node with wrapper spans detaches
 * the exact Text node React's fiber holds a reference to, so a later
 * state-driven update silently writes to a node no longer in the document
 * instead of the one on screen. Starting only from prose containers means
 * those bare dynamic spans are never reached. The few dynamic spots that DO
 * sit inside a <p> (Shop's item count, checkout status copy, form field
 * errors) are opted out explicitly via `data-no-word-hover` at the call
 * site — same escape hatch as icon buttons/badges, just for correctness
 * instead of taste.
 *
 * Skipped entirely (subtree included): <a>, <button>, <input>, <textarea>,
 * <select>, <svg>, <script>, <style>, and anything under
 * `data-no-word-hover` — interactive elements already carry their own hover
 * motion (tc-btn/tc-press/tc-lift, nav color-transitions), so layering
 * per-word lift on top would compound into two competing animations.
 *
 * Idempotent and self-healing: a MutationObserver re-runs the pass whenever
 * the DOM changes (route change, tab switch, async data landing, a fresh
 * mount inside an entry-point container), but only ever touches text nodes
 * that aren't already wrapped, so it never re-wraps or duplicates content.
 */

const ENTRY_SELECTOR =
  "h1, h2, h3, h4, h5, h6, p, li, label, dt, dd, blockquote, figcaption";

const SKIP_TAGS = new Set([
  "A",
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

  // Snapshot children first — wrapping a text node replaces it with a
  // fragment, which would otherwise shift the live childNodes list mid-walk.
  const children = Array.from(el.childNodes);
  for (const child of children) walk(child, kind);
}

function runPass(roots: (Element | null)[]) {
  for (const root of roots) {
    if (!root) continue;
    const entries = root.querySelectorAll<HTMLElement>(ENTRY_SELECTOR);
    for (const entry of entries) {
      if (entry.dataset.noWordHover !== undefined) continue;
      if (entry.closest("[data-no-word-hover]")) continue;
      // An entry point can itself sit inside a link/button (a card's title,
      // a "next article" teaser) — that whole region already has its own
      // hover treatment, so skip it here too, not just when a link/button
      // shows up *inside* a heading/paragraph.
      if (entry.closest("a, button")) continue;
      const kind = HEADING_TAGS.has(entry.tagName) ? "heading" : "body";
      walk(entry, kind);
    }
  }
}

export function useWordHoverScope(refs: RefObject<HTMLElement | null>[]) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const roots = refs.map((r) => r.current);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
