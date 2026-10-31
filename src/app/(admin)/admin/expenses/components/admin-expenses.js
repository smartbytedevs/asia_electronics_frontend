"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getAdminExpenses } from "@/lib/api/expenses";
import { safeMessage } from "@/lib/api/http";
import { Pagination } from "../../components/pagination";
import { TableSkeleton } from "../../components/table-skeleton";
import { ExpenseTable, createdByLabel } from "./expense-table";
import { ExpenseCard } from "./expense-card";
import { CreateExpenseDialog } from "./create-expense-dialog";

const PAGE_LIMIT = 20;
const EASE = [0.22, 1, 0.36, 1];

const EMPTY_FILTERS = { category: "", dateFrom: "", dateTo: "" };

const controlClass =
  "h-10 rounded-lg border border-gold-soft/80 bg-white px-3 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50";

const solidButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-mocha px-4 text-sm font-medium text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

const softButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2";

/**
 * Admin expense list. Filters (category, dateFrom, dateTo) are applied
 * explicitly via Apply so typing never fires a request; the backend does the
 * filtering. Reset clears everything. New expenses go through the dialog,
 * which converts the BDT amount to minor units before POSTing; on success the
 * list refreshes (filters preserved, back to page 1) and a short confirmation
 * notes the analytics impact.
 */
export function AdminExpenses() {
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [success, setSuccess] = useState(null);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    expenses: [],
    pagination: null,
  });

  const invalidDates =
    draft.dateFrom !== "" &&
    draft.dateTo !== "" &&
    draft.dateFrom > draft.dateTo;

  const hasFilters =
    applied.category !== "" ||
    applied.dateFrom !== "" ||
    applied.dateTo !== "";

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      expenses: prev.expenses,
      pagination: prev.pagination,
    }));
  }

  function handleApply() {
    if (invalidDates) {
      return;
    }
    setApplied({ ...draft });
    setPage(1);
    startLoading();
  }

  function handleReset() {
    setDraft(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
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

  function handleCreated() {
    setSuccess("Expense added. It is recorded now and counts toward analytics.");
    setPage(1);
    startLoading();
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    if (!success) {
      return undefined;
    }
    const id = setTimeout(() => setSuccess(null), 5000);
    return () => clearTimeout(id);
  }, [success]);

  useEffect(() => {
    let cancelled = false;
    const params = { page, limit: PAGE_LIMIT };
    if (applied.category) {
      params.category = applied.category;
    }
    if (applied.dateFrom) {
      params.dateFrom = applied.dateFrom;
    }
    if (applied.dateTo) {
      params.dateTo = applied.dateTo;
    }
    getAdminExpenses(params).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          expenses: [],
          pagination: null,
        });
        return;
      }
      const data = result.payload?.data ?? null;
      setFetchState({
        status: "ready",
        message: null,
        expenses: Array.isArray(data?.expenses) ? data.expenses : [],
        pagination: data?.pagination ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [applied, page, reloadKey]);

  const { status, message, expenses, pagination } = fetchState;

  const query = search.trim().toLowerCase();
  const visibleExpenses = query
    ? expenses.filter((expense) =>
        [expense.description, expense.category, createdByLabel(expense.createdBy)]
          .some((value) => value && value.toLowerCase().includes(query))
      )
    : expenses;
  const isSearching = query !== "";

  return (
      <div className="space-y-6">
        <div className="space-y-4 rounded-2xl border border-gold-soft/70 bg-cream p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Expenses are permanent financial records — they can be added but
              never edited or deleted, and they feed the analytics summary.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin/dashboard"
                className={softButtonClass}
              >
                View analytics
              </Link>
              <CreateExpenseDialog onCreated={handleCreated} />
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 border-t border-gold-soft/40 pt-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Search
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Description, category, or creator"
                className={`${controlClass} w-56`}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              Category
              <input
                type="text"
                value={draft.category}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, category: event.target.value }))
                }
                placeholder="e.g. Marketing"
                maxLength={100}
                className={`${controlClass} w-44`}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              From
              <input
                type="date"
                value={draft.dateFrom}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, dateFrom: event.target.value }))
                }
                className={controlClass}
              />
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium text-mocha-deep">
              To
              <input
                type="date"
                value={draft.dateTo}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, dateTo: event.target.value }))
                }
                className={controlClass}
              />
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApply}
                disabled={invalidDates}
                className={`${solidButtonClass} disabled:pointer-events-none disabled:opacity-50`}
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleReset}
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

          {invalidDates ? (
            <p className="text-sm text-[#c9604d]">
              The start date must be on or before the end date.
            </p>
          ) : null}

          {success ? (
            <p
              role="status"
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700"
            >
              {success}
            </p>
          ) : null}
        </div>

        {status === "loading" ? <TableSkeleton rows={6} /> : null}

        {status === "error" ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
          >
            <h2 className="font-display text-lg text-ink">Expenses unavailable</h2>
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

        {status === "ready" && visibleExpenses.length === 0 ? (
          <div className="rounded-2xl border border-gold-soft/70 bg-cream p-10 text-center">
            <p className="text-sm text-muted">
              {isSearching
                ? "No expenses match your search."
                : hasFilters
                  ? "No expenses match the selected filters yet."
                  : "No expenses recorded yet. Use Add Expense to create the first one."}
            </p>
          </div>
        ) : null}

        {status === "ready" && visibleExpenses.length > 0 ? (
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
            <ExpenseTable expenses={visibleExpenses} className="hidden md:block" />
            <div className="space-y-4 md:hidden">
              {visibleExpenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense} />
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
