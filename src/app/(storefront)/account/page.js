import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  BackendAccessTokenError,
  authenticatedRequest,
} from "@/lib/backend-auth";
import { ApiClientError } from "@/lib/api-client";
import { ArrowRightIcon, DashboardIcon } from "../_components/icons";
import { OrderCard } from "./_components/order-card";

export const metadata = {
  title: "Account",
};

const TOKEN_ERROR_MESSAGE =
  "We could not obtain a backend access token from your session. Please sign out and sign in again.";

function backendErrorMessage(err) {
  if (err instanceof BackendAccessTokenError) {
    return TOKEN_ERROR_MESSAGE;
  }
  if (err instanceof ApiClientError) {
    // ApiClientError messages are safe, pre-mapped, user-facing strings.
    return err.message;
  }
  return "Something went wrong while contacting the backend. Please try again later.";
}

function Field({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

/**
 * Account overview (server). Greets the customer from `GET /me` and shows the
 * most recent orders from `GET /orders` — both authenticated reads through the
 * server-side token flow. Order history lives on the dedicated My orders page.
 */
export default async function AccountOverviewPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }

  let user = null;
  let userError = null;
  let orders = [];
  let ordersError = null;
  let orderTotal = 0;

  try {
    const me = await authenticatedRequest("/me", { headers: requestHeaders });
    user = me?.data?.user ?? null;
  } catch (err) {
    userError = backendErrorMessage(err);
  }

  try {
    const list = await authenticatedRequest("/orders?page=1&limit=5", {
      headers: requestHeaders,
    });
    const data = list?.data ?? null;
    orders = Array.isArray(data?.orders) ? data.orders : [];
    orderTotal = Number(data?.pagination?.total) || 0;
  } catch (err) {
    ordersError = backendErrorMessage(err);
  }

  const displayName = user?.displayName || session.user.name || "there";

  return (
    <section>
      <header>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.4em] text-gold">
          Overview
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink">
          Salaam, {displayName}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Welcome back. Track your orders, review deliveries, and keep your
          details up to date.
        </p>
      </header>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-xl text-ink">Recent orders</h2>
            <Link
              href="/account/orders"
              className="inline-flex items-center gap-2 text-sm font-medium text-mocha transition-colors hover:text-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              View all
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {ordersError ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 text-sm text-mocha-deep"
            >
              <p className="font-medium text-ink">Orders unavailable</p>
              <p className="mt-1">{ordersError}</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-gold-soft bg-sand/40 px-6 py-12 text-center">
              <span className="text-2xl" aria-hidden="true">
                ✦
              </span>
              <h3 className="font-display text-lg text-ink">
                You haven&apos;t placed any orders yet
              </h3>
              <p className="max-w-sm text-sm leading-relaxed text-muted">
                When you order, your items and delivery details will appear
                here.
              </p>
              <Link
                href="/collection"
                className="mt-2 rounded-full border border-mocha/30 px-6 py-2.5 text-sm font-medium text-mocha transition-colors hover:bg-sand"
              >
                Browse the catalog
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {orders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))}
              </div>
              {orderTotal > orders.length ? (
                <p className="text-sm text-muted">
                  Showing your {orders.length} most recent of {orderTotal}{" "}
                  order{orderTotal === 1 ? "" : "s"}.
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-xl text-ink">Profile</h2>
          <section className="rounded-2xl border border-sand bg-white p-5 sm:p-6">
            {userError ? (
              <p role="alert" className="text-sm text-mocha-deep">
                {userError}
              </p>
            ) : user ? (
              <dl className="divide-y divide-sand">
                <Field label="Name" value={user.displayName || "—"} />
                <Field label="Email" value={user.email || "—"} />
                <Field label="Phone" value={user.phone || "—"} />
              </dl>
            ) : (
              <p className="text-sm text-muted">
                No profile information available.
              </p>
            )}
            <Link
              href="/account/profile"
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-mocha/25 px-5 py-2.5 text-sm font-medium text-mocha transition-colors hover:border-mocha hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              View profile
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            {user?.role === "ADMIN" ? (
              <Link
                href="/admin/dashboard"
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-cream transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 sm:w-auto"
              >
                <DashboardIcon className="h-4 w-4" />
                Admin Dashboard
              </Link>
            ) : null}
          </section>
        </div>
      </div>
    </section>
  );
}
