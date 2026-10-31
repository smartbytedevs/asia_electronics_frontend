"use client";

import Link from "next/link";
import { formatDateTime } from "@/lib/utils";
import { inventoryStatusMeta } from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";
import { StockActions } from "./stock-actions";

/** Outlet shown by name only — raw outlet IDs are never rendered. */
function outletLabel(inventory, outletNames) {
  if (!inventory.isInitialized) {
    return "—";
  }
  if (!inventory.outletId) {
    return "Central";
  }
  return outletNames[inventory.outletId] || "Unlisted outlet";
}

function cardTone(inventory) {
  if (inventory.isInitialized === false) {
    return { card: "border-gold-soft/70 bg-cream", notice: null };
  }
  if (inventory.isOutOfStock) {
    return {
      card: "border-red-200 bg-red-50/30",
      notice: {
        text: "No available online stock left to sell.",
        className: "text-[#c9604d]",
      },
    };
  }
  if (inventory.isLowStock) {
    return {
      card: "border-amber-200 bg-amber-50/20",
      notice: {
        text: "Available stock is at or below the low-stock threshold.",
        className: "text-amber-700",
      },
    };
  }
  return { card: "border-gold-soft/70 bg-cream", notice: null };
}

function availableTone(inventory) {
  if (inventory.isInitialized === false) {
    return "text-muted";
  }
  if (inventory.isOutOfStock) {
    return "text-[#c9604d]";
  }
  if (inventory.isLowStock) {
    return "text-amber-700";
  }
  return "text-ink";
}

function Stat({ label, value, tone = "text-ink" }) {
  return (
    <div className="rounded-lg border border-gold-soft/40 bg-white/60 px-3 py-2">
      <p className="text-[0.68rem] font-medium uppercase tracking-wide text-muted">
        {label}
      </p>
      <p className={`mt-0.5 text-sm font-semibold tabular-nums ${tone}`}>
        {value}
      </p>
    </div>
  );
}

function CardActions({ inventory, onChanged, onInitialize }) {
  if (!inventory.isInitialized) {
    return (
      <button
        type="button"
        onClick={() => onInitialize(inventory)}
        className="inline-flex h-8 items-center justify-center rounded-lg border border-gold-soft bg-white px-3 text-xs font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1"
      >
        Initialize
      </button>
    );
  }
  return (
    <StockActions
      inventory={inventory}
      onChanged={onChanged}
      subjectName={
        inventory.variantSku
          ? `${inventory.productNameLabel} · ${inventory.variantSku}`
          : inventory.productNameLabel
      }
      className="justify-start"
    />
  );
}

/**
 * Mobile inventory card — mirrors the desktop table for small screens. Items
 * are shown by product name, variant SKU/options and outlet name (never raw DB
 * IDs), and low-stock / out-of-stock rows get a tinted card plus a one-line
 * notice so they stand out.
 */
export function InventoryCard({ inventory, outletNames, onChanged, onInitialize }) {
  const tone = cardTone(inventory);
  return (
    <div className={`rounded-2xl border p-4 ${tone.card}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {inventory.detailHref ? (
            <Link
              href={inventory.detailHref}
              className="block truncate font-semibold text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
            >
              {inventory.productNameLabel}
            </Link>
          ) : (
            <p className="truncate font-semibold text-ink">
              {inventory.productNameLabel}
            </p>
          )}
          <p className="mt-0.5 text-sm text-muted">
            {inventory.isInitialized === false
              ? "No stock record yet"
              : `${outletLabel(inventory, outletNames)} · Updated ${formatDateTime(inventory.updatedAt)}`}
          </p>
          {inventory.variantSku ? (
            <p className="mt-1 text-xs font-medium tabular-nums tracking-wide text-mocha-deep">
              {inventory.variantSku}
            </p>
          ) : null}
          {inventory.variantOptions.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {inventory.variantOptions.map(([key, value]) => (
                <span
                  key={key}
                  className="rounded-full border border-gold-soft/70 bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-mocha-deep"
                >
                  {key}: {value}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <StatusBadge meta={inventoryStatusMeta(inventory)} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Stat label="Online" value={inventory.onlineQuantity} />
        <Stat label="Reserved" value={inventory.reservedQuantity} />
        <Stat label="Available" value={inventory.availableOnlineQuantity} tone={availableTone(inventory)} />
        <Stat label="Offline" value={inventory.offlineQuantity} />
        <Stat label="Total" value={inventory.totalPhysicalQuantity} />
        <Stat label="Threshold" value={inventory.lowStockThreshold ?? 0} />
      </div>

      {tone.notice ? (
        <p className={`mt-3 text-xs font-medium ${tone.notice.className}`}>
          {tone.notice.text}
        </p>
      ) : null}

      <div className="mt-4 border-t border-gold-soft/40 pt-3">
        <CardActions
          inventory={inventory}
          onChanged={onChanged}
          onInitialize={onInitialize}
        />
      </div>
    </div>
  );
}
