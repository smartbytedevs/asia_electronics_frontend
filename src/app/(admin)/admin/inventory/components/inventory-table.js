"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { formatDateTime } from "@/lib/utils";
import { inventoryStatusMeta } from "../../components/status-meta";
import { StatusBadge } from "../../components/status-badge";
import { StockActions } from "./stock-actions";

const EASE = [0.22, 1, 0.36, 1];

function rowKey(inventory) {
  return inventory.id ?? `uninitialized-${inventory.productId}`;
}

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

function rowTint(inventory) {
  if (inventory.isInitialized === false) {
    return "bg-stone-50/60";
  }
  if (inventory.isOutOfStock) {
    return "bg-red-50/40";
  }
  if (inventory.isLowStock) {
    return "bg-amber-50/40";
  }
  return "";
}

function availableTone(inventory) {
  if (inventory.isInitialized === false) {
    return "text-muted";
  }
  if (inventory.isOutOfStock) {
    return "font-semibold text-[#c9604d]";
  }
  if (inventory.isLowStock) {
    return "font-semibold text-amber-700";
  }
  return "text-ink";
}

function QuantityCell({ value, tone = "text-ink" }) {
  return (
    <td className={`px-4 py-3 tabular-nums ${tone}`}>
      <span className="font-medium">{value}</span>
    </td>
  );
}

function VariantOptions({ options }) {
  if (options.length === 0) {
    return null;
  }
  return (
    <span className="flex flex-wrap gap-1">
      {options.map(([key, value]) => (
        <span
          key={key}
          className="rounded-full border border-gold-soft/70 bg-sand/60 px-2 py-0.5 text-[10px] font-medium text-mocha-deep"
        >
          {key}: {value}
        </span>
      ))}
    </span>
  );
}

function ItemCell({ item }) {
  if (!item.isInitialized) {
    return (
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">
          {item.productNameLabel}
        </p>
        <p className="text-xs text-muted">No stock record yet</p>
      </div>
    );
  }
  if (item.detailHref) {
    return (
      <div className="min-w-0">
        <Link
          href={item.detailHref}
          className="block truncate font-semibold text-mocha-deep underline-offset-2 hover:text-ink hover:underline"
        >
          {item.productNameLabel}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {item.variantSku ? (
            <span className="text-xs font-medium tabular-nums tracking-wide text-mocha-deep">
              {item.variantSku}
            </span>
          ) : null}
          <VariantOptions options={item.variantOptions} />
        </div>
      </div>
    );
  }
  return (
    <div className="min-w-0">
      <p className="truncate font-semibold text-ink">{item.productNameLabel}</p>
      <p className="text-xs text-muted">Simple product</p>
    </div>
  );
}

function ActionsCell({ inventory, onChanged, onInitialize }) {
  if (!inventory.isInitialized) {
    return (
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onInitialize(inventory)}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-gold-soft bg-white px-3 text-xs font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1"
        >
          Initialize
        </button>
      </div>
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
    />
  );
}

/**
 * Desktop inventory table. Columns map 1:1 to the inventory serializer fields
 * (online/offline/reserved/available/total/threshold) plus the derived stock
 * status and the per-row stock commands. Rows with `isInitialized: false` are
 * synthetic "Not initialized" products — they render an Initialize action
 * instead of the stock commands (there is no record to act on yet). Items are
 * shown by product name, variant SKU and options, and outlet name — never raw
 * DB IDs. Low-stock and out-of-stock rows get a subtle tint so they stand out.
 */
export function InventoryTable({ inventory, outletNames, onChanged, onInitialize, className }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-gold-soft/70 bg-cream shadow-[0_2px_18px_-16px_rgba(43,38,32,0.35)] ${className ?? ""}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="border-b border-gold-soft/40 bg-sand/60 text-[0.68rem] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th scope="col" className="px-4 py-3.5 font-semibold">Status</th>
              <th scope="col" className="px-4 py-3.5 font-semibold">Item</th>
              <th scope="col" className="px-4 py-3.5 font-semibold">Outlet</th>
              <th scope="col" className="px-4 py-3.5 text-right font-semibold">Online</th>
              <th scope="col" className="px-4 py-3.5 text-right font-semibold">Reserved</th>
              <th scope="col" className="px-4 py-3.5 text-right font-semibold">Available</th>
              <th scope="col" className="px-4 py-3.5 text-right font-semibold">Offline</th>
              <th scope="col" className="px-4 py-3.5 text-right font-semibold">Total</th>
              <th scope="col" className="px-4 py-3.5 text-right font-semibold">Threshold</th>
              <th scope="col" className="px-4 py-3.5 font-semibold">Updated</th>
              <th scope="col" className="px-4 py-3.5 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-soft/40">
            {inventory.map((item, index) => (
              <motion.tr
                key={rowKey(item)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.3,
                  ease: EASE,
                  delay: Math.min(index * 0.03, 0.3),
                }}
                className={`transition-colors hover:bg-gold-soft/20 ${rowTint(item)}`}
              >
                <td className="px-4 py-3">
                  <StatusBadge meta={inventoryStatusMeta(item)} />
                </td>
                <td className="px-4 py-3">
                  <ItemCell item={item} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {outletLabel(item, outletNames)}
                </td>
                <QuantityCell value={item.onlineQuantity} />
                <QuantityCell value={item.reservedQuantity} />
                <QuantityCell value={item.availableOnlineQuantity} tone={availableTone(item)} />
                <QuantityCell value={item.offlineQuantity} />
                <QuantityCell value={item.totalPhysicalQuantity} />
                <td className="px-4 py-3 tabular-nums text-muted">
                  {item.lowStockThreshold ?? 0}
                </td>
                <td className="px-4 py-3 text-muted">
                  {item.updatedAt ? formatDateTime(item.updatedAt) : "—"}
                </td>
                <td className="px-4 py-3">
                  <ActionsCell
                    inventory={item}
                    onChanged={onChanged}
                    onInitialize={onInitialize}
                  />
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
