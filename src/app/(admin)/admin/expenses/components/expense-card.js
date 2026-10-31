import Link from "next/link";
import { formatDate, formatDateTime, formatMinorUnits } from "@/lib/utils";
import { createdByLabel } from "./expense-table";

/**
 * Mobile expense card — the same serializer fields as the desktop table,
 * laid out for small screens with a link to the record detail.
 */
export function ExpenseCard({ expense }) {
  return (
    <article className="rounded-2xl border border-gold-soft/70 bg-cream p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-lg font-semibold tabular-nums text-ink">
          {formatMinorUnits(expense.amountMinorUnits)}
        </p>
        {expense.category ? (
          <span className="inline-flex items-center rounded-full border border-gold-soft/70 bg-sand/60 px-2.5 py-0.5 text-xs font-medium text-mocha-deep">
            {expense.category}
          </span>
        ) : null}
      </div>

      <p className="mt-2 text-sm leading-relaxed text-mocha-deep">
        {expense.description}
      </p>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">
            Expense date
          </dt>
          <dd className="text-ink">
            {expense.expenseDate ? formatDate(expense.expenseDate) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Created</dt>
          <dd className="text-ink">{formatDateTime(expense.createdAt)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs uppercase tracking-wide text-muted">
            Created by
          </dt>
          <dd className="text-ink">{createdByLabel(expense.createdBy)}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-gold-soft/40 pt-3">
        <Link
          href={`/admin/expenses/${expense.id}`}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-gold-soft bg-white px-3 text-xs font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1"
        >
          View record
        </Link>
      </div>
    </article>
  );
}
