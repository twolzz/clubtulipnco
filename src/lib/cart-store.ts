import { useSyncExternalStore } from "react";

const STORAGE_KEY = "tulip-cart-v1";

export type CartItem = { productId: string; qty: number };
export type CartState = { items: CartItem[] };

const listeners = new Set<() => void>();
let state: CartState = { items: [] };
let hydrated = false;

function emit() {
  for (const l of listeners) l();
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartState;
      if (parsed && Array.isArray(parsed.items)) state = parsed;
    }
  } catch {
    /* ignore */
  }
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) {
      try {
        state = e.newValue ? (JSON.parse(e.newValue) as CartState) : { items: [] };
        emit();
      } catch {
        /* ignore */
      }
    }
  });
}

function subscribe(cb: () => void) {
  hydrate();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function getSnapshot(): CartState {
  return state;
}

function getServerSnapshot(): CartState {
  return { items: [] };
}

export const cart = {
  add(productId: string, qty = 1) {
    hydrate();
    const existing = state.items.find((i) => i.productId === productId);
    if (existing) {
      state = {
        items: state.items.map((i) =>
          i.productId === productId ? { ...i, qty: i.qty + qty } : i,
        ),
      };
    } else {
      state = { items: [...state.items, { productId, qty }] };
    }
    persist();
    emit();
  },
  setQty(productId: string, qty: number) {
    hydrate();
    if (qty <= 0) return cart.remove(productId);
    state = {
      items: state.items.map((i) => (i.productId === productId ? { ...i, qty } : i)),
    };
    persist();
    emit();
  },
  remove(productId: string) {
    hydrate();
    state = { items: state.items.filter((i) => i.productId !== productId) };
    persist();
    emit();
  },
  clear() {
    state = { items: [] };
    persist();
    emit();
  },
};

export function useCart(): CartState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useCartCount(): number {
  const { items } = useCart();
  return items.reduce((sum, i) => sum + i.qty, 0);
}

// Simple UI-open store for the drawer
let drawerOpen = false;
const drawerListeners = new Set<() => void>();
export const cartDrawer = {
  open() {
    drawerOpen = true;
    for (const l of drawerListeners) l();
  },
  close() {
    drawerOpen = false;
    for (const l of drawerListeners) l();
  },
  toggle() {
    drawerOpen = !drawerOpen;
    for (const l of drawerListeners) l();
  },
};
export function useCartDrawer(): boolean {
  return useSyncExternalStore(
    (cb) => {
      drawerListeners.add(cb);
      return () => drawerListeners.delete(cb);
    },
    () => drawerOpen,
    () => false,
  );
}
