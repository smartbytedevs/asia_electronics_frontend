"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Package, RefreshCw, Search, SearchX, X } from "lucide-react";
import { getAdminOrders } from "@/lib/api/orders";
import { getAdminShipments } from "@/lib/api/courier-shipments";
import { getAdminPayments } from "@/lib/api/payments";
import { safeMessage } from "@/lib/api/http";
import {
  ORDER_STATUS_OPTIONS,
  orderStatusMeta,
  paymentMethodLabel,
} from "../../components/status-meta";
import { Pagination } from "../../components/pagination";
import { OrderTable } from "./order-table";
import { OrderCard } from "./order-card";
import {
  PAYMENT_METHOD_FILTER_OPTIONS,
  orderMatchesDateRange,
  orderMatchesPaymentMethod,
  orderMatchesSearch,
  orderNumberFor,
  requiresPaymentVerification,
} from "./order-utils";

const PAGE_LIMIT = 20;
const SEARCH_LIMIT = 100;
const EASE = [0.22, 1, 0.36, 1];

const controlClass =
  "h-10 rounded-lg border border-gold-soft/80 bg-white px-3 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50";

const softButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

/**
 * Admin order list.
 *
 * Backend-supported controls: `status`, `page`, `limit` (GET /admin/orders
 * has no text search, no payment-method filter and no date filter). The
 * status dropdown is therefore the only server-side filter — it keeps
 * pagination working normally.
 *
 * Search and the payment-method / date-range filters run client-side over a
 * page fetched at the backend's max size (100), exactly like the product
 * search: while any client-side filter is active the list fetches a large
 * page once, filters in the browser, and hides pagination (a single fetched
 * batch is authoritative for that view). No invented API contract.
 *
 * Search matches order number, customer name, phone, and product names via
 * order-utils.orderMatchesSearch. Payment method and date use
 * orderMatchesPaymentMethod / orderMatchesDateRange over the same batch.
 */
