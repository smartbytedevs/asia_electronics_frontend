import { RefreshCw, Truck } from "lucide-react";
import { courierStatusMeta } from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";

const retryButtonClass =
  "inline-flex h-6 w-6 items-center justify-center rounded-md text-muted transition-colors hover:bg-gold-soft/40 hover:text-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";

/**
 * Courier shipment status for an order row/card. Renders the shared courier
 * state machine (courier.constants.js: PENDING / ACTIVE / DELIVERED /
 * CANCELLED / FAILED / CANCELLATION_FAILED) so DELIVERED and CANCELLED are
 * visible in the admin order surface, plus the human consignment number when
 * present. Never renders a Mongo/Object id.
 *
 * `state` is the per-order courier fetch: `{ status: "loading" | "ready" |
 * "error", shipment, message }`. Empty (no shipment yet) renders a quiet
 * "Not dispatched" note; errors show a small retry affordance.
 */
export function CourierStatus({ state, onRetry }) {
  if (!state || state.status === "loading") {
    return (
      <span
        aria-hidden="true"
        className="inline-flex h-5 items-center justify-center"
      >
        <span className="h-3.5 w-16 skeleton-shimmer rounded-full" />
      </span>
    );
  }

  if (state.status === "error") {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs text-muted"
        title={state.message}
      >
        <Truck aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted/60" />
        Couldn&apos;t load
        <button
          type="button"
          onClick={onRetry}
          aria-label="Retry loading courier status"
          className={retryButtonClass}
        >
          <RefreshCw aria-hidden="true" className="h-3 w-3" />
        </button>
      </span>
    );
  }

  if (!state.shipment) {
    return (
      <span className="text-xs text-muted/60" title="Not dispatched to a courier yet">
        Not dispatched
      </span>
    );
  }

  const shipment = state.shipment;
  return (
    <div className="flex flex-col items-start gap-1">
      <StatusBadge meta={courierStatusMeta(shipment.status)} />
      {shipment.consignmentId ? (
        <span className="text-xs tabular-nums text-muted">
          {shipment.consignmentId}
        </span>
      ) : null}
    </div>
  );
}
