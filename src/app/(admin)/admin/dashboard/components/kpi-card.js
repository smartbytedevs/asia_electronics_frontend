import { cn } from "@/lib/utils";

/**
 * Single KPI card for the dashboard.
 *
 * `value` is already a formatted string ("1,234" or "৳12,345.00"). `bar` and
 * `valueClass` are the accent colors that let sales / refunds / expenses / net
 * read differently at a glance. Hover gently lifts the card and warms the
 * border; the entrance animation (stagger) is driven by the parent.
 */
export function KpiCard({ label, value, note, bar, valueClass }) {
  return (
    <div className="group relative h-full overflow-hidden rounded-2xl border border-gold-soft/70 bg-gradient-to-b from-cream to-white p-5 shadow-[0_16px_40px_-28px_rgba(43,38,32,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/60 hover:shadow-[0_24px_48px_-26px_rgba(43,38,32,0.4)]">
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-x-0 top-0 h-1 transition-opacity duration-300 group-hover:opacity-100",
          bar,
        )}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gold-soft/30 blur-2xl transition-opacity duration-300 opacity-0 group-hover:opacity-100"
      />
      <div className="relative">
        <p className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted">
          <span
            aria-hidden="true"
            className={cn("h-1.5 w-1.5 rounded-full", bar)}
          />
          {label}
        </p>
        <p
          className={cn(
            "mt-3 text-[1.7rem] font-semibold leading-tight tabular-nums transition-colors duration-300 group-hover:text-ink",
            valueClass,
          )}
        >
          {value}
        </p>
        {note ? (
          <p className="mt-2 text-xs text-muted transition-colors duration-300 group-hover:text-mocha-deep">
            {note}
          </p>
        ) : null}
      </div>
    </div>
  );
}
