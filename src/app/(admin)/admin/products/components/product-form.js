"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Save } from "lucide-react";
import { getProduct, createProduct, updateProduct } from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import { safeMessage } from "@/lib/api/http";
import { formatMinorUnits } from "@/lib/utils";
import { TableSkeleton } from "../../components/table-skeleton";
import { ConfirmDialog } from "../../components/confirm-dialog";
import { ImageUploader } from "../../components/image-uploader";
import { VariantEditor, newVariant, variantLabel } from "./variant-editor";

const PRICE_MIN = 1;
const PRICE_MAX = 100_000_000;
const IMAGES_MAX = 10;
const VARIANTS_MAX = 50;
const ATTRIBUTES_MAX = 10;
const BRAND_MAX = 100;
const MODEL_NUMBER_MAX = 100;
const WARRANTY_PERIOD_MAX = 120;
const SKU_MAX = 64;
const SKU_PATTERN = /^[A-Z0-9][A-Z0-9-_]*$/;

const cardClass = "rounded-2xl border border-gold-soft/70 bg-cream p-5 sm:p-6";
const cardTitleClass = "font-display text-lg text-ink";
const inputClass =
  "mt-1.5 w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60";
const inputErrorClass = "border-[#c9604d]/70 focus-visible:ring-[#c9604d]/40";

const addButtonClass =
  "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gold-soft/80 bg-white px-3 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const checkClass = "h-4 w-4 accent-mocha";

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

/**
 * Converts a user-friendly BDT amount string into integer minor units
 * (paisa). Accepts "500", "500.00", "500.5" — no more than two decimals, no
 * negatives. Returns null for anything else. Mirrors the expense dialog
 * helper; the backend only ever stores integer minor units.
 */
function takaToMinorUnits(input) {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(String(input).trim());
  if (!match) {
    return null;
  }
  const taka = Number(match[1]);
  const paisa = match[2] ? Number(match[2].padEnd(2, "0")) : 0;
  const minor = taka * 100 + paisa;
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null;
}

/** Minor units → editable taka string (150000 → "1500"). */
function minorUnitsToTaka(minor) {
  if (minor === null || minor === undefined) {
    return "";
  }
  return String(minor / 100);
}

/**
 * Parses the free-text "Key: value" specification editor into the JSON object
 * the backend stores. One entry per line; blank lines are ignored.
 */
function parseSpecifications(input) {
  const specifications = {};
  const lines = String(input).split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();
    if (!line) {
      continue;
    }
    const separator = line.indexOf(":");
    if (separator <= 0) {
      return {
        error: `Specification line ${index + 1} must look like "Key: value".`,
      };
    }
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim();
    if (!key || !value) {
      return {
        error: `Specification line ${index + 1} needs both a key and a value.`,
      };
    }
    specifications[key] = value;
  }
  return { specifications };
}

/**
 * Admin product form (create + edit).
 *
 * Mirrors the backend product contract (product.validation.js +
 * product.service.js): name/description, categoryId (ACTIVE category),
 * images, selling/cost prices, discount, featured/newArrival/bestDeal,
 * isActive, brand/model/warranty/SKU, specifications, and the variant set. The URL slug
 * is NOT a form field — the backend generates it from the name on create and
 * preserves it on edit.
 *
 * Variants on PATCH are the FULL replacement spec: entries with an `id` are
 * updated, entries without one are created, and variants not referenced are
 * deactivated (never deleted). SKU is immutable after creation, so existing
 * variants omit the sku key entirely (resending an unchanged SKU trips the
 * backend's own-SKU check).
 *
 * Purchase-price fields (cost price, variant cost override) are only shown on
 * edit for ADMIN users because the public detail endpoint never exposes them
 * and PATCH is ADMIN-only.
 */
