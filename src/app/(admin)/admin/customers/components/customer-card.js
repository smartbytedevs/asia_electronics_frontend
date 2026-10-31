import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  accountStatusMeta,
  userRoleMeta,
} from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";

/**
 * Mobile customer card — the same real fields as the desktop table, laid out
 * for small screens.
 */
export function CustomerCard({ customer }) {
  return (
    <article className="rounded-2xl border border-gold-soft/70 bg-cream p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-ink">
            {customer.displayName || "Customer"}
          </p>
          <p className="mt-0.5 text-sm text-mocha-deep">{customer.email || "No email"}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge meta={userRoleMeta(customer.role)} />
          <StatusBadge meta={accountStatusMeta(customer.status)} />
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Phone</dt>
          <dd className="text-ink">{customer.phone || "—"}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Member since</dt>
          <dd className="text-ink">{formatDate(customer.createdAt)}</dd>
        </div>
      </dl>

      <div className="mt-3 border-t border-gold-soft/40 pt-3">
        <Link
          href={`/admin/customers/${customer.id}`}
          className="text-sm font-medium text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
