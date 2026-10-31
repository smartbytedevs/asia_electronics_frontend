"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  addCartItem,
  clearCart as clearBackendCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/api/cart";
import { safeMessage } from "@/lib/api/http";

const CART_STORAGE_KEY = "taqwa.cart.v1";
const CART_SYNCED_KEY = "taqwa.cart.v1.synced";
const CART_STASH_KEY = "taqwa.cart.stash.v1";
const MAX_QUANTITY = 99;

const CartContext = createContext(null);

function readStoredCart() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Variant attributes for display. When a size was picked, the size attribute's
 * packed value (e.g. "L, M, S") is replaced with the single chosen size so the
 * bag shows "M", not "L · M · S".
 */
function attributesLabelFor(variant, selectedSize) {
  const attributes = { ...(variant?.attributes ?? {}) };
  if (selectedSize) {
    const key = Object.keys(attributes).find((k) => /^size$/i.test(k.trim()));
    if (key) {
      attributes[key] = selectedSize;
    }
  }
  return Object.values(attributes).filter(Boolean).join(" · ");
}

/**
 * Maps one backend cart line to the unified line shape the drawer / cart page
 * render. `key` is stable per variant + selectedSize (the backend merges
 * same-variant+size lines) and `cartItemId` is the backend item id used for
 * mutations.
 */
function mapBackendItem(item) {
  const selectedSize = item.selectedSize ?? null;
  return {
    key: item.productVariantId
      ? `variant:${item.productVariantId}${selectedSize ? `:${selectedSize}` : ""}`
      : `product:${item.productId}`,
    cartItemId: item.id,
    productId: item.productId,
    variantId: item.productVariantId ?? null,
    slug: item.product?.slug ?? null,
    name: item.product?.name ?? "Unavailable item",
    selectedSize,
    attributesLabel: attributesLabelFor(item.variant, selectedSize),
    imageUrl: null,
    unitPriceMinorUnits: item.priceMinorUnits,
    quantity: item.quantity,
    isAvailable: Boolean(item.isAvailable),
    // Backend-provided live stock (null when the variant has no inventory
    // record). Used only to cap quantity in the bag UI — checkout remains the
    // authoritative stock check.
    availableOnlineQuantity:
      typeof item.availableOnlineQuantity === "number" && item.availableOnlineQuantity >= 0
        ? item.availableOnlineQuantity
        : null,
  };
}

function cartFromPayload(payload) {
  const items = payload?.data?.cart?.items;
  if (!Array.isArray(items)) {
    return null;
  }
  return items.map(mapBackendItem);
}

/**
 * Shopping bag that switches between two sources:
 *
 * - Guests: a local-first bag in localStorage (`taqwa.cart.v1`). Prices are
 *   displayed for convenience only; checkout always recomputes authoritative
 *   totals from the catalog.
 * - Signed-in customers: the real backend cart (`/cart`). On sign-in the
 *   stored guest bag is synced into the backend cart with add-with-existing-
 *   quantity semantics (the backend merges per variant), then cleared from the
 *   browser ONLY after an order is placed — so a failed checkout never loses
 *   the guest bag.
 *
 * The backend cart is never persisted to localStorage, so it can never
 * overwrite or destroy the guest bag.
 */
