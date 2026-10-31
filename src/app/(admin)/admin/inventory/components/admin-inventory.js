"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Boxes, RefreshCw, Search, SearchX, X } from "lucide-react";
import { getInventory, getLowStock } from "@/lib/api/inventory";
import { getOutlets } from "@/lib/api/outlets";
import { getProduct, getProducts } from "@/lib/api/products";
import { safeMessage } from "@/lib/api/http";
import { Pagination } from "../../components/pagination";
import { InventoryTable } from "./inventory-table";
import { InventoryCard } from "./inventory-card";
import { InitializeDialog } from "./initialize-dialog";

const PAGE_LIMIT = 20;
const SEARCH_LIMIT = 100;
const DETAIL_BATCH = 30;
const EASE = [0.22, 1, 0.36, 1];

const VIEWS = [
  { value: "all", label: "All inventory" },
  { value: "low-stock", label: "Low stock" },
  { value: "out-of-stock", label: "Out of stock" },
];

const VIEW_TEXT = {
  all: "Inventory records are the backend's authoritative stock numbers, sorted newest first, followed by active catalog products with no stock set up (Not initialized). Stock changes go through the commands on each record; Initialize sets up a missing one.",
  "low-stock":
    "Every product or variant whose available online stock is at or below its low-stock threshold — including out-of-stock ones. The backend returns all of them in one list.",
  "out-of-stock":
    "Products and variants with no available online stock left to sell, taken from the backend's low-stock view.",
};

const softButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const tabBase =
  "h-9 rounded-lg px-3.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

/**
 * Admin inventory list. The backend list endpoint supports only page/limit
 * (inventory.service.js: listInventory reads no filters), so "All inventory"
 * is paginated. "Low stock" uses the dedicated GET /inventory/low-stock
 * endpoint (backend-provided isLowStock data, returned unpaginated);
 * "Out of stock" is the same backend response narrowed by the backend's own
 * isOutOfStock flag — no stock logic is computed here. Outlet names come from
 * the public GET /outlets list; initialize stock lives here (not on the
 * detail page, which already has a record).
 *
 * Name search is client-side: while a search is active the "All inventory"
 * view is fetched at the backend's max page size (100) and filtered by product
 * name / SKU in the browser, so results are accurate without a backend change.
 *
 * The list payload carries only product/variant/outlet IDs (no names), so rows
 * are enriched client-side: product names come from the public catalog (the
 * newest 100 ACTIVE products) and variant SKUs/options from the public product
 * detail — fetched once per product, in bounded batches, and cached for the
 * session.
 */
