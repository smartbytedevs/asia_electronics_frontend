"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getAdminCustomer } from "@/lib/api/customers";
import { safeMessage } from "@/lib/api/http";
import { formatDateTime } from "@/lib/utils";
import {
  accountStatusMeta,
  userRoleMeta,
} from "../../../components/status-meta";
import { StatusBadge } from "../../../components/status-badge";

const EASE = [0.22, 1, 0.36, 1];

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-6 py-2">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  );
}

function SectionCard({ title, children, className }) {
  return (
    <section
      className={`rounded-2xl border border-gold-soft/70 bg-cream p-5 sm:p-6 ${className ?? ""}`}
    >
      <h2 className="font-display text-lg text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/**
 * Single application user fetched from `GET /admin/customers/:id`. Renders
 * exactly the admin serializer's fields — identity, role, status, timestamps.
 * Read-only: there are no customer mutation endpoints.
 */
export function CustomerDetail({ customerId }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    customer: null,
  });

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      customer: prev.customer,
    }));
  }

  function handleRefresh() {
    startLoading();
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let cancelled = false;
    getAdminCustomer(customerId).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          customer: null,
        });
        return;
      }
      setFetchState({
        status: "ready",
        message: null,
        customer: result.payload?.data?.customer ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [customerId, reloadKey]);

  const { status, message, customer } = fetchState;

  if (status === "loading") {
    return (
      <div aria-hidden="true" className="space-y-4">
        <div className="h-28 animate-pulse rounded-2xl bg-sand" />
        <div className="h-48 animate-pulse rounded-2xl bg-sand" />
        <div className="h-40 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
      >
        <h2 className="font-display text-lg text-ink">Customer unavailable</h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-mocha-deep">
          {message}
        </p>
        <button
          type="button"
          onClick={handleRefresh}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-lg bg-mocha px-5 text-sm font-semibold text-white transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="space-y-6"
      >
        <Link
          href="/admin/customers"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-mocha-deep hover:text-ink hover:underline"
        >
          ← Back to customers
        </Link>

        <section className="rounded-2xl border border-gold-soft/70 bg-cream p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Customer</p>
              <h2 className="mt-1 font-display text-2xl text-ink">
                {customer.displayName || "Customer"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {customer.email || "No email on record"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <StatusBadge meta={userRoleMeta(customer.role)} />
              <StatusBadge meta={accountStatusMeta(customer.status)} />
            </div>
          </div>
        </section>

        <SectionCard title="Account">
          <dl className="divide-y divide-gold-soft/30">
            <DetailRow label="Display name">
              {customer.displayName || "—"}
            </DetailRow>
            <DetailRow label="Email">
              <span className="block max-w-[280px] text-right break-all">
                {customer.email || "—"}
              </span>
            </DetailRow>
            <DetailRow label="Phone">{customer.phone || "—"}</DetailRow>
          </dl>
        </SectionCard>

        <SectionCard title="Access">
          <dl className="divide-y divide-gold-soft/30">
            <DetailRow label="Role">
              <StatusBadge meta={userRoleMeta(customer.role)} />
            </DetailRow>
            <DetailRow label="Status">
              <StatusBadge meta={accountStatusMeta(customer.status)} />
            </DetailRow>
            <DetailRow label="Created">
              {formatDateTime(customer.createdAt)}
            </DetailRow>
            <DetailRow label="Updated">
              {formatDateTime(customer.updatedAt)}
            </DetailRow>
          </dl>
        </SectionCard>
      </motion.div>
  );
}