export function CartProvider({ children }) {
  const { data: session, isPending } = authClient.useSession();
  const isSignedIn = Boolean(session?.user);

  const [items, setItems] = useState([]);
  const [mode, setMode] = useState("local");
  const [ready, setReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const syncInFlightRef = useRef(false);

  const showToast = useCallback((message) => {
    setToast({ id: Date.now(), message });
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(toastTimer.current);
  }, [toast]);

  // Hydrate the guest bag once after the first paint so server HTML and the
  // first client render always match (the bag is a client-only concern).
  useEffect(() => {
    const stored = readStoredCart();
    if (stored) {
      queueMicrotask(() => setItems(stored));
    }
  }, []);

  // Persist ONLY in local (guest) mode. Writing backend cart items here would
  // clobber the guest bag, which must survive until a real order is placed.
  useEffect(() => {
    if (mode !== "local" || !ready) {
      return;
    }
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or unavailable — the bag still works in-memory.
    }
  }, [items, mode, ready]);

  const markGuestDirty = useCallback(() => {
    try {
      window.localStorage.removeItem(CART_SYNCED_KEY);
    } catch {
      // ignore
    }
  }, []);

  /**
   * Pushes the stored guest bag into the backend cart once. The `synced`
   * marker guards against double-syncs (e.g. StrictMode or a sign-out/sign-in
   * with an unchanged bag); local mutations clear the marker so a changed bag
   * is re-synced on the next sign-in. Network failures abort the sync and
   * leave the guest bag untouched.
   */
  const syncGuestCartToBackend = useCallback(async () => {
    const stored = readStoredCart();
    if (!stored || stored.length === 0) {
      return;
    }
    try {
      if (window.localStorage.getItem(CART_SYNCED_KEY) === "1") {
        return;
      }
    } catch {
      // ignore and re-sync
    }
    for (const entry of stored) {
      const productId = entry.productId;
      const variantId = entry.variantId ?? null;
      const quantity = Number(entry.quantity);
      if (
        (!productId && !variantId) ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        continue;
      }
      const res = await addCartItem({
        productId,
        productVariantId: variantId,
        quantity,
        selectedSize: entry.selectedSize ?? null,
      });
      if (res.status === 0) {
        // Backend unreachable — keep the guest bag as-is for the next attempt.
        return;
      }
      // Backend rejections (e.g. a variant that is no longer active) are
      // skipped silently; the remaining valid lines still sync.
    }
    try {
      window.localStorage.setItem(CART_SYNCED_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  /**
   * Populates the guest's BACKEND cart so it exactly matches the local bag the
   * UI is showing, then resolves. Called immediately before a guest checkout,
   * because the order service reads the customer's backend cart — an empty one
   * fails checkout with "Cart is empty" (order.service.js:335).
   *
   * Unlike the sign-in sync this is exact-match and deterministic:
   *   1. Clears the backend cart first (idempotent) so stale or previously
   *      merged lines can never leak into the order, and re-syncing can never
   *      inflate quantities (the backend bumps quantity on re-add).
   *   2. Re-adds every current line — variant lines send `productVariantId`,
   *      simple-product lines send `productId` with `productVariantId: null`.
   * Any failure throws so checkout stops with a clear message instead of
   * proceeding into "Cart is empty".
   */
  const syncGuestCartForCheckout = useCallback(async () => {
    const lines = items.filter((item) => item.quantity > 0);
    const clearRes = await clearBackendCart();
    if (clearRes.status === 0) {
      throw new Error(
        "We couldn't reach our servers to prepare your order. Please check your connection and try again."
      );
    }
    if (!clearRes.ok) {
      throw new Error(safeMessage(clearRes.status, clearRes.payload));
    }
    for (const entry of lines) {
      const variantId = entry.variantId ?? null;
      const quantity = Math.max(
        1,
        Math.min(Math.round(Number(entry.quantity)) || 1, MAX_QUANTITY)
      );
      if (!variantId && !entry.productId) {
        throw new Error(
          `"${entry.name || "One of your items"}" can't be placed right now. Please remove it from your cart and try again.`
        );
      }
      const res = await addCartItem({
        productId: entry.productId,
        productVariantId: variantId,
        quantity,
        selectedSize: entry.selectedSize ?? null,
      });
      if (res.status === 0) {
        throw new Error(
          "We couldn't reach our servers to prepare your order. Please check your connection and try again."
        );
      }
      if (!res.ok) {
        throw new Error(safeMessage(res.status, res.payload));
      }
    }
  }, [items]);

  const loadBackendCart = useCallback(async () => {
    const res = await getCart();
    if (!res.ok) {
      if (res.status !== 401 && res.status !== 403) {
        showToast(safeMessage(res.status, res.payload));
      }
      return;
    }
    const mapped = cartFromPayload(res.payload);
    if (mapped) {
      setItems(mapped);
    }
  }, [showToast]);

  // Switch the source based on the auth session.
  useEffect(() => {
    if (isPending) {
      return;
    }

    if (isSignedIn) {
      if (syncInFlightRef.current) {
        return;
      }
      syncInFlightRef.current = true;
      (async () => {
        try {
          await syncGuestCartToBackend();
        } catch {
          // never block the storefront on a failed sync
        }
        setMode("backend");
        await loadBackendCart();
        setReady(true);
      })();
      return;
    }

    // Signed out: back to the guest bag.
    syncInFlightRef.current = false;
    queueMicrotask(() => {
      setMode("local");
      setItems(readStoredCart() ?? []);
      setReady(true);
    });
  }, [isPending, isSignedIn, syncGuestCartToBackend, loadBackendCart]);

  const addItem = useCallback(
    async (entry) => {
      if (mode === "backend") {
        const res = await addCartItem({
          productId: entry.productId,
          productVariantId: entry.variantId,
          quantity: entry.quantity,
          selectedSize: entry.selectedSize ?? null,
        });
        if (res.ok) {
          const mapped = cartFromPayload(res.payload);
          if (mapped) {
            setItems(mapped);
          }
          showToast("Added to your cart");
        } else {
          showToast(safeMessage(res.status, res.payload));
        }
        return;
      }
      markGuestDirty();
      setItems((prev) => {
        const existing = prev.find((item) => item.key === entry.key);
        if (existing) {
          return prev.map((item) =>
            item.key === entry.key
              ? {
                  ...item,
                  quantity: Math.min(item.quantity + entry.quantity, MAX_QUANTITY),
                }
              : item
          );
        }
        return [...prev, { ...entry, quantity: Math.min(entry.quantity, MAX_QUANTITY) }];
      });
      showToast("Added to your cart");
    },
    [mode, markGuestDirty, showToast]
  );

  const setQuantity = useCallback(
    async (key, quantity) => {
      const target = items.find((item) => item.key === key);
      if (!target) {
        return;
      }
      const next = Math.max(1, Math.min(Math.round(quantity), MAX_QUANTITY));
      if (next === target.quantity) {
        return;
      }
      if (mode === "backend") {
        const res = await updateCartItem(target.cartItemId, next);
        if (res.ok) {
          const mapped = cartFromPayload(res.payload);
          if (mapped) {
            setItems(mapped);
          }
        } else {
          showToast(safeMessage(res.status, res.payload));
        }
        return;
      }
      markGuestDirty();
      setItems((prev) =>
        prev.map((item) =>
          item.key === key ? { ...item, quantity: next } : item
        )
      );
    },
    [items, mode, markGuestDirty, showToast]
  );

  const updateQuantity = useCallback(
    async (key, delta) => {
      const target = items.find((item) => item.key === key);
      if (!target) {
        return;
      }
      await setQuantity(key, target.quantity + delta);
    },
    [items, setQuantity]
  );

  const removeItem = useCallback(
    async (key) => {
      const target = items.find((item) => item.key === key);
      if (mode === "backend") {
        if (!target) {
          return;
        }
        const res = await removeCartItem(target.cartItemId);
        if (res.ok) {
          const mapped = cartFromPayload(res.payload);
          if (mapped) {
            setItems(mapped);
          }
        } else {
          showToast(safeMessage(res.status, res.payload));
        }
        return;
      }
      markGuestDirty();
      setItems((prev) => prev.filter((item) => item.key !== key));
    },
    [mode, items, markGuestDirty, showToast]
  );

  const clearCart = useCallback(async () => {
    if (mode === "backend") {
      const res = await clearBackendCart();
      if (res.ok) {
        setItems([]);
      } else {
        showToast(safeMessage(res.status, res.payload));
      }
      return;
    }
    markGuestDirty();
    setItems([]);
  }, [mode, markGuestDirty, showToast]);

  const refresh = useCallback(async () => {
    if (mode !== "backend") {
      return;
    }
    await loadBackendCart();
  }, [mode, loadBackendCart]);

  /**
   * "Order now" — swaps the active bag for a single chosen piece and remembers
   * the previous bag in sessionStorage (`taqwa.cart.stash.v1`) so it can be
   * restored after the order is placed — or if the visitor abandons checkout
   * without ordering. Returns true when the bag is ready for checkout and
   * false when a backend sync failed (the caller should not navigate).
   */
  const beginBuyNow = useCallback(
    async (entry) => {
      if (items.length > 0) {
        try {
          window.sessionStorage.setItem(CART_STASH_KEY, JSON.stringify(items));
        } catch {
          // Stash unavailable — buy-now still works, the prior bag is lost.
        }
      }
      const quantity = Math.max(
        1,
        Math.min(Math.round(Number(entry.quantity)) || 1, MAX_QUANTITY)
      );
      if (mode === "backend") {
        const clearRes = await clearBackendCart();
        if (clearRes.status === 0) {
          showToast(
            "We couldn't reach our servers. Please check your connection and try again."
          );
          return false;
        }
        if (!clearRes.ok) {
          showToast(safeMessage(clearRes.status, clearRes.payload));
          return false;
        }
        const res = await addCartItem({
          productId: entry.productId,
          productVariantId: entry.variantId,
          quantity,
          selectedSize: entry.selectedSize ?? null,
        });
        if (res.status === 0) {
          showToast(
            "We couldn't reach our servers. Please check your connection and try again."
          );
          return false;
        }
        if (!res.ok) {
          showToast(safeMessage(res.status, res.payload));
          return false;
        }
        const mapped = cartFromPayload(res.payload);
        if (mapped) {
          setItems(mapped);
        }
        return true;
      }
      markGuestDirty();
      setItems([{ ...entry, quantity }]);
      return true;
    },
    [items, mode, markGuestDirty, showToast]
  );

  /**
   * Restores the bag stashed by a buy-now. No-op when no stash exists. Guest
   * bags are restored instantly from sessionStorage; backend carts are cleared
   * and re-synced line by line (same exact-match approach as a guest checkout).
   */
  const restoreStashedCart = useCallback(async () => {
    let raw = null;
    try {
      raw = window.sessionStorage.getItem(CART_STASH_KEY);
      window.sessionStorage.removeItem(CART_STASH_KEY);
    } catch {
      // ignore
    }
    if (!raw) {
      return;
    }
    let stashed;
    try {
      stashed = JSON.parse(raw);
    } catch {
      return;
    }
    if (!Array.isArray(stashed) || stashed.length === 0) {
      return;
    }
    if (mode === "backend") {
      const clearRes = await clearBackendCart();
      if (clearRes.status === 0 || !clearRes.ok) {
        return;
      }
      for (const line of stashed) {
        const variantId = line.variantId ?? null;
        const quantity = Math.max(
          1,
          Math.min(Math.round(Number(line.quantity)) || 1, MAX_QUANTITY)
        );
        if (!variantId && !line.productId) {
          continue;
        }
        const res = await addCartItem({
          productId: line.productId,
          productVariantId: variantId,
          quantity,
          selectedSize: line.selectedSize ?? null,
        });
        if (res.ok) {
          const mapped = cartFromPayload(res.payload);
          if (mapped) {
            setItems(mapped);
          }
        }
      }
      return;
    }
    setItems(
      stashed.map((line) => ({
        ...line,
        quantity: Math.max(
          1,
          Math.min(Math.round(Number(line.quantity)) || 1, MAX_QUANTITY)
        ),
      }))
    );
  }, [mode]);

  const pathname = usePathname();

  // Heal an abandoned buy-now: once the visitor leaves checkout without
  // placing the order, put their original bag back. The order-complete path
  // restores explicitly (the confirmation stays on /checkout), so this effect
  // only fires for abandonment or a later cross-tab recovery.
  useEffect(() => {
    if (pathname === "/checkout") {
      return;
    }
    queueMicrotask(() => {
      restoreStashedCart();
    });
  }, [pathname, restoreStashedCart]);

  /**
   * Called only after a successful order: drops the stored guest bag (and its
   * sync marker) so signing out later starts with an empty bag.
   */
  const forgetLocalCart = useCallback(() => {
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      window.localStorage.removeItem(CART_SYNCED_KEY);
    } catch {
      // ignore
    }
    if (mode === "local") {
      setItems([]);
    }
  }, [mode]);

  const itemCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const subtotalMinorUnits = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + (item.unitPriceMinorUnits ?? 0) * item.quantity,
        0
      ),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      mode,
      ready,
      isOpen,
      toast,
      itemCount,
      subtotalMinorUnits,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      showToast,
      addItem,
      updateQuantity,
      setQuantity,
      removeItem,
      clearCart,
      refresh,
      forgetLocalCart,
      syncGuestCartForCheckout,
      beginBuyNow,
      restoreStashedCart,
    }),
    [
      items,
      mode,
      ready,
      isOpen,
      toast,
      itemCount,
      subtotalMinorUnits,
      showToast,
      addItem,
      updateQuantity,
      setQuantity,
      removeItem,
      clearCart,
      refresh,
      forgetLocalCart,
      syncGuestCartForCheckout,
      beginBuyNow,
      restoreStashedCart,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}

/**
 * Builds a bag line item from a product + chosen variant.
 * @param {object} product - public product (detail or card shape).
 * @param {string|null} variantId - chosen active variant id (defaults to first active).
 * @param {number} quantity
 * @param {string|null} selectedSize - chosen size token (when the variant has sizes).
 */
export function buildCartEntry(product, variantId = null, quantity = 1, selectedSize = null) {
  const activeVariants = (product.variants || []).filter((v) => v.isActive);
  const variant =
    activeVariants.find((v) => v.id === variantId) || activeVariants[0] || null;

  const unitPriceMinorUnits =
    variant?.effectiveSellingPrice ??
    variant?.sellingPrice ??
    product.effectiveSellingPrice ??
    product.sellingPrice ??
    0;

  const size = selectedSize ?? null;

  return {
    key: `${product.id}:${variant ? variant.id : "default"}${size ? `:${size}` : ""}`,
    productId: product.id,
    variantId: variant ? variant.id : null,
    slug: product.slug ?? null,
    name: product.name,
    selectedSize: size,
    attributesLabel: attributesLabelFor(variant, size),
    imageUrl: product.images?.[0]?.url ?? null,
    unitPriceMinorUnits,
    quantity,
  };
}
