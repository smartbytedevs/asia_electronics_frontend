"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarClock, RefreshCw, Search, SearchX, X } from "lucide-react";
import { getReservations } from "@/lib/api/reservations";
import { getProduct, getProducts } from "@/lib/api/products";
import { getAdminOrder } from "@/lib/api/orders";
import { getAdminCustomer } from "@/lib/api/customers";
import { safeMessage } from "@/lib/api/http";
import {
  RESERVATION_STATUS_OPTIONS,
  reservationStatusMeta,
} from "../../../components/status-meta";
import { Pagination } from "../../../components/pagination";
import { TableSkeleton } from "../../../components/table-skeleton";
import { ReservationTable } from "./reservation-table";
import { ReservationCard } from "./reservation-card";
import { CreateReservationDialog } from "./create-reservation-dialog";

const PAGE_LIMIT = 20;
const SEARCH_LIMIT = 100;
const DETAIL_BATCH = 30;
const EASE = [0.22, 1, 0.36, 1];
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const controlClass =
  "h-10 rounded-lg border border-gold-soft/80 bg-white px-3 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50";

const solidButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-mocha px-4 text-sm font-medium text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const softButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

/**
 * Human-readable reference for a reservation row. ORDER references carry a
 * valid order ObjectId, so the order's number and (via the order's customer)
 * the customer's display name are resolved from the admin read APIs when
 * available; every other reference stays generic.
 */
function referenceMeta(reservation, ordersById, customersById) {
  if (
    reservation.referenceType === "ORDER" &&
    OBJECT_ID_PATTERN.test(reservation.referenceId)
  ) {
    const order = ordersById[reservation.referenceId];
    if (order) {
      const customer = order.customerId ? customersById[order.customerId] : null;
      return {
        kind: "order",
        orderId: order.id,
        orderName: order.orderNumber || null,
        customerId: order.customerId || null,
        customerName: customer?.displayName || null,
        fallback: reservation.referenceId,
      };
    }
  }
  return {
    kind: "generic",
    referenceType: reservation.referenceType,
    referenceId: reservation.referenceId,
  };
}

/**
 * Admin reservation list. Reservations are grouped per product/variant so each
 * product shows its own section with a running total. Only backend-supported
 * filters are used (status, page, limit); status applies immediately. ACTIVE
 * rows expose the release / consume / expire commands.
 *
 * Reservation rows carry only product/variant IDs (no names), so rows are
 * enriched client-side — product names come from the public catalog, variant
 * SKUs/options from the public product detail, and ORDER-reference rows are
 * further resolved to the order number + customer display name via the admin
 * order/customer read APIs (bounded batches, cached for the session).
 *
 * Name search is client-side: while a search is active the current status's
 * list is fetched at the backend's max page size (100) and filtered by product
 * name / SKU in the browser.
 */