export function AdminOrders() {
  const [status, setStatus] = useState("ALL");
  const [paymentMethod, setPaymentMethod] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    orders: [],
    pagination: null,
  });
  /**
   * Courier shipment lookup per displayed order. The Order and CourierShipment
   * are separate resources, so every order row resolves its own shipment via
   * the existing admin shipments endpoint (`GET /admin/shipments?orderId=…`).
   * Each entry is `{ status: "loading" | "ready" | "error", shipment, message }`
   * keyed by order id.
   */
  const [courierById, setCourierById] = useState({});
  const shipmentReqRef = useRef(new Map());

  /**
   * Payment-record lookup for manual-payment orders that are still PENDING.
   * The backend gates confirmation on a VERIFIED payment for manual methods,
   * so the row needs the payment status to know whether Confirm is allowed
   * (`GET /admin/payments?orderNumber=…`). Each entry is
   * `{ status: "loading" | "ready" | "none" | "error", payment, message }`
   * keyed by order id; non-manual / non-PENDING orders never get a lookup.
   */
  const [paymentById, setPaymentById] = useState({});
  const paymentReqRef = useRef(new Map());

  const searching = debouncedQuery !== "";
  const invalidDates =
    dateFrom !== "" && dateTo !== "" && dateFrom > dateTo;
  const clientFiltering =
    searching || paymentMethod !== "ALL" || dateFrom !== "" || dateTo !== "";

  const params = useMemo(() => {
    const query = {};
    if (status !== "ALL") {
      query.status = status;
    }
    if (clientFiltering) {
      return { ...query, page: 1, limit: SEARCH_LIMIT };
    }
    return { ...query, page, limit: PAGE_LIMIT };
  }, [status, clientFiltering, page]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  const visibleOrders = useMemo(() => {
    if (!clientFiltering) {
      return fetchState.orders;
    }
    return fetchState.orders.filter((order) => {
      if (!orderMatchesSearch(order, debouncedQuery)) {
        return false;
      }
      if (!orderMatchesPaymentMethod(order, paymentMethod)) {
        return false;
      }
      if (!invalidDates && !orderMatchesDateRange(order, dateFrom, dateTo)) {
        return false;
      }
      return true;
    });
  }, [
    clientFiltering,
    fetchState.orders,
    debouncedQuery,
    paymentMethod,
    dateFrom,
    dateTo,
    invalidDates,
  ]);

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      orders: prev.orders,
      pagination: prev.pagination,
    }));
  }

  function handleStatusChange(next) {
    if (next === status) {
      return;
    }
    setStatus(next);
    setPage(1);
    startLoading();
  }

  function handlePaymentMethodChange(next) {
    if (next === paymentMethod) {
      return;
    }
    setPaymentMethod(next);
    setPage(1);
    startLoading();
  }

  function handleDateFromChange(value) {
    setDateFrom(value);
    setPage(1);
    startLoading();
  }

  function handleDateToChange(value) {
    setDateTo(value);
    setPage(1);
    startLoading();
  }

  function handlePageChange(next) {
    setPage(next);
    startLoading();
  }

  function handleClearSearch() {
    setQuery("");
    setDebouncedQuery("");
    setPage(1);
    startLoading();
  }

  function handleResetFilters() {
    setStatus("ALL");
    setPaymentMethod("ALL");
    setDateFrom("");
    setDateTo("");
    setQuery("");
    setDebouncedQuery("");
    setPage(1);
    startLoading();
  }

  function handleRefresh() {
    startLoading();
    setCourierById((prev) => {
      const next = {};
      for (const [key, value] of Object.entries(prev)) {
        next[key] = { ...value, status: "loading" };
      }
      return next;
    });
    setPaymentById((prev) => {
      const next = {};
      for (const [key, value] of Object.entries(prev)) {
        next[key] = { ...value, status: "loading" };
      }
      return next;
    });
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let cancelled = false;
    getAdminOrders(params).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          orders: [],
          pagination: null,
        });
        return;
      }
      const data = result.payload?.data ?? null;
      setFetchState({
        status: "ready",
        message: null,
        orders: Array.isArray(data?.orders) ? data.orders : [],
        pagination: data?.pagination ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [params, reloadKey]);

  const applyShipmentResult = useCallback((orderId, result) => {
    setCourierById((prev) => {
      if (shipmentReqRef.current.get(orderId) === undefined) {
        return prev;
      }
      const next = { ...prev };
      if (!result.ok) {
        next[orderId] = {
          status: "error",
          shipment: prev[orderId]?.shipment ?? null,
          message: safeMessage(result.status, result.payload),
        };
        return next;
      }
      const shipments = Array.isArray(result.payload?.data?.shipments)
        ? result.payload.data.shipments
        : [];
      next[orderId] = {
        status: "ready",
        shipment: shipments[0] ?? null,
        message: null,
      };
      return next;
    });
  }, []);

  const requestShipment = useCallback(
    (orderId) => {
      const version = (shipmentReqRef.current.get(orderId) ?? 0) + 1;
      shipmentReqRef.current.set(orderId, version);
      setCourierById((prev) => ({
        ...prev,
        [orderId]: {
          status: "loading",
          shipment: prev[orderId]?.shipment ?? null,
          message: null,
        },
      }));
      getAdminShipments({ orderId, page: 1, limit: 1 }).then((result) => {
        if (shipmentReqRef.current.get(orderId) !== version) {
          return;
        }
        applyShipmentResult(orderId, result);
      });
    },
    [applyShipmentResult]
  );

  useEffect(() => {
    const orderIds = visibleOrders
      .map((order) => order?.id)
      .filter((id) => typeof id === "string" && id !== "");
    orderIds.forEach(requestShipment);
  }, [visibleOrders, requestShipment]);

  const applyPaymentResult = useCallback((orderId, result) => {
    setPaymentById((prev) => {
      if (paymentReqRef.current.get(orderId) === undefined) {
        return prev;
      }
      const next = { ...prev };
      if (!result.ok) {
        next[orderId] = {
          status: "error",
          payment: prev[orderId]?.payment ?? null,
          message: safeMessage(result.status, result.payload),
        };
        return next;
      }
      const payments = Array.isArray(result.payload?.data?.payments)
        ? result.payload.data.payments
        : [];
      next[orderId] = {
        status: payments.length > 0 ? "ready" : "none",
        payment: payments[0] ?? null,
        message: null,
      };
      return next;
    });
  }, []);

  const requestPayment = useCallback(
    (order) => {
      const orderId = order?.id;
      const orderNumber = orderNumberFor(order);
      if (typeof orderId !== "string" || orderId === "") {
        return;
      }
      const version = (paymentReqRef.current.get(orderId) ?? 0) + 1;
      paymentReqRef.current.set(orderId, version);
      setPaymentById((prev) => ({
        ...prev,
        [orderId]: {
          status: "loading",
          payment: prev[orderId]?.payment ?? null,
          message: null,
        },
      }));
      getAdminPayments({ orderNumber, page: 1, limit: 1 }).then((result) => {
        if (paymentReqRef.current.get(orderId) !== version) {
          return;
        }
        applyPaymentResult(orderId, result);
      });
    },
    [applyPaymentResult]
  );

  useEffect(() => {
    const ordersToCheck = visibleOrders.filter(requiresPaymentVerification);
    ordersToCheck.forEach(requestPayment);
  }, [visibleOrders, requestPayment]);

  const { status: viewStatus, message, orders, pagination } = fetchState;
  const hasFilters =
    status !== "ALL" || searching || paymentMethod !== "ALL" || dateFrom !== "" || dateTo !== "";
  const totalShown = clientFiltering
    ? visibleOrders.length
    : pagination?.total ?? orders.length;

  return (
      <div className="space-y-6">
        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="rounded-2xl border border-gold-soft/70 bg-cream/95 p-4 shadow-[0_2px_18px_-16px_rgba(43,38,32,0.35)] sm:p-5"
        >
          <div className="relative">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by order number, customer, phone, or product…"
              aria-label="Search orders by order number, customer name, phone, or product name"
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
          <p className="mt-2 text-xs text-muted">
            Search matches order number, customer name, phone, and product
            names.
          </p>

          <div className="mt-4 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Order status
              <select
                value={status}
                onChange={(event) => handleStatusChange(event.target.value)}
                className={controlClass}
              >
                <option value="ALL">All statuses</option>
                {ORDER_STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {orderStatusMeta(value).label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Payment method
              <select
                value={paymentMethod}
                onChange={(event) => handlePaymentMethodChange(event.target.value)}
                className={controlClass}
              >
                <option value="ALL">All payment methods</option>
                {PAYMENT_METHOD_FILTER_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {paymentMethodLabel(value)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              From
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(event) => handleDateFromChange(event.target.value)}
                className={controlClass}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              To
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(event) => handleDateToChange(event.target.value)}
                className={controlClass}
              />
            </label>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                disabled={!hasFilters}
                className={softButtonClass}
              >
                <X aria-hidden="true" className="h-4 w-4" />
                Reset
              </button>
              <button type="button" onClick={handleRefresh} className={softButtonClass}>
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>

          {invalidDates ? (
            <p className="mt-3 text-sm text-[#c9604d]">
              The start date must be on or before the end date.
            </p>
          ) : null}
        </motion.div>

        {viewStatus === "loading" ? <OrdersSkeleton rows={6} /> : null}

        {viewStatus === "error" ? (
          <motion.div
            role="alert"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
          >
            <h2 className="font-display text-lg text-ink">Orders unavailable</h2>
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
          </motion.div>
        ) : null}

        {viewStatus === "ready" && orders.length === 0 ? (
          <EmptyPanel
            searching={searching}
            statusFiltered={status !== "ALL"}
            hasFilters={hasFilters}
            onClearSearch={handleClearSearch}
            onResetFilters={handleResetFilters}
          />
        ) : null}

        {viewStatus === "ready" && orders.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="space-y-6"
          >
            {clientFiltering && visibleOrders.length === 0 ? (
              <NoMatchPanel
                searching={searching}
                query={debouncedQuery}
                onReset={handleResetFilters}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-muted">
                    {clientFiltering
                      ? `${totalShown} order${totalShown === 1 ? "" : "s"} match${totalShown === 1 ? "es" : ""} the current filters`
                      : `${totalShown} order${totalShown === 1 ? "" : "s"}`}
                  </p>
                  {hasFilters ? (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className={softButtonClass}
                    >
                      <X aria-hidden="true" className="h-4 w-4" />
                      Clear filters
                    </button>
                  ) : null}
                </div>

                <OrderTable
                  orders={visibleOrders}
                  onChanged={handleRefresh}
                  courierById={courierById}
                  onCourierRetry={requestShipment}
                  paymentById={paymentById}
                  className="hidden md:block"
                />

                <div className="space-y-4 md:hidden">
                  <AnimatePresence initial={false}>
                    {visibleOrders.map((order, index) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.35,
                          ease: EASE,
                          delay: Math.min(index * 0.04, 0.3),
                        }}
                      >
                        <OrderCard
                          order={order}
                          onChanged={handleRefresh}
                          courier={courierById[order.id]}
                          onCourierRetry={requestShipment}
                          payment={paymentById[order.id]}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {!clientFiltering ? (
                  <Pagination pagination={pagination} onPageChange={handlePageChange} />
                ) : null}
              </>
            )}
          </motion.div>
        ) : null}
      </div>
  );
}

/** Loading skeleton using the shared gold shimmer sweep. */
function OrdersSkeleton({ rows = 6 }) {
  return (
    <div
      aria-hidden="true"
      className="rounded-2xl border border-gold-soft/70 bg-cream p-4 sm:p-6"
    >
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            <div className="h-3.5 w-1/5 skeleton-shimmer rounded-full" />
            <div className="h-3.5 w-1/6 skeleton-shimmer rounded-full" />
            <div className="hidden h-3 w-1/4 skeleton-shimmer rounded-full sm:block" />
            <div className="hidden h-3 w-12 skeleton-shimmer rounded-full sm:block" />
            <div className="ml-auto hidden h-5 w-20 skeleton-shimmer rounded-full sm:block" />
            <div className="hidden h-5 w-16 skeleton-shimmer rounded-full sm:block" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** No orders exist at all, or none match the server-side status filter. */
function EmptyPanel({ searching, statusFiltered, hasFilters, onClearSearch, onResetFilters }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="rounded-2xl border border-gold-soft/70 bg-cream px-6 py-12 text-center"
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-soft bg-gold-soft/30 text-gold">
        {searching ? (
          <SearchX aria-hidden="true" className="h-6 w-6" />
        ) : (
          <Package aria-hidden="true" className="h-6 w-6" />
        )}
      </span>
      <h2 className="mt-4 font-display text-lg text-ink">
        {searching
          ? "No matching orders"
          : statusFiltered
            ? "No orders in this status"
            : hasFilters
              ? "No matching orders"
              : "No orders yet"}
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {searching
          ? "No orders match your search. Try an order number, customer name, phone, or product name."
          : statusFiltered
            ? "No orders are currently in this status. Try another status or clear the filters."
            : hasFilters
              ? "No orders match the current filters yet. Try a different payment method or date range."
              : "Once customers place orders, they will appear here."}
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
      ) : hasFilters ? (
        <button
          type="button"
          onClick={onResetFilters}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-5 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <X aria-hidden="true" className="h-4 w-4" />
          Clear filters
        </button>
      ) : null}
    </motion.div>
  );
}

/** The backend returned orders, but the client-side filters eliminated them. */
function NoMatchPanel({ searching, query, onReset }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className="rounded-2xl border border-gold-soft/70 bg-cream px-6 py-12 text-center"
    >
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold-soft bg-gold-soft/30 text-gold">
        <SearchX aria-hidden="true" className="h-6 w-6" />
      </span>
      <h2 className="mt-4 font-display text-lg text-ink">No matching orders</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        {searching
          ? `No orders in this view match “${query}”. Try a different term or clear the search.`
          : "No orders match the current filters. Try a different status, payment method, or date range."}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-5 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        <X aria-hidden="true" className="h-4 w-4" />
        {searching ? "Clear search" : "Clear filters"}
      </button>
    </motion.div>
  );
}
