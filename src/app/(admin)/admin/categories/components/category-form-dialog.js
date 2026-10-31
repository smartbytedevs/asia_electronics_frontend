"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { createCategory, updateCategory } from "@/lib/api/categories";
import { safeMessage } from "@/lib/api/http";
import { ConfirmDialog } from "../../components/confirm-dialog";
import { ImageUploader } from "../../components/image-uploader";

const inputClass =
  "mt-2 w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60";

/**
 * Create/edit category dialog. Mirrors the backend category contract:
 *   name (required), slug (optional — server auto-generates when omitted),
 *   description, image (uploaded through the catalog media API), isActive,
 *   sortOrder (0–9999).
 *
 * Slugs are server-owned: an empty slug input means "let the backend generate
 * it" on create and "keep the current one" on edit. The backend remains the
 * authority for slug collisions and returns its safe message on conflict.
 *
 * Create mode renders its own "Add Category" trigger. Edit mode opens already
 * populated from the row's data (no second click) and re-syncs whenever a
 * different category is selected.
 */
export function CategoryFormDialog({ category, onSaved }) {
  const isEdit = Boolean(category);
  const [open, setOpen] = useState(isEdit);
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [image, setImage] = useState(category?.image ?? "");
  const [sortOrder, setSortOrder] = useState(
    category?.sortOrder != null ? String(category.sortOrder) : "0"
  );
  const [isActive, setIsActive] = useState(category ? Boolean(category.isActive) : true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Re-populate and reopen whenever a category row is selected, so editing
  // another row (or re-editing the same row after closing) always opens a
  // freshly populated dialog.
  useEffect(() => {
    if (!category) {
      return undefined;
    }
    const id = window.setTimeout(() => {
      setName(category.name ?? "");
      setSlug(category.slug ?? "");
      setDescription(category.description ?? "");
      setImage(category.image ?? "");
      setSortOrder(category.sortOrder != null ? String(category.sortOrder) : "0");
      setIsActive(Boolean(category.isActive));
      setError(null);
      setOpen(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, [category]);

  function openDialog() {
    setName(category?.name ?? "");
    setSlug(category?.slug ?? "");
    setDescription(category?.description ?? "");
    setImage(category?.image ?? "");
    setSortOrder(category?.sortOrder != null ? String(category.sortOrder) : "0");
    setIsActive(category ? Boolean(category.isActive) : true);
    setError(null);
    setOpen(true);
  }

  function validate() {
    const nameText = name.trim();
    if (!nameText) {
      return "Category name is required.";
    }
    if (nameText.length > 100) {
      return "Category name must be at most 100 characters.";
    }
    const slugText = slug.trim();
    if (slugText.length > 120) {
      return "Slug must be at most 120 characters.";
    }
    if (slugText && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slugText)) {
      return "Slug may only contain lowercase letters, numbers, and hyphens.";
    }
    const descriptionText = description.trim();
    if (descriptionText.length > 1000) {
      return "Description must be at most 1000 characters.";
    }
    const imageText = image.trim();
    if (imageText && !/^https?:\/\/\S+$/i.test(imageText)) {
      return "Image must be a valid http(s) URL.";
    }
    const order = Number(sortOrder);
    if (
      !Number.isInteger(order) ||
      order < 0 ||
      order > 9999
    ) {
      return "Sort order must be a whole number between 0 and 9999.";
    }
    return null;
  }

  async function run() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    const body = {
      name: name.trim(),
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      image: image.trim() || null,
      isActive,
      sortOrder: Number(sortOrder),
    };
    setLoading(true);
    setError(null);
    const result = isEdit
      ? await updateCategory(category.id, body)
      : await createCategory(body);
    setLoading(false);
    if (result.ok) {
      setOpen(false);
      onSaved();
    } else {
      setError(safeMessage(result.status, result.payload));
    }
  }

  return (
    <>
      {!isEdit ? (
        <button
          type="button"
          onClick={openDialog}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-sm font-semibold text-white transition-colors hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add Category
        </button>
      ) : null}

      {open ? (
        <ConfirmDialog
          title={isEdit ? "Edit category" : "Add category"}
          description={
            isEdit
              ? "Update the category details. The slug can be left blank to keep the current one."
              : "Add a category to the catalog. The slug is generated automatically from the name when left blank."
          }
          confirmLabel={isEdit ? "Save changes" : "Add category"}
          confirmClassName="bg-gold text-white hover:bg-gold/90 focus-visible:ring-gold"
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
                Name
              </span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                disabled={loading}
                maxLength={100}
                autoFocus
                placeholder="e.g. Sound boxes"
                className={inputClass}
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  Slug (optional)
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  disabled={loading}
                  maxLength={120}
                  placeholder="auto-generated"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-mocha-deep">
                  Sort order
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={9999}
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  disabled={loading}
                  className={inputClass}
                />
              </label>
            </div>

            <label className="block">
              <span className="text-sm font-medium text-mocha-deep">
                Description (optional)
              </span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={loading}
                maxLength={1000}
                rows={3}
                placeholder="What kind of products live in this category?"
                className={`${inputClass} resize-y`}
              />
            </label>

            <div>
              <span className="text-sm font-medium text-mocha-deep">
                Category image (optional)
              </span>
              <div className="mt-2">
                <ImageUploader
                  mode="single"
                  value={image}
                  onChange={setImage}
                  disabled={loading}
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm font-medium text-mocha-deep">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                disabled={loading}
                className="h-4 w-4 accent-mocha"
              />
              Active — visible in the storefront
            </label>
          </div>
        </ConfirmDialog>
      ) : null}
    </>
  );
}
