"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Package, Plus, RefreshCw, Search, SearchX, X } from "lucide-react";
import { getProducts, updateProduct } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import { safeMessage } from "@/lib/api/http";
import { Pagination } from "../../components/pagination";
import { ConfirmDialog } from "../../components/confirm-dialog";
import { ProductTable } from "./product-table";
import { ProductCard } from "./product-card";

const PAGE_LIMIT = 20;
const SEARCH_LIMIT = 100;
const EASE = [0.22, 1, 0.36, 1];

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "priceAsc", label: "Price: low to high" },
  { value: "priceDesc", label: "Price: high to low" },
  { value: "featured", label: "Featured first" },
];

const goldButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const softButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const controlClass =
  "h-10 rounded-lg border border-gold-soft/80 bg-white px-3 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50";

/**
 * Admin product list. The backend has ONE product list endpoint (GET /products,
 * public, ACTIVE products only) — there is no admin variant, no text search and
 * no status filter. The only supported controls are categoryId, the four
 * allowlisted sorts, and page/limit, so the toolbar offers exactly those.
 *
 * Name search is therefore client-side: while a search is active the list is
 * fetched at the backend's max page size (100) and filtered by name in the
 * browser, so results are still accurate without any backend change.
 *
 * Because the list is ACTIVE-only, deactivating a product removes it from this
 * list (and the storefront) and it can never be re-read through the API —
 * deactivation is the archival mechanism (there is no DELETE).
 */
