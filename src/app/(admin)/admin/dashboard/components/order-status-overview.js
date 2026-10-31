import { motion } from "motion/react";
import { Panel, PanelTitle } from "./panel";

const EASE = [0.22, 1, 0.36, 1];

const STATUS_LABELS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  REFUNDED: "Refunded",
};

const STATUS_BARS = {
  PENDING: "bg-amber-400/80",
  CONFIRMED: "bg-gold",
  PROCESSING: "bg-mocha/70",
  SHIPPED: "bg-mocha-deep/70",
  DELIVERED: "bg-emerald-600/70",
  COMPLETED: "bg-emerald-600/70",
  REJECTED: "bg-[#c9604d]",
  CANCELLED: "bg-stone-400/70",
  RETURNED: "bg-rose-400/70",
  REFUNDED: "bg-rose-400/70",
};

function labelFor(status) {
  if (STATUS_LABELS[status]) {
    return STATUS_LABELS[status];
  }
  const lower = status.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function barFor(status) {
  return STATUS_BARS[status] ?? "bg-gold/50";
}

/**
 * Order status breakdown from the analytics `orderStatusCounts` map. Each
 * status renders a proportional bar (share of the period's total orders) with
 * its count, sorted by count so the busiest status reads first. Bars grow in
 * when the section appears; a flat "no orders" message is shown when the
 * period has none.
 */
export function OrderStatusOverview({ counts, totalOrders }) {
  const entries = Object.entries(counts ?? {})
    .map(([status, count]) => ({
      status,
      count: Number(count) || 0,
    }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);

  const hasOrders = totalOrders > 0;

  return (
    <Panel aria-label="Order status overview">
      <PanelTitle>Order status</PanelTitle>
      <p className="mt-1 text-sm text-muted">
        How the {hasOrders ? totalOrders.toLocaleString("en-US") : "period's"}{" "}
        order{hasOrders && totalOrders === 1 ? "" : "s"} are distributed.
      </p>

      {entries.length === 0 ? (
        <p className="mt-6 rounded-xl border border-gold-soft/60 bg-sand/60 px-4 py-5 text-center text-sm text-muted">
          No orders recorded in the selected period yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {entries.map(({ status, count }, index) => {
            const width = hasOrders
              ? Math.round((count / totalOrders) * 100)
              : 0;
            return (
              <motion.li
                key={status}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + index * 0.05, ease: EASE }}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="min-w-0 flex-1 text-sm font-medium text-ink">
                    {labelFor(status)}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-2">
                    <span className="text-xs tabular-nums text-muted">
                      {width}%
                    </span>
                    <span className="min-w-[3.5rem] text-right text-sm font-semibold tabular-nums text-mocha-deep">
                      {count.toLocaleString("en-US")}
                    </span>
                  </span>
                </div>
                <div
                  role="img"
                  aria-label={`${labelFor(status)}: ${count} orders`}
                  className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand"
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.6, delay: 0.2 + index * 0.05, ease: EASE }}
                    className={`h-full rounded-full ${barFor(status)}`}
                  />
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
