"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { createReservation } from "@/lib/api/reservations";
import { getInventoryByVariant } from "@/lib/api/inventory";
import {
  getProduct,
  getProductAvailability,
  getProducts,
} from "@/lib/api/products";
import { safeMessage } from "@/lib/api/http";
import { ConfirmDialog } from "../../../components/confirm-dialog";

const PRODUCTS_LIMIT = 100;
const REFERENCE_TYPES = [
  { value: "ORDER", label: "Order" },
  { value: "CUSTOMER", label: "Customer" },
  { value: "RETURN", label: "Return" },
  { value: "STOCK_TRANSFER", label: "Stock transfer" },
  { value: "OTHER", label: "Other / custom" },
];
const REFERENCE_ID_LABELS = {
  ORDER: "Order ID",
  CUSTOMER: "Customer ID",
  RETURN: "Return ID",
  STOCK_TRANSFER: "Transfer ID",
  OTHER: "Reference ID",
};

const inputClass =
  "mt-2 w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60";

function variantLabel(variant) {
  const attributes = Object.entries(variant.attributes || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");
  if (variant.sku) {
    return attributes ? `${variant.sku} · ${attributes}` : variant.sku;
  }
  return attributes || "Variant";
}

function quantityError(value, max) {
  if (value === "") {
    return null;
  }
  const n = Number(value);
  if (!Number.isInteger(n)) {
    return "Enter a whole number.";
  }
  if (n < 1) {
    return "Enter a quantity of at least 1.";
  }
  if (max !== null && max !== undefined && n > max) {
    return `Only ${max} units are available to reserve online.`;
  }
  return null;
}

/**
 * Create-reservation dialog for the Reservations page. Walks product →
 * variant (only when the product has variants), then quantity (capped at the
 * subject's available online stock), reference type/id, and an optional future
 * expiry.
 *
 * A product with NO active variants is a Simple Product: the reservation is
 * product-scoped (`productVariantId: null`) and the dialog reads its
 * product-level availability. A product WITH variants still requires an
 * explicit variant selection — the dialog never picks one on the admin's
 * behalf.
 *
 * referenceType/referenceId are the backend's generic link to the business
 * object holding the reservation — the system's own reference types
 * (ORDER, RETURN, STOCK_TRANSFER) are offered as presets, with a free-text
 * "Other / custom" option. The backend still enforces availability,
 * ACTIVE-variant and duplicate-reference rules.
 */
export const CreateReservationDialog = forwardRef(function CreateReservationDialog(
  { onCreated },
  ref
) {
  const [open, setOpen] = useState(false);
  const [productsStatus, setProductsStatus] = useState("idle");
  const [productsError, setProductsError] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productId, setProductId] = useState("");
  const productIdRef = useRef("");
  const variantIdRef = useRef("");
  const [variantsStatus, setVariantsStatus] = useState("idle");
  const [variantsError, setVariantsError] = useState(null);
  const [variants, setVariants] = useState([]);
  const [variantId, setVariantId] = useState("");
  const [inventoryStatus, setInventoryStatus] = useState("idle");
  const [record, setRecord] = useState(null);
  const [quantity, setQuantity] = useState("");
  const [referenceType, setReferenceType] = useState("ORDER");
  const [customReferenceType, setCustomReferenceType] = useState("");
  const [referenceId, setReferenceId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [expiryInvalid, setExpiryInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useImperativeHandle(ref, () => ({
    open() {
      openDialog();
    },
  }));

  function loadProducts() {
    setProductsStatus("loading");
    setProductsError(null);
    getProducts({ page: 1, limit: PRODUCTS_LIMIT }).then((result) => {
      if (!result.ok) {
        setProductsStatus("error");
        setProductsError(safeMessage(result.status, result.payload));
        setProducts([]);
        setProductsTotal(0);
        return;
      }
      const data = result.payload?.data ?? null;
      setProducts(Array.isArray(data?.products) ? data.products : []);
      setProductsTotal(data?.pagination?.total ?? 0);
      setProductsStatus("ready");
    });
  }

  function openDialog() {
    setProductsStatus("idle");
    setProductsError(null);
    setProducts([]);
    setProductsTotal(0);
    setProductId("");
    productIdRef.current = "";
    setVariantsStatus("idle");
    setVariantsError(null);
    setVariants([]);
    setVariantId("");
    variantIdRef.current = "";
    setInventoryStatus("idle");
    setRecord(null);
    setQuantity("");
    setReferenceType("ORDER");
    setCustomReferenceType("");
    setReferenceId("");
    setExpiresAt("");
    setExpiryInvalid(false);
    setError(null);
    setOpen(true);
    loadProducts();
  }

  function loadProductAvailability(productId) {
    const requestedProductId = productId;
    setInventoryStatus("loading");
    setRecord(null);
    getProductAvailability(requestedProductId).then((result) => {
      if (productIdRef.current !== requestedProductId) {
        return;
      }
      if (!result.ok) {
        setInventoryStatus("error");
        setRecord(null);
        return;
      }
      const availability = result.payload?.data?.product ?? null;
      setRecord(
        availability
          ? {
              availableOnlineQuantity: availability.availableQuantity,
              isOutOfStock: availability.isOutOfStock,
            }
          : null
      );
      setInventoryStatus("ready");
    });
  }

  function handleProductChange(value) {
    productIdRef.current = value;
    setProductId(value);
    setVariantId("");
    variantIdRef.current = "";
    setVariants([]);
    setVariantsError(null);
    setInventoryStatus("idle");
    setRecord(null);
    setQuantity("");
    if (value === "") {
      setVariantsStatus("idle");
      return;
    }
    setVariantsStatus("loading");
    getProduct(value).then((result) => {
      if (productIdRef.current !== value) {
        return;
      }
      if (!result.ok) {
        setVariantsStatus("error");
        setVariantsError(safeMessage(result.status, result.payload));
        setVariants([]);
        return;
      }
      const product = result.payload?.data?.product ?? null;
      const productVariants = Array.isArray(product?.variants)
        ? product.variants
        : [];
      setVariants(productVariants);
      setVariantsStatus("ready");
      if (productVariants.length === 0) {
        loadProductAvailability(value);
      }
    });
  }

  function handleVariantChange(value) {
    variantIdRef.current = value;
    setVariantId(value);
    setInventoryStatus("idle");
    setRecord(null);
    setQuantity("");
    if (value === "") {
      return;
    }
    setInventoryStatus("loading");
    getInventoryByVariant(value).then((result) => {
      if (variantIdRef.current !== value) {
        return;
      }
      if (!result.ok) {
        setInventoryStatus("error");
        setRecord(null);
        return;
      }
      setRecord(result.payload?.data?.inventory ?? null);
      setInventoryStatus("ready");
    });
  }

  function handleExpiryChange(value) {
    setExpiresAt(value);
    setExpiryInvalid(value !== "" && new Date(value).getTime() <= Date.now());
  }
  const hasVariants =
    productId !== "" && variantsStatus === "ready" && variants.length > 0;
  const noVariants =
    productId !== "" && variantsStatus === "ready" && variants.length === 0;

  const productNameLabel =
    products.find((product) => product.id === productId)?.name || "Product";
  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const subjectLabel = selectedVariant
    ? `${productNameLabel} · ${variantLabel(selectedVariant)}`
    : productNameLabel;

  const isSimpleProduct = noVariants;
  const available =
    record && (variantId !== "" || isSimpleProduct)
      ? Number(record.availableOnlineQuantity ?? 0)
      : null;

  const customReference = referenceType === "OTHER";
  const resolvedReferenceType = customReference
    ? customReferenceType.trim()
    : referenceType;

  const invalidProduct = productId.trim().length === 0;
  const invalidVariant = hasVariants && variantId.trim().length === 0;
  const invalidCustomType = customReference && resolvedReferenceType.length === 0;
  const invalidReferenceId = referenceId.trim().length === 0;
  const qtyError = quantityError(quantity, available);

  const expiryValue = expiresAt ? new Date(expiresAt) : null;
  const expiryPast = expiryValue ? expiryValue.getTime() <= Date.now() : false;

  async function run() {
    if (
      invalidProduct ||
      invalidVariant ||
      invalidCustomType ||
      invalidReferenceId ||
      qtyError ||
      expiryPast
    ) {
      setError(
        expiryPast
          ? "Expiry must be a date in the future."
          : "Fix the highlighted fields before creating the reservation."
      );
      return;
    }
    if (variantsStatus === "loading") {
      setError("The product's variants are still loading.");
      return;
    }
    if (variantsStatus === "error") {
      setError("Could not load the product's variants. Select the product again.");
      return;
    }
    if (isSimpleProduct && inventoryStatus === "loading") {
      setError("The product's stock is still loading.");
      return;
    }
    if (isSimpleProduct && inventoryStatus === "error") {
      setError("Could not load the product's stock. Select the product again.");
      return;
    }
    setLoading(true);
    setError(null);
    const body = {
      productId: productId.trim(),
      productVariantId: variantId.trim() || null,
      quantity: Number(quantity),
      referenceType: resolvedReferenceType,
      referenceId: referenceId.trim(),
    };
    if (expiryValue) {
      body.expiresAt = expiryValue.toISOString();
    }
    const result = await createReservation(body);
    setLoading(false);
    if (result.ok) {
      setOpen(false);
      onCreated();
    } else {
      setError(safeMessage(result.status, result.payload));
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => openDialog()}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-mocha px-4 text-sm font-medium text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
        Create reservation
      </button>

      {open ? (
        <ConfirmDialog
          title="Create reservation"
          description="Hold part of a product's or variant's ONLINE availability for a reference (order, customer, return or transfer). Choose a variant when the product has one; the backend enforces the quantity and reference rules."
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
            <label className="block">
              <span className="text-sm font-medium text-mocha-deep">
                Product
              </span>
              <select
                value={productId}
                onChange={(event) => handleProductChange(event.target.value)}
                disabled={loading || productsStatus !== "ready"}
                className={inputClass}
              >
                <option value="">Select a product…</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              {invalidProduct ? (
                <span className="mt-1.5 block text-sm text-[#c9604d]">
                  Product is required.
                </span>
              ) : null}
              {productsStatus === "error" ? (
                <span className="mt-1.5 block text-sm text-[#c9604d]">
                  {productsError}
                </span>
              ) : null}
              {productsStatus === "loading" ? (
                <span className="mt-1.5 block text-xs text-muted">
                  Loading products…
                </span>
              ) : null}
              {productsStatus === "ready" ? (
                <span className="mt-1.5 block text-xs text-muted">
                  {products.length === 0
                    ? "No active products available."
                    : `Showing the ${products.length} newest active product${
                        products.length === 1 ? "" : "s"
                      }${
                        productsTotal > products.length
                          ? ` of ${productsTotal}`
                          : ""
                      }.`}
                </span>
              ) : null}
            </label>

            {variantsStatus === "loading" ? (
              <p className="text-sm text-muted">Loading product variants…</p>
            ) : null}

            {variantsStatus === "error" ? (
              <p role="alert" className="text-sm text-[#c9604d]">
                {variantsError}
              </p>
            ) : null}

            {hasVariants ? (
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  Variant
                </span>
                <select
                  value={variantId}
                  onChange={(event) => handleVariantChange(event.target.value)}
                  disabled={loading}
                  className={inputClass}
                >
                  <option value="">Select a variant…</option>
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variantLabel(variant)}
                    </option>
                  ))}
                </select>
                {invalidVariant ? (
                  <span className="mt-1.5 block text-sm text-[#c9604d]">
                    Variant is required.
                  </span>
                ) : null}
                {variantId !== "" ? (
                  <span className="mt-1.5 block text-xs text-muted">
                    {subjectLabel}
                  </span>
                ) : null}
              </label>
            ) : null}

            {noVariants ? (
              <p className="rounded-lg border border-gold-soft/70 bg-sand/50 px-3 py-2 text-sm text-mocha-deep">
                This product has no variants, so the reservation holds
                product-level online stock.
              </p>
            ) : null}

            {(variantId !== "" || isSimpleProduct) &&
            inventoryStatus === "loading" ? (
              <p className="text-sm text-muted">Loading current stock…</p>
            ) : null}

            {(variantId !== "" || isSimpleProduct) && inventoryStatus === "error" ? (
              <p role="alert" className="text-sm text-[#c9604d]">
                Could not load current stock. Select the product again.
              </p>
            ) : null}

            {variantId !== "" || isSimpleProduct ? (
              available !== null ? (
                <p className="rounded-lg border border-gold-soft/70 bg-sand/50 px-3 py-2 text-sm text-mocha-deep">
                  {subjectLabel} — <strong>{available}</strong> available
                  online
                </p>
              ) : (
                <p className="rounded-lg border border-gold-soft/70 bg-sand/50 px-3 py-2 text-sm text-mocha-deep">
                  No stock record found for this {isSimpleProduct ? "product" : "variant"}.
                  Reserving may still fail — the backend enforces the available
                  quantity.
                </p>
              )
            ) : null}

            <label className="block">
              <span className="text-sm font-medium text-mocha-deep">
                Quantity to reserve
              </span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max={available ?? undefined}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                disabled={loading}
                placeholder="0"
                className={inputClass}
              />
              {qtyError ? (
                <span className="mt-1.5 block text-sm text-[#c9604d]">
                  {qtyError}
                </span>
              ) : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  Reference type
                </span>
                <select
                  value={referenceType}
                  onChange={(event) => setReferenceType(event.target.value)}
                  disabled={loading}
                  className={inputClass}
                >
                  {REFERENCE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  {customReference ? "Custom reference type" : REFERENCE_ID_LABELS[referenceType]}
                </span>
                <input
                  type="text"
                  value={customReference ? customReferenceType : referenceId}
                  onChange={(event) =>
                    customReference
                      ? setCustomReferenceType(event.target.value)
                      : setReferenceId(event.target.value)
                  }
                  disabled={loading}
                  maxLength={customReference ? 50 : 100}
                  placeholder={customReference ? "e.g. HOLD-001" : "Reference value"}
                  className={inputClass}
                />
                {customReference && invalidCustomType ? (
                  <span className="mt-1.5 block text-sm text-[#c9604d]">
                    Reference type is required.
                  </span>
                ) : null}
                {!customReference && invalidReferenceId ? (
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
});