export function ProductForm({ productId, userRole }) {
  const isEdit = Boolean(productId);
  const isAdmin = userRole === "ADMIN";
  const showPurchasePrice = !isEdit || isAdmin;
  const router = useRouter();

  const [reloadKey, setReloadKey] = useState(0);
  const [loadState, setLoadState] = useState({
    status: isEdit ? "loading" : "ready",
    message: null,
  });
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [removingVariant, setRemovingVariant] = useState(null);
  const removingVariantRef = useRef(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [images, setImages] = useState([]);
  const [coverId, setCoverId] = useState(null);
  const [sellingPrice, setSellingPrice] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [discountType, setDiscountType] = useState("none");
  const [discountValue, setDiscountValue] = useState("");
  const [featured, setFeatured] = useState(false);
  const [newArrival, setNewArrival] = useState(false);
  const [bestDeal, setBestDeal] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [brand, setBrand] = useState("");
  const [modelNumber, setModelNumber] = useState("");
  const [warrantyPeriod, setWarrantyPeriod] = useState("");
  const [stockKeepingUnit, setStockKeepingUnit] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [variants, setVariants] = useState([]);

  /** Drops a single field's validation message as the user corrects it. */
  function clearFieldError(key) {
    setFieldErrors((prev) => {
      if (!(key in prev)) {
        return prev;
      }
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function populateForm(product) {
    setName(product.name ?? "");
    setDescription(product.description ?? "");
    setCategoryId(product.categoryId ?? "");
    // The backend has no explicit cover field — the image with the lowest
    // sortOrder (first position) is the cover. Sort deterministically and
    // restore that image as the selected cover on edit.
    const loadedImages = (product.images || [])
      .map((image) => ({
        id: crypto.randomUUID(),
        url: image.url ?? "",
        alt: image.alt ?? "",
        sortOrder: image.sortOrder ?? 0,
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    setImages(loadedImages);
    setCoverId(loadedImages.length > 0 ? loadedImages[0].id : null);
    setSellingPrice(minorUnitsToTaka(product.sellingPrice));
    setPurchasePrice("");
    if (product.discount) {
      setDiscountType(product.discount.type);
      setDiscountValue(
        product.discount.type === "percentage"
          ? String(product.discount.value)
          : minorUnitsToTaka(product.discount.value)
      );
    } else {
      setDiscountType("none");
      setDiscountValue("");
    }
    setFeatured(Boolean(product.featured));
    setNewArrival(Boolean(product.newArrival));
    setBestDeal(Boolean(product.bestDeal));
    setIsActive(Boolean(product.isActive));
    setBrand(product.brand ?? "");
    setModelNumber(product.modelNumber ?? "");
    setWarrantyPeriod(
      product.warrantyPeriod === null || product.warrantyPeriod === undefined
        ? ""
        : String(product.warrantyPeriod)
    );
    setStockKeepingUnit(product.stockKeepingUnit ?? "");
    setSpecifications(
      Object.entries(product.specifications || {})
        .map(([key, value]) => `${key}: ${value}`)
        .join("\n")
    );

    const loadedVariants = (product.variants || []).map((variant) => ({
      id: crypto.randomUUID(),
      existingId: variant.id,
      attributes: Object.entries(variant.attributes || {}).map(([key, value]) => ({
        id: crypto.randomUUID(),
        key,
        value,
      })),
      sellingPriceOverride: "",
      purchasePriceOverride: "",
      isActive: Boolean(variant.isActive),
      currentSellingPrice: variant.sellingPrice ?? null,
    }));
    setVariants(loadedVariants);
  }

  useEffect(() => {
    let cancelled = false;
    getCategories().then((result) => {
      if (cancelled || !result.ok) {
        return;
      }
      const found = Array.isArray(result.payload?.data?.categories)
        ? result.payload.data.categories
        : [];
      setCategories(found.filter((category) => category?.id));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit) {
      return undefined;
    }
    let cancelled = false;
    getProduct(productId).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setLoadState({
          status: "error",
          message: safeMessage(result.status, result.payload),
        });
        return;
      }
      const product = result.payload?.data?.product;
      if (!product) {
        setLoadState({
          status: "error",
          message: "The product could not be loaded.",
        });
        return;
      }
      populateForm(product);
      setLoadState({ status: "ready", message: null });
    });
    return () => {
      cancelled = true;
    };
  }, [isEdit, productId, reloadKey]);

  function addVariant() {
    if (variants.length >= VARIANTS_MAX) {
      return;
    }
    setVariants([...variants, newVariant()]);
  }

  /**
   * The cover is represented by array position / sortOrder in the backend
   * contract (no explicit cover field), so "Set as cover" deterministically
   * moves the chosen image to the front before the payload is built.
   */
  function orderedImages() {
    if (!coverId) {
      return images;
    }
    const cover = images.find((image) => image.id === coverId);
    if (!cover) {
      return images;
    }
    return [cover, ...images.filter((image) => image.id !== coverId)];
  }

  function handleImagesChange(nextImages) {
    setImages(nextImages);
    clearFieldError("images");
    // Removing the current cover leaves the selection unset — the admin must
    // explicitly pick another cover (never silently/randomly promoted).
    if (coverId && !nextImages.some((image) => image.id === coverId)) {
      setCoverId(null);
    }
  }

  function handleSetCover(imageId) {
    setCoverId(imageId);
    clearFieldError("images");
  }

  function updateVariant(variantId, patch) {
    setVariants(variants.map((variant) => (variant.id === variantId ? { ...variant, ...patch } : variant)));
    setFieldErrors((prev) => {
      const prefix = `variant:${variantId}:`;
      const next = {};
      for (const key of Object.keys(prev)) {
        if (!key.startsWith(prefix)) {
          next[key] = prev[key];
        }
      }
      return next;
    });
  }

  function clearVariantErrors(variantId) {
    setFieldErrors((prev) => {
      const prefix = `variant:${variantId}:`;
      const next = {};
      for (const key of Object.keys(prev)) {
        if (!key.startsWith(prefix)) {
          next[key] = prev[key];
        }
      }
      return next;
    });
  }

  function confirmRemoveVariant() {
    const variant = removingVariantRef.current;
    if (!variant) {
      return;
    }
    setVariants(variants.filter((item) => item.id !== variant.id));
    clearVariantErrors(variant.id);
    setRemovingVariant(null);
  }

  /**
   * Validates every field and returns a map of per-field messages keyed by
   * field name (or `variant:<id>:<field>` for variant-level problems). An
   * empty map means the form is valid.
   */
  function validate() {
    const errors = {};

    const nameText = name.trim();
    if (!nameText) {
      errors.name = "Product name is required.";
    } else if (nameText.length > 200) {
      errors.name = "Product name must be at most 200 characters.";
    }

    if (description.trim().length > 5000) {
      errors.description = "Description must be at most 5000 characters.";
    }

    if (!categoryId) {
      errors.categoryId = "Choose a category. A product must belong to a category.";
    }

    const sellingMinor = takaToMinorUnits(sellingPrice);
    if (sellingMinor === null) {
      errors.sellingPrice =
        "Selling price must be a positive amount in taka (BDT), e.g. 1500.00.";
    } else if (sellingMinor > PRICE_MAX) {
      errors.sellingPrice = "Selling price is too large.";
    }

    if (purchasePrice.trim()) {
      const purchaseMinor = takaToMinorUnits(purchasePrice);
      if (purchaseMinor === null) {
        errors.purchasePrice = "Cost price must be a positive amount in taka (BDT).";
      } else if (purchaseMinor > PRICE_MAX) {
        errors.purchasePrice = "Cost price is too large.";
      }
    }

    if (discountType === "percentage") {
      const value = Number(discountValue);
      if (!Number.isInteger(value) || value < 1 || value > 100) {
        errors.discount = "Percentage discount must be a whole number between 1 and 100.";
      }
    } else if (discountType === "fixed") {
      const fixedMinor = takaToMinorUnits(discountValue);
      if (fixedMinor === null) {
        errors.discount = "Fixed discount must be a positive amount in taka (BDT).";
      } else if (sellingMinor !== null && fixedMinor > sellingMinor) {
        errors.discount = "Fixed discount cannot exceed the selling price.";
      }
    }

    if (images.length > IMAGES_MAX) {
      errors.images = `A product can have at most ${IMAGES_MAX} images.`;
    } else {
      for (const image of images) {
        const url = image.url.trim();
        if (!url) {
          errors.images = "Every image needs a URL — remove blank image rows.";
          break;
        }
        if (!/^https?:\/\/\S+$/i.test(url)) {
          errors.images = "Image URLs must be valid http(s) URLs.";
          break;
        }
        if (url.length > 500) {
          errors.images = "Image URLs must be at most 500 characters.";
          break;
        }
        if (image.alt.length > 300) {
          errors.images = "Image alt text must be at most 300 characters.";
          break;
        }
      }
    }
    if (images.length > 0 && !coverId) {
      errors.images = "Choose a cover image — one uploaded image must be the cover.";
    }

    if (variants.length > VARIANTS_MAX) {
      errors.variants = `A product can have at most ${VARIANTS_MAX} variants.`;
    } else {
      const seenAttributeSets = new Set();
      for (const variant of variants) {
        const prefix = `variant:${variant.id}:`;
        const label = variantLabel(variant);

        const attributes = {};
        let attributeCount = 0;
        for (const attribute of variant.attributes) {
          const key = attribute.key.trim();
          const value = attribute.value.trim();
          if (!key && !value) {
            continue;
          }
          attributeCount += 1;
          if (attributeCount > ATTRIBUTES_MAX) {
            errors[`${prefix}attributes`] =
              `Variant ${label} can have at most ${ATTRIBUTES_MAX} options.`;
            break;
          }
          if (!/^[a-zA-Z][a-zA-Z0-9]{0,39}$/.test(key)) {
            errors[`${prefix}attributes`] =
              `Option key "${key}" must start with a letter and use only letters and numbers.`;
            break;
          }
          if (!value) {
            errors[`${prefix}attributes`] = `Option "${key}" needs a value.`;
            break;
          }
          if (value.length > 60) {
            errors[`${prefix}attributes`] =
              `Option "${key}" value must be at most 60 characters.`;
            break;
          }
          if (attributes[key] !== undefined) {
            errors[`${prefix}attributes`] = `Duplicate option key "${key}" in variant ${label}.`;
            break;
          }
          attributes[key] = value;
        }
        const attributeSetKey = JSON.stringify(
          Object.keys(attributes)
            .sort()
            .map((key) => [key, attributes[key]])
        );
        if (!errors[`${prefix}attributes`] && seenAttributeSets.has(attributeSetKey)) {
          errors[`${prefix}attributes`] =
            "Two variants share the same options — make each variant unique.";
        }
        seenAttributeSets.add(attributeSetKey);

        if (variant.sellingPriceOverride.trim()) {
          const overrideMinor = takaToMinorUnits(variant.sellingPriceOverride);
          if (overrideMinor === null) {
            errors[`${prefix}sellingPriceOverride`] =
              `Variant ${label} price override must be a positive amount in taka (BDT).`;
          } else if (overrideMinor > PRICE_MAX) {
            errors[`${prefix}sellingPriceOverride`] = `Variant ${label} price override is too large.`;
          }
        }
        if (variant.purchasePriceOverride.trim()) {
          const overrideMinor = takaToMinorUnits(variant.purchasePriceOverride);
          if (overrideMinor === null) {
            errors[`${prefix}purchasePriceOverride`] =
              `Variant ${label} cost override must be a positive amount in taka (BDT).`;
          } else if (overrideMinor > PRICE_MAX) {
            errors[`${prefix}purchasePriceOverride`] = `Variant ${label} cost override is too large.`;
          }
        }
      }
    }

    if (brand.trim().length > BRAND_MAX) {
      errors.brand = `Brand must be at most ${BRAND_MAX} characters.`;
    }
    if (modelNumber.trim().length > MODEL_NUMBER_MAX) {
      errors.modelNumber = `Model number must be at most ${MODEL_NUMBER_MAX} characters.`;
    }
    if (warrantyPeriod.trim()) {
      const months = Number(warrantyPeriod);
      if (
        !Number.isInteger(months) ||
        months < 0 ||
        months > WARRANTY_PERIOD_MAX
      ) {
        errors.warrantyPeriod = `Warranty must be a whole number of months between 0 and ${WARRANTY_PERIOD_MAX}.`;
      }
    }
    const sku = stockKeepingUnit.trim().toUpperCase();
    if (sku) {
      if (sku.length > SKU_MAX) {
        errors.stockKeepingUnit = `SKU must be at most ${SKU_MAX} characters.`;
      } else if (!SKU_PATTERN.test(sku)) {
        errors.stockKeepingUnit =
          "SKU must start with a letter or number and use only letters, numbers, hyphen and underscore.";
      }
    }
    const parsedSpecifications = parseSpecifications(specifications);
    if (parsedSpecifications.error) {
      errors.specifications = parsedSpecifications.error;
    }

    return errors;
  }

  /** Validation messages for one variant row, keyed for the editor. */
  function variantErrors(variant) {
    const prefix = `variant:${variant.id}:`;
    return {
      attributes: fieldErrors[`${prefix}attributes`],
      sellingPriceOverride: fieldErrors[`${prefix}sellingPriceOverride`],
      purchasePriceOverride: fieldErrors[`${prefix}purchasePriceOverride`],
    };
  }

  function buildDiscount(sellingMinor) {
    if (discountType === "percentage") {
      return { type: "percentage", value: Number(discountValue) };
    }
    if (discountType === "fixed") {
      return { type: "fixed", value: takaToMinorUnits(discountValue) };
    }
    return null;
  }

  function buildVariants() {
    return variants.map((variant) => {
      const attributes = {};
      for (const attribute of variant.attributes) {
        const key = attribute.key.trim();
        const value = attribute.value.trim();
        if (key && value) {
          attributes[key] = value;
        }
      }
      const entry = { attributes, isActive: variant.isActive };
      if (variant.existingId) {
        entry.id = variant.existingId;
        // SKU is immutable after creation and is deliberately omitted — the
        // backend rejects resending a variant's own SKU in the replacement
        // spec (it would collide with itself).
      }
      if (variant.sellingPriceOverride.trim()) {
        entry.sellingPriceOverride = takaToMinorUnits(variant.sellingPriceOverride);
      }
      if (variant.purchasePriceOverride.trim()) {
        entry.purchasePriceOverride = takaToMinorUnits(variant.purchasePriceOverride);
      }
      return entry;
    });
  }

  function buildBody() {
    // Cover first (sortOrder 0 = storefront thumbnail), remaining images keep
    // their order. The key is omitted when there are no images — the backend
    // rejects `images: []` but defaults to [] when the field is absent.
    const bodyImages = orderedImages();
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      categoryId,
      sellingPrice: takaToMinorUnits(sellingPrice),
      images: bodyImages.map((image, index) => ({
        url: image.url.trim(),
        alt: image.alt.trim() || null,
        sortOrder: index,
      })),
      discount: buildDiscount(takaToMinorUnits(sellingPrice)),
      featured,
      newArrival,
      bestDeal,
      isActive,
      brand: brand.trim(),
      modelNumber: modelNumber.trim(),
      // null clears the value on edit (the backend maps it to "unset").
      warrantyPeriod: warrantyPeriod.trim() ? Number(warrantyPeriod) : null,
      stockKeepingUnit: stockKeepingUnit.trim().toUpperCase() || null,
      specifications: parseSpecifications(specifications).specifications || {},
      variants: buildVariants(),
    };
    if (bodyImages.length === 0) {
      delete body.images;
    }
    if (purchasePrice.trim()) {
      body.purchasePrice = takaToMinorUnits(purchasePrice);
    }
    return body;
  }

  async function handleSubmit() {
    if (uploadingImages) {
      setError("Please wait for the images to finish uploading before saving.");
      return;
    }
    const errors = validate();
    const errorKeys = Object.keys(errors);
    if (errorKeys.length > 0) {
      setFieldErrors(errors);
      setError(errors[errorKeys[0]]);
      return;
    }
    setFieldErrors({});
    setSubmitting(true);
    setError(null);
    const result = isEdit
      ? await updateProduct(productId, buildBody())
      : await createProduct(buildBody());
    setSubmitting(false);
    if (result.ok) {
      router.push("/admin/products");
      router.refresh();
    } else {
      setError(safeMessage(result.status, result.payload));
    }
  }

  if (loadState.status === "loading") {
    return <TableSkeleton rows={6} />;
  }

  if (loadState.status === "error") {
    return (
      <div role="alert" className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8">
        <h2 className="font-display text-lg text-ink">Product unavailable</h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-mocha-deep">{loadState.message}</p>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <Link
            href="/admin/products"
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gold-soft/80 bg-white px-5 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            Back to products
          </Link>
          <button
            type="button"
            onClick={() => {
              setLoadState({ status: "loading", message: null });
              setReloadKey((key) => key + 1);
            }}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-mocha px-5 text-sm font-semibold text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className={`${cardClass} space-y-5`}>
        <h2 className={cardTitleClass}>Product details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-mocha-deep">Name (required)</span>
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                clearFieldError("name");
              }}
              disabled={submitting}
              maxLength={200}
              placeholder="e.g. Portable Bluetooth Speaker"
              className={`${inputClass} ${fieldErrors.name ? inputErrorClass : ""}`}
            />
            <FieldError message={fieldErrors.name} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-mocha-deep">Category (required)</span>
            <select
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                clearFieldError("categoryId");
              }}
              disabled={submitting}
              className={`${inputClass} ${fieldErrors.categoryId ? inputErrorClass : ""}`}
            >
              <option value="">Choose a category…</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.categoryId} />
            {categories.length === 0 ? (
              <span className="mt-1.5 block text-xs text-muted">
                No active categories available yet — create one first under Categories.
              </span>
            ) : null}
          </label>
        </div>
        <label className="block">
          <span className="sr-only">Description (optional)</span>
          <textarea
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              clearFieldError("description");
            }}
            disabled={submitting}
            maxLength={5000}
            rows={5}
            placeholder="Describe the product — specs, features, what's in the box."
            className={`${inputClass} resize-y ${fieldErrors.description ? inputErrorClass : ""}`}
          />
          <FieldError message={fieldErrors.description} />
          <span className="mt-1.5 block text-right text-xs tabular-nums text-muted">
            {description.length}/5000
          </span>
        </label>
      </div>

      <div className={`${cardClass} space-y-5`}>
        <div>
          <h2 className={cardTitleClass}>Electronics specifications</h2>
          <p className="mt-1 text-sm text-muted">
            Optional catalog facts shown on the product page. Brand, model and
            warranty help customers compare models.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-mocha-deep">Brand</span>
            <input
              type="text"
              value={brand}
              onChange={(event) => {
                setBrand(event.target.value);
                clearFieldError("brand");
              }}
              disabled={submitting}
              maxLength={BRAND_MAX}
              placeholder="e.g. Brand name"
              className={`${inputClass} ${fieldErrors.brand ? inputErrorClass : ""}`}
            />
            <FieldError message={fieldErrors.brand} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-mocha-deep">Model number</span>
            <input
              type="text"
              value={modelNumber}
              onChange={(event) => {
                setModelNumber(event.target.value);
                clearFieldError("modelNumber");
              }}
              disabled={submitting}
              maxLength={MODEL_NUMBER_MAX}
              placeholder="e.g. SPK-200"
              className={`${inputClass} ${fieldErrors.modelNumber ? inputErrorClass : ""}`}
            />
            <FieldError message={fieldErrors.modelNumber} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-mocha-deep">
              Warranty (months)
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={WARRANTY_PERIOD_MAX}
              step={1}
              value={warrantyPeriod}
              onChange={(event) => {
                setWarrantyPeriod(event.target.value);
                clearFieldError("warrantyPeriod");
              }}
              disabled={submitting}
              placeholder="e.g. 12"
              className={`${inputClass} ${fieldErrors.warrantyPeriod ? inputErrorClass : ""}`}
            />
            <FieldError message={fieldErrors.warrantyPeriod} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-mocha-deep">
              Product SKU (optional)
            </span>
            <input
              type="text"
              value={stockKeepingUnit}
              onChange={(event) => {
                setStockKeepingUnit(event.target.value);
                clearFieldError("stockKeepingUnit");
              }}
              disabled={submitting}
              maxLength={SKU_MAX}
              placeholder="e.g. SPK-200-BLK"
              className={`${inputClass} ${fieldErrors.stockKeepingUnit ? inputErrorClass : ""}`}
            />
            <FieldError message={fieldErrors.stockKeepingUnit} />
          </label>
        </div>
        <label className="block">
          <span className="text-sm font-medium text-mocha-deep">
            Specifications (one “Key: value” per line)
          </span>
          <textarea
            value={specifications}
            onChange={(event) => {
              setSpecifications(event.target.value);
              clearFieldError("specifications");
            }}
            disabled={submitting}
            rows={5}
            placeholder={"Power: 20 W\nBattery: 5000 mAh\nConnectivity: Bluetooth\nWarranty: 12 months"}
            className={`${inputClass} resize-y ${fieldErrors.specifications ? inputErrorClass : ""}`}
          />
          <FieldError message={fieldErrors.specifications} />
        </label>
      </div>

      <div className={`${cardClass} space-y-5`}>
        <h2 className={cardTitleClass}>Pricing &amp; discount</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-mocha-deep">Selling price (BDT, required)</span>
            <input
              type="text"
              inputMode="decimal"
              value={sellingPrice}
              onChange={(event) => {
                setSellingPrice(event.target.value);
                clearFieldError("sellingPrice");
                clearFieldError("discount");
              }}
              disabled={submitting}
              placeholder="e.g. 1500.00"
              className={`${inputClass} ${fieldErrors.sellingPrice ? inputErrorClass : ""}`}
            />
            <FieldError message={fieldErrors.sellingPrice} />
            {sellingPrice.trim() && takaToMinorUnits(sellingPrice) !== null ? (
              <span className="mt-1.5 block text-sm text-muted">
                {formatMinorUnits(takaToMinorUnits(sellingPrice))}
              </span>
            ) : null}
          </label>
          {showPurchasePrice ? (
            <label className="block">
              <span className="text-sm font-medium text-mocha-deep">
                Cost price (BDT, optional)
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={purchasePrice}
                onChange={(event) => {
                  setPurchasePrice(event.target.value);
                  clearFieldError("purchasePrice");
                }}
                disabled={submitting}
                placeholder="e.g. 900.00"
                className={`${inputClass} ${fieldErrors.purchasePrice ? inputErrorClass : ""}`}
              />
              <FieldError message={fieldErrors.purchasePrice} />
              {isEdit ? (
                <span className="mt-1.5 block text-xs text-muted">
                  The public read API does not reveal the current cost — leave blank to keep it.
                </span>
              ) : null}
            </label>
          ) : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-mocha-deep">Discount</span>
            <select
              value={discountType}
              onChange={(event) => {
                setDiscountType(event.target.value);
                setDiscountValue("");
                clearFieldError("discount");
              }}
              disabled={submitting}
              className={`${inputClass} ${fieldErrors.discount ? inputErrorClass : ""}`}
            >
              <option value="none">No discount</option>
              <option value="percentage">Percentage off</option>
              <option value="fixed">Fixed amount off</option>
            </select>
          </label>
          {discountType !== "none" ? (
            <label className="block">
              <span className="text-sm font-medium text-mocha-deep">
                {discountType === "percentage" ? "Percent off" : "Amount off (BDT)"}
              </span>
              <input
                type="text"
                inputMode={discountType === "percentage" ? "numeric" : "decimal"}
                value={discountValue}
                onChange={(event) => {
                  setDiscountValue(event.target.value);
                  clearFieldError("discount");
                }}
                disabled={submitting}
                placeholder={discountType === "percentage" ? "e.g. 20" : "e.g. 200.00"}
                className={`${inputClass} ${fieldErrors.discount ? inputErrorClass : ""}`}
              />
              <FieldError message={fieldErrors.discount} />
            </label>
          ) : null}
        </div>
      </div>

      <div className={`${cardClass} space-y-4`}>
        <div>
          <h2 className={cardTitleClass}>Storefront status</h2>
          <p className="mt-1 text-sm text-muted">
            Control where the product appears in the storefront.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2.5 text-sm font-medium text-mocha-deep">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              disabled={submitting}
              className={checkClass}
            />
            Active — visible in the storefront
          </label>
          <label className="flex items-center gap-2.5 text-sm font-medium text-mocha-deep">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
              disabled={submitting}
              className={checkClass}
            />
            Featured
          </label>
          <label className="flex items-center gap-2.5 text-sm font-medium text-mocha-deep">
            <input
              type="checkbox"
              checked={newArrival}
              onChange={(event) => setNewArrival(event.target.checked)}
              disabled={submitting}
              className={checkClass}
            />
            New arrival
          </label>
          <label className="flex items-center gap-2.5 text-sm font-medium text-mocha-deep">
            <input
              type="checkbox"
              checked={bestDeal}
              onChange={(event) => setBestDeal(event.target.checked)}
              disabled={submitting}
              className={checkClass}
            />
            Best deal
          </label>
        </div>
      </div>

      <div className={`${cardClass} space-y-4`}>
        <div>
          <h2 className={cardTitleClass}>Images</h2>
          <p className="mt-1 text-sm text-muted">
            Upload images from your computer — up to {IMAGES_MAX}. Choose which
            image is the cover; it is shown first in the storefront. Uploading
            new images never changes the selected cover. Existing images are
            kept as-is until you replace or remove them.
          </p>
        </div>
        <ImageUploader
          mode="multiple"
          value={images}
          onChange={handleImagesChange}
          max={IMAGES_MAX}
          showAlt
          disabled={submitting}
          onBusyChange={setUploadingImages}
          coverId={coverId}
          onSetCover={handleSetCover}
        />
        <FieldError message={fieldErrors.images} />
      </div>

      <div className={`${cardClass} space-y-4`}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className={cardTitleClass}>Variants</h2>
            <p className="mt-1 text-sm text-muted">
              Optional — a product with no variants holds no inventory. Add variants
              only when the product needs selectable options, such as colour or
              capacity. SKUs are generated automatically.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={addVariant}
              disabled={submitting || variants.length >= VARIANTS_MAX}
              className={addButtonClass}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add variant
            </button>
          </div>
        </div>
        <FieldError message={fieldErrors.variants} />
        {variants.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gold-soft/70 bg-white/40 px-4 py-5 text-center">
            <p className="text-sm font-medium text-mocha-deep">No variants added</p>
            <p className="mt-1 text-sm text-muted">
              A product without variants holds no inventory. If this product needs
              selectable options, add a variant above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {variants.map((variant, index) => (
              <VariantEditor
                key={variant.id}
                variant={variant}
                index={index}
                errors={variantErrors(variant)}
                showPurchasePrice={showPurchasePrice}
                onChange={updateVariant}
                onRemove={() => {
                  if (variant.existingId) {
                    removingVariantRef.current = variant;
                    setRemovingVariant(variant);
                  } else {
                    setVariants(variants.filter((item) => item.id !== variant.id));
                    clearVariantErrors(variant.id);
                  }
                }}
                disabled={submitting}
              />
            ))}
          </div>
        )}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[#c9604d]"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse items-center justify-end gap-3 rounded-2xl border border-gold-soft/70 bg-cream p-4 sm:flex-row">
        <Link
          href="/admin/products"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-gold-soft/80 bg-white px-5 text-sm font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          Cancel
        </Link>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || uploadingImages}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-gold px-6 text-sm font-semibold text-white transition-colors hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60"
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              {isEdit ? "Saving…" : "Creating…"}
            </span>
          ) : (
            <>
              <Save className="h-4 w-4" aria-hidden="true" />
              Save Product
            </>
          )}
        </button>
      </div>

      {removingVariant ? (
        <ConfirmDialog
          title="Remove saved variant"
          description="This variant already exists in the backend. Removing it here deactivates it when the product is saved — it is kept for records but hidden from the storefront. Removing it cannot be undone through the admin UI."
          confirmLabel="Remove variant"
          confirmClassName="bg-[#c9604d] text-white hover:bg-[#b3412f] focus-visible:ring-red-300"
          loading={false}
          onConfirm={confirmRemoveVariant}
          onClose={() => setRemovingVariant(null)}
        >
          <p className="text-sm leading-relaxed text-mocha-deep">
            {variantLabel(removingVariant)} will be deactivated on save.
          </p>
        </ConfirmDialog>
      ) : null}
    </div>
  );
}
