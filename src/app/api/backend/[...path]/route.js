import { apiClient } from "@/lib/api-client";
import { getBackendAccessToken } from "@/lib/backend-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUTH_FAILED_PAYLOAD = {
  success: false,
  message: "Your authentication session is invalid or expired.",
  error: { code: "AUTH_REQUIRED" },
};

const BACKEND_UNAVAILABLE_PAYLOAD = {
  success: false,
  message: "The backend is currently unavailable. Please try again later.",
  error: { code: "BACKEND_UNAVAILABLE" },
};

const FORWARDED_HEADERS = new Set(["idempotency-key", "x-guest-id"]);

/**
 * Public read endpoints the backend serves without a token. When the session
 * lookup fails for one of these GETs, the proxy forwards the request
 * token-less instead of 401ing — storefront visitors may browse the catalog,
 * check an order's status (order id/number + phone), and read payment methods
 * without signing in. Everything else still requires a valid session (or a
 * valid `X-Guest-Id`, see below).
 */
const PUBLIC_GET_PATHS = [
  /^\/categories$/,
  /^\/categories\/[^/]+$/,
  /^\/categories\/slug\/[^/]+$/,
  /^\/products$/,
  /^\/products\/[^/]+$/,
  /^\/products\/slug\/[^/]+$/,
  /^\/products\/[^/]+\/reviews$/,
  /^\/products\/[^/]+\/availability$/,
  /^\/orders\/status$/,
  /^\/payment-methods$/,
  /^\/outlets$/,
  /^\/outlets\/[^/]+$/,
  /^\/outlets\/code\/[^/]+$/,
];

function isPublicGet(pathname, method) {
  return method === "GET" && PUBLIC_GET_PATHS.some((re) => re.test(pathname));
}

/**
 * Authenticated backend proxy (with anonymous public reads).
 *
 * The browser never talks to the Taqwa backend directly and never sees the
 * JWT. This route acquires the Better Auth JWT for the current session
 * server-side, forwards the request to the real backend, and returns the
 * backend's exact JSON envelope with its exact status code.
 *
 * Signed-in sessions are forwarded with their JWT for every path. Anonymous
 * visitors may read the public catalog (categories, products, product reviews,
 * outlets) via the whitelist above; those requests are forwarded without an
 * Authorization header.
 *
 * Error statuses are preserved as-is (including 401/403 from the backend) so
 * callers can render the exact, safe messages defined by the backend contract.
 */
async function handle(request, { params }) {
  const { path } = await params;
  const pathname = `/${path.join("/")}`;
  const guestIdHeader = request.headers.get("x-guest-id")?.trim();

  let token;
  try {
    token = await getBackendAccessToken({ headers: request.headers });
  } catch {
    // No session. Guest-capable backend routes (cart, checkout, payment proof)
    // resolve the customer from the `X-Guest-Id` header, so forward token-less
    // when one is present; public GETs also pass through; everything else 401s.
    if (!guestIdHeader && !isPublicGet(pathname, request.method)) {
      return Response.json(AUTH_FAILED_PAYLOAD, { status: 401 });
    }
  }

  const forwardedHeaders = {};
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      forwardedHeaders[name] = value;
    }
  }

  let body;
  let multipart = false;
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (request.method !== "GET" && request.method !== "HEAD") {
    if (contentType.includes("multipart/form-data")) {
      // Read the raw FormData and forward it verbatim so the backend receives
      // the real multipart body (file uploads). The token is still attached
      // server-side; the browser never handles credentials.
      try {
        body = await request.formData();
        multipart = true;
      } catch {
        body = undefined;
      }
    } else if (contentType.includes("application/json")) {
      try {
        body = await request.json();
      } catch {
        body = undefined;
      }
    }
  }

  let result;
  try {
    const search = new URL(request.url).search;
    result = await apiClient.raw(`${pathname}${search}`, {
      method: request.method,
      body,
      multipart,
      token,
      headers: forwardedHeaders,
    });
  } catch {
    return Response.json(BACKEND_UNAVAILABLE_PAYLOAD, { status: 502 });
  }

  return Response.json(result.payload ?? { success: result.ok }, {
    status: result.status,
  });
}

export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
