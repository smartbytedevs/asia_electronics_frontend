"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { getAdminCustomers } from "@/lib/api/customers";
import { safeMessage } from "@/lib/api/http";
import {
  ACCOUNT_STATUS_OPTIONS,
  USER_ROLE_OPTIONS,
  accountStatusMeta,
  userRoleMeta,
} from "../../components/status-meta";
import { Pagination } from "../../components/pagination";
import { TableSkeleton } from "../../components/table-skeleton";
import { CustomerTable } from "./customer-table";
import { CustomerCard } from "./customer-card";

const PAGE_LIMIT = 20;
const EASE = [0.22, 1, 0.36, 1];

const controlClass =
  "h-10 rounded-lg border border-gold-soft/80 bg-white px-3 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50";

const softButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

/**
 * Admin customer list. Filters use only the backend-supported query params
 * (role, status, page, limit). Changing a filter resets to page 1 so the
 * result set never starts mid-list.
 */
export function AdminCustomers() {
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    customers: [],
    pagination: null,
  });

  const params = useMemo(() => {
    const query = { page, limit: PAGE_LIMIT };
    if (role !== "ALL") {
      query.role = role;
    }
    if (status !== "ALL") {
      query.status = status;
    }
    return query;
  }, [role, status, page]);

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      customers: prev.customers,
      pagination: prev.pagination,
    }));
  }

  function handleRoleChange(next) {
    setRole(next);
    setPage(1);
    startLoading();
  }

  function handleStatusChange(next) {
    setStatus(next);
    setPage(1);
    startLoading();
  }

  function handleResetFilters() {
    setRole("ALL");
    setStatus("ALL");
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
    getAdminCustomers(params).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          customers: [],
          pagination: null,
        });
        return;
      }
      const data = result.payload?.data ?? null;
      setFetchState({
        status: "ready",
        message: null,
        customers: Array.isArray(data?.customers) ? data.customers : [],
        pagination: data?.pagination ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [params, reloadKey]);

  const { status: viewStatus, message, customers, pagination } = fetchState;
  const hasFilters = role !== "ALL" || status !== "ALL";

  const query = search.trim().toLowerCase();
  const visibleCustomers = query
    ? customers.filter((customer) =>
        [customer.displayName, customer.email, customer.phone]
          .some((value) => value && value.toLowerCase().includes(query))
      )
    : customers;
  const isSearching = query !== "";

  return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-gold-soft/70 bg-cream p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Search
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, or phone"
                className={`${controlClass} w-56`}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Role
              <select
                value={role}
                onChange={(event) => handleRoleChange(event.target.value)}
                className={controlClass}
              >
                <option value="ALL">All roles</option>
                {USER_ROLE_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {userRoleMeta(value).label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Status
              <select
                value={status}
                onChange={(event) => handleStatusChange(event.target.value)}
                className={controlClass}
              >
                <option value="ALL">All statuses</option>
                {ACCOUNT_STATUS_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {accountStatusMeta(value).label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetFilters}
                disabled={!hasFilters}
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
            <h2 className="font-display text-lg text-ink">Customers unavailable</h2>
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

        {viewStatus === "ready" && visibleCustomers.length === 0 ? (
          <div className="rounded-2xl border border-gold-soft/70 bg-cream p-10 text-center">
            <p className="text-sm text-muted">
              {isSearching
                ? "No customers match your search."
                : hasFilters
                  ? "No users match the selected filters."
                  : "No user accounts have been created yet."}
            </p>
          </div>
        ) : null}

        {viewStatus === "ready" && visibleCustomers.length > 0 ? (
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
            <CustomerTable customers={visibleCustomers} className="hidden md:block" />
            <div className="space-y-4 md:hidden">
              {visibleCustomers.map((customer) => (
                <CustomerCard key={customer.id} customer={customer} />
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
