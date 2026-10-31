"use client";

import { useState } from "react";
import {
  addStock,
  adjustStock,
  removeStock,
  transferStock,
} from "@/lib/api/inventory";
import { safeMessage } from "@/lib/api/http";
import { ConfirmDialog } from "../../components/confirm-dialog";

const MODE_META = {
  "stock-in": {
    title: "Add stock",
    description: "Increase stock at a location. Records a STOCK_IN ledger movement.",
    confirmLabel: "Add stock",
    className: "bg-mocha text-white hover:bg-mocha-deep focus-visible:ring-gold",
    prompt: "Quantity to add (positive integer)",
  },
  "stock-out": {
    title: "Remove stock",
    description:
      "Decrease stock at a location. The backend rejects removals that would dip below reserved or available stock.",
    confirmLabel: "Remove stock",
    className: "bg-mocha text-white hover:bg-mocha-deep focus-visible:ring-gold",
    prompt: "Quantity to remove (positive integer)",
  },
  adjust: {
    title: "Adjust stock",
    description:
      "Correct a location with a signed delta — positive increases, negative decreases. Records an ADJUSTMENT movement.",
    confirmLabel: "Adjust stock",
    className: "bg-gold text-white hover:bg-gold/90 focus-visible:ring-gold",
    prompt: "Signed adjustment (e.g. 5 or -3)",
  },
  transfer: {
    title: "Transfer stock",
    description:
      "Move stock between the ONLINE and OFFLINE locations. Records a TRANSFER movement; the backend rejects a move into the same location.",
    confirmLabel: "Transfer stock",
    className: "bg-mocha text-white hover:bg-mocha-deep focus-visible:ring-gold",
    prompt: "Quantity to transfer (positive integer)",
  },
};

const SMALL_BUTTON =
  "inline-flex h-8 items-center justify-center rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50";

function quantityError(mode, quantity) {
  if (quantity === "" || quantity === null || quantity === undefined) {
    return "Enter a quantity.";
  }
  const value = Number(quantity);
  if (!Number.isInteger(value)) {
    return "Quantity must be a whole number.";
  }
  if (mode === "adjust") {
    if (value === 0) {
      return "Adjustment cannot be zero.";
    }
    return null;
  }
  if (value < 1) {
    return "Quantity must be at least 1.";
  }
  return null;
}

function CurrentStock({ inventory, subjectName }) {
  if (!inventory) {
    return null;
  }
  return (
    <div className="rounded-xl border border-gold-soft/70 bg-sand/50 p-4">
      {subjectName ? (
        <p className="truncate text-sm font-semibold text-ink">{subjectName}</p>
      ) : null}
      <dl className={`grid grid-cols-2 gap-x-6 gap-y-2 ${subjectName ? "mt-3" : ""}`}>
        <dt className="text-xs text-muted">Online</dt>
        <dd className="text-right text-sm font-medium tabular-nums text-ink">
          {inventory.onlineQuantity}
        </dd>
        <dt className="text-xs text-muted">Reserved</dt>
        <dd className="text-right text-sm font-medium tabular-nums text-ink">
          {inventory.reservedQuantity}
        </dd>
        <dt className="text-xs text-muted">Available online</dt>
        <dd className="text-right text-sm font-medium tabular-nums text-ink">
          {inventory.availableOnlineQuantity}
        </dd>
        <dt className="text-xs text-muted">Offline</dt>
        <dd className="text-right text-sm font-medium tabular-nums text-ink">
          {inventory.offlineQuantity}
        </dd>
      </dl>
    </div>
  );
}

/**
 * Stock action buttons (Stock in / Stock out / Adjust, plus Transfer when
 * `allowTransfer`) with the matching ConfirmDialog. Each command targets the
 * row's existing Inventory record via its subject — a ProductVariant or a
 * Simple Product (`productVariantId: null`). The body always carries both
 * `productId` and `productVariantId`; the backend derives `performedBy` from
 * the session, so the dialog only collects `location`, `quantity` and an
 * optional `reason`. Transfer collects `fromLocation` / `toLocation` instead
 * and calls `POST /inventory/transfer`. On success the caller refreshes its
 * data.
 */
