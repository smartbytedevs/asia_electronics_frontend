import { backendRequest } from "./http";

/**
 * Catalog media upload constants. Mirrors the backend media contract
 * (src/modules/media/media.constants.js): JPEG/PNG/WEBP images only, max 10
 * files per request, 5 MB per file. The multipart field name is `files` and
 * the response envelope carries uploaded image references under
 * `data.uploads[]` with the image URL in `.url`.
 */
export const MEDIA_UPLOAD_LIMITS = Object.freeze({
  MAX_FILES: 10,
  IMAGE_MAX_BYTES: 5 * 1024 * 1024,
  ACCEPTED_TYPES: Object.freeze(["image/jpeg", "image/png", "image/webp"]),
  EXTENSIONS_BY_TYPE: Object.freeze({
    "image/jpeg": Object.freeze(["jpg", "jpeg"]),
    "image/png": Object.freeze(["png"]),
    "image/webp": Object.freeze(["webp"]),
  }),
});

/**
 * Uploads catalog images through the authenticated backend proxy.
 *
 * POST /admin/media/upload — multipart/form-data, field name `files`.
 * ADMIN/STAFF only; the proxy attaches the server-side JWT.
 *
 * The browser sets the multipart Content-Type automatically — it is never
 * set manually, so the boundary is generated correctly. Returns the existing
 * `{ status, ok, payload }` contract; the uploaded URLs live at
 * `payload.data.uploads[].url`.
 *
 * @param {File[]} files - image files (JPEG/PNG/WEBP, ≤ 5 MB each).
 */
export async function uploadMedia(files) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file, file.name);
  }
  return backendRequest("/admin/media/upload", {
    method: "POST",
    body: formData,
  });
}
