"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { safeMessage } from "@/lib/api/http";
import { getCurrentUser } from "@/lib/api/users";
import {
  getProduct,
  getProductBySlug,
  getProducts,
} from "@/lib/api/products";
import { getCategories } from "@/lib/api/categories";
import {
  getInventory,
  getInventoryByVariant,
  getInventoryMovements,
  getLowStock,
} from "@/lib/api/inventory";
import { getReservations } from "@/lib/api/reservations";
import {
  getAdminOrder,
  getAdminOrders,
  getMyOrders,
} from "@/lib/api/orders";
import {
  getAdminPayment,
  getAdminPayments,
  getMyPayment,
  getPaymentMethods,
} from "@/lib/api/payments";
import {
  getAdminReturn,
  getAdminReturns,
  getMyReturn,
  getMyReturns,
} from "@/lib/api/returns";
import { getAdminRefund, getAdminRefunds } from "@/lib/api/refunds";
import {
  getAdminShipment,
  getAdminShipments,
  getOrderTracking,
} from "@/lib/api/courier-shipments";
import { getAdminCustomer, getAdminCustomers } from "@/lib/api/customers";
import {
  getAdminNotification,
  getAdminNotifications,
} from "@/lib/api/notifications";

const READ_ONLY = "Read-only — no data is modified.";

