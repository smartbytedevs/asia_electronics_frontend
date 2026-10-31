import { cn } from "@/lib/utils";

/**
 * ABAYA pagination controls. Uses the backend `pagination` shape
 * ({ page, limit, total, totalPages }). Renders nothing for a single page so
 * the list stays calm for small result sets.
 */
export function Pagination({ pagination, onPageChange, disabled }) {
  const page = Number(pagination?.page) || 1;
  const totalPages = Number(pagination?.totalPages) || 0;
  const total = Number(pagination?.total) || 0;

  if (totalPages <= 1) {
    return null;
  }

  const buttonClass =
    "inline-flex h-9 items-center justify-center rounded-lg border border-gold-soft/70 bg-cream px-3.5 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40";

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-wrap items-center justify-between gap-3"
    >
      <p className="text-sm text-muted">
        Showing{" "}
        <span className="font-medium text-ink">
          {total === 0 ? 0 : (page - 1) * (Number(pagination?.limit) || 20) + 1}
          –{Math.min(page * (Number(pagination?.limit) || 20), total)}
        </span>{" "}
        of <span className="font-medium text-ink">{total}</span> results
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={buttonClass}
          disabled={disabled || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <span
          className={cn(
            "px-2 text-sm tabular-nums",
            disabled ? "text-muted/60" : "text-mocha-deep",
          )}
        >
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className={buttonClass}
          disabled={disabled || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
