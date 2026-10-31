"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getAdminRefund } from "@/lib/api/refunds";
import { safeMessage } from "@/lib/api/http";
import { formatDateTime, formatMinorUnits } from "@/lib/utils";
import { paymentMethodLabel, refundStatusMeta } from "../../../components/status-meta";
import { StatusBadge } from "../../../components/status-badge";
import { RefundActions } from "../../components/refund-actions";
import { actorLabel } from "../../components/refund-table";

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
 * Single refund fetched from `GET /admin/refunds/:id`. Renders exactly the
 * refund serializer's fields — amount, payment method, linked return/order,
 * customer, processed/voided audit, note and status history — with the same
 * process/void actions as the list for PENDING refunds.
 */
export function RefundDetail({ refundId }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    refund: null,
  });

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      refund: prev.refund,
    }));
  }

  function handleRefresh() {
    startLoading();
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let cancelled = false;
    getAdminRefund(refundId).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          refund: null,
        });
        return;
      }
      setFetchState({
        status: "ready",
        message: null,
        refund: result.payload?.data?.refund ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [refundId, reloadKey]);

  const { status, message, refund } = fetchState;

  if (status === "loading") {
    return (
      <div aria-hidden="true" className="space-y-4">
        <div className="h-24 animate-pulse rounded-2xl bg-sand" />
        <div className="h-48 animate-pulse rounded-2xl bg-sand" />
        <div className="h-56 animate-pulse rounded-2xl bg-sand" />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div
        role="alert"
        className="rounded-2xl border border-red-200/80 bg-red-50/70 p-6 sm:p-8"
      >
        <h2 className="font-display text-lg text-ink">Refund unavailable</h2>
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

  if (!refund) {
    return null;
  }

  const history = Array.isArray(refund.statusHistory) ? refund.statusHistory : [];

  return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="space-y-6"
      >
        <Link
          href="/admin/refunds"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-mocha-deep hover:text-ink hover:underline"
        >
          ← Back to refunds
        </Link>

        <section className="rounded-2xl border border-gold-soft/70 bg-cream p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Refund</p>
              <h2 className="mt-1 text-2xl font-semibold tabular-nums text-ink">
                {refund.refundNumber}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {formatMinorUnits(refund.amount)} ·{" "}
                {paymentMethodLabel(refund.paymentMethod)} · Created{" "}
                {formatDateTime(refund.createdAt)}
              </p>
            </div>
            <StatusBadge meta={refundStatusMeta(refund.status)} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gold-soft/40 pt-4">
            <p className="text-xs text-muted">
              {refund.updatedAt ? (
                <>Updated {formatDateTime(refund.updatedAt)}</>
              ) : null}
            </p>
            <RefundActions refund={refund} onChanged={handleRefresh} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Linked records">
            <dl className="divide-y divide-gold-soft/30">
              <DetailRow label="Return">
                {refund.return ? (
                  <Link
                    href={`/admin/returns/${refund.return.id}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {refund.return.returnNumber || "View return"}
                  </Link>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Order">
                {refund.order ? (
                  <Link
                    href={`/admin/orders/${refund.order.id}`}
                    className="underline-offset-2 hover:underline"
                  >
                    {refund.order.orderNumber || "View order"}
                  </Link>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Customer">{actorLabel(refund.customer)}</DetailRow>
              <DetailRow label="Payment method">
                {paymentMethodLabel(refund.paymentMethod)}
              </DetailRow>
              <DetailRow label="Payment">
                {refund.paymentId
                  ? "Recorded — see Payments"
                  : "COD — no captured payment"}
              </DetailRow>
            </dl>
          </SectionCard>

          <SectionCard title="Payout">
            <dl className="divide-y divide-gold-soft/30">
              <DetailRow label="Amount">
                {formatMinorUnits(refund.amount)}
              </DetailRow>
              {refund.status === "PROCESSED" ? (
                <>
                  <DetailRow label="Processed by">{actorLabel(refund.processedBy)}</DetailRow>
                  <DetailRow label="Processed at">
                    {formatDateTime(refund.processedAt)}
                  </DetailRow>
                </>
              ) : null}
              {refund.status === "VOIDED" ? (
                <>
                  <DetailRow label="Voided by">{actorLabel(refund.voidedBy)}</DetailRow>
                  <DetailRow label="Voided at">
                    {formatDateTime(refund.voidedAt)}
                  </DetailRow>
                </>
              ) : null}
              <DetailRow label="Note">{refund.note || "—"}</DetailRow>
            </dl>
          </SectionCard>
        </div>

        <SectionCard title="Status history">
          {history.length === 0 ? (
            <p className="text-sm text-muted">No status changes recorded.</p>
          ) : (
            <ol className="space-y-3">
              {history.map((entry, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge meta={refundStatusMeta(entry.status)} />
                      <span className="text-xs text-muted">
                        {formatDateTime(entry.at)}
                      </span>
                    </div>
                    {entry.note ? (
                      <p className="mt-1 text-sm text-mocha-deep">{entry.note}</p>
                    ) : null}
                    {entry.by ? (
                      <p className="mt-0.5 text-xs text-muted">By {actorLabel(entry.by)}</p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </SectionCard>
      </motion.div>
  );
}
