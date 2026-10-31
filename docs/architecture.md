# Frontend Architecture

This document describes the current Taqwa frontend: its stack, module layout,
authentication model, and how it talks to the Taqwa backend. It is written
from the verified source tree and is intentionally scoped to what exists
today.

## Overview

- **Next.js 16 (App Router)** + **React 19**, JavaScript (JSX) — no TypeScript
  yet.
- **Better Auth 1.6.26** owns authentication and sessions (email + password),
  with the **jwt plugin** so the frontend acts as a local identity provider for
  the backend.
- **MongoDB** (native `mongodb` driver) persists Better Auth data (users,
  sessions, accounts, verification, JWKS). The database name comes from
  `MONGODB_URI`.
- The frontend talks to the Express backend **only through an authenticated
  BFF proxy route** (`/api/backend/...`). The browser never sees the JWT.
- Styling is **Tailwind CSS v4** with small hand-rolled UI primitives.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js `16.3.0` (App Router), React `19.2.8` |
| Language | JavaScript (JSX) |
| Auth | `better-auth@1.6.26` + `better-auth/adapters/mongodb` |
| Database (auth persistence) | `mongodb@^7` native driver |
| Styling | `tailwindcss@^4`, `@tailwindcss/postcss` |
| Config | `next.config.mjs` (React Compiler enabled via `reactCompiler: true`) |

## Module layout

```
src/
├── app/
│   ├── (storefront)/page.js          # Home page (public)
│   ├── (storefront)/login/page.js    # Sign in
│   ├── (storefront)/register/page.js # Sign up
│   ├── (dashboard)/dashboard/    # Customer dashboard (session-gated)
│   ├── (admin)/admin/            # Admin area (role-gated)
│   ├── api/auth/[...all]/route.js   # Better Auth endpoints
│   ├── api/backend/[...path]/route.js # Authenticated BFF proxy to the backend
│   ├── layout.js                 # Root layout
│   ├── loading.js / error.js / global-error.js / not-found.js
├── components/ui/                # Button, Card, Input, Label primitives
├── config/env.js                 # Central env config (api + auth URLs)
└── lib/
    ├── auth.js                   # Server-side Better Auth instance
    ├── auth-client.js            # Browser auth client (client components)
    ├── mongodb.js                # Shared MongoDB client for Better Auth
    ├── backend-auth.js           # Server-side JWT acquisition for the backend
    ├── api-client.js             # Minimal HTTP client (server-side, Bearer JWT)
    ├── api/
    │   ├── http.js               # Browser-safe proxy client (fetch /api/backend)
    │   └── categories.js products.js inventory.js reservations.js orders.js
    │       payments.js courier-shipments.js returns.js refunds.js
    │       notifications.js users.js   # Per-domain endpoint wrappers
    ├── admin-auth.js             # Admin RBAC gate (ADMIN/STAFF)
    └── utils.js                  # cn, formatMinorUnits, formatDate
```

## Route groups

- **`(storefront)`** — the public storefront: home (`/`), sign-in (`/login`),
  and sign-up (`/register`). Wraps pages in the storefront header/footer,
  cart + wishlist providers, and the page transition.
- **`(dashboard)`** — `/dashboard`. Server component checks the Better Auth
  session (`auth.api.getSession`) and redirects to `/login` when absent. It
  also fetches `GET /api/v1/me` (with the server-minted JWT) and renders the
  application user's role/status from the backend.
- **`(admin)`** — `/admin` (redirects to `/admin/dashboard`). Wrapped in an
  RBAC gate (see below). Admin accounts only; `CUSTOMER` accounts get an
  "access denied" screen, non-admins without a session are redirected.

## Authentication model

Two identities exist and are deliberately separate (see
`docs/auth-integration.md` for the full contract):

1. **Better Auth identity** (frontend): users/sessions in MongoDB
   (`user`, `session`, `account`, `verification`, `jwks` collections).
2. **Application identity** (backend): the Express `User` record in MongoDB,
   linked to the auth identity via `authProviderId` (the JWT `sub`), holding
   the authoritative `role` (`ADMIN`/`STAFF`/`CUSTOMER`) and `status`
   (`ACTIVE`/`SUSPENDED`/`DISABLED`).

The JWT carries **no role claim**, and even if it did, the backend ignores it
(`src/integrations/auth/identity.js` drops any role). The role is always read
from the backend's database record.

### Server instance — `src/lib/auth.js`

Creates the Better Auth instance with the MongoDB adapter, `emailAndPassword`
enabled, and the `jwt` plugin:

- RSA `RS256`, 2048-bit key pair; the private key is encrypted at rest with
  `BETTER_AUTH_SECRET` and stored in the `jwks` collection (stable `kid`).
- JWT issuer/audience default to `env.auth.baseUrl`; expiry default `15m`.

