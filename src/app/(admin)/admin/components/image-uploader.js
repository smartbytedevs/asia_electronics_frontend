"use client";

import { useRef, useState } from "react";
import { uploadMedia, MEDIA_UPLOAD_LIMITS } from "@/lib/api/media";
import { safeMessage } from "@/lib/api/http";
import { InlineSpinner } from "./inline-spinner";

const inputClass =
  "w-full rounded-lg border border-gold-soft/80 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-60";

const removeButtonClass =
  "inline-flex h-9 items-center justify-center rounded-lg border border-red-200 bg-white px-3 text-sm font-medium text-[#c9604d] transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const uploadButtonClass =
  "inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-gold px-4 text-sm font-semibold text-white transition-colors hover:bg-gold/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60";

const ACCEPT = MEDIA_UPLOAD_LIMITS.ACCEPTED_TYPES.join(",");

/**
 * Client-side validation mirroring the backend media rules (JPEG/PNG/WEBP,
 * extension must match the declared type, ≤ 5 MB). The backend still re-checks
 * magic bytes on upload — this only gives a fast, clear message before the
 * request is made.
 */
function validateImageFile(file) {
  if (!MEDIA_UPLOAD_LIMITS.ACCEPTED_TYPES.includes(file.type)) {
    return "Only JPG, PNG, or WEBP images are allowed.";
  }
  if (file.size > MEDIA_UPLOAD_LIMITS.IMAGE_MAX_BYTES) {
    return `Images must be 5 MB or smaller.`;
  }
  const extensions = MEDIA_UPLOAD_LIMITS.EXTENSIONS_BY_TYPE[file.type];
  const dot = (file.name || "").lastIndexOf(".");
  const extension =
    dot !== -1 && dot < (file.name || "").length - 1
      ? file.name.slice(dot + 1).toLowerCase()
      : "";
  if (!extensions.includes(extension)) {
    return `The file name must end in ${extensions.join(" or ")}.`;
  }
  return null;
}

/**
 * Reusable admin image uploader wired to the existing catalog media API
 * (POST /admin/media/upload via the authenticated backend proxy).
 *
 * `mode="multiple"` (product images):
 *   - `value`: array of `{ id, url, alt? }`; `onChange(nextArray)`.
 *   - Up to `max` images, optional `showAlt` alt-text input per image.
 *   - When `coverId` and `onSetCover` are provided, the cover is a MANUAL
 *     selection: the chosen image shows a COVER badge and every other image
 *     gets a "Set as cover" action. Nothing is auto-assigned — the first
 *     uploaded image is not treated as the cover, and uploads never change an
 *     existing selection. (The backend represents the cover as the first
 *     image / lowest sortOrder; the parent orders the array on save.)
 * `mode="single"` (category image):
 *   - `value`: a URL string; `onChange(url)`.
 *   - Preview, replace, and remove controls.
 *
 * Handles the picker, upload state, per-request validation errors, a disabled
 * state (form submitting), and prevents starting new uploads while one is in
 * flight. Unchanged images are never re-uploaded — only newly picked files are
 * sent to the backend.
 */
