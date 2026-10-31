"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const WISHLIST_STORAGE_KEY = "taqwa.wishlist.v1";

const WishlistContext = createContext(null);

function readStoredWishlist() {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

/**
 * Lightweight client-side wishlist (product ids) persisted in localStorage.
 * Purely presentational — there is no backend wishlist, and the storefront
 * cart / checkout flows are untouched. Hydrates once after first paint so the
 * server HTML and the first client render always match.
 */
export function WishlistProvider({ children }) {
  const [ids, setIds] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  // Set once hydration has read localStorage; until then persistence is
  // skipped so the empty initial state can never clobber the saved list.
  const [hydrated, setHydrated] = useState(false);

  // Hydrate after the first paint (matches the cart context's local-first
  // hydration pattern so SSR and client markup agree). Persistence waits for
  // this to finish — writing on mount would overwrite the stored wishlist
  // with `[]` before the saved ids load, wiping it on every refresh.
  useEffect(() => {
    queueMicrotask(() => {
      setIds(readStoredWishlist());
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    try {
      window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(ids));
    } catch {
      // Storage unavailable — the wishlist still works in-memory.
    }
  }, [ids, hydrated]);

  const isSaved = useCallback((id) => ids.includes(id), [ids]);

  const toggle = useCallback((id) => {
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const openWishlist = useCallback(() => setIsOpen(true), []);
  const closeWishlist = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ ids, isSaved, toggle, isOpen, openWishlist, closeWishlist }),
    [ids, isSaved, toggle, isOpen, openWishlist, closeWishlist]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return ctx;
}
