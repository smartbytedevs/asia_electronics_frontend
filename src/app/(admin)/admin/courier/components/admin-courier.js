"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getAdminShipments } from "@/lib/api/courier-shipments";
import { safeMessage } from "@/lib/api/http";
import { COURIER_STATUS_OPTIONS, courierStatusMeta } from "../../components/status-meta";
import { Pagination } from "../../components/pagination";
import { TableSkeleton } from "../../components/table-skeleton";
import { CourierTable } from "./courier-table";
import { CourierCard } from "./courier-card";

const PAGE_LIMIT = 20;
const EASE = [0.22, 1, 0.36, 1];

const controlClass =
  "h-10 rounded-lg border border-gold-soft/80 bg-white px-3 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50";

const softButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

/**
 * Courier shipment list. Filters (status, orderId) are applied explicitly so
 * typing never fires a request; only the backend-supported query params are
 * used. Shipment actions (retry/cancel) refresh the list on success so a
 * FAILED → ACTIVE retry immediately reflects the new status.
 */
export function AdminCourier() {
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    shipments: [],
    pagination: null,
  });

  const hasFilters = status !== "ALL";

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      shipments: prev.shipments,
      pagination: prev.pagination,
    }));
  }

  function handleStatusChange(next) {
    setStatus(next);
    setPage(1);
    startLoading();
  }

  function handleResetFilters() {
    setStatus("ALL");
    setSearch("");
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

  useEffect(() => {
    let cancelled = false;
    const params = { page, limit: PAGE_LIMIT };
    if (status !== "ALL") {
      params.status = status;
    }
    getAdminShipments(params).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          shipments: [],
          pagination: null,
        });
        return;
      }
      const data = result.payload?.data ?? null;
      setFetchState({
        status: "ready",
        message: null,
        shipments: Array.isArray(data?.shipments) ? data.shipments : [],
        pagination: data?.pagination ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [status, page, reloadKey]);

  const { status: viewStatus, message, shipments, pagination } = fetchState;

  const query = search.trim().toLowerCase();
  const visibleShipments = query
    ? shipments.filter((shipment) => {
        const orderNumber = shipment.orderNumber || "";
        const consignment = shipment.consignmentId || "";
        const provider = shipment.provider || "";
        return [orderNumber, consignment, provider].some((value) =>
          value.toLowerCase().includes(query)
        );
      })
    : shipments;
  const isSearching = query !== "";

  return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gold-soft/70 bg-cream p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Status
              <select
                value={status}
                onChange={(event) => handleStatusChange(event.target.value)}
                className={controlClass}
              >
                <option value="ALL">All statuses</option>
                {COURIER_STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {courierStatusMeta(value).label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Search
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Order number, consignment, or provider"
                className={`${controlClass} w-64`}
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                disabled={!hasFilters && !isSearching}
                className={`${softButtonClass} disabled:pointer-events-none disabled:opacity-50`}
              >
                Reset
              </button>
              <button type="button" onClick={handleRefresh} className={softButtonClass}>
                Refresh
              </button>
            </div>
          </div>
        </div>

        {viewStatus === "loading" ? <TableSkeleton rows={6} /> : null}

        {viewStatus === "error" ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
          >
            <h2 className="font-display text-lg text-ink">Shipments unavailable</h2>
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

        {viewStatus === "ready" && visibleShipments.length === 0 ? (
          <div className="rounded-2xl border border-gold-soft/70 bg-cream p-10 text-center">
            <p className="text-sm text-muted">
              {isSearching
                ? "No shipments match your search."
                : hasFilters
                  ? "No shipments match the selected filters."
                  : "No shipments yet. Dispatch a confirmed order to create the first one."}
            </p>
          </div>
        ) : null}

        {viewStatus === "ready" && visibleShipments.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="space-y-6"
          >
            {isSearching ? (
              <p className="text-xs text-muted">
                Showing matches from the loaded page of results.
              </p>
            ) : null}
            <CourierTable
              shipments={visibleShipments}
              onChanged={handleRefresh}
              className="hidden md:block"
            />
            <div className="space-y-4 md:hidden">
              {visibleShipments.map((shipment) => (
                <CourierCard key={shipment.id} shipment={shipment} onChanged={handleRefresh} />
              ))}
            </div>
            {!isSearching ? (
              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            ) : null}
          </motion.div>
        ) : null}
      </div>
  );
}