### Browser client — `src/lib/auth-client.js`

`createAuthClient` from `better-auth/react`, bound to the same base URL/path.
Used by client components for sign-in/sign-out.

### Endpoints — `src/app/api/auth/[...all]/route.js`

`toNextJsHandler(auth)` exposes every Better Auth endpoint under the auth base
path (default `/api/auth`), including:

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/sign-up/email` | Create account |
| POST | `/sign-in/email` | Sign in |
| POST | `/sign-out` | Sign out (CSRF origin-checked) |
| GET | `/get-session` | Current session |
| GET | `/token` | Mint a JWT for the current session |
| GET | `/jwks` | Public JWK set (public keys only) |

### MongoDB — `src/lib/mongodb.js`

Server-only; reads `MONGODB_URI`, caches the `MongoClient` on `globalThis`
(Next.js compiles route handlers and server components into separate module
graphs, so the cached handle avoids duplicate connection pools). The driver
connects lazily on first use. `MONGODB_URI` is never logged and never bundled
client-side.

## Backend integration

Two paths call the backend; both use the same JWT but never expose it to the
browser.

### 1. Server-side direct calls (`apiClient`)

`src/lib/api-client.js` resolves paths against `env.api.baseUrl`
(`NEXT_PUBLIC_API_URL`, default `http://localhost:4000/api/v1`), sends
`Authorization: Bearer <token>` when a token is passed, and throws
`ApiClientError` with a safe pre-mapped message on failure (401/403 always
use the exact product-defined strings; network failures return status `0`).

Used by `src/lib/backend-auth.js` (`authenticatedRequest`), the customer
dashboard page, `src/lib/admin-auth.js`, and the `/api/backend` proxy route.

The JWT itself is obtained server-side via `auth.api.getToken`
(`src/lib/backend-auth.js`). Tokens are never logged or persisted.

### 2. BFF proxy — `src/app/api/backend/[...path]/route.js`

```
Browser (fetch /api/backend/...)  →  /api/backend/[...path] route  →  Express backend
        no token in the browser          attaches Authorization: Bearer <JWT>
```

- The route acquires the Better Auth JWT for the current session from the
  incoming cookies (`getBackendAccessToken`).
- Forwards method, path, query string, JSON body, and only a whitelisted set
  of headers (`idempotency-key`) to the backend.
- Returns the backend's **exact JSON envelope and status code** (including
  `401`/`403`), so callers render the same safe messages the backend defines.
- On missing/invalid session → `401 AUTH_REQUIRED`; on backend network failure
  → `502 BACKEND_UNAVAILABLE`.

### Browser data layer — `src/lib/api/*`

Each `src/lib/api/<domain>.js` module wraps the backend contract for its
domain through `backendRequest` (`src/lib/api/http.js`), which:

- fetches `/api/backend<path>` (no token handling in the browser),
- supports JSON bodies and `FormData` (used for payment-proof uploads),
- never throws — returns `{ status, ok, payload }`, with a `status: 0`
  result on network failure; use `safeMessage(status, payload)` to render a
  safe message.

`withQuery(path, params)` builds a query string, skipping nullish/empty
values. Filter/sort allowlists for the catalog live in `src/lib/api/products.js`.

Domain modules and what they wrap:

| Module | Backend surface |
| --- | --- |
| `users.js` | `GET /me` |
| `categories.js` | `GET /categories`, `GET /categories/:id`, `GET /categories/slug/:slug`, `POST/PATCH` (write) |
| `products.js` | `GET /products`, `GET /products/:id`, `GET /products/slug/:slug`, `POST/PATCH` (write) |
| `inventory.js` | `GET /inventory`, `/low-stock`, `/inventory/:variantId`, `:variantId/movements`, stock `initialize`/`stock-in`/`stock-out`/`transfer`/`adjust` (write) |
| `reservations.js` | `GET /inventory/reservations`, `:id`, create/release/consume/expire (write) |
| `orders.js` | `GET /orders`, `GET /orders/:id`, `POST /orders/checkout` (write, idempotency-key), `POST /orders/:id/cancel`, admin orders list/get/confirm/process/reject (write) |
| `payments.js` | `GET /orders/:orderId/payment`, `POST /orders/:orderId/payment` (multipart proof + idempotency-key), `GET /payment-methods`, admin payments list/get/verify/reject (write) |
| `courier-shipments.js` | `GET /admin/shipments`, `:shipmentId`, `GET /orders/:orderId/tracking`, dispatch/retry/cancel (write) |
| `returns.js` | customer `GET /orders/:orderId/returns[:/:returnId]`, `POST` create/cancel; admin list/get/approve/reject/complete/cancel (write) |
| `refunds.js` | `GET /admin/refunds`, `:id`, process/void (write) |
| `analytics.js` | `GET /admin/analytics/summary`, `GET /admin/analytics/daily` (read-only dashboard metrics, optional `dateFrom`/`dateTo`) |
| `notifications.js` | none — the backend has **no** notification REST endpoints; documented as intentionally empty |

