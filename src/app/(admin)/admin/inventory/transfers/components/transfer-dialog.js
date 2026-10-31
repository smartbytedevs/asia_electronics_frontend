"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { getInventory, transferStock } from "@/lib/api/inventory";
import { getProduct, getProducts } from "@/lib/api/products";
import { safeMessage } from "@/lib/api/http";
import { ConfirmDialog } from "../../../components/confirm-dialog";

const PRODUCTS_LIMIT = 100;
const INVENTORY_LIMIT = 100;
const REASON_MAX = 500;

const inputClass =
  "mt-2 w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60";

const selectClass =
  "mt-2 w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60";

const LOCATION_LABELS = {
  ONLINE: "Online",
  OFFLINE: "Offline",
};

function variantLabel(variant) {
  const attributes = Object.entries(variant.attributes || {})
    .map(([key, value]) => `${key}: ${value}`)
    .join(" · ");
  if (variant.sku) {
    return attributes ? `${variant.sku} · ${attributes}` : variant.sku;
  }
  return attributes || "Variant";
}

/**
 * Returns an error string for a positive-integer quantity input capped by the
 * source's available quantity, or null when valid.
 */
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
    return `Only ${max} available to move from this location.`;
  }
  return null;
}

function StockSnapshot({ record, subjectName }) {
  if (!record) {
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
          {record.onlineQuantity}
        </dd>
        <dt className="text-xs text-muted">Reserved</dt>
        <dd className="text-right text-sm font-medium tabular-nums text-ink">
          {record.reservedQuantity}
        </dd>
        <dt className="text-xs text-muted">Available online</dt>
        <dd className="text-right text-sm font-medium tabular-nums text-ink">
          {record.availableOnlineQuantity}
        </dd>
        <dt className="text-xs text-muted">Offline</dt>
        <dd className="text-right text-sm font-medium tabular-nums text-ink">
          {record.offlineQuantity}
        </dd>
      </dl>
    </div>
  );
}

/**
 * Transfer-stock dialog for the Stock Transfers page. Uses the backend's
 * ONLINE ↔ OFFLINE location transfer (POST /inventory/transfer) — there are no
 * physical outlets in this system. The subject is picked from the active
 * catalog (a Simple Product, or one of a product's variants), the direction is
 * Online → Offline or Offline → Online, and the current available quantity for
 * the source location is shown and enforced as the maximum.
 *
 * `openWith({ productId, variantId, productName })` preselects a subject so a
 * row's Transfer button can jump straight to the right product/variant.
 */
