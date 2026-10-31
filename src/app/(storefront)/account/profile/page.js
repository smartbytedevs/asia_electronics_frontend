import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  BackendAccessTokenError,
  authenticatedRequest,
} from "@/lib/backend-auth";
import { ApiClientError } from "@/lib/api-client";

export const metadata = {
  title: "Profile",
};

const TOKEN_ERROR_MESSAGE =
  "We could not obtain a backend access token from your session. Please sign out and sign in again.";

function backendErrorMessage(err) {
  if (err instanceof BackendAccessTokenError) {
    return TOKEN_ERROR_MESSAGE;
  }
  if (err instanceof ApiClientError) {
    return err.message;
  }
  return "Something went wrong while contacting the backend. Please try again later.";
}

const ROLE_LABELS = {
  CUSTOMER: "Customer",
  ADMIN: "Administrator",
  STAFF: "Staff",
};

const STATUS_LABELS = {
  ACTIVE: "Active",
  SUSPENDED: "Suspended",
};

function Field({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

/**
 * Read-only profile (server). Renders the customer's application record from
 * `GET /me` — the safe user serializer has no endpoint to edit these fields
 * yet, so nothing here is editable.
 */
export default async function AccountProfilePage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }

  let user = null;
  let userError = null;

  try {
    const me = await authenticatedRequest("/me", { headers: requestHeaders });
    user = me?.data?.user ?? null;
  } catch (err) {
    userError = backendErrorMessage(err);
  }

  return (
    <section>
      <header>
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.4em] text-gold">
          Profile
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink">
          Your details
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          The name, phone and address tied to your account are used to prepare
          and deliver your orders.
        </p>
      </header>

      <div className="mt-10 max-w-2xl">
        <section className="rounded-2xl border border-sand bg-white p-5 sm:p-6">
          {userError ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 text-sm text-mocha-deep"
            >
              <p className="font-medium text-ink">Profile unavailable</p>
              <p className="mt-1">{userError}</p>
            </div>
          ) : user ? (
            <dl className="divide-y divide-sand">
              <Field label="Name" value={user.displayName || "—"} />
              <Field label="Email" value={user.email || "—"} />
              <Field label="Phone" value={user.phone || "—"} />
              <Field
                label="Account type"
                value={ROLE_LABELS[user.role] || user.role || "—"}
              />
              <Field
                label="Status"
                value={STATUS_LABELS[user.status] || user.status || "—"}
              />
            </dl>
          ) : (
            <p className="text-sm text-muted">
              No profile information available.
            </p>
          )}
        </section>

        <p className="mt-4 text-sm text-muted">
          Profile editing isn&apos;t available yet. To update your details, please
          contact our support team.
        </p>
      </div>
    </section>
  );
}