## Admin area

### RBAC gate — `src/lib/admin-auth.js`

`getAdminAccess()` (wrapped in React `cache()` so the layout and pages of a
request share one `/me` call):

1. Reads the Better Auth session; no session → `redirect("/login")`.
2. Mints the JWT and calls `GET /api/v1/me`.
3. Returns a discriminated result:
   - `{ status: "authorized", user }` when role is `ADMIN` or `STAFF`,
   - `{ status: "forbidden" }` for other roles,
   - `{ status: "error", message }` when the backend is unreachable or the
     token can't be obtained.

The role always comes from the backend `/me` response (MongoDB `User`), never
from the session, JWT claims, cookies, or client state. The `(admin)` layout
renders the `AdminShell` for authorized users, `AccessDenied` for forbidden,
and a `GateError` screen for errors.

### Admin dashboard — `src/app/(admin)/admin/dashboard`

`/admin/dashboard` is a server page (wrapped in the RBAC gate) that renders an
interactive `AnalyticsDashboard` client component. It reads the real analytics
endpoints through the browser proxy wrappers in `src/lib/api/analytics.js`:

- `GET /admin/analytics/summary` → KPI cards (total orders, sales, refunds,
  expenses, net — all in integer minor units, rendered as BDT) plus the order
  status breakdown (`orderStatusCounts`).
- `GET /admin/analytics/daily` → a lightweight SVG line chart of daily sales,
  refunds, expenses and net (no chart library).

The date range defaults to the backend's trailing 30-day window (no params);
Today / Last 7 days compute explicit `dateFrom`/`dateTo`, and Custom posts a
chosen range. Loading uses a skeleton, errors render the pre-mapped safe
message with a retry action, and empty/zero periods show quiet empty states.
Entrance animation is subtle Motion and always plays — reduced-motion
preferences are intentionally ignored so it behaves identically on every
device.

Prior to this iteration the dashboard used `src/lib/admin-dashboard.js`
(product/category/order/payment counts); that data layer and its components
were removed when the analytics dashboard replaced it.

## Configuration

`src/config/env.js` normalizes env into `env.api.baseUrl` and
`env.auth.baseUrl` / `env.auth.basePath` / `env.auth.trustedOrigins` with
production defaults (`https://taqwa-backend.vercel.app/api/v1`,
`https://www.taqwactg.com`, `/api/auth`). See `.env.example`:

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://taqwa-backend.vercel.app/api/v1` | Backend base URL (browser-reachable; used server-side too) |
| `BETTER_AUTH_SECRET` | — | Signs session tokens + encrypts the JWT private key at rest (server-only, never committed) |
| `BETTER_AUTH_URL` | `https://www.taqwactg.com` | Public base URL of this app |
| `BETTER_AUTH_BASE_PATH` | `/api/auth` | Mount path of the Better Auth API |
| `BETTER_AUTH_TRUSTED_ORIGINS` | — | Comma-separated extra trusted browser origins (base URL origin is always trusted) |
| `BETTER_AUTH_JWT_ALGORITHM` | `RS256` | JWT plugin key algorithm |
| `BETTER_AUTH_JWT_EXPIRATION_TIME` | `15m` | JWT lifetime |
| `MONGODB_URI` | — | MongoDB connection for Better Auth persistence (server-only) |

## UI

`src/components/ui/` holds small Tailwind primitives (`Button`, `Card`,
`Input`, `Label`). `src/lib/utils.js` provides `cn`, `formatMinorUnits`
(minor-units → `৳1,500.00`), and `formatDate`. Money is always handled as
integer minor units; floats are never sent by the backend.

## Security notes

- The JWT and `BETTER_AUTH_SECRET` are server-only. The browser talks only to
  `/api/backend`, which attaches the token server-side.
- Tokens, cookies, secrets, and connection strings are never logged; error
  bodies are mapped to safe, pre-defined messages before reaching the UI.
- The authoritative application role comes from the backend database record;
  client-controlled role claims never reach authorization.
- Production URLs, issuer/audience, and JWKS values are **not** established
  yet; the current environment is local development only.

## Verification

Run `npm run dev` and:

1. Register at `/register` → redirected to `/dashboard`, which shows the
   backend account from `GET /api/v1/me` (role `CUSTOMER`, status `ACTIVE`).
2. Sign out → `/dashboard` redirects to `/login`.
3. Sign in with a `CUSTOMER` account and visit `/admin` → access denied.
4. Visit `/admin` with an `ADMIN`/`STAFF` account → the admin shell and
   dashboard load.
5. `/admin/api-test` exercises the read-only endpoint explorer against the
   backend through the proxy.
