"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getInventoryByVariant, getInventoryMovements } from "@/lib/api/inventory";
import { getOutlets } from "@/lib/api/outlets";
import { safeMessage } from "@/lib/api/http";
import { formatDateTime } from "@/lib/utils";
import {
  inventoryStatusMeta,
  movementTypeLabel,
  stockLocationLabel,
} from "../../../components/status-meta";
import { StatusBadge } from "../../../components/status-badge";
import { Pagination } from "../../../components/pagination";
import { StockActions } from "../../components/stock-actions";
import { ReserveDialog } from "./reserve-dialog";

const EASE = [0.22, 1, 0.36, 1];
const MOVEMENTS_LIMIT = 20;

function shortId(id) {
  return typeof id === "string" ? id.slice(0, 8) : "—";
}

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

function StatTile({ label, value }) {
  return (
    <div className="rounded-xl border border-gold-soft/40 bg-white/60 p-4">
      <p className="text-[0.68rem] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink">{value}</p>
    </div>
  );
}

function MovementBadge({ type }) {
  return (
    <span className="inline-flex items-center rounded-full border border-gold-soft/70 bg-sand/60 px-2.5 py-0.5 text-xs font-medium text-mocha-deep">
      {movementTypeLabel(type)}
    </span>
  );
}

function MovementDirection({ movement }) {
  if (movement.fromLocation && movement.toLocation) {
    return (
      <span className="text-mocha-deep">
        {stockLocationLabel(movement.fromLocation)} →{" "}
        {stockLocationLabel(movement.toLocation)}
      </span>
    );
  }
  if (movement.toLocation) {
    return <span className="text-mocha-deep">→ {stockLocationLabel(movement.toLocation)}</span>;
  }
  if (movement.fromLocation) {
    return <span className="text-mocha-deep">{stockLocationLabel(movement.fromLocation)} →</span>;
  }
  return <span className="text-muted">—</span>;
}

/**
 * Single inventory record for a variant plus its movement ledger. Reads the
 * record (`GET /inventory/:productVariantId`) and the ledger
 * (`GET /inventory/:productVariantId/movements`) in parallel. Stock commands
 * (in/out/adjust) and reservation creation mutate, then the page refreshes
 * both so the ledger reflects the new movement.
 */
export function InventoryDetail({ variantId }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [movementPage, setMovementPage] = useState(1);
  const [outletNames, setOutletNames] = useState({});
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    inventory: null,
    movements: [],
    pagination: null,
  });

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      inventory: prev.inventory,
      movements: prev.movements,
      pagination: prev.pagination,
    }));
  }

  function handleRefresh() {
    startLoading();
    setReloadKey((key) => key + 1);
  }

  function handleMovementPage(next) {
    setMovementPage(next);
    startLoading();
  }

  useEffect(() => {
    let cancelled = false;
    getOutlets().then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        return;
      }
      const outlets = Array.isArray(result.payload?.data?.outlets)
        ? result.payload.data.outlets
        : [];
      const names = {};
      for (const outlet of outlets) {
        if (outlet?.id && outlet?.name) {
          names[outlet.id] = outlet.name;
        }
      }
      setOutletNames(names);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const recordRequest = getInventoryByVariant(variantId);
    const movementsRequest = getInventoryMovements(variantId, {
      page: movementPage,
      limit: MOVEMENTS_LIMIT,
    });
    Promise.all([recordRequest, movementsRequest]).then(([recordResult, movementsResult]) => {
      if (cancelled) {
        return;
      }
      const record = recordResult.ok ? (recordResult.payload?.data?.inventory ?? null) : null;
      if (!recordResult.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(recordResult.status, recordResult.payload),
          inventory: null,
          movements: [],
          pagination: null,
        });
        return;
      }
      const movementsData = movementsResult.ok ? (movementsResult.payload?.data ?? null) : null;
      setFetchState({
        status: "ready",
        message: null,
        inventory: record,
        movements: Array.isArray(movementsData?.movements) ? movementsData.movements : [],
        pagination: movementsData?.pagination ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [variantId, movementPage, reloadKey]);

  const { status, message, inventory, movements, pagination } = fetchState;

  if (status === "loading") {
    return (
      <div aria-hidden="true" className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-sand" />
        <div className="h-56 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
      >
        <h2 className="font-display text-lg text-ink">Inventory unavailable</h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-mocha-deep">
          {message}
        </p>
        <button
          type="button"
          onClick={handleRefresh}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-mocha px-5 text-sm font-semibold text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!inventory) {
    return null;
  }

  const outletName = inventory.outletId ? outletNames[inventory.outletId] : null;
  const outletLabel = !inventory.outletId
    ? "Central (online pool)"
    : outletName
      ? `${outletName} (${shortId(inventory.outletId)})`
      : shortId(inventory.outletId);

  return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="space-y-6"
      >
        <Link
          href="/admin/inventory"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-mocha-deep hover:text-ink hover:underline"
        >
          ← Back to inventory
        </Link>

        <section className="rounded-2xl border border-gold-soft/70 bg-cream p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Variant</p>
              <h2 className="mt-1 text-2xl font-semibold tabular-nums text-ink">
                {shortId(inventory.productVariantId)}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {outletLabel} · Updated {formatDateTime(inventory.updatedAt)}
              </p>
            </div>
            <StatusBadge meta={inventoryStatusMeta(inventory)} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatTile label="Online" value={inventory.onlineQuantity} />
            <StatTile label="Reserved" value={inventory.reservedQuantity} />
            <StatTile label="Available" value={inventory.availableOnlineQuantity} />
            <StatTile label="Offline" value={inventory.offlineQuantity} />
            <StatTile label="Total" value={inventory.totalPhysicalQuantity} />
            <StatTile label="Threshold" value={inventory.lowStockThreshold ?? 0} />
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gold-soft/40 pt-4">
            <p className="text-xs text-muted">
              ID {inventory.id} · Created {formatDateTime(inventory.createdAt)}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <ReserveDialog inventory={inventory} onChanged={handleRefresh} />
              <StockActions
                inventory={inventory}
                onChanged={handleRefresh}
                allowTransfer
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gold-soft/70 bg-cream p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg text-ink">Movement ledger</h2>
              <p className="mt-1 text-sm text-muted">
                Every stock change and reservation transition is an immutable
                ledger movement.
              </p>
            </div>
          </div>

          {movements.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No movements recorded yet.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-sand/70 text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-medium">Type</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Qty</th>
                    <th scope="col" className="px-4 py-3 font-medium">Movement</th>
                    <th scope="col" className="px-4 py-3 font-medium">Reason</th>
                    <th scope="col" className="px-4 py-3 font-medium">Reference</th>
                    <th scope="col" className="px-4 py-3 font-medium">By</th>
                    <th scope="col" className="px-4 py-3 font-medium">At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-soft/40">
                  {movements.map((movement) => (
                    <tr key={movement.id} className="hover:bg-gold-soft/20">
                      <td className="px-4 py-3">
                        <MovementBadge type={movement.type} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                        {movement.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <MovementDirection movement={movement} />
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {movement.reason || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {movement.referenceType
                          ? `${movement.referenceType} · ${shortId(movement.referenceId)}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {shortId(movement.performedBy)}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {formatDateTime(movement.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4">
            <Pagination pagination={pagination} onPageChange={handleMovementPage} />
          </div>
        </section>
      </motion.div>
  );
}
