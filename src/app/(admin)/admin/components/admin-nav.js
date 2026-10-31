import { AdminNavLink } from "./admin-nav-link";

/**
 * Admin sidebar navigation, grouped into logical sections. Only routed,
 * supported admin sections are listed; the /admin/api-test dev tool is
 * deliberately omitted from the sidebar (its route still exists). Icons are
 * referenced by string key so the client link component can resolve them.
 */
const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ href: "/admin/dashboard", label: "Dashboard", icon: "dashboard" }],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: "products" },
      { href: "/admin/categories", label: "Categories", icon: "categories" },
      { href: "/admin/inventory", label: "Inventory", icon: "inventory" },
      {
        href: "/admin/inventory/reservations",
        label: "Reservations",
        icon: "reservations",
      },
      {
        href: "/admin/inventory/transfers",
        label: "Stock Transfers",
        icon: "transfers",
      },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: "orders" },
      { href: "/admin/payments", label: "Payments", icon: "payments" },
      { href: "/admin/expenses", label: "Expenses", icon: "expenses" },
      { href: "/admin/customers", label: "Customers", icon: "customers" },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/reviews", label: "Reviews", icon: "reviews" },
      { href: "/admin/returns", label: "Returns", icon: "returns" },
      { href: "/admin/refunds", label: "Refunds", icon: "refunds" },
      { href: "/admin/courier", label: "Courier", icon: "courier" },
    ],
  },
];

export function AdminNav() {
  return (
    <nav aria-label="Admin navigation" className="px-3">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-6 last:mb-0">
          <p className="mb-1.5 px-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-mocha/70">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.href}>
                <AdminNavLink href={item.href} icon={item.icon}>
                  {item.label}
                </AdminNavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