export function AdminProducts() {
  const [categoryId, setCategoryId] = useState("ALL");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [success, setSuccess] = useState(null);
  const [deactivating, setDeactivating] = useState(null);
  const deactivatingRef = useRef(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);
  const [deactivateError, setDeactivateError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    products: [],
    pagination: null,
  });

  const searching = debouncedQuery !== "";

  const params = useMemo(() => {
    const base = {
      sort,
      ...(categoryId !== "ALL" ? { categoryId } : {}),
    };
    if (searching) {
      return { ...base, page: 1, limit: SEARCH_LIMIT };
    }
    return { ...base, page, limit: PAGE_LIMIT };
  }, [searching, categoryId, sort, page]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  const visibleProducts = useMemo(() => {
    if (!searching) {
      return fetchState.products;
    }
    const term = debouncedQuery.toLowerCase();
    return fetchState.products.filter((product) =>
      product.name.toLowerCase().includes(term)
    );
  }, [searching, debouncedQuery, fetchState.products]);

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      products: prev.products,
      pagination: prev.pagination,
    }));
  }

  function handleCategoryChange(next) {
    if (next === categoryId) {
      return;
    }
    setCategoryId(next);
    setPage(1);
    startLoading();
  }

  function handleSortChange(next) {
    if (next === sort) {
      return;
    }
    setSort(next);
    setPage(1);
    startLoading();
  }

  function handlePageChange(next) {
    setPage(next);
    startLoading();
  }

  function handleRefresh() {
    startLoading();
    setReloadKey((key) => key + 1);
  }

  function handleClearSearch() {
    setQuery("");
    setDebouncedQuery("");
    setPage(1);
    startLoading();
  }

  function handleDeactivate(product) {
    deactivatingRef.current = product;
    setDeactivating(product);
    setDeactivateError(null);
  }

  async function confirmDeactivate() {
    const product = deactivatingRef.current;
    if (!product) {
      return;
    }
    setDeactivateLoading(true);
    setDeactivateError(null);
    const result = await updateProduct(product.id, { isActive: false });
    setDeactivateLoading(false);
    if (result.ok) {
      setDeactivating(null);
      setSuccess("Product deactivated. It is hidden from the storefront and this list.");
      startLoading();
      setReloadKey((key) => key + 1);
    } else {
      setDeactivateError(safeMessage(result.status, result.payload));
    }
  }

  useEffect(() => {
    if (!success) {
      return undefined;
    }
    const id = window.setTimeout(() => setSuccess(null), 5000);
    return () => window.clearTimeout(id);
  }, [success]);

  useEffect(() => {
    let cancelled = false;
    getCategories().then((result) => {
      if (cancelled || !result.ok) {
        return;
      }
      const found = Array.isArray(result.payload?.data?.categories)
        ? result.payload.data.categories
        : [];
      setCategories(found.filter((category) => category?.id));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getProducts(params).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          products: [],
          pagination: null,
        });
        return;
      }
      const data = result.payload?.data ?? null;
      setFetchState({
        status: "ready",
        message: null,
        products: Array.isArray(data?.products) ? data.products : [],
        pagination: data?.pagination ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [params, reloadKey]);

  const { status, message, products, pagination } = fetchState;
  const hasFilters = categoryId !== "ALL" || searching;
  const totalShown = searching
    ? visibleProducts.length
    : pagination?.total ?? products.length;

  return (
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="rounded-2xl border border-gold-soft/70 bg-cream/95 p-4 shadow-[0_2px_18px_-16px_rgba(43,38,32,0.35)] sm:p-5">
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products by name…"
              aria-label="Search products by name"
              className="h-11 w-full rounded-xl border border-gold-soft/80 bg-white pl-11 pr-11 text-sm text-ink shadow-sm placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
            {query ? (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-gold-soft/40 hover:text-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Category
              <select
                value={categoryId}
                onChange={(event) => handleCategoryChange(event.target.value)}
                className={controlClass}
              >
                <option value="ALL">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Sort
              <select
                value={sort}
                onChange={(event) => handleSortChange(event.target.value)}
                className={controlClass}
              >
                {SORTS.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Link href="/admin/products/new" className={goldButtonClass}>
                <Plus aria-hidden="true" className="h-4 w-4" />
                New Product
              </Link>
              <button
                type="button"
                onClick={handleRefresh}
                className={softButtonClass}
              >
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          <p className="mt-4 border-t border-gold-soft/40 pt-3 text-sm text-muted">
            The catalog list is served by the backend&apos;s storefront endpoint,
            so only active products appear here. Deactivating a product archives
            it (the backend keeps no visible record).
          </p>
        </div>

        {/* Success toast */}
        {success ? (
          <motion.p
            role="status"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700"
          >
            {success}
          </motion.p>
        ) : null}

        {status === "loading" ? <ProductsSkeleton rows={6} /> : null}

        {status === "error" ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
          >
            <h2 className="font-display text-lg text-ink">
              Products unavailable
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-mocha-deep">
              {message}
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-mocha px-5 text-sm font-semibold text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        ) : null}

        {status === "ready" && products.length === 0 ? (
          <EmptyPanel searching={searching} query={debouncedQuery} hasFilters={hasFilters} onClearSearch={handleClearSearch} />
        ) : null}

        {status === "ready" && products.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="space-y-6"
          >
            {searching && visibleProducts.length === 0 ? (
              <NoSearchResults query={debouncedQuery} onClear={handleClearSearch} />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted">
                    {searching
                      ? `${totalShown} match${totalShown === 1 ? "" : "es"} for “${debouncedQuery}”`
                      : `${totalShown} product${totalShown === 1 ? "" : "s"}`}
                  </p>
                  {searching ? (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className={softButtonClass}
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                      Clear search
                    </button>
                  ) : null}
                </div>

                <ProductTable
                  products={visibleProducts}
                  onDeactivate={handleDeactivate}
                  className="hidden md:block"
                />

                <div className="space-y-4 md:hidden">
                  <AnimatePresence initial={false}>
                    {visibleProducts.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.35,
                          ease: EASE,
                          delay: Math.min(index * 0.04, 0.3),
                        }}
                      >
                        <ProductCard
                          product={product}
                          onDeactivate={handleDeactivate}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {!searching ? (
                  <Pagination
                    pagination={pagination}
                    onPageChange={handlePageChange}
                  />
                ) : null}
              </>
            )}
          </motion.div>
        ) : null}

        {deactivating ? (
          <ConfirmDialog
            title="Deactivate product"
            description={`“${deactivating.name}” will be hidden from the storefront and removed from this list. The backend has no DELETE and no way to list or re-read an inactive product, so this cannot be undone through the admin UI — deactivate only if you are sure.`}
            confirmLabel="Deactivate"
            confirmClassName="bg-[#c9604d] text-white hover:bg-[#b3412f] focus-visible:ring-red-300"
            loading={deactivateLoading}
            error={deactivateError}
            onConfirm={confirmDeactivate}
            onClose={() => {
              if (!deactivateLoading) {
                setDeactivating(null);
                setDeactivateError(null);
              }
            }}
          >
            <p className="text-sm leading-relaxed text-mocha-deep">
              This sends {`{ isActive: false }`} to the backend&apos;s PATCH
              endpoint — the product and its variants are kept but hidden
              everywhere.
            </p>
          </ConfirmDialog>
        ) : null}
      </div>
  );
}

/** Skeleton with image + text bars that uses the gold shimmer sweep. */
function ProductsSkeleton({ rows = 5 }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-gold-soft/70 bg-cream p-4 sm:p-6"
    >
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="h-12 w-12 shrink-0 skeleton-shimmer rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-2/5 skeleton-shimmer rounded-full" />
              <div className="h-3 w-1/4 skeleton-shimmer rounded-full" />
            </div>
            <div className="hidden h-5 w-20 skeleton-shimmer rounded-full sm:block" />
            <div className="hidden h-9 w-24 skeleton-shimmer rounded-lg sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Empty states: no catalog, no category matches, or no search matches. */
function EmptyPanel({ searching, query, hasFilters, onClearSearch }) {
  return (
    <div className="rounded-2xl border border-gold-soft/70 bg-cream px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-soft bg-gold-soft/30 text-gold">
        {searching ? (
          <SearchX aria-hidden="true" className="h-6 w-6" />
        ) : (
          <Package aria-hidden="true" className="h-6 w-6" />
        )}
      </span>
      <h2 className="mt-4 font-display text-lg text-ink">
        {searching ? "No matching products" : "No products yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {searching
          ? `No active products match “${query}”. Try a different name or clear the search.`
          : hasFilters
            ? "No active products match this category yet."
            : "Use “New Product” to create the first product in the storefront."}
      </p>
      {searching ? (
        <button
          type="button"
          onClick={onClearSearch}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-5 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <X aria-hidden="true" className="h-4 w-4" />
          Clear search
        </button>
      ) : !hasFilters ? (
        <Link
          href="/admin/products/new"
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold px-5 text-sm font-semibold text-white transition-colors hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          New Product
        </Link>
      ) : null}
    </div>
  );
}

/** Search produced results on the backend but none matched the typed name. */
function NoSearchResults({ query, onClear }) {
  return (
    <div className="rounded-2xl border border-gold-soft/70 bg-cream px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-soft bg-gold-soft/30 text-gold">
        <SearchX aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-lg text-ink">
        No matching products
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        No products in this view match “{query}”. Try a different name or clear
        the search.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-5 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        <X aria-hidden="true" className="h-4 w-4" />
        Clear search
      </button>
    </div>
  );
}
