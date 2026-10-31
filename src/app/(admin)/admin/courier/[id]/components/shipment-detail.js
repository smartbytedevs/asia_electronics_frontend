"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { getAdminShipment } from "@/lib/api/courier-shipments";
import { safeMessage } from "@/lib/api/http";
import { formatDateTime, formatMinorUnits } from "@/lib/utils";
import { courierStatusMeta } from "../../../components/status-meta";
import { StatusBadge } from "../../../components/status-badge";
import { ShipmentActions } from "../../components/shipment-actions";

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

function None() {
  return <span className="text-muted/60">—</span>;
}

/**
 * Single shipment fetched from `GET /admin/shipments/:shipmentId`. Renders
 * exactly the admin serializer's audit fields — consignment, submission
 * attempts and last error, provider status, fees, cancel info and dispatch
 * info — plus the same state-machine-driven actions as the list.
 */
export function ShipmentDetail({ shipmentId }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [fetchState, setFetchState] = useState({
    status: "loading",
    message: null,
    shipment: null,
  });

  function startLoading() {
    setFetchState((prev) => ({
      status: "loading",
      message: null,
      shipment: prev.shipment,
    }));
  }

  function handleRefresh() {
    startLoading();
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    let cancelled = false;
    getAdminShipment(shipmentId).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setFetchState({
          status: "error",
          message: safeMessage(result.status, result.payload),
          shipment: null,
        });
        return;
      }
      setFetchState({
        status: "ready",
        message: null,
        shipment: result.payload?.data?.shipment ?? null,
      });
    });
    return () => {
      cancelled = true;
    };
  }, [shipmentId, reloadKey]);

  const { status, message, shipment } = fetchState;

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
        <h2 className="font-display text-lg text-ink">Shipment unavailable</h2>
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

  if (!shipment) {
    return null;
  }

  const history = Array.isArray(shipment.statusHistory) ? shipment.statusHistory : [];

  return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="space-y-6"
      >
        <Link
          href="/admin/courier"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-mocha-deep hover:text-ink hover:underline"
        >
          ← Back to shipments
        </Link>

        <section className="rounded-2xl border border-gold-soft/70 bg-cream p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Consignment</p>
              <h2 className="mt-1 text-2xl font-semibold tabular-nums text-ink">
                {shipment.consignmentId || "Not yet assigned"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Order{" "}
                <Link
                  href={`/admin/orders/${shipment.orderId}`}
                  className="underline-offset-2 hover:underline"
                >
                  {shipment.orderNumber || "Order"}
                </Link>{" "}
                · {shipment.provider || "—"}
              </p>
            </div>
            <StatusBadge meta={courierStatusMeta(shipment.status)} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gold-soft/40 pt-4">
            <p className="text-xs text-muted">
              Updated {formatDateTime(shipment.updatedAt)}
            </p>
            <ShipmentActions shipment={shipment} onChanged={handleRefresh} />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard title="Delivery">
            <dl className="divide-y divide-gold-soft/30">
              <DetailRow label="Amount to collect">
                {formatMinorUnits(shipment.amountToCollectMinorUnits)}
              </DetailRow>
              <DetailRow label="Delivery fee">
                {formatMinorUnits(shipment.fees?.providerDeliveryFeeMinorUnits)}
              </DetailRow>
              <DetailRow label="Fee currency">{shipment.fees?.currency || "BDT"}</DetailRow>
              <DetailRow label="Provider status">
                {shipment.providerStatus?.status ?? "—"}
              </DetailRow>
              <DetailRow label="Provider updated">
                {formatDateTime(shipment.providerStatus?.updatedAt)}
              </DetailRow>
            </dl>
          </SectionCard>

          <SectionCard title="Dispatch">
            <dl className="divide-y divide-gold-soft/30">
              <DetailRow label="Requested by">
                {shipment.dispatch?.requestedBy ? "Staff" : "—"}
              </DetailRow>
              <DetailRow label="Requested at">
                {formatDateTime(shipment.dispatch?.requestedAt)}
              </DetailRow>
              <DetailRow label="Note">{shipment.dispatch?.note ?? "—"}</DetailRow>
              <DetailRow label="Submit attempts">
                {shipment.submission?.attempts ?? 0}
              </DetailRow>
              <DetailRow label="Submitted at">
                {formatDateTime(shipment.submission?.submittedAt)}
              </DetailRow>
              <DetailRow label="Last attempt">
                {formatDateTime(shipment.submission?.lastSubmitAttemptAt)}
              </DetailRow>
              {shipment.submission?.lastError ? (
                <DetailRow label="Last error">
                  <span className="block max-w-[260px] text-right break-words text-[#c9604d]">
                    {shipment.submission.lastError}
                  </span>
                </DetailRow>
              ) : null}
            </dl>
          </SectionCard>

          <SectionCard title="Cancellation">
            <dl className="divide-y divide-gold-soft/30">
              <DetailRow label="Requested at">
                {formatDateTime(shipment.cancel?.requestedAt)}
              </DetailRow>
              <DetailRow label="Confirmed at">
                {formatDateTime(shipment.cancel?.confirmedAt)}
              </DetailRow>
              {shipment.cancel?.lastError ? (
                <DetailRow label="Last error">
                  <span className="block max-w-[260px] text-right break-words text-[#c9604d]">
                    {shipment.cancel.lastError}
                  </span>
                </DetailRow>
              ) : null}
            </dl>
          </SectionCard>

          <SectionCard title="Record">
            <dl className="divide-y divide-gold-soft/30">
              <DetailRow label="Order">
                <Link
                  href={`/admin/orders/${shipment.orderId}`}
                  className="underline-offset-2 hover:underline"
                >
                  {shipment.orderNumber || "Order"}
                </Link>
              </DetailRow>
              <DetailRow label="Consignment ID">
                {shipment.consignmentId ?? <None />}
              </DetailRow>
              <DetailRow label="Created">{formatDateTime(shipment.createdAt)}</DetailRow>
              <DetailRow label="Updated">{formatDateTime(shipment.updatedAt)}</DetailRow>
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
                      <StatusBadge meta={courierStatusMeta(entry.status)} />
                      <span className="text-xs text-muted">
                        {formatDateTime(entry.at)}
                      </span>
                    </div>
                    {entry.note ? (
                      <p className="mt-1 text-sm text-mocha-deep">{entry.note}</p>
                    ) : null}
                    {entry.providerStatus ? (
                      <p className="mt-0.5 text-xs text-muted">
                        Provider: {entry.providerStatus}
                      </p>
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
