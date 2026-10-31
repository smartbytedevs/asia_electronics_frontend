const GUEST_ID_STORAGE_KEY = "taqwa.guestId.v1";

/**
 * Generates a UUID v4 (matching the backend's guest-id contract, which accepts
 * UUID versions 1–5). Prefers `crypto.randomUUID`, falls back to a spec-built
 * v4 UUID from `crypto.getRandomValues`, then to a Math.random string.
 */
function generateUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

/**
 * The stable browser guest identity. Generated once and persisted in
 * localStorage, then sent as the `X-Guest-Id` header so the backend can
 * resolve a guest customer (cart + checkout) without an account.
 *
 * Returns null on the server or when storage is unavailable (the caller then
 * simply omits the header, e.g. for genuinely public reads).
 */
export function getGuestId() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const existing = window.localStorage.getItem(GUEST_ID_STORAGE_KEY);
    if (existing) {
      return existing;
    }
    const id = generateUuid();
    window.localStorage.setItem(GUEST_ID_STORAGE_KEY, id);
    return id;
  } catch {
    return null;
  }
}