export function AdminInventory() {
  const [view, setView] = useState("all");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [outlets, setOutlets] = useState([]);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [detailsById, setDetailsById] = useState({});
  const initializeRef = useRef(null);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    inventory: [],
    pagination: null,
  });

  const searching = debouncedQuery !== "";
  const { status, message, inventory, pagination } = fetchState;

  const params = useMemo(() => {
    if (searching) {
      return { page: 1, limit: SEARCH_LIMIT };
    }
    return { page, limit: PAGE_LIMIT };
  }, [searching, page]);

  function handleInitialize(inventory) {
    initializeRef.current?.openWith({
      productId: inventory.productId,
      productName: inventory.productName,
    });
  }

  const outletNames = useMemo(() => {
    const names = {};
    for (const outlet of outlets) {
      if (outlet?.id && outlet?.name) {
        names[outlet.id] = outlet.name;
      }
    }
    return names;
  }, [outlets]);

  const productById = useMemo(() => {
    const map = {};
    for (const product of catalogProducts) {
      if (product?.id) {
        map[product.id] = product;
      }
    }
    for (const product of Object.values(detailsById)) {
      if (product?.id) {
        map[product.id] = product;
      }
    }
    return map;
  }, [catalogProducts, detailsById]);

  const variantById = useMemo(() => {
    const map = {};
    for (const product of Object.values(detailsById)) {
      for (const variant of product?.variants || []) {
        if (variant?.id) {
          map[variant.id] = { ...variant, productId: product.id };
        }
      }
    }
    return map;
  }, [detailsById]);

  /** Rows with human-readable labels — no raw DB IDs are shown anywhere. */
  const rows = useMemo(() => {
    return inventory.map((item) => {
      if (!item.isInitialized) {
        return {
          ...item,
          productNameLabel: item.productName || "Unnamed product",
          variantSku: null,
          variantOptions: [],
          detailHref: null,
        };
      }
      const product = productById[item.productId];
      if (!item.productVariantId) {
        return {
          ...item,
          productNameLabel: product?.name || "Product",
          variantSku: null,
          variantOptions: [],
          detailHref: null,
        };
      }
      const variant = variantById[item.productVariantId];
      return {
        ...item,
        productNameLabel: product?.name || "Product",
        variantSku: variant?.sku || null,
        variantOptions: Object.entries(variant?.attributes || {}),
        detailHref: `/admin/inventory/${encodeURIComponent(item.productVariantId)}`,
      };
    });
  }, [inventory, productById, variantById]);

  const visibleRows = useMemo(() => {
    if (!searching) {
      return rows;
    }
    const term = debouncedQuery.toLowerCase();
    return rows.filter(
      (row) =>
        row.productNameLabel.toLowerCase().includes(term) ||
        (row.variantSku ? row.variantSku.toLowerCase().includes(term) : false)
    );
  }, [searching, debouncedQuery, rows]);

  /** Distinct productIds of the fetched rows whose variant detail is missing. */
  const missingDetailIds = useMemo(() => {
    const seen = new Set();
    const missing = [];
    for (const item of inventory) {
      if (!item.productId || !item.productVariantId) {
        continue;
      }
      if (detailsById[item.productId] || seen.has(item.productId)) {
        continue;
      }
      seen.add(item.productId);
      missing.push(item.productId);
    }
    return missing;
  }, [inventory, detailsById]);

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      inventory: prev.inventory,
      pagination: prev.pagination,
    }));
  }

  function handleViewChange(next) {
    if (next === view) {
      return;
    }
    setView(next);
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

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    getOutlets().then((result) => {
      if (cancelled || !result.ok) {
        return;
      }
      const found = Array.isArray(result.payload?.data?.outlets)
        ? result.payload.data.outlets
        : [];
      setOutlets(found.filter((outlet) => outlet?.id && outlet?.name));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getProducts({ page: 1, limit: SEARCH_LIMIT }).then((result) => {
      if (cancelled || !result.ok) {
        return;
      }
      const found = Array.isArray(result.payload?.data?.products)
        ? result.payload.data.products
        : [];
      setCatalogProducts(found.filter((product) => product?.id));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const request =
      view === "all" ? getInventory(params) : getLowStock();
    request.then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          inventory: [],
          pagination: null,
        });
        return;
      }
      const data = result.payload?.data ?? null;
      const items = Array.isArray(data?.inventory) ? data.inventory : [];
      const filtered =
        view === "out-of-stock"
          ? items.filter((item) => item.isOutOfStock)
          : items;
      setFetchState({
        status: "ready",
        message: null,
        inventory: filtered,
        pagination: view === "all" ? (data?.pagination ?? null) : null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [view, params, reloadKey]);

  useEffect(() => {
    if (missingDetailIds.length === 0) {
      return undefined;
    }
    const batch = missingDetailIds.slice(0, DETAIL_BATCH);
    let cancelled = false;
    Promise.all(batch.map((id) => getProduct(id))).then((results) => {
      if (cancelled) {
        return;
      }
      const next = {};
      let added = false;
      for (const result of results) {
        const product = result?.payload?.data?.product;
        if (!product?.id) {
          continue;
        }
        next[product.id] = product;
        added = true;
      }
      if (added) {
        setDetailsById((prev) => ({ ...prev, ...next }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [missingDetailIds]);

  const isScopedView = view !== "all";
  const totalShown = searching
    ? visibleRows.length
    : isScopedView
      ? inventory.length
      : pagination?.total ?? inventory.length;

  return (
      <div className="space-y-6">
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
              placeholder="Search inventory by product name or SKU…"
              aria-label="Search inventory by product name or SKU"
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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div
              role="group"
              aria-label="Inventory view"
              className="inline-flex items-center gap-1 rounded-xl border border-gold-soft/80 bg-sand/50 p-1"
            >
              {VIEWS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={view === item.value}
                  onClick={() => handleViewChange(item.value)}
                  className={`${tabBase} ${
                    view === item.value
                      ? "bg-mocha text-white shadow-sm"
                      : "text-mocha-deep hover:bg-gold-soft/40"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <InitializeDialog
                ref={initializeRef}
                outlets={outlets}
                onChanged={handleRefresh}
              />
              <button type="button" onClick={handleRefresh} className={softButtonClass}>
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
          <p className="mt-4 border-t border-gold-soft/40 pt-3 text-sm text-muted">
            {VIEW_TEXT[view]}
          </p>
        </div>

        {status === "loading" ? <InventorySkeleton rows={6} /> : null}

        {status === "error" ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
          >
            <h2 className="font-display text-lg text-ink">Inventory unavailable</h2>
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

        {status === "ready" && inventory.length === 0 ? (
          <EmptyInventory view={view} onRefresh={handleRefresh} />
        ) : null}

        {status === "ready" && inventory.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="space-y-6"
          >
            {searching && visibleRows.length === 0 ? (
              <NoSearchResults query={debouncedQuery} onClear={handleClearSearch} />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted">
                    {searching
                      ? `${totalShown} match${totalShown === 1 ? "" : "es"} for “${debouncedQuery}”`
                      : `${totalShown} item${totalShown === 1 ? "" : "s"}`}
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

                <InventoryTable
                  inventory={visibleRows}
                  outletNames={outletNames}
                  onChanged={handleRefresh}
                  onInitialize={handleInitialize}
                  className="hidden md:block"
                />

                <div className="space-y-4 md:hidden">
                  <AnimatePresence initial={false}>
                    {visibleRows.map((item, index) => (
                      <motion.div
                        key={item.id ?? `uninitialized-${item.productId}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.35,
                          ease: EASE,
                          delay: Math.min(index * 0.04, 0.3),
                        }}
                      >
                        <InventoryCard
                          inventory={item}
                          outletNames={outletNames}
                          onChanged={handleRefresh}
                          onInitialize={handleInitialize}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {isScopedView || searching ? null : (
                  <Pagination pagination={pagination} onPageChange={handlePageChange} />
                )}
              </>
            )}
          </motion.div>
        ) : null}
      </div>
  );
}

/** Skeleton with item + quantity bars that uses the gold shimmer sweep. */
function InventorySkeleton({ rows = 5 }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-gold-soft/70 bg-cream p-4 sm:p-6"
    >
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="h-10 w-10 shrink-0 skeleton-shimmer rounded-lg" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-2/5 skeleton-shimmer rounded-full" />
              <div className="h-3 w-1/4 skeleton-shimmer rounded-full" />
            </div>
            <div className="hidden h-5 w-20 skeleton-shimmer rounded-full sm:block" />
            <div className="hidden h-8 w-40 skeleton-shimmer rounded-lg sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Empty state per view: no inventory records at all. */
function EmptyInventory({ view, onRefresh }) {
  const copy = {
    all: {
      title: "No inventory yet",
      body: "No inventory records or active products found. Use Initialize stock to set up a product or one of its variants.",
    },
    "low-stock": {
      title: "No low-stock items",
      body: "Every product and variant has stock above its threshold right now.",
    },
    "out-of-stock": {
      title: "No out-of-stock items",
      body: "Every product and variant has available online stock right now.",
    },
  }[view];
  return (
    <div className="rounded-2xl border border-gold-soft/70 bg-cream px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-soft bg-gold-soft/30 text-gold">
        <Boxes aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-lg text-ink">{copy.title}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {copy.body}
      </p>
      <button
        type="button"
        onClick={onRefresh}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-5 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        <RefreshCw aria-hidden="true" className="h-4 w-4" />
        Refresh
      </button>
    </div>
  );
}

/** The list loaded but none of the fetched items match the typed name/SKU. */
function NoSearchResults({ query, onClear }) {
  return (
    <div className="rounded-2xl border border-gold-soft/70 bg-cream px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-soft bg-gold-soft/30 text-gold">
        <SearchX aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-lg text-ink">
        No matching inventory
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        No items in this view match “{query}”. Try a different name or SKU, or
        clear the search.
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
