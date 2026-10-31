"use client";

import { Plus, Trash2, X } from "lucide-react";
import { formatMinorUnits } from "@/lib/utils";

const inputClass =
  "mt-1 w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60";
const inputErrorClass = "border-[#c9604d]/70 focus-visible:ring-[#c9604d]/40";

const removeButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-[#c9604d] transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const addButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gold-soft/80 bg-white px-3 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

/** Inline, per-field validation message rendered under a form control. */
function FieldError({ message }) {
  if (!message) {
    return null;
  }
  return (
    <span role="alert" className="mt-1.5 block text-xs font-medium text-[#c9604d]">
      {message}
    </span>
  );
}

export function emptyAttribute() {
  return { id: crypto.randomUUID(), key: "", value: "" };
}

export function newVariant() {
  return {
    id: crypto.randomUUID(),
    existingId: null,
    attributes: [emptyAttribute()],
    sellingPriceOverride: "",
    purchasePriceOverride: "",
    isActive: true,
    currentSellingPrice: null,
  };
}

/**
 * Human-readable label for a variant row, e.g. "Black" for a colour variant.
 * Used in confirmations and inline error messages instead of the (now
 * auto-generated) SKU.
 */
export function variantLabel(variant) {
  const parts = (variant?.attributes || [])
    .map((attribute) => String(attribute.value ?? "").trim())
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : "Variant";
}

/**
 * One variant row inside the product form. Mirrors the backend variant
 * contract (variants/productVariant.service.js): attributes (key/value
 * strings), optional selling/purchase price overrides, and an active flag.
 * SKUs are generated automatically by the backend on creation and are
 * immutable afterwards — the admin never sees or edits them here.
 *
 * `errors` carries the parent's per-field validation messages for this row:
 * `{ attributes, sellingPriceOverride, purchasePriceOverride }`.
 */
export function VariantEditor({
  variant,
  index,
  showPurchasePrice,
  onChange,
  onRemove,
  disabled,
  errors = {},
}) {
  function update(patch) {
    onChange(variant.id, patch);
  }

  function updateAttribute(attributeId, patch) {
    update({
      attributes: variant.attributes.map((attribute) =>
        attribute.id === attributeId ? { ...attribute, ...patch } : attribute
      ),
    });
  }

  function addAttribute() {
    update({ attributes: [...variant.attributes, emptyAttribute()] });
  }

  function removeAttribute(attributeId) {
    update({
      attributes: variant.attributes.filter((attribute) => attribute.id !== attributeId),
    });
  }

  return (
    <fieldset className="rounded-2xl border border-gold-soft/70 bg-cream p-4">
      <div className="flex items-start justify-between gap-3">
        <legend className="font-display text-base text-ink">Variant {index + 1}</legend>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className={removeButtonClass}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Remove
        </button>
      </div>

      <div className="mt-4">
        <label className="flex items-center gap-2.5 text-sm font-medium text-mocha-deep">
          <input
            type="checkbox"
            checked={variant.isActive}
            onChange={(event) => update({ isActive: event.target.checked })}
            disabled={disabled}
            className="h-4 w-4 accent-mocha"
          />
          <span>Active — available for sale</span>
        </label>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-mocha-deep">Options</p>
        <p className="mt-0.5 text-xs text-muted">
          e.g. colour, capacity. Each option needs a key and a value.
        </p>
        <div className="mt-2 space-y-2">
          {variant.attributes.map((attribute, attributeIndex) => (
            <div key={attribute.id} className="flex items-start gap-2">
              <label className="block flex-1">
                <span className="sr-only">Option name</span>
                <input
                  type="text"
                  value={attribute.key}
                  onChange={(event) =>
                    updateAttribute(attribute.id, { key: event.target.value })
                  }
                  disabled={disabled}
                  maxLength={40}
                  placeholder={`Option ${attributeIndex + 1} (e.g. colour)`}
                  className={inputClass}
                />
              </label>
              <label className="block flex-1">
                <span className="sr-only">Option value</span>
                <input
                  type="text"
                  value={attribute.value}
                  onChange={(event) =>
                    updateAttribute(attribute.id, { value: event.target.value })
                  }
                  disabled={disabled}
                  maxLength={60}
                  placeholder="Value (e.g. 52)"
                  className={inputClass}
                />
              </label>
              <button
                type="button"
                onClick={() => removeAttribute(attribute.id)}
                disabled={disabled || variant.attributes.length <= 1}
                aria-label="Remove option"
                className={`${removeButtonClass} px-2.5 disabled:opacity-30`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <FieldError message={errors.attributes} />
        <button type="button" onClick={addAttribute} disabled={disabled} className={`${addButtonClass} mt-2`}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add option
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-mocha-deep">
            Price override (optional, BDT)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={variant.sellingPriceOverride}
            onChange={(event) => update({ sellingPriceOverride: event.target.value })}
            disabled={disabled}
            placeholder="Leave blank to use the product price"
            className={`${inputClass} ${errors.sellingPriceOverride ? inputErrorClass : ""}`}
          />
          <FieldError message={errors.sellingPriceOverride} />
          {variant.currentSellingPrice != null ? (
            <span className="mt-1.5 block text-xs text-muted">
              Current effective price: {formatMinorUnits(variant.currentSellingPrice)}
            </span>
          ) : null}
        </label>

        {showPurchasePrice ? (
          <label className="block">
            <span className="text-sm font-medium text-mocha-deep">
              Cost price override (optional, BDT)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={variant.purchasePriceOverride}
              onChange={(event) => update({ purchasePriceOverride: event.target.value })}
              disabled={disabled}
              placeholder="Admin cost for this variant"
              className={`${inputClass} ${errors.purchasePriceOverride ? inputErrorClass : ""}`}
            />
            <FieldError message={errors.purchasePriceOverride} />
          </label>
        ) : null}
      </div>
    </fieldset>
  );
}
