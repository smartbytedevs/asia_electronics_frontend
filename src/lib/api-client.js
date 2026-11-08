import { env } from "@/config/env";
import { createRequestId, HEADER_NAME } from "@/lib/request-id";

const NETWORK_ERROR_MESSAGE =
  "The backend is currently unavailable. Please try again later.";
const REQUEST_TIMEOUT_MS = 12_000;
const GET_RETRY_ATTEMPTS = 2;
const GET_RETRY_DELAY_MS = 400;

/**
 * Exact, safe messages for the security-critical statuses. These are always
 * shown verbatim regardless of what the backend body says.
 */
const AUTH_STATUS_MESSAGES = {
  401: "Your authentication session is invalid or expired.",
  403: "You do not have permission to perform this request.",
};

/**
 * Fallback messages for other statuses. The backend's own safe `message` is
 * preferred when the error envelope provides one; these are only used when it
 * does not.
 */
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

export class ApiClientError extends Error {
  constructor(message, { status = 0, code = null } = {}) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.code = code;
  }
}

function backendMessage(payload) {
  return typeof payload?.message === "string" && payload.message.length > 0
    ? payload.message
    : null;
}

function messageForStatus(status, payload) {
  const authMessage = AUTH_STATUS_MESSAGES[status];
  if (authMessage) {
    return authMessage;
  }
  return (
    backendMessage(payload) ??
    STATUS_MESSAGES[status] ??
    GENERIC_ERROR_MESSAGE
  );
}

async function parsePayload(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Minimal HTTP client for the Taqwa backend.
 *
 * - Resolves paths against `env.api.baseUrl` (never hardcoded in callers).
 * - Supports GET/POST/PUT/PATCH/DELETE, JSON bodies, and multipart form
 *   bodies (`multipart: true` forwards a `FormData` body verbatim so the
 *   browser sets the correct `multipart/form-data; boundary=...` header).
 * - Accepts an optional `token` that is sent as `Authorization: Bearer <token>`.
 *   Tokens are never persisted here, never logged, and never stored in
 *   localStorage/sessionStorage.
 * - Never logs JWTs, cookies, Authorization headers, secrets, or connection
 *   strings.
 *
 * Convenience methods (`get`/`post`/...) throw `ApiClientError` with a safe,
 * human-readable message on network failures and non-2xx responses.
 * `apiClient.raw` returns `{ status, ok, payload }` for every response so the
 * caller can forward the exact backend status and envelope without losing
 * error bodies (used by the authenticated proxy route).
 */
function isRetryableStatus(status) {
  return status === 500 || status === 502 || status === 503 || status === 504;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(
  path,
  {
    method = "GET",
    body,
    token,
    headers: extraHeaders,
    multipart = false,
    signal,
  } = {}
) {
  const methodUpper = String(method).toUpperCase();
  const canRetry = methodUpper === "GET" || methodUpper === "HEAD";
  const attempts = canRetry ? GET_RETRY_ATTEMPTS : 1;
  const headers = new Headers({ Accept: "application/json" });

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (body !== undefined && !multipart) {
    headers.set("Content-Type", "application/json");
  }
  if (extraHeaders) {
    for (const [name, value] of Object.entries(extraHeaders)) {
      if (value !== undefined && value !== null) {
        headers.set(name, value);
      }
    }
  }
  if (!headers.has(HEADER_NAME)) {
    headers.set(HEADER_NAME, createRequestId());
  }

  let response;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const timeoutSignal = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
      const requestSignal =
        signal && typeof AbortSignal.any === "function"
          ? AbortSignal.any([signal, timeoutSignal])
          : timeoutSignal;

      response = await fetch(`${env.api.baseUrl}${path}`, {
        method,
        headers,
        body:
          body !== undefined
            ? multipart
              ? body
              : JSON.stringify(body)
            : undefined,
        cache: "no-store",
        signal: requestSignal,
      });
    } catch {
      if (signal?.aborted) {
        throw new ApiClientError(NETWORK_ERROR_MESSAGE, {
          status: 0,
          code: "REQUEST_ABORTED",
        });
      }
      if (canRetry && attempt < attempts - 1) {
        await wait(GET_RETRY_DELAY_MS);
        continue;
      }
      throw new ApiClientError(NETWORK_ERROR_MESSAGE, {
        status: 0,
        code: "BACKEND_UNAVAILABLE",
      });
    }

    if (canRetry && attempt < attempts - 1 && isRetryableStatus(response.status)) {
      await response.body?.cancel().catch(() => {});
      await wait(GET_RETRY_DELAY_MS);
      continue;
    }

    break;
  }

  const payload = await parsePayload(response);
  return { status: response.status, ok: response.ok, payload };
}

function assertOk(result) {
  if (!result.ok) {
    throw new ApiClientError(messageForStatus(result.status, result.payload), {
      status: result.status,
      code: result.payload?.error?.code ?? null,
    });
  }
  return result.payload;
}

export const apiClient = {
  get: (path, options) =>
    request(path, { ...options, method: "GET" }).then(assertOk),
  post: (path, options) =>
    request(path, { ...options, method: "POST" }).then(assertOk),
  put: (path, options) =>
    request(path, { ...options, method: "PUT" }).then(assertOk),
  patch: (path, options) =>
    request(path, { ...options, method: "PATCH" }).then(assertOk),
  delete: (path, options) =>
    request(path, { ...options, method: "DELETE" }).then(assertOk),
  raw: (path, options) => request(path, options),
};