const ENDPOINTS = [
  {
    id: "users-me",
    section: "Users",
    label: "GET /me",
    description:
      "Current authenticated user. Works for any role (admin, staff or customer).",
    run: () => getCurrentUser(),
    params: [],
  },
  {
    id: "categories-list",
    section: "Catalog",
    label: "GET /categories",
    description: "Active categories. Public endpoint, no auth required.",
    run: () => getCategories(),
    params: [],
  },
  {
    id: "products-list",
    section: "Catalog",
    label: "GET /products?page=1&limit=5",
    description: "Paginated product cards. Public endpoint.",
    run: () => getProducts({ page: 1, limit: 5 }),
    params: [],
  },
  {
    id: "products-featured",
    section: "Catalog",
    label: "GET /products?featured=true&page=1&limit=5",
    description: "Product list filtered to featured items. Public endpoint.",
    run: () => getProducts({ featured: "true", page: 1, limit: 5 }),
    params: [],
  },
  {
    id: "products-by-id",
    section: "Catalog",
    label: "GET /products/:id",
    description: "Full product by id. Public endpoint.",
    run: (id) => getProduct(id),
    params: ["id"],
  },
  {
    id: "products-by-slug",
    section: "Catalog",
    label: "GET /products/slug/:slug",
    description: "Full product by slug. Public endpoint.",
    run: (slug) => getProductBySlug(slug),
    params: ["slug"],
  },
  {
    id: "inventory-list",
    section: "Inventory",
    label: "GET /inventory?page=1&limit=5",
    description: "Paginated inventory list. ADMIN only.",
    run: () => getInventory({ page: 1, limit: 5 }),
    params: [],
  },
  {
    id: "inventory-low-stock",
    section: "Inventory",
    label: "GET /inventory/low-stock",
    description: "Items at or below the low-stock threshold. ADMIN only.",
    run: () => getLowStock(),
    params: [],
  },
  {
    id: "inventory-by-variant",
    section: "Inventory",
    label: "GET /inventory/:productVariantId",
    description: "Inventory record for one variant. ADMIN only.",
    run: (productVariantId) => getInventoryByVariant(productVariantId),
    params: ["productVariantId"],
  },
  {
    id: "inventory-movements",
    section: "Inventory",
    label: "GET /inventory/:productVariantId/movements",
    description: "Stock movement ledger for one variant. ADMIN only.",
    run: (productVariantId) =>
      getInventoryMovements(productVariantId, { page: 1, limit: 5 }),
    params: ["productVariantId"],
  },
  {
    id: "reservations-list",
    section: "Reservations",
    label: "GET /inventory/reservations?page=1&limit=5",
    description: "Paginated reservation list. ADMIN only.",
    run: () => getReservations({ page: 1, limit: 5 }),
    params: [],
  },
  {
    id: "orders-my",
    section: "Orders",
    label: "GET /orders",
    description:
      "Current customer's orders. CUSTOMER only — admin accounts get a 403, which is expected.",
    run: () => getMyOrders(),
    params: [],
  },
  {
    id: "orders-admin-list",
    section: "Orders",
    label: "GET /admin/orders?page=1&limit=5",
    description: "Paginated order list. ADMIN/STAFF only.",
    run: () => getAdminOrders({ page: 1, limit: 5 }),
    params: [],
  },
  {
    id: "orders-admin-by-id",
    section: "Orders",
    label: "GET /admin/orders/:id",
    description: "Single order by id. ADMIN/STAFF only.",
    run: (id) => getAdminOrder(id),
    params: ["id"],
  },
  {
    id: "payments-methods",
    section: "Payments",
    label: "GET /payment-methods",
    description:
      "Active payment methods with transfer instructions. CUSTOMER only — admin accounts get a 403, which is expected.",
    run: () => getPaymentMethods(),
    params: [],
  },
  {
    id: "payments-my-by-order",
    section: "Payments",
    label: "GET /orders/:orderId/payment",
    description:
      "Current customer's payment for an order. CUSTOMER only — admin accounts get a 403, which is expected.",
    run: (orderId) => getMyPayment(orderId),
    params: ["orderId"],
  },
  {
    id: "payments-admin-list",
    section: "Payments",
    label: "GET /admin/payments?page=1&limit=5",
    description: "Paginated payment list. ADMIN/STAFF only.",
    run: () => getAdminPayments({ page: 1, limit: 5 }),
    params: [],
  },
  {
    id: "payments-admin-by-id",
    section: "Payments",
    label: "GET /admin/payments/:id",
    description: "Single payment by id. ADMIN/STAFF only.",
    run: (id) => getAdminPayment(id),
    params: ["id"],
  },
  {
    id: "returns-my-by-order",
    section: "Returns",
    label: "GET /orders/:orderId/returns",
    description:
      "Current customer's returns for an order. CUSTOMER only — admin accounts get a 403, which is expected.",
    run: (orderId) => getMyReturns(orderId),
    params: ["orderId"],
  },
  {
    id: "returns-my-by-id",
    section: "Returns",
    label: "GET /orders/:orderId/returns/:returnId",
    description:
      "Single return for the current customer. CUSTOMER only — admin accounts get a 403, which is expected.",
    run: (orderId, returnId) => getMyReturn(orderId, returnId),
    params: ["orderId", "returnId"],
  },
  {
    id: "returns-admin-list",
    section: "Returns",
    label: "GET /admin/returns?page=1&limit=5",
    description: "Paginated return list. ADMIN/STAFF only.",
    run: () => getAdminReturns({ page: 1, limit: 5 }),
    params: [],
  },
  {
    id: "returns-admin-by-id",
    section: "Returns",
    label: "GET /admin/returns/:id",
    description: "Single return by id. ADMIN/STAFF only.",
    run: (id) => getAdminReturn(id),
    params: ["id"],
  },
  {
    id: "refunds-admin-list",
    section: "Refunds",
    label: "GET /admin/refunds?page=1&limit=5",
    description: "Paginated refund list. ADMIN/STAFF only.",
    run: () => getAdminRefunds({ page: 1, limit: 5 }),
    params: [],
  },
  {
    id: "refunds-admin-by-id",
    section: "Refunds",
    label: "GET /admin/refunds/:id",
    description: "Single refund by id. ADMIN/STAFF only.",
    run: (id) => getAdminRefund(id),
    params: ["id"],
  },
  {
    id: "shipments-admin-list",
    section: "Courier",
    label: "GET /admin/shipments?page=1&limit=5",
    description: "Paginated shipment list. ADMIN/STAFF only.",
    run: () => getAdminShipments({ page: 1, limit: 5 }),
    params: [],
  },
  {
    id: "shipments-admin-by-id",
    section: "Courier",
    label: "GET /admin/shipments/:shipmentId",
    description: "Single shipment by id. ADMIN/STAFF only.",
    run: (shipmentId) => getAdminShipment(shipmentId),
    params: ["shipmentId"],
  },
  {
    id: "shipments-my-tracking",
    section: "Courier",
    label: "GET /orders/:orderId/tracking",
    description:
      "Current customer's tracking for an order. CUSTOMER only — admin accounts get a 403, which is expected.",
    run: (orderId) => getOrderTracking(orderId),
    params: ["orderId"],
  },
  {
    id: "customers-admin-list",
    section: "Customers",
    label: "GET /admin/customers?page=1&limit=5",
    description:
      "Paginated application-user list. ADMIN only — staff and customer accounts get a 403, which is expected.",
    run: () => getAdminCustomers({ page: 1, limit: 5 }),
    params: [],
  },
  {
    id: "customers-admin-by-id",
    section: "Customers",
    label: "GET /admin/customers/:id",
    description:
      "Single application user by id. ADMIN only.",
    run: (id) => getAdminCustomer(id),
    params: ["id"],
  },
  {
    id: "notifications-admin-list",
    section: "Notifications",
    label: "GET /admin/notifications?page=1&limit=5",
    description:
      "Paginated notification audit list. ADMIN only.",
    run: () => getAdminNotifications({ page: 1, limit: 5 }),
    params: [],
  },
  {
    id: "notifications-admin-by-id",
    section: "Notifications",
    label: "GET /admin/notifications/:id",
    description:
      "Single notification by id. ADMIN only.",
    run: (id) => getAdminNotification(id),
    params: ["id"],
  },
];

