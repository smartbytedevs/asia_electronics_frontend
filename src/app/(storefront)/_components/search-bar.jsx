"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Price } from "./price";
import { ProductImage } from "./product-image";
import { ArrowRightIcon, CloseIcon, SearchIcon } from "./icons";

const CATALOG_LIMIT = 100;
const RESULT_LIMIT = 8;

/**
 * Catalog cache (module-level) so reopening search doesn't refetch. The
 * backend exposes no dedicated search endpoint, so the existing public
 * product list is loaded once and filtered client-side by name.
 */
let catalogCache = null;

async function fetchCatalog() {
  if (catalogCache) {
    return catalogCache;
  }
  const response = await fetch(`/api/backend/products?limit=${CATALOG_LIMIT}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Catalog unavailable");
  }
  const payload = await response.json();
  const products = Array.isArray(payload?.data?.products)
    ? payload.data.products
    : [];
  catalogCache = products;
  return products;
}

function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-3 py-2.5">
      <div className="skeleton-shimmer h-14 w-11 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="skeleton-shimmer h-3 w-1/2 rounded-full" />
        <div className="skeleton-shimmer h-3 w-1/3 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Storefront product search. The icon opens a clean, responsive search dialog
 * (backdrop + card) that live-filters the catalog by name and shows each match
 * with its image, name, price and product link. Includes loading, empty,
 * error and no-results states; Esc / backdrop close; body scroll is locked
 * while open. Reuses the existing public catalog API — no new endpoints.
 */
export function SearchBar({ className = "", variant = "icon" }) {
  const isBar = variant === "bar";
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | ready | error
  const [products, setProducts] = useState([]);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);

  const loadCatalog = useCallback(async () => {
    setStatus("loading");
    try {
      const loaded = await fetchCatalog();
      setProducts(loaded);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  const closeSearch = useCallback(() => {
    setOpen(false);
    setQuery("");
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, closeSearch]);

  const normalizedQuery = query.trim().toLowerCase();

  const { results, matchingCount } = useMemo(() => {
    if (!normalizedQuery) {
      return { results: [], matchingCount: 0 };
    }
    const matches = products.filter((product) =>
      product.name.toLowerCase().includes(normalizedQuery)
    );
    return { results: matches.slice(0, RESULT_LIMIT), matchingCount: matches.length };
  }, [products, normalizedQuery]);

  return (
    <>
      <div className={"flex items-center gap-1 " + className}>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => {
            if (status === "idle") loadCatalog();
            setOpen(true);
          }}
          aria-label="Search products"
          aria-haspopup="dialog"
          aria-expanded={open}
          className={
            isBar
              ? "group flex w-full items-center gap-3 rounded-full border border-ink/10 bg-ivory px-4 py-2.5 text-left text-sm text-muted transition-colors hover:border-electric/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
              : "rounded-full p-2 text-ink transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
          }
        >
          <SearchIcon className={isBar ? "h-5 w-5 shrink-0 text-muted" : ""} />
          {isBar ? (
            <>
              <span className="flex-1 truncate">
                Search speakers, fans, lights…
              </span>
              <span className="hidden shrink-0 rounded-md border border-ink/10 bg-white px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.14em] text-muted lg:inline">
                Search
              </span>
            </>
          ) : null}
        </button>
      </div>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-50" onClick={closeSearch}>
              <div
                className="absolute inset-0 bg-ink/30 backdrop-blur-sm"
                aria-hidden="true"
              />
              <div className="relative mx-auto mt-16 w-[calc(100%-2rem)] max-w-2xl sm:mt-24">
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Search products"
                  onClick={(event) => event.stopPropagation()}
                  className="overflow-hidden rounded-2xl bg-cream shadow-2xl ring-1 ring-sand"
                >
                  <div className="flex items-center gap-3 border-b border-sand px-5 py-4">
                    <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
                    <input
                      ref={inputRef}
                      autoFocus
                      type="text"
                      enterKeyHint="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search speakers, fans, lights…"
                      aria-label="Search products"
                      className="w-full bg-transparent text-base text-ink placeholder:text-muted focus-visible:outline-none"
                    />
                    {query ? (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery("");
                          inputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                        className="rounded-full p-1 text-muted transition-colors hover:bg-sand hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                      >
                        <CloseIcon className="h-4 w-4" />
                      </button>
                    ) : null}
                    <span
                      className="h-5 w-px shrink-0 bg-sand"
                      aria-hidden="true"
                    />
                    <button
                      type="button"
                      onClick={closeSearch}
                      aria-label="Close search"
                      className="rounded-full p-1 text-muted transition-colors hover:bg-sand hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                    >
                      <CloseIcon className="h-4 w-4" />
                    </button>
                  </div>

              <div className="max-h-[60vh] overflow-y-auto p-2">
                {status === "loading" ? (
                  <div aria-live="polite" className="py-2">
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </div>
                ) : status === "error" ? (
                  <div className="px-3 py-10 text-center">
                    <p className="font-display text-2xl text-ink">
                      Couldn&apos;t load the catalog
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                      Please try again in a moment.
                    </p>
                    <button
                      type="button"
                      onClick={loadCatalog}
                      className="mt-5 inline-flex items-center gap-2 rounded-full border border-mocha/30 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.22em] text-mocha transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                    >
                      Try again
                    </button>
                  </div>
                ) : !normalizedQuery ? (
                  <div className="px-3 py-10 text-center">
                    <p className="font-display text-2xl text-ink">
                      Search the catalog
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                      Type a product name to find what you need.
                    </p>
                    <Link
                      href="/collection"
                      onClick={closeSearch}
                      className="group mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold transition-colors hover:text-mocha focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                    >
                      Browse all products
                      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                ) : results.length > 0 ? (
                  <div>
                    <p className="px-3 pb-1 pt-2 text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-muted">
                      {matchingCount} result{matchingCount === 1 ? "" : "s"} for
                      &ldquo;{query.trim()}&rdquo;
                    </p>
                    <ul>
                      {results.map((product) => (
                        <li key={product.id}>
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={closeSearch}
                            className="flex items-center gap-4 rounded-xl px-3 py-2.5 transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                          >
                            <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-sand">
                              <ProductImage
                                src={product.images?.[0]?.url}
                                alt={product.images?.[0]?.alt || product.name}
                                sizes="44px"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-ink">
                                {product.name}
                              </span>
                              {product.category?.name ? (
                                <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold">
                                  {product.category.name}
                                </span>
                              ) : null}
                            </div>
                            <Price
                              product={product}
                              className="shrink-0 text-sm"
                            />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="px-3 py-10 text-center">
                    <p className="font-display text-2xl text-ink">
                      No results for &ldquo;{query.trim()}&rdquo;
                    </p>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
                      Try a different spelling or browse the full catalog.
                    </p>
                    <Link
                      href="/collection"
                      onClick={closeSearch}
                      className="group mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-gold transition-colors hover:text-mocha focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                    >
                      Browse all products
                      <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>,
            document.body
          )
        : null}
    </>
  );
}