export function StockActions({ inventory, onChanged, className, allowTransfer = false, subjectName }) {
  const [dialog, setDialog] = useState(null);
  const [location, setLocation] = useState("ONLINE");
  const [fromLocation, setFromLocation] = useState("ONLINE");
  const [toLocation, setToLocation] = useState("OFFLINE");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mode = dialog;
  const meta = MODE_META[mode] ?? null;
  const sameLocation = mode === "transfer" && fromLocation === toLocation;
  const invalid = meta
    ? sameLocation
      ? "Choose two different locations to move between."
      : quantityError(mode, quantity)
    : null;

  const calls = {
    "stock-in": addStock,
    "stock-out": removeStock,
    adjust: adjustStock,
    transfer: transferStock,
  };

  function open(nextMode) {
    setLocation("ONLINE");
    setFromLocation("ONLINE");
    setToLocation("OFFLINE");
    setQuantity("");
    setError(null);
    setDialog(nextMode);
  }

  async function run(reason) {
    if (mode === "transfer" && fromLocation === toLocation) {
      setError("Choose two different locations to move between.");
      return;
    }
    setLoading(true);
    setError(null);
    const body =
      mode === "transfer"
        ? {
            productId: inventory.productId,
            productVariantId: inventory.productVariantId,
            fromLocation,
            toLocation,
            quantity: Number(quantity),
            reason: reason ?? null,
          }
        : {
            productId: inventory.productId,
            productVariantId: inventory.productVariantId,
            location,
            quantity: Number(quantity),
            reason: reason ?? null,
          };
    const result = await calls[mode](body);
    setLoading(false);
    if (result.ok) {
      setDialog(null);
      onChanged();
    } else {
      setError(safeMessage(result.status, result.payload));
    }
  }

  return (
    <>
      <div className={`flex flex-wrap items-center justify-end gap-2 ${className ?? ""}`}>
        <button
          type="button"
          onClick={() => open("stock-in")}
          className={`${SMALL_BUTTON} border-gold-soft bg-white text-mocha-deep hover:bg-gold-soft/30`}
        >
          Stock in
        </button>
        <button
          type="button"
          onClick={() => open("stock-out")}
          className={`${SMALL_BUTTON} border-gold-soft bg-white text-mocha-deep hover:bg-gold-soft/30`}
        >
          Stock out
        </button>
        <button
          type="button"
          onClick={() => open("adjust")}
          className={`${SMALL_BUTTON} border-gold-soft bg-white text-mocha-deep hover:bg-gold-soft/30`}
        >
          Adjust
        </button>
        {allowTransfer ? (
          <button
            type="button"
            onClick={() => open("transfer")}
            className={`${SMALL_BUTTON} border-gold-soft bg-white text-mocha-deep hover:bg-gold-soft/30`}
          >
            Transfer stock
          </button>
        ) : null}
      </div>

      {dialog ? (
        <ConfirmDialog
          key={dialog}
          title={meta.title}
          description={meta.description}
          noteLabel="Reason (optional)"
          confirmLabel={meta.confirmLabel}
          confirmClassName={meta.className}
          loading={loading}
          error={error}
          onConfirm={(note) => run(note)}
          onClose={() => {
            if (!loading) {
              setDialog(null);
              setError(null);
            }
          }}
        >
          <div className="space-y-4">
            <CurrentStock inventory={inventory} subjectName={subjectName} />
            {mode === "transfer" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-mocha-deep">
                    Move from
                  </span>
                  <select
                    value={fromLocation}
                    onChange={(event) => setFromLocation(event.target.value)}
                    disabled={loading}
                    className="mt-2 w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
                  >
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-mocha-deep">
                    Move to
                  </span>
                  <select
                    value={toLocation}
                    onChange={(event) => setToLocation(event.target.value)}
                    disabled={loading}
                    className="mt-2 w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
                  >
                    <option value="ONLINE">Online</option>
                    <option value="OFFLINE">Offline</option>
                  </select>
                </label>
              </div>
            ) : (
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">Location</span>
                <select
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  disabled={loading}
                  className="mt-2 w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
                >
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                </select>
              </label>
            )}
            <label className="block">
              <span className="text-sm font-medium text-mocha-deep">
                {meta.prompt}
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={loading}
                className="mt-2 w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60"
              />
              {invalid ? (
                <span className="mt-1.5 block text-sm text-[#c9604d]">
                  {invalid}
                </span>
              ) : null}
            </label>
          </div>
        </ConfirmDialog>
      ) : null}
    </>
  );
}