export function AdminReservations() {
  const [status, setStatus] = useState("ALL");
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [detailsById, setDetailsById] = useState({});
  const [ordersById, setOrdersById] = useState({});
  const [customersById, setCustomersById] = useState({});
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    reservations: [],
    pagination: null,
  });
  const createRef = useRef(null);

  const searching = debouncedQuery !== "";
  const { status: viewStatus, message, reservations, pagination } = fetchState;

  const params = useMemo(() => {
    const base = searching ? { page: 1, limit: SEARCH_LIMIT } : { page, limit: PAGE_LIMIT };
    if (status !== "ALL") {
      base.status = status;
    }
    return base;
  }, [searching, page, status]);

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
    return reservations.map((reservation) => {
      const variant = reservation.productVariantId
        ? variantById[reservation.productVariantId]
        : null;
      const productId = variant?.productId
        ? variant.productId
        : reservation.productId
          ? String(reservation.productId)
          : null;
      const product = productId ? productById[productId] : null;
      return {
        ...reservation,
        productId,
        productNameLabel: product?.name || "Product",
        variantSku: variant?.sku || null,
        variantOptions: Object.entries(variant?.attributes || {}),
        detailHref: reservation.productVariantId
          ? `/admin/inventory/${encodeURIComponent(reservation.productVariantId)}`
          : null,
        reference: referenceMeta(reservation, ordersById, customersById),
      };
    });
  }, [reservations, productById, variantById, ordersById, customersById]);

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

  /** Reservations grouped per product (fallback key: the variant itself). */
  const groups = useMemo(() => {
    const order = [];
    const byKey = new Map();
    for (const row of visibleRows) {
      const key = row.productId ?? row.productVariantId;
      let group = byKey.get(key);
      if (!group) {
        group = {
          key,
          productId: row.productId,
          productNameLabel: row.productNameLabel,
          totalQuantity: 0,
          reservations: [],
        };
        byKey.set(key, group);
        order.push(group);
      }
      group.totalQuantity += row.quantity;
      group.reservations.push(row);
    }
    return order;
  }, [visibleRows]);

  /** Distinct productIds of the fetched rows whose detail is missing. */
  const missingDetailIds = useMemo(() => {
    const seen = new Set();
    const missing = [];
    for (const reservation of reservations) {
      const variant = reservation.productVariantId
        ? variantById[reservation.productVariantId]
        : null;
      const productId = variant?.productId
        ? variant.productId
        : reservation.productId
          ? String(reservation.productId)
          : null;
      if (!productId || seen.has(productId)) {
        continue;
      }
      seen.add(productId);
      if (detailsById[productId]) {
        continue;
      }
      // Variant rows need the full detail to resolve the variant/SKU; simple
      // rows only need it when the catalog list did not include the product.
      if (reservation.productVariantId ? !variant : !productById[productId]) {
        missing.push(productId);
      }
    }
    return missing;
  }, [reservations, variantById, detailsById, productById]);

  /** Unfetched ORDER reference ids on the current page (valid ObjectIds only). */
  const missingOrderIds = useMemo(() => {
    const seen = new Set();
    const missing = [];
    for (const reservation of reservations) {
      if (
        reservation.referenceType === "ORDER" &&
        OBJECT_ID_PATTERN.test(reservation.referenceId) &&
        !ordersById[reservation.referenceId] &&
        !seen.has(reservation.referenceId)
      ) {
        seen.add(reservation.referenceId);
        missing.push(reservation.referenceId);
      }
    }
    return missing;
  }, [reservations, ordersById]);

  /** Customer ids referenced by resolved orders but not yet fetched. */
  const missingCustomerIds = useMemo(() => {
    const seen = new Set();
    const missing = [];
    for (const order of Object.values(ordersById)) {
      if (
        order?.customerId &&
        !customersById[order.customerId] &&
        !seen.has(order.customerId)
      ) {
        seen.add(order.customerId);
        missing.push(order.customerId);
      }
    }
    return missing;
  }, [ordersById, customersById]);

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      reservations: prev.reservations,
      pagination: prev.pagination,
    }));
  }

  function handleStatusChange(next) {
    setStatus(next);
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
    getReservations(params).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          reservations: [],
          pagination: null,
        });
        return;
      }
      const data = result.payload?.data ?? null;
      setFetchState({
        status: "ready",
        message: null,
        reservations: Array.isArray(data?.reservations) ? data.reservations : [],
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

  useEffect(() => {
    if (missingOrderIds.length === 0) {
      return undefined;
    }
    const batch = missingOrderIds.slice(0, DETAIL_BATCH);
    let cancelled = false;
    Promise.all(batch.map((id) => getAdminOrder(id))).then((results) => {
      if (cancelled) {
        return;
      }
      const next = {};
      let added = false;
      for (const result of results) {
        const order = result?.payload?.data?.order;
        if (!order?.id) {
          continue;
        }
        next[order.id] = order;
        added = true;
      }
      if (added) {
        setOrdersById((prev) => ({ ...prev, ...next }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [missingOrderIds]);

  useEffect(() => {
    if (missingCustomerIds.length === 0) {
      return undefined;
    }
    const batch = missingCustomerIds.slice(0, DETAIL_BATCH);
    let cancelled = false;
    Promise.all(batch.map((id) => getAdminCustomer(id))).then((results) => {
      if (cancelled) {
        return;
      }
      const next = {};
      let added = false;
      for (const result of results) {
        const customer = result?.payload?.data?.customer;
        if (!customer?.id) {
          continue;
        }
        next[customer.id] = customer;
        added = true;
      }
      if (added) {
        setCustomersById((prev) => ({ ...prev, ...next }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [missingCustomerIds]);

  const hasFilter = status !== "ALL";
  const totalShown = searching
    ? visibleRows.length
    : pagination?.total ?? reservations.length;

  return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gold-soft/70 bg-cream/95 p-4 shadow-[0_2px_18px_-16px_rgba(43,38,32,0.35)] sm:p-5">
          <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
            Status
            <select
              value={status}
              onChange={(event) => handleStatusChange(event.target.value)}
              className={controlClass}
            >
              <option value="ALL">All statuses</option>
              {RESERVATION_STATUS_OPTIONS.map((value) => (
                <option key={value} value={value}>
                  {reservationStatusMeta(value).label}
                </option>
              ))}
            </select>
          </label>
          <div className="relative min-w-[220px] flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search reservations by product name or SKU…"
              aria-label="Search reservations by product name or SKU"
              className="h-10 w-full rounded-lg border border-gold-soft/80 bg-white pl-10 pr-10 text-sm text-ink shadow-sm placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            />
            {query ? (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-gold-soft/40 hover:text-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <CreateReservationDialog ref={createRef} onCreated={handleRefresh} />
            <button type="button" onClick={handleRefresh} className={solidButtonClass}>
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </div>

        {viewStatus === "loading" ? <TableSkeleton rows={6} /> : null}

        {viewStatus === "error" ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
          >
            <h2 className="font-display text-lg text-ink">Reservations unavailable</h2>
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

        {viewStatus === "ready" && reservations.length === 0 ? (
          <EmptyReservations hasFilter={hasFilter} onRefresh={handleRefresh} />
        ) : null}

        {viewStatus === "ready" && reservations.length > 0 ? (
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
                      : `${totalShown} reservation${totalShown === 1 ? "" : "s"} across ${groups.length} product${groups.length === 1 ? "" : "s"}`}
                  </p>
                  {searching ? (
                    <button type="button" onClick={handleClearSearch} className={softButtonClass}>
                      <X aria-hidden="true" className="h-4 w-4" />
                      Clear search
                    </button>
                  ) : null}
                </div>

                <ReservationTable
                  groups={groups}
                  onChanged={handleRefresh}
                  className="hidden md:block"
                />

                <div className="space-y-6 md:hidden">
                  <AnimatePresence initial={false}>
                    {groups.map((group, groupIndex) => (
                      <motion.section
                        key={group.key}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.35,
                          ease: EASE,
                          delay: Math.min(groupIndex * 0.04, 0.3),
                        }}
                        className="space-y-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gold-soft/70 bg-sand/70 px-4 py-2.5">
                          <h3 className="font-semibold text-mocha-deep">
                            {group.productNameLabel}
                          </h3>
                          <p className="text-xs text-muted">
                            {group.reservations.length}{" "}
                            {group.reservations.length === 1 ? "reservation" : "reservations"}
                            {" · "}
                            {group.totalQuantity} units
                          </p>
                        </div>
                        {group.reservations.map((reservation) => (
                          <ReservationCard
                            key={reservation.id}
                            reservation={reservation}
                            onChanged={handleRefresh}
                          />
                        ))}
                      </motion.section>
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

/** No reservations at all (or none for the selected status). */
function EmptyReservations({ hasFilter, onRefresh }) {
  return (
    <div className="rounded-2xl border border-gold-soft/70 bg-cream px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-soft bg-gold-soft/30 text-gold">
        <CalendarClock aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-lg text-ink">No reservations</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {hasFilter
          ? "No reservations match the selected status yet. Try another status."
          : "No reservations exist yet. Use “Create reservation” to hold stock for an order, customer, return or transfer."}
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

/** The list loaded but none of the fetched reservations match the name/SKU. */
function NoSearchResults({ query, onClear }) {
  return (
    <div className="rounded-2xl border border-gold-soft/70 bg-cream px-6 py-12 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-soft bg-gold-soft/30 text-gold">
        <SearchX aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-lg text-ink">No matching reservations</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        No reservations in this view match “{query}”. Try a different product
        name or SKU, or clear the search.
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