const SECTIONS = [
  "Users",
  "Catalog",
  "Inventory",
  "Reservations",
  "Orders",
  "Payments",
  "Returns",
  "Refunds",
  "Courier",
  "Customers",
  "Notifications",
];

function statusStyles(status) {
  if (status === 0) {
    return "border-zinc-200 bg-zinc-100 text-zinc-600";
  }
  if (status >= 200 && status < 300) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status >= 400 && status < 500) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (status >= 500) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-zinc-200 bg-zinc-100 text-zinc-600";
}

function statusText(status) {
  if (status === 0) {
    return "No response";
  }
  return String(status);
}

function EndpointCard({ endpoint, result, values, onRun, onValueChange }) {
  const running = result?.status === "loading";
  const done = result?.status === "done";

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <span className="rounded bg-emerald-600 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide text-white">
            GET
          </span>
          <code className="font-mono text-xs text-zinc-900">
            {endpoint.label}
          </code>
        </CardTitle>
        <CardDescription>{endpoint.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3">
        {endpoint.params.length > 0 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {endpoint.params.map((param, index) => (
              <Input
                key={param}
                placeholder={param}
                aria-label={param}
                value={values[index] ?? ""}
                onChange={(event) => onValueChange(index, event.target.value)}
              />
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRun(endpoint)}
            disabled={running}
          >
            {running ? "Loading..." : "Run"}
          </Button>
          {done && (
            <span
              className={cn(
                "rounded-md border px-2 py-0.5 font-mono text-xs font-medium",
                statusStyles(result.result.status),
              )}
            >
              {statusText(result.result.status)}
            </span>
          )}
        </div>

        {done && <ResultBody result={result.result} />}
      </CardContent>
    </Card>
  );
}

function ResultBody({ result }) {
  const message = safeMessage(result.status, result.payload);
  const json =
    result.payload !== null && result.payload !== undefined
      ? JSON.stringify(result.payload, null, 2)
      : "(no JSON body)";

  return (
    <div className="space-y-2">
      <p role="alert" className="text-sm text-zinc-700">
        {message}
      </p>
      <pre className="max-h-80 overflow-auto rounded-md bg-zinc-950 p-3 font-mono text-xs text-zinc-100">
        {json}
      </pre>
    </div>
  );
}

export function ApiTestExplorer() {
  const [activeSection, setActiveSection] = useState(SECTIONS[0]);
  const [results, setResults] = useState({});
  const [values, setValues] = useState({});

  async function runEndpoint(endpoint) {
    const args = values[endpoint.id] ?? [];
    setResults((prev) => ({ ...prev, [endpoint.id]: { status: "loading" } }));
    const result = await endpoint.run(...args);
    setResults((prev) => ({
      ...prev,
      [endpoint.id]: { status: "done", result },
    }));
  }

  function updateValue(endpointId, index, value) {
    setValues((prev) => {
      const current = [...(prev[endpointId] ?? [])];
      current[index] = value;
      return { ...prev, [endpointId]: current };
    });
  }

  const endpoints = ENDPOINTS.filter(
    (endpoint) => endpoint.section === activeSection,
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-zinc-500">{READ_ONLY}</p>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="API areas">
        {SECTIONS.map((section) => (
          <button
            key={section}
            role="tab"
            aria-selected={activeSection === section}
            onClick={() => setActiveSection(section)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-sm font-medium transition-colors",
              activeSection === section
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100",
            )}
          >
            {section}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {endpoints.map((endpoint) => (
          <EndpointCard
            key={endpoint.id}
            endpoint={endpoint}
            result={results[endpoint.id]}
            values={values[endpoint.id] ?? []}
            onRun={runEndpoint}
            onValueChange={(index, value) =>
              updateValue(endpoint.id, index, value)
            }
          />
        ))}
      </div>
    </div>
  );
}