export function ImageUploader({
  mode = "multiple",
  value,
  onChange,
  max = MEDIA_UPLOAD_LIMITS.MAX_FILES,
  disabled = false,
  showAlt = false,
  onBusyChange,
  coverId = null,
  onSetCover,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  function setBusy(busy) {
    setUploading(busy);
    onBusyChange?.(busy);
  }

  function pick() {
    inputRef.current?.click();
  }

  function resetInput() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  async function runUpload(fileList) {
    if (!fileList || fileList.length === 0) {
      return;
    }
    const picked = Array.from(fileList);
    const problems = [];
    const validFiles = [];
    for (const file of picked) {
      const problem = validateImageFile(file);
      if (problem) {
        problems.push(`${file.name}: ${problem}`);
      } else {
        validFiles.push(file);
      }
    }
    if (validFiles.length === 0) {
      setError(problems.join(" "));
      resetInput();
      return;
    }
    if (mode === "multiple") {
      const slots = max - value.length;
      if (slots <= 0) {
        setError(`A maximum of ${max} images is allowed.`);
        resetInput();
        return;
      }
      if (validFiles.length > slots) {
        problems.push(
          `${validFiles.length - slots} extra image${validFiles.length - slots > 1 ? "s" : ""} skipped — a maximum of ${max} images is allowed.`
        );
        validFiles.splice(slots);
      }
    }

    setBusy(true);
    setError(null);
    try {
      const result = await uploadMedia(validFiles);
      if (result.ok) {
        const uploads = result.payload?.data?.uploads ?? [];
        if (mode === "single") {
          if (uploads.length > 0) {
            onChange(uploads[0].url);
          } else {
            setError("The image uploaded but returned no URL. Please try again.");
          }
        } else {
          const added = uploads.map((item) => ({
            id: crypto.randomUUID(),
            url: item.url,
            alt: "",
          }));
          onChange([...value, ...added]);
        }
        if (problems.length > 0) {
          setError(problems.join(" "));
        }
      } else {
        setError(safeMessage(result.status, result.payload));
      }
    } catch {
      setError("The image could not be uploaded. Please try again.");
    } finally {
      setBusy(false);
      resetInput();
    }
  }

  const controlsDisabled = disabled || uploading;
  const reachedMax = mode === "multiple" && value.length >= max;

  if (mode === "single") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-3 rounded-xl border border-gold-soft/60 bg-white/50 p-3">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Uploaded image preview"
              className="h-24 w-24 shrink-0 rounded-lg border border-gold-soft/60 object-cover"
            />
          ) : (
            <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed border-gold-soft/70 bg-sand/60 px-2 text-center text-xs text-muted">
              No image yet
            </span>
          )}
          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={pick}
                disabled={controlsDisabled}
                className={uploadButtonClass}
              >
                {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
              </button>
              {value ? (
                <button
                  type="button"
                  onClick={() => onChange("")}
                  disabled={controlsDisabled}
                  className={removeButtonClass}
                >
                  Remove
                </button>
              ) : null}
            </div>
            {uploading ? (
              <span className="inline-flex items-center gap-2 text-sm text-muted">
                <InlineSpinner />
                Uploading…
              </span>
            ) : null}
          </div>
        </div>
        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-[#c9604d]"
          >
            {error}
          </p>
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(event) => runUpload(event.target.files)}
          disabled={controlsDisabled}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={pick}
          disabled={controlsDisabled || reachedMax}
          className={uploadButtonClass}
        >
          + Upload images
        </button>
        {uploading ? (
          <span className="inline-flex items-center gap-2 text-sm text-muted">
            <InlineSpinner />
            Uploading…
          </span>
        ) : (
          <span className="text-sm tabular-nums text-muted">
            {value.length}/{max} images
          </span>
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
      {value.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gold-soft/70 px-3 py-3 text-sm text-muted">
          No images yet. Upload photos from your computer to show them in the storefront.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {value.map((image, index) => (
            <div
              key={image.id}
              className="flex items-start gap-3 rounded-xl border border-gold-soft/60 bg-white/50 p-3"
            >
              <div className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt || `Image ${index + 1}`}
                  className="h-20 w-20 rounded-lg border border-gold-soft/60 object-cover"
                  loading="lazy"
                />
                {image.id === coverId ? (
                  <span className="mt-1 block text-center text-[0.65rem] font-semibold uppercase tracking-wide text-gold">
                    Cover
                  </span>
                ) : onSetCover ? (
                  <button
                    type="button"
                    onClick={() => onSetCover(image.id)}
                    disabled={controlsDisabled}
                    className="mt-1 block w-full rounded border border-gold-soft/80 bg-white px-1.5 py-0.5 text-center text-[0.65rem] font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50"
                  >
                    Set as cover
                  </button>
                ) : null}
              </div>
              <div className="flex-1 space-y-2">
                {showAlt ? (
                  <label className="block">
                    <span className="sr-only">Alt text</span>
                    <input
                      type="text"
                      value={image.alt ?? ""}
                      onChange={(event) =>
                        onChange(
                          value.map((item) =>
                            item.id === image.id
                              ? { ...item, alt: event.target.value }
                              : item
                          )
                        )
                      }
                      disabled={controlsDisabled}
                      maxLength={300}
                      placeholder="Alt text (optional)"
                      className={inputClass}
                    />
                  </label>
                ) : null}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((item) => item.id !== image.id))}
                  disabled={controlsDisabled}
                  className={removeButtonClass}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(event) => runUpload(event.target.files)}
        disabled={controlsDisabled}
      />
    </div>
  );
}
