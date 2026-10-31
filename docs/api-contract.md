# Frontend ↔ Backend API Contract

This document captures the contract between the Taqwa frontend and the Taqwa
Express backend **as the frontend consumes it**. It is derived from the
verified `src/lib/api/*` modules, the BFF proxy route, and the error-mapping
helpers. The backend's own contract is the source of truth for response
shapes; this document focuses on how the frontend addresses it.

## Base URLs

| Item | Value |
| --- | --- |
| Backend base URL | `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api/v1`) |
| BFF proxy path (browser) | `/api/backend<path>` → backend `NEXT_PUBLIC_API_URL<path>` |
| Auth base path | `BETTER_AUTH_BASE_PATH` (default `/api/auth`) |

The browser never calls the backend directly. All calls go through the BFF
proxy (`src/app/api/backend/[...path]/route.js`), which:

- attaches `Authorization: Bearer <JWT>` server-side for signed-in sessions,
- forwards anonymous public reads (catalog/categories/product reviews/outlets)
  **without** a token instead of 401ing (see the `PUBLIC_GET_PATHS` whitelist
  in the proxy route),
- forwards only the `idempotency-key` request header (whitelist),
- forwards the query string and JSON body (multipart `FormData` is forwarded
  for payment-proof uploads),
- returns the backend's **exact JSON envelope and status code**,
- maps a missing/invalid session to `401` `AUTH_REQUIRED` (except public GET
  reads) and a backend network failure to `502` `BACKEND_UNAVAILABLE`.

## Response envelope

The backend wraps all responses in a consistent envelope (see the backend's
`src/middlewares/errorHandler.js` and `src/utils/response.js`):

```jsonc
// Success
{ "success": true, "message": "...", "data": { /* resource */ } }

// Error
{ "success": false, "message": "Human readable message", "error": { "code": "ERROR_CODE" } }
```

The frontend preserves these shapes. `src/lib/api/http.js` returns
`{ status, ok, payload }` to callers; `safeMessage(status, payload)` renders a
safe message using this priority:

1. `status === 0` (network failure) → "The backend is currently unavailable…"
2. `401` → "Your authentication session is invalid or expired."
3. `403` → "You do not have permission to perform this request."
4. Otherwise the backend's own `message` (when present), then a fallback for
   the status (`400`/`404`/`409`/`422`/`500`), then a generic message.

The server-side client (`src/lib/api-client.js`) throws `ApiClientError` with
the same message rules plus `status` and `code`
(`payload.error.code`) fields.

## Authentication

- `Authorization: Bearer <JWT>` where the JWT is minted by Better Auth
  (`GET /api/auth/token`) with claims `sub`, `name`, `email`, `iss`, `aud`,
  `iat`, `exp`; RS256; issuer/audience = frontend base URL.
- The JWT carries no role. The backend links `sub` → `authProviderId` and
  resolves role/status from the MongoDB `User` record.
- Public endpoints (catalog, categories, outlets, product review reads) need
  no token. Everything else maps to backend role rules:

| Access | Roles |
| --- | --- |
| CUSTOMER | `GET /me`, cart, customer orders/payments/returns/tracking, checkout, payment proof, review submission |
| ADMIN | catalog/inventory/order/payment/return/refund/shipment/review/expense/outlet/stock-transfer/analytics writes + reads |
| ADMIN/STAFF | admin reads + order/return/refund/shipment actions, inventory reads |
| Public | `GET /products`, `GET /products/:id`, `GET /products/slug/:slug`, `GET /products/:productId/reviews`, `GET /categories`, `GET /categories/:id`, `GET /categories/slug/:slug`, `GET /outlets`, `GET /outlets/:id`, `GET /outlets/code/:code` |

## Endpoint inventory (frontend wrappers)

All paths below are appended to the backend base URL; the browser calls them
via `/api/backend…`. Sections marked **no wrapper yet** are verified against
the backend `src/routes/index.js` but have no `src/lib/api/*` module — the
`Frontend fn` column is `—` until a wrapper is added.

### Users

| Method | Path | Access | Frontend fn |
| --- | --- | --- | --- |
| GET | `/me` | any authenticated | `users.getCurrentUser` |

