"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { getAnalyticsDaily, getAnalyticsSummary } from "@/lib/api/analytics";
import { safeMessage } from "@/lib/api/http";
import { formatDate, formatMinorUnits } from "@/lib/utils";
import { KpiCard } from "./kpi-card";
import { DateRangeControls } from "./date-range-controls";
import { OrderStatusOverview } from "./order-status-overview";
import { FinancialTrend } from "./financial-trend";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { DashboardError } from "./dashboard-error";

const EASE = [0.22, 1, 0.36, 1];

function toDateParam(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayParam() {
  return toDateParam(new Date());
}

function daysAgoParam(days) {
  const now = new Date();
  return toDateParam(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() - days),
  );
}

/** Formats net in minor units, putting the sign before the BDT symbol. */
function formatNet(minorUnits) {
  const value = Number(minorUnits);
  if (!Number.isFinite(value)) {
    return "—";
  }
  if (value < 0) {
    return `−${formatMinorUnits(Math.abs(value))}`;
  }
  return formatMinorUnits(value);
}

function numberOrDash(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en-US") : "—";
}

const CARD_STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const CARD_ITEM = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

/**
 * Interactive analytics dashboard.
 *
 * Fetches the real admin analytics (summary + daily) through the existing
 * authenticated proxy wrappers, keyed to the selected date range. Every
 * failure is mapped to a safe, pre-mapped message via `safeMessage` — never
 * raw backend bodies, tokens, or stack traces. Loading uses a skeleton,
 * errors use a retryable panel, and empty/zero periods render cleanly.
 *
 * Animation is subtle and always plays — reduced-motion preferences are
 * intentionally ignored (entrance values are deterministic, so there is no
 * hydration mismatch).
 */
