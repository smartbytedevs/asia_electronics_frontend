"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { getMyOrders } from "@/lib/api/orders";
import { safeMessage } from "@/lib/api/http";
import { Pagination } from "@/app/(admin)/admin/components/pagination";
import { RefreshIcon } from "../../_components/icons";
import { OrderCard } from "./order-card";
import { OrdersSkeleton } from "./orders-skeleton";

const PAGE_LIMIT = 10;
const EASE = [0.22, 1, 0.36, 1];

const refreshClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-mocha/25 px-4 text-sm font-medium text-mocha transition-colors hover:border-mocha hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";

/**
 * Customer order history. Fetches the real `GET /orders` endpoint through the
 * authenticated proxy (newest first, server-side pagination). No filters — the
 * customer list only accepts `page`/`limit`. Loading uses a skeleton, errors
 * show the safe pre-mapped message, and an empty result renders the quiet
 * "no orders yet" state with a link back to the catalog.
 */
export function CustomerOrders() {
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    orders: [],
    pagination: null,
  });

  const params = useMemo(() => ({ page, limit: PAGE_LIMIT }), [page]);

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      orders: prev.orders,
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

  useEffect(() => {
    let cancelled = false;
    getMyOrders(params).then((result) => {
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

  const { status, message, orders, pagination } = fetchState;

  return (
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted">
            {status === "ready" && pagination
              ? `${pagination.total} order${pagination.total === 1 ? "" : "s"}`
              : "Your order history"}
          </p>
          <button type="button" onClick={handleRefresh} className={refreshClass}>
            <RefreshIcon className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {status === "loading" ? <OrdersSkeleton /> : null}

        {status === "error" ? (
          <div
            role="alert"
            className="rounded-3xl border border-red-200/80 bg-red-50/70 p-8 text-center"
          >
            <h2 className="font-display text-xl text-ink">
              Orders unavailable
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mocha-deep">
              {message}
            </p>
            <button
              type="button"
              onClick={handleRefresh}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-mocha px-6 text-sm font-semibold text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
            >
              Try again
            </button>
          </div>
        ) : null}

        {status === "ready" && orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-gold-soft bg-sand/40 px-6 py-16 text-center">
            <span className="text-2xl" aria-hidden="true">
              ✦
            </span>
            <h3 className="font-display text-xl text-ink">
              You haven&apos;t placed any orders yet
            </h3>
            <p className="max-w-sm text-sm leading-relaxed text-muted">
              When you order, your items and delivery details will appear
              here.
            </p>
            <Link
              href="/collection"
              className="mt-2 rounded-full border border-mocha/30 px-6 py-2.5 text-sm font-medium text-mocha transition-colors hover:bg-sand"
            >
              Browse the catalog
            </Link>
          </div>
        ) : null}

        {status === "ready" && orders.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="space-y-3"
          >
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            <div className="pt-2">
              <Pagination pagination={pagination} onPageChange={handlePageChange} />
            </div>
          </motion.div>
        ) : null}
      </div>
  );
}