`GET /me` is the identity endpoint. Its `data.user` supplies `id`,
`authProviderId`, `email`, `displayName`, `phone`, `role`, and `status`, and
drives the admin RBAC gate (`src/lib/admin-auth.js`).

### Catalog (public)

| Method | Path | Frontend fn |
| --- | --- | --- |
| GET | `/categories` | `categories.getCategories` |
| GET | `/categories/:id` | `categories.getCategory` |
| GET | `/categories/slug/:slug` | `categories.getCategoryBySlug` |
| GET | `/products` | `products.getProducts` |
| GET | `/products/:id` | `products.getProduct` |
| GET | `/products/slug/:slug` | `products.getProductBySlug` |

`GET /products` supports the backend filter/sort allowlist:
`categoryId`, `featured`, `newArrival`, `bestDeal` and sorts `newest`,
`priceAsc`, `priceDesc`, `featured` (see `src/lib/api/products.js`).

### Cart (CUSTOMER) — no wrapper yet

The cart is a **server-side, per-customer draft** holding only variant
references + quantities; it never stores money. Every price/availability value
in the response is derived live from the catalog at read time and is
informational — checkout recomputes the authoritative totals. The cart body
must never carry `customerId`, prices, or discounts (rejected by the
validator); the customer id always comes from `req.user`.

| Method | Path | Access | Frontend fn |
| --- | --- | --- | --- |
| GET | `/cart` | CUSTOMER | — |
| POST | `/cart/items` | CUSTOMER | — |
| PATCH | `/cart/items/:id` | CUSTOMER | — |
| DELETE | `/cart/items/:id` | CUSTOMER | — |
| DELETE | `/cart` | CUSTOMER | — |

`POST /cart/items` takes `{ productVariantId, quantity }`;
`PATCH /cart/items/:id` takes `{ quantity }`. Each response returns the whole
cart: `data.cart` with `items[]` (each exposing `productVariantId`,
`quantity`, `product`, `variant`, `priceMinorUnits`,
`availableOnlineQuantity`, `isAvailable`), `itemCount`, and
`itemsSubtotalMinorUnits`.

### Product reviews

Customers submit reviews that start `PENDING`; ADMIN approves or rejects
(terminal — no reversal). Only `APPROVED` reviews are ever exposed publicly.
Status values: `PENDING`, `APPROVED`, `REJECTED`. There is deliberately **no
purchase-verification rule** (the backend does not require a prior purchase).
`rating` is 1–5; `comment` is optional (≤ 2000 chars). `customerId` and
`customerDisplayName` always come from the authenticated user, never the body.
Customer review submission has no wrapper yet.

| Method | Path | Access | Frontend fn |
| --- | --- | --- | --- |
| GET | `/products/:productId/reviews` | Public | `reviews.getProductReviews` |
| POST | `/products/:productId/reviews` | CUSTOMER | — |
| GET | `/admin/reviews` | ADMIN | — |
| GET | `/admin/reviews/:id` | ADMIN | — |
| POST | `/admin/reviews/:id/approve` | ADMIN | — |
| POST | `/admin/reviews/:id/reject` | ADMIN | — |

`GET /products/:productId/reviews` returns `data.reviews` (public view: `id`,
`productId`, `customerDisplayName`, `rating`, `comment`, `createdAt`) plus
`data.pagination` and a `data.averageRating` / `data.ratingBreakdown` summary.
`GET /admin/reviews` supports `status`, `productId`, `page`, `limit` and
returns the admin view (adds `customerId`, `status`, `statusHistory`,
`approvedBy/At`, `rejectedBy/At`). Approve/reject take an optional
`{ note }` body.

### Inventory & reservations (ADMIN)

All inventory endpoints are ADMIN-only. Stock lives in two **locations**,
`ONLINE` and `OFFLINE`; the serializer derives `availableOnlineQuantity`
(`onlineQuantity − reservedQuantity`), `totalPhysicalQuantity`, `isLowStock`,
and `isOutOfStock` (see `inventory.serializer.js`). Since Phase 14, an
Inventory record may be scoped to an `outletId` (per-outlet stock).

A stock **subject** is either a ProductVariant (`productId` +
`productVariantId`) or a Simple Product — a product with zero variants —
identified by `productId` with `productVariantId: null`. Serialized records
always expose both `productId` and `productVariantId` (null for simple
products). The variant-scoped read endpoints below do not cover simple
products; mutations do. The backend never invents variants for simple
products.

