"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { initializeInventory } from "@/lib/api/inventory";
import { getProduct, getProducts } from "@/lib/api/products";
import { safeMessage } from "@/lib/api/http";
import { ConfirmDialog } from "../../components/confirm-dialog";

const PRODUCTS_LIMIT = 100;

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

/**
 * Returns an error string for a non-negative integer input, or null when
 * valid. Empty means "unset" and is always valid.
 */
function nonNegativeIntegerError(value) {
  if (value === "") {
    return null;
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    return "Enter a whole number, 0 or more.";
  }
  return null;
}

function fieldError(value) {
  return value === "" ? null : nonNegativeIntegerError(value);
}

/**
 * Initialize-stock dialog for the inventory list header. Sets up the first
 * Inventory record for a subject — a Simple Product (productId with
 * productVariantId: null) or one of its product variants — using only the
 * fields the backend accepts: optional outlet, online/offline opening
 * quantities and a low-stock threshold (all non-negative integers). The
 * backend rejects subjects that already have a record
 * (INVENTORY_ALREADY_EXISTS), so this is only useful for stock not set up yet.
 *
 * The catalog is the storefront list (ACTIVE products only — the backend only
 * initializes active subjects), so the newest 100 products are offered. Once a
 * product is picked its detail is read to learn whether it has variants: a
 * product with variants requires choosing one, a product without variants is
 * initialized directly (no fake variant is created).
 */
export const InitializeDialog = forwardRef(function InitializeDialog(
  { outlets, onChanged },
  ref
) {
  const [open, setOpen] = useState(false);
  const [productsStatus, setProductsStatus] = useState("idle");
  const [productsError, setProductsError] = useState(null);
  const [products, setProducts] = useState([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productId, setProductId] = useState("");
  const productIdRef = useRef("");
  const preselectedRef = useRef(null);
  const [variantsStatus, setVariantsStatus] = useState("idle");
  const [variantsError, setVariantsError] = useState(null);
  const [variants, setVariants] = useState([]);
  const [variantId, setVariantId] = useState("");
  const [onlineQuantity, setOnlineQuantity] = useState("");
  const [offlineQuantity, setOfflineQuantity] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("");
  const [outletId, setOutletId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useImperativeHandle(ref, () => ({
    openWith({ productId: initialId, productName }) {
      preselectedRef.current = initialId
        ? { productId: initialId, productName }
        : null;
      openDialog(initialId);
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
      setProducts(
        Array.isArray(data?.products) ? data.products : []
      );
      setProductsTotal(data?.pagination?.total ?? 0);
      setProductsStatus("ready");
    });
  }

  function openDialog(initialId) {
    const initial = typeof initialId === "string" ? initialId : "";
    productIdRef.current = initial;
    setProductsStatus("idle");
    setProductsError(null);
    setProducts([]);
    setProductsTotal(0);
    setProductId(initial);
    setVariantsStatus("idle");
    setVariantsError(null);
    setVariants([]);
    setVariantId("");
    setOnlineQuantity("");
    setOfflineQuantity("");
    setLowStockThreshold("");
    setOutletId("");
    setError(null);
    setOpen(true);
    loadProducts();
    if (initial !== "") {
      handleProductChange(initial);
    }
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
    });
  }

  const isSimpleProduct =
    productId !== "" && variantsStatus === "ready" && variants.length === 0;

  const visibleProducts = useMemo(() => {
    const preset = preselectedRef.current;
    if (!preset || products.some((product) => product.id === preset.productId)) {
      return products;
    }
    return [
      { id: preset.productId, name: preset.productName || "Selected product" },
      ...products,
    ];
  }, [products]);

  const invalidProduct = productId.trim().length === 0;
  const invalidVariant =
    !isSimpleProduct &&
    variantsStatus === "ready" &&
    variants.length > 0 &&
    variantId.trim().length === 0;
  const onlineError = fieldError(onlineQuantity);
  const offlineError = fieldError(offlineQuantity);
  const thresholdError = fieldError(lowStockThreshold);

  const subjectBusy = loading || variantsStatus === "loading";

  async function run() {
    if (
      invalidProduct ||
      invalidVariant ||
      onlineError ||
      offlineError ||
      thresholdError
    ) {
      setError("Fix the highlighted fields before initializing.");
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
    setLoading(true);
    setError(null);
    const body = {
      productId: productId.trim(),
      productVariantId: isSimpleProduct ? null : variantId.trim(),
    };
    if (onlineQuantity !== "") {
      body.onlineQuantity = Number(onlineQuantity);
    }
    if (offlineQuantity !== "") {
      body.offlineQuantity = Number(offlineQuantity);
    }
    if (lowStockThreshold !== "") {
      body.lowStockThreshold = Number(lowStockThreshold);
    }
    if (outletId !== "") {
      body.outletId = outletId;
    }
    const result = await initializeInventory(body);
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
        className="inline-flex h-10 items-center justify-center rounded-lg border border-gold-soft bg-white px-4 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1"
      >
        Initialize stock
      </button>

      {open ? (
        <ConfirmDialog
          title="Initialize stock"
          description="Set up stock for a product — or one of its variants — that does not yet have an inventory record. The backend rejects subjects that already have one."
          confirmLabel="Initialize stock"
          confirmClassName="bg-gold text-white hover:bg-gold/90 focus-visible:ring-gold"
          loading={loading}
          error={error}
          onConfirm={() => run()}
          onClose={() => {
            if (!loading) {
              preselectedRef.current = null;
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
                {visibleProducts.map((product) => (
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
                      }. Only active products can be initialized.`}
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

            {variantsStatus === "ready" && variants.length > 0 ? (
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
                This product has no variants, so stock is set up for the
                product itself (productVariantId is null).
              </p>
            ) : null}

            {outlets.length > 0 ? (
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  Outlet (optional)
                </span>
                <select
                  value={outletId}
                  onChange={(event) => setOutletId(event.target.value)}
                  disabled={loading}
                  className={inputClass}
                >
                  <option value="">No outlet (central pool)</option>
                  {outlets.map((outlet) => (
                    <option key={outlet.id} value={outlet.id}>
                      {outlet.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  Online qty
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={onlineQuantity}
                  onChange={(event) => setOnlineQuantity(event.target.value)}
                  disabled={loading}
                  placeholder="0"
                  className={inputClass}
                />
                {onlineError ? (
                  <span className="mt-1.5 block text-sm text-[#c9604d]">
                    {onlineError}
                  </span>
                ) : null}
              </label>
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  Offline qty
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={offlineQuantity}
                  onChange={(event) => setOfflineQuantity(event.target.value)}
                  disabled={loading}
                  placeholder="0"
                  className={inputClass}
                />
                {offlineError ? (
                  <span className="mt-1.5 block text-sm text-[#c9604d]">
                    {offlineError}
                  </span>
                ) : null}
              </label>
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  Low-stock threshold
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={lowStockThreshold}
                  onChange={(event) => setLowStockThreshold(event.target.value)}
                  disabled={loading}
                  placeholder="0"
                  className={inputClass}
                />
                {thresholdError ? (
                  <span className="mt-1.5 block text-sm text-[#c9604d]">
                    {thresholdError}
                  </span>
                ) : null}
              </label>
            </div>

            <p className="text-xs leading-relaxed text-muted">
              Opening quantities default to 0 when left empty. The low-stock
              threshold controls when the record appears in the Low Stock view.
            </p>
          </div>
        </ConfirmDialog>
      ) : null}
    </>
  );
});
