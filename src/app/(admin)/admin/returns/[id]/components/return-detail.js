"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getAdminReturn } from "@/lib/api/returns";
import { safeMessage } from "@/lib/api/http";
import { formatDateTime, formatMinorUnits } from "@/lib/utils";
import { returnStatusMeta } from "../../../components/status-meta";
import { StatusBadge } from "../../../components/status-badge";
import { ReturnActions } from "../../components/return-actions";

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

function statusDate(returnItem, status) {
  if (status === "APPROVED") return returnItem.approvedAt;
  if (status === "REJECTED") return returnItem.rejectedAt;
  if (status === "COMPLETED") return returnItem.completedAt;
  if (status === "CANCELLED") return returnItem.cancelledAt;
  return null;
}

/**
 * Single return fetched from `GET /admin/returns/:id`. Renders exactly the
 * admin serializer's fields — items with their immutable price snapshots,
 * reason, notes, status history, decision timestamps/actors and the linked
 * refund — with the same state-machine-driven actions as the list.
 */
export function ReturnDetail({ returnId }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    returnItem: null,
  });

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      returnItem: prev.returnItem,
    }));
  }

  function handleRefresh() {
    startLoading();
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let cancelled = false;
    getAdminReturn(returnId).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          returnItem: null,
        });
        return;
      }
      setFetchState({
        status: "ready",
        message: null,
        returnItem: result.payload?.data?.return ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [returnId, reloadKey]);

  const { status, message, returnItem } = fetchState;

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
        <h2 className="font-display text-lg text-ink">Return unavailable</h2>
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

  if (!returnItem) {
    return null;
  }

  const history = Array.isArray(returnItem.statusHistory) ? returnItem.statusHistory : [];
  const items = Array.isArray(returnItem.items) ? returnItem.items : [];

  return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="space-y-6"
      >
        <Link
          href="/admin/returns"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-mocha-deep hover:text-ink hover:underline"
        >
          ← Back to returns
        </Link>

        <section className="rounded-2xl border border-gold-soft/70 bg-cream p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Return</p>
              <h2 className="mt-1 text-2xl font-semibold tabular-nums text-ink">
                {returnItem.returnNumber}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Order{" "}
                <Link
                  href={`/admin/orders/${returnItem.orderId}`}
                  className="underline-offset-2 hover:underline"
                >
                  View order
                </Link>{" "}
                · Requested {formatDateTime(returnItem.createdAt)}
              </p>
            </div>
            <StatusBadge meta={returnStatusMeta(returnItem.status)} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gold-soft/40 pt-4">
            <p className="text-xs text-muted">
              {returnItem.updatedAt ? (
                <>Updated {formatDateTime(returnItem.updatedAt)}</>
              ) : null}
            </p>
            <ReturnActions returnItem={returnItem} onChanged={handleRefresh} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Reason & notes">
            <p className="text-sm leading-relaxed text-ink">{returnItem.reason}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              {returnItem.notes || "No additional notes."}
            </p>
          </SectionCard>

          <SectionCard title="Record">
            <dl className="divide-y divide-gold-soft/30">
              <DetailRow label="Order">
                <Link
                  href={`/admin/orders/${returnItem.orderId}`}
                  className="underline-offset-2 hover:underline"
                >
                  View order
                </Link>
              </DetailRow>
              <DetailRow label="Customer">
                {returnItem.customerId ? (
                  <Link
                    href={`/admin/customers/${returnItem.customerId}`}
                    className="underline-offset-2 hover:underline"
                  >
                    View customer
                  </Link>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Refund">
                {returnItem.refundId ? (
                  <Link
                    href={`/admin/refunds/${returnItem.refundId}`}
                    className="underline-offset-2 hover:underline"
                  >
                    View refund
                  </Link>
                ) : (
                  "—"
                )}
              </DetailRow>
              {returnItem.status !== "PENDING" ? (
                <DetailRow label="Decided at">
                  {formatDateTime(statusDate(returnItem, returnItem.status))}
                </DetailRow>
              ) : null}
            </dl>
          </SectionCard>
        </div>

        <SectionCard title={`Items (${items.length})`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-sand/70 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Product</th>
                  <th scope="col" className="px-4 py-3 font-medium">SKU</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Qty</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Unit price</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Discount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-soft/40">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gold-soft/20">
                    <td className="px-4 py-3 text-mocha-deep">{item.productName}</td>
                    <td className="px-4 py-3 text-muted tabular-nums">{item.sku}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink">{item.quantity}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-ink">
                      {formatMinorUnits(item.unitPriceMinorUnits)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted">
                      {item.discountMinorUnits
                        ? formatMinorUnits(item.discountMinorUnits)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

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
                      <StatusBadge meta={returnStatusMeta(entry.status)} />
                      <span className="text-xs text-muted">
                        {formatDateTime(entry.at)}
                      </span>
                    </div>
                    {entry.note ? (
                      <p className="mt-1 text-sm text-mocha-deep">{entry.note}</p>
                    ) : null}
                    {entry.by ? (
                      <p className="mt-0.5 text-xs text-muted">By Staff</p>
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
