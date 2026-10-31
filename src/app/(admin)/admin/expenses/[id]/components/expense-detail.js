"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAdminExpense } from "@/lib/api/expenses";
import { safeMessage } from "@/lib/api/http";
import { formatDate, formatDateTime, formatMinorUnits } from "@/lib/utils";
import { createdByLabel } from "../../components/expense-table";

function InfoRow({ label, children }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-4 py-3 sm:grid-cols-[150px_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm text-ink">{children}</dd>
    </div>
  );
}

/**
 * Read-only detail view for a single expense. No edit/delete affordances —
 * expense records are append-only. Every field shown is exactly what the
 * expense serializer returns.
 */
export function ExpenseDetail({ expenseId }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ status: "loading", message: null });

  function handleRetry() {
    setState({ status: "loading", message: null });
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let cancelled = false;
    getAdminExpense(expenseId).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setState({
          status: "error",
          message: safeMessage(result.status, result.payload),
        });
        return;
      }
      const expense = result.payload?.data?.expense ?? null;
      if (!expense) {
        setState({
          status: "error",
          message: "Expense not found.",
        });
        return;
      }
      setState({ status: "ready", message: expense });
    });
    return () => {
      cancelled = true;
    };
  }, [expenseId, reloadKey]);

  if (state.status === "loading") {
    return (
      <div className="rounded-2xl border border-gold-soft/70 bg-cream p-6">
        <div className="h-6 w-1/3 animate-pulse rounded bg-sand" />
        <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-sand" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-sand" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
      >
        <h2 className="font-display text-lg text-ink">Expense unavailable</h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-mocha-deep">
          {state.message}
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-mocha px-5 text-sm font-semibold text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  const expense = state.message;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gold-soft/70 bg-cream p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-semibold tabular-nums text-ink">
              {formatMinorUnits(expense.amountMinorUnits)}
            </p>
            {expense.category ? (
              <span className="mt-2 inline-flex items-center rounded-full border border-gold-soft/70 bg-sand/60 px-2.5 py-0.5 text-xs font-medium text-mocha-deep">
                {expense.category}
              </span>
            ) : null}
          </div>
          <Link
            href="/admin/expenses"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gold-soft/80 bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            ← All expenses
          </Link>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-mocha-deep">
          {expense.description}
        </p>
      </div>

      <div className="rounded-2xl border border-gold-soft/70 bg-cream p-6">
        <dl className="divide-y divide-gold-soft/40">
          <InfoRow label="Expense date">
            {expense.expenseDate ? formatDate(expense.expenseDate) : "—"}
          </InfoRow>
          <InfoRow label="Category">
            {expense.category ?? "—"}
          </InfoRow>
          <InfoRow label="Created by">{createdByLabel(expense.createdBy)}</InfoRow>
          <InfoRow label="Record created">{formatDateTime(expense.createdAt)}</InfoRow>
          <InfoRow label="Last updated">{formatDateTime(expense.updatedAt)}</InfoRow>
        </dl>
      </div>

      <p className="rounded-xl border border-gold-soft/60 bg-sand/40 px-4 py-3 text-xs leading-relaxed text-muted">
        Append-only record — expenses cannot be edited or deleted after they
        are created. Amounts are stored in minor units (paisa) and verified by
        the backend on creation.
      </p>
    </div>
  );
}
