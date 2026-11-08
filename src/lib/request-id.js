const HEADER_NAME = "x-request-id";
const VALID_REQUEST_ID = /^[A-Za-z0-9._:-]{8,128}$/;

export function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function resolveRequestId(value) {
  if (typeof value !== "string") {
    return createRequestId();
  }
  const trimmed = value.trim();
  return VALID_REQUEST_ID.test(trimmed) ? trimmed : createRequestId();
}

export { HEADER_NAME };
