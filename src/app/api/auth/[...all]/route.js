import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { HEADER_NAME, resolveRequestId } from "@/lib/request-id";

const handlers = toNextJsHandler(auth);

function withRequestContext(handler) {
  return async function handleAuthRequest(request) {
    const requestId = resolveRequestId(request.headers.get(HEADER_NAME));

    try {
      const response = await handler(request);
      const headers = new Headers(response.headers);
      headers.set("X-Request-Id", requestId);
      if (response.status >= 500) {
        headers.set("Cache-Control", "no-store");
      }
      const body = [101, 204, 205, 304].includes(response.status)
        ? null
        : response.body;
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch {
      const headers = new Headers({
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Request-Id": requestId,
        "Retry-After": "5",
      });
      return Response.json(
        {
          message: "Authentication is temporarily unavailable. Please try again shortly.",
          code: "AUTH_UNAVAILABLE",
          requestId,
        },
        { status: 503, headers }
      );
    }
  };
}

export const GET = withRequestContext(handlers.GET);
export const POST = withRequestContext(handlers.POST);
export const PUT = withRequestContext(handlers.PUT);
export const PATCH = withRequestContext(handlers.PATCH);
export const DELETE = withRequestContext(handlers.DELETE);
