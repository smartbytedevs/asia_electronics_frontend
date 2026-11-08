import { getGuestId } from "@/lib/guest-id";
import { createRequestId, HEADER_NAME } from "@/lib/request-id";

const NETWORK_ERROR_MESSAGE =
  "The backend is currently unavailable. Please try again later.";
const REQUEST_TIMEOUT_MS = 15_000;
const GET_RETRY_ATTEMPTS = 2;
const GET_RETRY_DELAY_MS = 400;

const AUTH_STATUS_MESSAGES = {
  401: "Your authentication session is invalid or expired.",
  403: "You do not have permission to perform this request.",
};

const STATUS_MESSAGES = {
  400: "The request was invalid.",
  404: "The requested resource was not found.",
  409: "The request conflicts with the current state of the resource.",
  422: "The request could not be processed because it failed validation.",
  500: "The backend returned an internal server error. Please try again later.",
  502: "The backend is temporarily unavailable. Please try again shortly.",
  503: "The service is temporarily unavailable. Please try again shortly.",
  504: "The backend took too long to respond. Please try again shortly.",
};

const GENERIC_ERROR_MESSAGE =
  "The backend returned an unexpected error. Please try again later.";

/**
 * Resolves a safe, human-readable message for a backend response.
 * - 401/403 always use the exact messages the product requires.
 * - Other statuses prefer the backend's own safe `message`.
 * - A status of 0 means the request never reached the backend.
 */
export function safeMessage(status, payload) {
  if (status === 0) {
    return NETWORK_ERROR_MESSAGE;
  }
  if (AUTH_STATUS_MESSAGES[status]) {
    return AUTH_STATUS_MESSAGES[status];
  }
  if (typeof payload?.message === "string" && payload.message.length > 0) {
    return payload.message;
  }
  return STATUS_MESSAGES[status] ?? GENERIC_ERROR_MESSAGE;
}

/**
 * Builds a query string from an object of params, skipping nullish/empty
 * values. Returns the path unchanged when there are no params.
 *
 * @param {string} path
 * @param {object} [params]
 * @returns {string}
 */
export function withQuery(path, params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

/**
 * Calls the authenticated backend proxy (`/api/backend/...`) from the
 * browser. The proxy attaches the server-side JWT, so the browser never
 * handles tokens here.
 *
 * Never throws: on a network failure it returns
 * `{ status: 0, ok: false, payload: null }` and the message is available via
 * `safeMessage(status, payload)`.
 *
 * @param {string} path - Backend API path, e.g. "/me" or "/admin/orders".
 * @param {object} [args]
 * @param {string} [args.method] - GET (default), POST, PUT, PATCH or DELETE.
 * @param {object} [args.body] - JSON body for non-GET requests.
 * @param {object} [args.headers] - Extra request headers.
 * @returns {Promise<{status: number, ok: boolean, payload: object|null}>}
 */
function isRetryableStatus(status) {
  return status === 500 || status === 502 || status === 503 || status === 504;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function backendRequest(
  path,
  { method = "GET", body, headers } = {}
) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const guestId = getGuestId();
  const methodUpper = String(method).toUpperCase();
  const canRetry = methodUpper === "GET" || methodUpper === "HEAD";
  const attempts = canRetry ? GET_RETRY_ATTEMPTS : 1;
  // One request id for the logical request: retries reuse it so backend logs
  // correlate every attempt of the same failing GET.
  const requestId = headers?.[HEADER_NAME] ?? createRequestId();

  let response;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      response = await fetch(`/api/backend${path}`, {
        method,
        headers: {
          ...(body !== undefined && !isFormData
            ? { "Content-Type": "application/json" }
            : {}),
          // Stable browser guest identity. The backend resolves the guest
          // customer on guest-capable routes (cart/checkout); signed-in requests
          // are forwarded with the JWT and the backend prefers Bearer, so this
          // header is inert for them.
          ...(guestId ? { "X-Guest-Id": guestId } : {}),
          ...headers,
          [HEADER_NAME]: requestId,
        },
        body:
          body !== undefined
            ? isFormData
              ? body
              : JSON.stringify(body)
            : undefined,
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      if (canRetry && attempt < attempts - 1) {
        await wait(GET_RETRY_DELAY_MS);
        continue;
      }
      return { status: 0, ok: false, payload: null };
    }

    if (canRetry && attempt < attempts - 1 && isRetryableStatus(response.status)) {
      await response.body?.cancel().catch(() => {});
      await wait(GET_RETRY_DELAY_MS);
      continue;
    }

    break;
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  return { status: response.status, ok: response.ok, payload };
}
