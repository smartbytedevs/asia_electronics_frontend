import Link from "next/link";
import { formatDate, formatDateTime, formatMinorUnits } from "@/lib/utils";

/**
 * A human label for the serializer's createdBy (safe user ref or { id }).
 * Never falls back to the technical user id — unidentifiable actors read as
 * "Staff".
 */
export function createdByLabel(createdBy) {
  if (!createdBy) {
    return "—";
  }
  if (createdBy.name) {
    return createdBy.name;
  }
  if (createdBy.email) {
    return createdBy.email;
  }
  return "Staff";
}

const viewLinkClass =
  "inline-flex h-8 items-center justify-center rounded-lg border border-gold-soft bg-white px-3 text-xs font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1";

/**
 * Desktop expense table. Columns map 1:1 to the expense serializer fields
 * (amount, category, description, expenseDate, createdBy, createdAt) plus a
 * link to the append-only record detail page.
 */
export function ExpenseTable({ expenses, className }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gold-soft/70 bg-cream ${className ?? ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-sand/70 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Amount</th>
              <th scope="col" className="px-4 py-3 font-medium">Category</th>
              <th scope="col" className="px-4 py-3 font-medium">Description</th>
              <th scope="col" className="px-4 py-3 font-medium">Expense date</th>
              <th scope="col" className="px-4 py-3 font-medium">Created</th>
              <th scope="col" className="px-4 py-3 font-medium">Created by</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">View</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-soft/40">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gold-soft/20">
                <td className="px-4 py-3 font-semibold tabular-nums text-ink">
                  {formatMinorUnits(expense.amountMinorUnits)}
                </td>
                <td className="px-4 py-3">
                  {expense.category ? (
                    <span className="inline-flex items-center rounded-full border border-gold-soft/70 bg-sand/60 px-2.5 py-0.5 text-xs font-medium text-mocha-deep">
                      {expense.category}
                    </span>
                  ) : (
                    <span className="text-muted/60">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <p
                    className="max-w-[280px] truncate text-mocha-deep"
                    title={expense.description}
                  >
                    {expense.description}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted">
                  {expense.expenseDate ? formatDate(expense.expenseDate) : "—"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDateTime(expense.createdAt)}
                </td>
                <td className="px-4 py-3 text-muted">
                  {createdByLabel(expense.createdBy)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/expenses/${expense.id}`}
                    className={viewLinkClass}
                  >
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