| Method | Path | Access | Frontend fn |
| --- | --- | --- | --- |
| GET | `/inventory` | ADMIN | `inventory.getInventory` |
| GET | `/inventory/low-stock` | ADMIN | `inventory.getLowStock` |
| GET | `/inventory/:productVariantId` | ADMIN | `inventory.getInventoryByVariant` |
| GET | `/inventory/:productVariantId/movements` | ADMIN | `inventory.getInventoryMovements` |
| POST | `/inventory/initialize` | ADMIN | — (no wrapper yet) |
| POST | `/inventory/stock-in` | ADMIN | — (no wrapper yet) |
| POST | `/inventory/stock-out` | ADMIN | — (no wrapper yet) |
| POST | `/inventory/transfer` | ADMIN | — (no wrapper yet) |
| POST | `/inventory/adjust` | ADMIN | — (no wrapper yet) |
| GET | `/inventory/reservations` | ADMIN | `reservations.getReservations` |
| GET | `/inventory/reservations/:id` | ADMIN | `reservations.getReservation` |
| POST | `/inventory/reservations` | ADMIN | — (no wrapper yet) |
| POST | `/inventory/reservations/:id/release` | ADMIN | — (no wrapper yet) |
| POST | `/inventory/reservations/:id/consume` | ADMIN | — (no wrapper yet) |
| POST | `/inventory/reservations/:id/expire` | ADMIN | — (no wrapper yet) |

Inventory mutation bodies identify the subject with `productId` +
`productVariantId` (`productVariantId` is `null` for a Simple Product; legacy
variant-only callers may send `productVariantId` alone): `initialize` also
accepts optional `outletId`, `onlineQuantity`, `offlineQuantity`,
`lowStockThreshold`; `stock-in`/`stock-out` take `location`
(`ONLINE`/`OFFLINE`), `quantity`, `reason?`; `transfer` takes `fromLocation`,
`toLocation`, `quantity`, `reason?`; `adjust` takes `location`, a **signed**
non-zero `quantity` (positive = increase, negative = decrease), `reason?`.
Reservation mutations take `productVariantId`, `quantity`, `referenceType`,
`referenceId`, `expiresAt?`, `metadata?`. Every mutation writes an immutable
ledger movement in the same transaction and records `performedBy` from the
authenticated user — never the body.

### Orders

| Method | Path | Access | Frontend fn |
| --- | --- | --- | --- |
| POST | `/orders/checkout` | CUSTOMER | `orders.checkoutOrder` |
| GET | `/orders` | CUSTOMER | `orders.getMyOrders` |
| GET | `/orders/:id` | CUSTOMER | `orders.getMyOrder` |
| POST | `/orders/:id/cancel` | CUSTOMER | `orders.cancelMyOrder` |
| GET | `/admin/orders` | ADMIN/STAFF | `orders.getAdminOrders` |
| GET | `/admin/orders/:id` | ADMIN/STAFF | `orders.getAdminOrder` |
| POST | `/admin/orders/:id/confirm` | ADMIN/STAFF | `orders.confirmOrder` |
| POST | `/admin/orders/:id/process` | ADMIN/STAFF | `orders.processOrder` |
| POST | `/admin/orders/:id/reject` | ADMIN/STAFF | `orders.rejectOrder` |

`GET /admin/orders` supports `status`, `customerId`, `page`, `limit`. The
dashboard reads `data.orders` and `data.pagination.total`.

### Payments

| Method | Path | Access | Frontend fn |
| --- | --- | --- | --- |
| GET | `/orders/:orderId/payment` | CUSTOMER | `payments.getMyPayment` |
| POST | `/orders/:orderId/payment` | CUSTOMER | `payments.submitPayment` |
| GET | `/payment-methods` | CUSTOMER | `payments.getPaymentMethods` |
| GET | `/admin/payments` | ADMIN/STAFF | `payments.getAdminPayments` |
| GET | `/admin/payments/:id` | ADMIN/STAFF | `payments.getAdminPayment` |
| POST | `/admin/payments/:id/verify` | ADMIN/STAFF | `payments.verifyPayment` |
| POST | `/admin/payments/:id/reject` | ADMIN/STAFF | `payments.rejectPayment` |

