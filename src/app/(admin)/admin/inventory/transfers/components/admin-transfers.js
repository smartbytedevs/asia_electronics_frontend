"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRightLeft, RefreshCw, Search, SearchX, X } from "lucide-react";
import { getInventory } from "@/lib/api/inventory";
import { getProduct, getProducts } from "@/lib/api/products";
import { safeMessage } from "@/lib/api/http";
import { Pagination } from "../../../components/pagination";
import { TableSkeleton } from "../../../components/table-skeleton";
import { TransferTable } from "./transfer-table";
import { TransferCard } from "./transfer-card";
import { TransferDialog } from "./transfer-dialog";

const PAGE_LIMIT = 20;
const SEARCH_LIMIT = 100;
const DETAIL_BATCH = 30;
const EASE = [0.22, 1, 0.36, 1];

const softButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

/**
 * Admin Stock Transfers page. There are no physical outlets in this system —
 * stock lives in two locations per record, Online and Offline, and transfers
 * move quantity between them via POST /inventory/transfer. The backend has no
 * aggregate "transfer list" endpoint, so this page lists every initialized
 * stock subject with its current Online / Offline / Reserved quantities and a
 * per-row Transfer action; the header Transfer button opens the same dialog
 * with a product picker.
 *
 * Rows are enriched client-side (product names from the public catalog, variant
 * SKUs/options from the product detail) so no raw IDs are ever shown.
 */
export function AdminTransfers() {
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const transferRef = useRef(null);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [detailsById, setDetailsById] = useState({});
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    inventory: [],
    pagination: null,
  });

  const searching = debouncedQuery !== "";
  const { status, message, inventory, pagination } = fetchState;

  const params = useMemo(() => {
    return searching ? { page: 1, limit: SEARCH_LIMIT } : { page, limit: PAGE_LIMIT };
  }, [searching, page]);

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

  /** Only initialized records can be transferred; rows carry readable labels. */
  const rows = useMemo(() => {
    return inventory
      .filter((item) => item.isInitialized)
      .map((item) => {
        const variant = item.productVariantId
          ? variantById[item.productVariantId]
          : null;
        const product = item.productId ? productById[item.productId] : null;
        return {
          ...item,
          productNameLabel: product?.name || "Product",
          variantSku: variant?.sku || null,
          variantOptions: Object.entries(variant?.attributes || {}),
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

  function handleTransfer(row) {
    transferRef.current?.openWith({
      productId: row.productId,
      variantId: row.productVariantId,
    });
  }

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

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
    getInventory(params).then((result) => {
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
      setFetchState({
        status: "ready",
        message: null,
        inventory: Array.isArray(data?.inventory) ? data.inventory : [],
        pagination: data?.pagination ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [params, reloadKey]);

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

  const totalShown = searching
    ? visibleRows.length
    : rows.length;

  return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gold-soft/70 bg-cream/95 p-4 shadow-[0_2px_18px_-16px_rgba(43,38,32,0.35)] sm:p-5">
          <div className="relative min-w-[220px] flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search stock by product name or SKU…"
              aria-label="Search stock by product name or SKU"
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
          <div className="flex flex-wrap items-center gap-2">
            <TransferDialog ref={transferRef} onChanged={handleRefresh} />
            <button type="button" onClick={handleRefresh} className={softButtonClass}>
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {status === "loading" ? <TableSkeleton rows={6} /> : null}

        {status === "error" ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
          >
            <h2 className="font-display text-lg text-ink">Stock transfers unavailable</h2>
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
          <EmptyTransfers onRefresh={handleRefresh} />
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
                      : `${totalShown} stock record${totalShown === 1 ? "" : "s"}`}
                  </p>
                  {searching ? (
                    <button type="button" onClick={handleClearSearch} className={softButtonClass}>
                      <X aria-hidden="true" className="h-4 w-4" />
                      Clear search
                    </button>
                  ) : null}
                </div>

                <TransferTable
                  transfers={visibleRows}
                  onTransfer={handleTransfer}
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
                        <TransferCard item={item} onTransfer={handleTransfer} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {searching ? null : (
                  <Pagination pagination={pagination} onPageChange={handlePageChange} />
                )}
              </>
            )}
          </motion.div>
        ) : null}
      </div>
  );
}

/** No stock records exist yet — nothing can be transferred. */
function EmptyTransfers({ onRefresh }) {
  return (
    <div className="rounded-2xl border border-gold-soft/70 bg-cream px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-soft bg-gold-soft/30 text-gold">
        <ArrowRightLeft aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-lg text-ink">No stock records yet</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        No stock has been set up. Initialize stock on the Inventory page first,
        then transfer quantity between Online and Offline here.
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

/** The list loaded but none of the fetched stock matches the search. */
function NoSearchResults({ query, onClear }) {
  return (
    <div className="rounded-2xl border border-gold-soft/70 bg-cream px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-soft bg-gold-soft/30 text-gold">
        <SearchX aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-lg text-ink">No matching stock</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        No stock records match “{query}”. Try a different product name or SKU,
        or clear the search.
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