export const TransferDialog = forwardRef(function TransferDialog(
  { onChanged },
  ref
) {
  const [open, setOpen] = useState(false);
  const preselectedRef = useRef(null);
  const [productsStatus, setProductsStatus] = useState("idle");
  const [productsError, setProductsError] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productId, setProductId] = useState("");
  const productIdRef = useRef("");
  const [variantsStatus, setVariantsStatus] = useState("idle");
  const [variantsError, setVariantsError] = useState(null);
  const [variants, setVariants] = useState([]);
  const [variantId, setVariantId] = useState("");
  const [inventoryStatus, setInventoryStatus] = useState("idle");
  const [inventoryList, setInventoryList] = useState([]);
  const [fromLocation, setFromLocation] = useState("ONLINE");
  const [toLocation, setToLocation] = useState("OFFLINE");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useImperativeHandle(ref, () => ({
    openWith(initial) {
      preselectedRef.current = initial ?? null;
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
      const initial = preselectedRef.current;
      if (initial?.productId) {
        handleProductChange(initial.productId);
      }
    });
  }

  function loadInventory() {
    setInventoryStatus("loading");
    getInventory({ page: 1, limit: INVENTORY_LIMIT }).then((result) => {
      if (!result.ok) {
        setInventoryStatus("error");
        setInventoryList([]);
        return;
      }
      const data = result.payload?.data ?? null;
      setInventoryList(Array.isArray(data?.inventory) ? data.inventory : []);
      setInventoryStatus("ready");
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
    setInventoryStatus("idle");
    setInventoryList([]);
    setFromLocation("ONLINE");
    setToLocation("OFFLINE");
    setQuantity("");
    setReason("");
    setError(null);
    setOpen(true);
    loadProducts();
    loadInventory();
  }

  function handleProductChange(value) {
    productIdRef.current = value;
    setProductId(value);
    setVariantId("");
    setVariants([]);
    setVariantsError(null);
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
      const found = Array.isArray(product?.variants) ? product.variants : [];
      setVariants(found);
      setVariantsStatus("ready");
      const initial = preselectedRef.current;
      if (
        initial?.variantId &&
        found.some((variant) => variant.id === initial.variantId)
      ) {
        setVariantId(initial.variantId);
      }
    });
  }

  const isSimpleProduct =
    productId !== "" && variantsStatus === "ready" && variants.length === 0;
  const hasVariants =
    productId !== "" && variantsStatus === "ready" && variants.length > 0;

  const inventoryByVariantId = useMemo(() => {
    const map = {};
    for (const item of inventoryList) {
      if (item?.productVariantId && item.isInitialized) {
        map[item.productVariantId] = item;
      }
    }
    return map;
  }, [inventoryList]);

  const inventoryByProductId = useMemo(() => {
    const map = {};
    for (const item of inventoryList) {
      if (item?.productId && !item.productVariantId && item.isInitialized) {
        map[item.productId] = item;
      }
    }
    return map;
  }, [inventoryList]);

  const subjectResolved =
    productId !== "" &&
    (variantsStatus === "ready") &&
    (isSimpleProduct || variantId !== "");

  const productNameLabel =
    products.find((product) => product.id === productId)?.name || "Product";

  const selectedVariant = variants.find((variant) => variant.id === variantId);
  const subjectLabel = selectedVariant
    ? `${productNameLabel} · ${variantLabel(selectedVariant)}`
    : productNameLabel;

  const record = hasVariants
    ? variantId
      ? inventoryByVariantId[variantId]
      : null
    : isSimpleProduct
      ? inventoryByProductId[productId]
      : null;

  const sourceAvailable = record
    ? fromLocation === "ONLINE"
      ? Number(record.availableOnlineQuantity ?? 0)
      : Number(record.offlineQuantity ?? 0)
    : null;

  const invalidProduct = productId.trim().length === 0;
  const invalidVariant = hasVariants && variantId.trim().length === 0;
  const qtyError = quantityError(quantity, sourceAvailable);

  const subjectBusy = loading || variantsStatus === "loading";

  function handleFromChange(value) {
    setFromLocation(value);
    if (value === toLocation) {
      setToLocation(value === "ONLINE" ? "OFFLINE" : "ONLINE");
    }
  }

  function handleToChange(value) {
    setToLocation(value);
    if (value === fromLocation) {
      setFromLocation(value === "ONLINE" ? "OFFLINE" : "ONLINE");
    }
  }

  async function run() {
    if (invalidProduct || invalidVariant || qtyError) {
      setError("Fix the highlighted fields before transferring.");
      return;
    }
    if (productId !== "" && variantsStatus === "loading") {
      setError("Product variants are still loading.");
      return;
    }
    if (productId !== "" && variantsStatus === "error") {
      setError("Could not load the product's variants. Select the product again.");
      return;
    }
    if (!record) {
      setError(
        "This subject has no stock record yet — initialize its stock first."
      );
      return;
    }
    setLoading(true);
    setError(null);
    const result = await transferStock({
      productId: productId.trim(),
      productVariantId: isSimpleProduct ? null : variantId.trim(),
      fromLocation,
      toLocation,
      quantity: Number(quantity),
      reason: reason.trim() || undefined,
    });
    setLoading(false);
    if (result.ok) {
      setOpen(false);
      onChanged();
    } else {
      setError(safeMessage(result.status, result.payload));
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          preselectedRef.current = null;
          openDialog();
        }}
        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-mocha px-4 text-sm font-medium text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
      >
        Transfer stock
      </button>

      {open ? (
        <ConfirmDialog
          title="Transfer stock"
          description="Move stock between the Online and Offline locations for a product or variant. The backend records a TRANSFER movement and rejects a move the source cannot cover."
          confirmLabel="Transfer stock"
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
                disabled={subjectBusy || productsStatus !== "ready"}
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
                      }. Only active products can be transferred.`}
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
                  onChange={(event) => setVariantId(event.target.value)}
                  disabled={subjectBusy}
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
              </label>
            ) : null}

            {isSimpleProduct ? (
              <p className="rounded-lg border border-gold-soft/70 bg-sand/50 px-3 py-2 text-sm text-mocha-deep">
                This product has no variants, so stock is transferred for the
                product itself.
              </p>
            ) : null}

            {subjectResolved ? (
              record ? (
                <StockSnapshot record={record} subjectName={subjectLabel} />
              ) : (
                <p className="rounded-lg border border-gold-soft/70 bg-sand/50 px-3 py-2 text-sm text-mocha-deep">
                  No stock record found for this subject yet — initialize its
                  stock first.
                </p>
              )
            ) : null}

            {inventoryStatus === "error" ? (
              <p className="text-xs text-muted">
                Current stock levels couldn&apos;t be loaded, but the backend
                still enforces the available quantity.
              </p>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  Move from
                </span>
                <select
                  value={fromLocation}
                  onChange={(event) => handleFromChange(event.target.value)}
                  disabled={loading}
                  className={selectClass}
                >
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                </select>
                {sourceAvailable !== null ? (
                  <span className="mt-1.5 block text-xs text-muted">
                    {LOCATION_LABELS[fromLocation]} available: {sourceAvailable}
                  </span>
                ) : null}
              </label>
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  Move to
                </span>
                <select
                  value={toLocation}
                  onChange={(event) => handleToChange(event.target.value)}
                  disabled={loading}
                  className={selectClass}
                >
                  <option value="ONLINE">Online</option>
                  <option value="OFFLINE">Offline</option>
                </select>
                <span className="mt-1.5 block text-xs text-muted">
                  {LOCATION_LABELS[toLocation]} receives the stock.
                </span>
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-mocha-deep">
                Quantity to transfer
              </span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                max={sourceAvailable ?? undefined}
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

            <label className="block">
              <span className="text-sm font-medium text-mocha-deep">
                Reason (optional)
              </span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={REASON_MAX}
                rows={2}
                disabled={loading}
                className={inputClass}
                placeholder="Why this stock is moving"
              />
            </label>
          </div>
        </ConfirmDialog>
      ) : null}
    </>
  );
});
