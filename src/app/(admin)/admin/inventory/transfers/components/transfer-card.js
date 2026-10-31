import { ArrowRightLeft } from "lucide-react";

function variantLabel(item) {
  if (item.variantSku) {
    const attributes = item.variantOptions
      .map(([key, value]) => `${key}: ${value}`)
      .join(" · ");
    return attributes ? `${item.variantSku} · ${attributes}` : item.variantSku;
  }
  return null;
}

const TRANSFER_BUTTON =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-gold-soft bg-white px-3 text-xs font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1";

/**
 * Mobile Stock Transfers card — mirrors the desktop table for small screens.
 */
export function TransferCard({ item, onTransfer }) {
  const label = variantLabel(item);
  return (
    <div className="rounded-2xl border border-gold-soft/70 bg-cream p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink">{item.productNameLabel}</p>
          {label ? (
            <p className="mt-0.5 text-sm text-mocha-deep">{label}</p>
          ) : (
            <p className="mt-0.5 text-xs text-muted">Simple product</p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onTransfer(item)}
          className={TRANSFER_BUTTON}
        >
          <ArrowRightLeft aria-hidden="true" className="h-3.5 w-3.5" />
          Transfer
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-x-4 gap-y-2 rounded-xl border border-gold-soft/40 bg-white/60 p-3 text-sm">
        <div>
          <dt className="text-xs text-muted">Online avail.</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-ink">
            {item.availableOnlineQuantity}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Offline</dt>
          <dd className="mt-0.5 font-semibold tabular-nums text-ink">
            {item.offlineQuantity}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Reserved</dt>
          <dd className="mt-0.5 tabular-nums text-muted">
            {item.reservedQuantity}
          </dd>
        </div>
      </dl>
    </div>
  );
}