`POST /orders/:orderId/payment` sends a `FormData` body (payment proof image)
and requires an `Idempotency-Key` header.

There is no admin GET list for payment methods; management is write-only
(`POST /admin/payment-methods`, `PATCH /admin/payment-methods/:id`), so no
frontend wrapper exists.

### Courier / shipments

| Method | Path | Access | Frontend fn |
| --- | --- | --- | --- |
| GET | `/admin/shipments` | ADMIN/STAFF | `courier-shipments.getAdminShipments` |
| GET | `/admin/shipments/:shipmentId` | ADMIN/STAFF | `courier-shipments.getAdminShipment` |
| GET | `/orders/:orderId/tracking` | CUSTOMER | `courier-shipments.getOrderTracking` |
| POST | `/admin/orders/:orderId/courier/dispatch` | ADMIN/STAFF | `courier-shipments.dispatchShipment` |
| POST | `/admin/shipments/:shipmentId/retry` | ADMIN/STAFF | `courier-shipments.retryDispatch` |
| POST | `/admin/shipments/:shipmentId/cancel` | ADMIN/STAFF | `courier-shipments.cancelShipment` |

`POST /webhooks/pathao` is a public, signed backend webhook — intentionally
not part of the frontend API surface.

### Returns

| Method | Path | Access | Frontend fn |
| --- | --- | --- | --- |
| GET | `/orders/:orderId/returns` | CUSTOMER | `returns.getMyReturns` |
| GET | `/orders/:orderId/returns/:returnId` | CUSTOMER | `returns.getMyReturn` |
| POST | `/orders/:orderId/returns` | CUSTOMER | `returns.createReturn` |
| POST | `/orders/:orderId/returns/:returnId/cancel` | CUSTOMER | `returns.cancelMyReturn` |
| GET | `/admin/returns` | ADMIN/STAFF | `returns.getAdminReturns` |
| GET | `/admin/returns/:id` | ADMIN/STAFF | `returns.getAdminReturn` |
| POST | `/admin/returns/:id/approve` | ADMIN/STAFF | `returns.approveReturn` |
| POST | `/admin/returns/:id/reject` | ADMIN/STAFF | `returns.rejectReturn` |
| POST | `/admin/returns/:id/complete` | ADMIN/STAFF | `returns.completeReturn` |
| POST | `/admin/returns/:id/cancel` | ADMIN/STAFF | `returns.cancelReturn` |

`GET /admin/returns` supports `status`, `returnNumber`, `orderNumber`,
`dateFrom`, `dateTo`, `page`, `limit`.

### Refunds

| Method | Path | Access | Frontend fn |
| --- | --- | --- | --- |
| GET | `/admin/refunds` | ADMIN/STAFF | `refunds.getAdminRefunds` |
| GET | `/admin/refunds/:id` | ADMIN/STAFF | `refunds.getAdminRefund` |
| POST | `/admin/refunds/:id/process` | ADMIN/STAFF | `refunds.processRefund` |
| POST | `/admin/refunds/:id/void` | ADMIN/STAFF | `refunds.voidRefund` |

`GET /admin/refunds` supports `status`, `refundNumber`, `dateFrom`, `dateTo`,
`page`, `limit`.

### Expenses (ADMIN) — no wrapper yet

Append-only finance ledger (create + list + get; **no** update/delete).
`amountMinorUnits` and `description` are required; `category` and `expenseDate`
are optional. The acting admin (`createdBy`) always comes from `req.user`.

| Method | Path | Access | Frontend fn |
| --- | --- | --- | --- |
| POST | `/admin/expenses` | ADMIN | — |
| GET | `/admin/expenses` | ADMIN | — |
| GET | `/admin/expenses/:id` | ADMIN | — |

`GET /admin/expenses` supports `category`, `dateFrom`, `dateTo`, `page`,
`limit`. Response fields: `amountMinorUnits`, `category`, `description`,
`expenseDate`, `createdBy` (safe user ref or `{ id }`), `createdAt`,
`updatedAt`.

### Analytics (ADMIN) — no wrapper yet

