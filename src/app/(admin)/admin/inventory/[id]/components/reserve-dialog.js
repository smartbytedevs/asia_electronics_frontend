"use client";

import { useState } from "react";
import { createReservation } from "@/lib/api/reservations";
import { safeMessage } from "@/lib/api/http";
import { formatDateTime } from "@/lib/utils";
import { ConfirmDialog } from "../../../components/confirm-dialog";

function shortId(id) {
  return typeof id === "string" ? id.slice(0, 8) : "—";
}

/**
 * Create-reservation dialog for the inventory detail page. The variant is
 * pre-filled (the page's record); the admin supplies quantity, reference
 * type/id (the backend requires both) and an optional future expiry. A
 * successful reservation writes a RESERVATION movement, so the caller
 * refreshes inventory + ledger on success.
 */
export function ReserveDialog({ inventory, onChanged }) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [referenceType, setReferenceType] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [expiryInvalid, setExpiryInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function openDialog() {
    setQuantity("");
    setReferenceType("");
    setReferenceId("");
    setExpiresAt("");
    setExpiryInvalid(false);
    setError(null);
    setOpen(true);
  }

  function handleExpiryChange(value) {
    setExpiresAt(value);
    setExpiryInvalid(value !== "" && new Date(value).getTime() <= Date.now());
  }

  const quantityValue = quantity === "" ? null : Number(quantity);
  const invalidQuantity =
    quantityValue === null ||
    !Number.isInteger(quantityValue) ||
    quantityValue < 1;
  const invalidType = referenceType.trim().length === 0;
  const invalidId = referenceId.trim().length === 0;
  const invalid = invalidQuantity || invalidType || invalidId;

  async function run() {
    const expiryValue = expiresAt ? new Date(expiresAt) : null;
    const expiryPast = expiryValue
      ? expiryValue.getTime() <= Date.now()
      : false;
    if (invalid || expiryPast) {
      setError(
        expiryPast
          ? "Expiry must be a date in the future."
          : "Fix the highlighted fields before creating the reservation."
      );
      return;
    }
    setLoading(true);
    setError(null);
    const body = {
      productVariantId: inventory.productVariantId,
      quantity: quantityValue,
      referenceType: referenceType.trim(),
      referenceId: referenceId.trim(),
    };
    if (expiryValue) {
      body.expiresAt = expiryValue.toISOString();
    }
    const result = await createReservation(body);
    setLoading(false);
    if (result.ok) {
      setOpen(false);
      onChanged();
    } else {
      setError(safeMessage(result.status, result.payload));
    }
  }

  const inputClass =
    "mt-2 w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60";

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex h-9 items-center justify-center rounded-lg border border-gold-soft bg-white px-3.5 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1"
      >
        Create reservation
      </button>

      {open ? (
        <ConfirmDialog
          title="Create reservation"
          description="Hold part of the variant's ONLINE availability for a reference. The backend requires referenceType and referenceId."
          confirmLabel="Create reservation"
          confirmClassName="bg-mocha text-white hover:bg-mocha-deep focus-visible:ring-gold"
          loading={loading}
          error={error}
          onConfirm={() => run()}
          onClose={() => {
            if (!loading) {
              setOpen(false);
              setError(null);
            }
          }}
        >
          <div className="space-y-4">
            <dl className="rounded-xl border border-gold-soft/70 bg-sand/50 p-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                <dt className="text-xs text-muted">Variant</dt>
                <dd className="text-right text-sm font-medium tabular-nums text-ink">
                  {shortId(inventory.productVariantId)}
                </dd>
                <dt className="text-xs text-muted">Available online</dt>
                <dd className="text-right text-sm font-medium tabular-nums text-ink">
                  {inventory.availableOnlineQuantity}
                </dd>
                {inventory.updatedAt ? (
                  <>
                    <dt className="text-xs text-muted">Updated</dt>
                    <dd className="text-right text-sm font-medium text-ink">
                      {formatDateTime(inventory.updatedAt)}
                    </dd>
                  </>
                ) : null}
              </div>
            </dl>

            <label className="block">
              <span className="text-sm font-medium text-mocha-deep">
                Quantity to reserve (positive integer)
              </span>
              <input
                type="number"
                inputMode="numeric"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={loading}
                className={inputClass}
              />
              {invalidQuantity ? (
                <span className="mt-1.5 block text-sm text-[#c9604d]">
                  Quantity must be a positive integer.
                </span>
              ) : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  Reference type
                </span>
                <input
                  type="text"
                  value={referenceType}
                  onChange={(event) => setReferenceType(event.target.value)}
                  disabled={loading}
                  maxLength={50}
                  placeholder="e.g. ORDER"
                  className={inputClass}
                />
                {invalidType ? (
                  <span className="mt-1.5 block text-sm text-[#c9604d]">
                    Reference type is required.
                  </span>
                ) : null}
              </label>
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  Reference ID
                </span>
                <input
                  type="text"
                  value={referenceId}
                  onChange={(event) => setReferenceId(event.target.value)}
                  disabled={loading}
                  maxLength={100}
                  placeholder="Stable reference value"
                  className={inputClass}
                />
                {invalidId ? (
                  <span className="mt-1.5 block text-sm text-[#c9604d]">
                    Reference ID is required.
                  </span>
                ) : null}
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-mocha-deep">
                Expires at (optional)
              </span>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => handleExpiryChange(event.target.value)}
                disabled={loading}
                className={inputClass}
              />
              {expiryInvalid ? (
                <span className="mt-1.5 block text-sm text-[#c9604d]">
                  Expiry must be in the future.
                </span>
              ) : null}
            </label>
          </div>
        </ConfirmDialog>
      ) : null}
    </>
  );
}
