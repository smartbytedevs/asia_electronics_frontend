"use client";

import { useState } from "react";
import { createExpense } from "@/lib/api/expenses";
import { safeMessage } from "@/lib/api/http";
import { formatMinorUnits } from "@/lib/utils";
import { ConfirmDialog } from "../../components/confirm-dialog";

const inputClass =
  "mt-2 w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60";

/**
 * Converts a user-friendly BDT amount string into integer minor units
 * (paisa). Accepts "500", "500.00", "500.5" — no more than two decimals, no
 * negatives. Returns null when the input is not a valid positive BDT amount.
 * The conversion is string-based so floating-point drift can never corrupt
 * money values.
 */
export function amountToMinorUnits(input) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(input).trim());
  if (!match) {
    return null;
  }
  const taka = Number(match[1]);
  const paisa = match[2] ? Number(match[2].padEnd(2, "0")) : 0;
  const minor = taka * 100 + paisa;
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Create-expense dialog. Collects a BDT amount (converted to minor units),
 * optional category, required description and an expense date that defaults
 * to today (back-dating is allowed). The dialog never sends createdBy — the
 * backend records the acting admin itself. On success it closes and the list
 * refreshes; the new line also feeds the analytics summary.
 */
export function CreateExpenseDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function openDialog() {
    setAmount("");
    setCategory("");
    setDescription("");
    setExpenseDate(toDateInputValue(new Date()));
    setError(null);
    setOpen(true);
  }

  const minorUnits = amountToMinorUnits(amount);
  const descriptionEmpty = description.trim().length === 0;

  async function run() {
    if (minorUnits === null) {
      setError("Enter a valid positive amount in taka (BDT), e.g. 500.00");
      return;
    }
    const descriptionText = description.trim();
    if (!descriptionText) {
      setError("Description is required.");
      return;
    }
    setLoading(true);
    setError(null);
    const body = {
      amountMinorUnits: minorUnits,
      description: descriptionText,
    };
    const categoryText = category.trim();
    if (categoryText) {
      body.category = categoryText;
    }
    if (expenseDate) {
      body.expenseDate = expenseDate;
    }
    const result = await createExpense(body);
    setLoading(false);
    if (result.ok) {
      setOpen(false);
      onCreated();
    } else {
      setError(safeMessage(result.status, result.payload));
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-sm font-semibold text-white transition-colors hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        + Add Expense
      </button>

      {open ? (
        <ConfirmDialog
          title="Add expense"
          description="Record a business expense. This is an append-only financial record — it cannot be edited or deleted, and it feeds the analytics summary."
          confirmLabel="Add expense"
          confirmClassName="bg-gold text-white hover:bg-gold/90 focus-visible:ring-gold"
          loading={loading}
          error={error}
          onConfirm={() => run()}
          onClose={() => {
            if (!loading) {
              setOpen(false);
              setError(null);
            }
          }}
        >
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-mocha-deep">
                Amount (BDT)
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={loading}
                placeholder="e.g. 500.00"
                className={inputClass}
              />
              {amount !== "" && minorUnits === null ? (
                <span className="mt-1.5 block text-sm text-[#c9604d]">
                  Enter a valid positive amount with up to two decimals.
                </span>
              ) : null}
              {minorUnits !== null ? (
                <span className="mt-1.5 block text-sm text-muted">
                  Recorded as {formatMinorUnits(minorUnits)}
                </span>
              ) : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  Category (optional)
                </span>
                <input
                  type="text"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  disabled={loading}
                  maxLength={100}
                  placeholder="e.g. Marketing"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  Expense date
                </span>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(event) => setExpenseDate(event.target.value)}
                  disabled={loading}
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-mocha-deep">
                Description
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={loading}
                maxLength={500}
                rows={3}
                placeholder="What was this expense for?"
                className={`${inputClass} resize-y`}
              />
              {descriptionEmpty ? (
                <span className="mt-1.5 block text-sm text-[#c9604d]">
                  Description is required.
                </span>
              ) : null}
            </label>
          </div>
        </ConfirmDialog>
      ) : null}
    </>
  );
}