export function AnalyticsDashboard() {
  const [preset, setPreset] = useState("30d");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [appliedCustom, setAppliedCustom] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({
    status: "loading",
    message: null,
    summary: null,
    daily: null,
  });

  const idle = preset === "custom" && !appliedCustom;

  const params = useMemo(() => {
    if (preset === "custom") {
      return appliedCustom;
    }
    if (preset === "today") {
      const today = todayParam();
      return { dateFrom: today, dateTo: today };
    }
    if (preset === "7d") {
      return { dateFrom: daysAgoParam(6), dateTo: todayParam() };
    }
    return null;
  }, [preset, appliedCustom]);

  function startLoading() {
    setState((prev) => ({
      status: "loading",
      message: null,
      summary: prev.summary,
      daily: prev.daily,
    }));
  }

  function handlePresetChange(next) {
    setPreset(next);
    if (next === "custom") {
      setAppliedCustom(null);
      setState({ status: "idle", message: null, summary: null, daily: null });
    } else {
      startLoading();
    }
  }

  function handleApplyCustom() {
    if (custom.from === "" || custom.to === "" || custom.from > custom.to) {
      return;
    }
    setAppliedCustom({ dateFrom: custom.from, dateTo: custom.to });
    startLoading();
  }

  function handleRetry() {
    startLoading();
    setReloadKey((key) => key + 1);
  }

  useEffect(() => {
    if (idle) {
      return;
    }

    let cancelled = false;
    Promise.all([getAnalyticsSummary(params), getAnalyticsDaily(params)]).then(
      ([summaryResult, dailyResult]) => {
        if (cancelled) {
          return;
        }
        if (!summaryResult.ok || !dailyResult.ok) {
          const failed = summaryResult.ok ? dailyResult : summaryResult;
          setState({
            status: "error",
            message: safeMessage(failed.status, failed.payload),
            summary: null,
            daily: null,
          });
          return;
        }
        const dailyData = dailyResult.payload?.data ?? null;
        const daily = Array.isArray(dailyData) ? dailyData : dailyData?.daily ?? [];
        setState({
          status: "ready",
          message: null,
          summary: summaryResult.payload?.data ?? null,
          daily,
        });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [params, idle, reloadKey]);

  const { status, message, summary, daily } = state;
  const rangeLabel =
    status === "ready" && summary?.range
      ? `Showing ${formatDate(summary.range.from)} – ${formatDate(summary.range.to)}`
      : null;

  const net = Number(summary?.netMinorUnits);
  const netNegative = Number.isFinite(net) && net < 0;

  const kpis = [
    {
      label: "Total Orders",
      value: numberOrDash(summary?.totalOrders),
      note: "All orders placed in the period",
      bar: "bg-gold",
      valueClass: "text-mocha-deep",
    },
    {
      label: "Total Sales",
      value: formatMinorUnits(summary?.totalSalesMinorUnits),
      note: "Delivered COD + verified manual payments",
      bar: "bg-mocha",
      valueClass: "text-mocha-deep",
    },
    {
      label: "Total Refunds",
      value: formatMinorUnits(summary?.totalRefundsMinorUnits),
      note: "Processed refunds",
      bar: "bg-red-500",
      valueClass: "text-red-500",
    },
    {
      label: "Total Expenses",
      value: formatMinorUnits(summary?.totalExpensesMinorUnits),
      note: "Expense lines",
      bar: "bg-gold-soft",
      valueClass: "text-muted",
    },
    {
      label: "Net",
      value: formatNet(summary?.netMinorUnits),
      note: "Sales − refunds − expenses",
      bar: netNegative ? "bg-red-500" : "bg-ink",
      valueClass: netNegative ? "text-red-500" : "text-ink",
    },
  ];

  return (
      <div className="space-y-8">
        <DateRangeControls
          preset={preset}
          onPresetChange={handlePresetChange}
          customFrom={custom.from}
          customTo={custom.to}
          onCustomFromChange={(value) =>
            setCustom((prev) => ({ ...prev, from: value }))
          }
          onCustomToChange={(value) =>
            setCustom((prev) => ({ ...prev, to: value }))
          }
          onApplyCustom={handleApplyCustom}
          rangeLabel={rangeLabel}
          disabled={status === "loading"}
        />

        {idle ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="rounded-2xl border border-dashed border-gold-soft/80 bg-cream p-10 text-center"
          >
            <p className="font-display text-lg text-ink">Pick a date range</p>
            <p className="mt-1.5 text-sm text-muted">
              Choose a start and end date, then press Apply to load the
              dashboard.
            </p>
          </motion.div>
        ) : null}

        {status === "loading" ? <DashboardSkeleton /> : null}

        {status === "error" ? (
          <DashboardError message={message} onRetry={handleRetry} />
        ) : null}

        {status === "ready" && summary ? (
          <>
            <section aria-label="Quick summary" className="space-y-4">
              <div>
                <h2 className="flex items-center gap-2.5 font-display text-xl text-ink">
                  <span aria-hidden="true" className="h-5 w-1 rounded-full bg-gold" />
                  Quick summary
                </h2>
                <p className="mt-1 pl-[1.1rem] text-sm text-muted">
                  Store performance for the selected period. Sales recognize
                  COD revenue once an order is delivered and manual payments
                  once verified.
                </p>
              </div>
              <motion.div
                initial="hidden"
                animate="show"
                variants={CARD_STAGGER}
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
              >
                {kpis.map((kpi) => (
                  <motion.div
                    key={kpi.label}
                    variants={CARD_ITEM}
                    whileHover={{ y: -3 }}
                    transition={{ type: "spring", stiffness: 320, damping: 24 }}
                  >
                    <KpiCard {...kpi} />
                  </motion.div>
                ))}
              </motion.div>
            </section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15, ease: EASE }}
              className="grid gap-6 lg:grid-cols-[340px_1fr]"
              aria-label="Order status and financial trend"
            >
              <OrderStatusOverview
                counts={summary.orderStatusCounts}
                totalOrders={Number(summary.totalOrders) || 0}
              />
              <FinancialTrend daily={daily} />
            </motion.section>
          </>
        ) : null}
      </div>
  );
}