Read-only dashboard metrics over a date range. Metric definitions: `sales` =
VERIFIED payments only, `refunds` = PROCESSED refunds only, `expenses` =
Expense lines, `net` = sales − refunds − expenses. Without `dateFrom`/`dateTo`
the backend defaults to a trailing window. All money is in minor units.

| Method | Path | Access | Frontend fn |
| --- | --- | --- | --- |
| GET | `/admin/analytics/summary` | ADMIN | — |
| GET | `/admin/analytics/daily` | ADMIN | — |

`/summary` returns `data.range` (`{ from, to }`), `totalOrders`,
`totalSalesMinorUnits`, `totalRefundsMinorUnits`, `totalExpensesMinorUnits`,
`netMinorUnits`, and `orderStatusCounts`. `/daily` returns `data.range` and a
zero-filled `data.daily[]` series of `{ date (YYYY-MM-DD, UTC), orders, sales,
refunds, expenses, net }`.

### Outlets

Outlet management is ADMIN-only and deactivation is always soft
(`isActive: false`, never deletion) so historical per-outlet inventory stays
intact. Storefront reads expose **ACTIVE outlets only** (inactive behave as
not-found); admin reads include inactive. Public outlet shape: `id`, `name`,
`code`, `address`, `phone`, `isActive`, `createdAt`, `updatedAt`.
— No frontend wrapper yet.

| Method | Path | Access | Frontend fn |
| --- | --- | --- | --- |
| GET | `/outlets` | Public | — |
| GET | `/outlets/:id` | Public | — |
| GET | `/outlets/code/:code` | Public | — |
| POST | `/admin/outlets` | ADMIN | — |
| GET | `/admin/outlets` | ADMIN | — |
| GET | `/admin/outlets/:id` | ADMIN | — |
| PATCH | `/admin/outlets/:id` | ADMIN | — |

`POST /admin/outlets` requires `name` and `code` (uppercased, must match
`/^[A-Z0-9][A-Z0-9_-]*$/`); `address`, `phone`, `isActive` are optional.
`PATCH` accepts any subset.

### Stock transfers (ADMIN) — no wrapper yet

Moves physical stock between two outlets for one variant, in a single
transaction (source outlet stock decremented, destination incremented,
ledger + transfer record in the same commit). The acting user (`createdBy`)
always comes from `req.user`.

| Method | Path | Access | Frontend fn |
| --- | --- | --- | --- |
| POST | `/admin/stock-transfers` | ADMIN | — |
| GET | `/admin/stock-transfers` | ADMIN | — |
| GET | `/admin/stock-transfers/:id` | ADMIN | — |

`POST /admin/stock-transfers` body: `sourceOutletId`, `destinationOutletId`
(must differ), `productVariantId`, `quantity` (positive integer), `reason?`.
`GET /admin/stock-transfers` supports `page`, `limit`.

### Notifications

There are **no** notification endpoints. The backend notification service is
internal-only; `src/lib/api/notifications.js` documents this and defines
nothing so no endpoint is invented.

## Idempotency

Write endpoints that create resources (checkout, payment proof submission)
must be retried safely. The frontend sends an `Idempotency-Key` header:

- `POST /orders/checkout`
- `POST /orders/:orderId/payment`

The BFF proxy forwards `idempotency-key` (case-insensitive HTTP headers) from
the browser to the backend. Callers generate the key (e.g. per checkout
attempt) and keep it stable across retries so the backend returns the original
result (201 first time, 200 on replay) instead of creating duplicates.

## API testing page

`/admin/api-test` (`src/app/(admin)/admin/api-test/`) is a read-only explorer
of the backend contract. It exercises only `GET` endpoints through the proxy
and marks each as public, ADMIN, ADMIN/STAFF, or CUSTOMER (CUSTOMER-only
endpoints return `403` for admin accounts, which the page documents as
expected). It renders status + `safeMessage` + the raw JSON envelope.

## Money and formatting

- Money is exchanged as integer **minor units** (paisa), e.g.
  `grandTotalMinorUnits: 150000`. Floats are never sent by the backend.
- `formatMinorUnits` (src/lib/utils.js) divides by 100 for display only.
- Order summaries read `data.orders[*].totals.grandTotalMinorUnits`,
  `paymentMethod`, `status`, `orderNumber`, `createdAt`, and
  `delivery.address.fullName`.
