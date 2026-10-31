"use client";

import { useEffect, useRef, useState } from "react";
import { Panel, PanelTitle } from "./panel";

/**
 * Lightweight SVG line chart for the daily analytics series — no chart
 * library needed. Plots Sales, Refunds, Expenses and Net as four restrained
 * lines (the ABAYA palette) over a zero-filled daily range, with compact BDT
 * axis labels. The chart is measured at its actual rendered width (via a
 * ResizeObserver) and rebuilt at that pixel width, so labels, legend, axes and
 * the plot area always fit the panel without scaling text down or forcing
 * horizontal scroll.
 */

const SERIES = [
  { key: "sales", label: "Sales", color: "#6e5c4a" },
  { key: "refunds", label: "Refunds", color: "#c9604d" },
  { key: "expenses", label: "Expenses", color: "#b89b6b" },
  { key: "net", label: "Net", color: "#2b2620" },
];

/** Fallback width used before the first measurement (keeps render stable). */
const FALLBACK_WIDTH = 640;
const HEIGHT = 240;

/** "2026-08-11" → "11 Aug" using local time (never UTC-shifted). */
function formatDateKey(key) {
  const [year, month, day] = String(key).split("-").map(Number);
  if (!year || !month || !day) {
    return key ?? "—";
  }
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Compact BDT label for chart axes, e.g. 123000 → "৳1.2k". */
function formatAxis(minorUnits) {
  const value = Number(minorUnits) || 0;
  const sign = value < 0 ? "−" : "";
  const abs = Math.abs(value) / 100;
  let scaled = abs;
  let suffix = "";
  if (abs >= 1e7) {
    scaled = abs / 1e7;
    suffix = "Cr";
  } else if (abs >= 1e5) {
    scaled = abs / 1e5;
    suffix = "L";
  } else if (abs >= 1e3) {
    scaled = abs / 1e3;
    suffix = "k";
  }
  const text =
    scaled >= 100
      ? Math.round(scaled).toString()
      : scaled.toFixed(scaled >= 10 ? 1 : 2).replace(/\.0+$/, "");
  return `${sign}৳${text}${suffix}`;
}

/**
 * Geometry tuned to the actual rendered width so axis padding and font sizes
 * keep labels legible on narrow screens instead of being scaled by the SVG.
 */
function layoutFor(width) {
  const w = Math.max(width || FALLBACK_WIDTH, 1);
  return {
    width: w,
    height: HEIGHT,
    pad: {
      top: 14,
      right: w < 360 ? 10 : 16,
      bottom: 30,
      left: w < 360 ? 44 : w < 520 ? 50 : 58,
    },
    font: w < 360 ? 10 : 11,
    labelCount: w < 300 ? 2 : w < 380 ? 3 : 5,
    axisGap: w < 360 ? 6 : 8,
  };
}

function buildChart(daily, layout) {
  const n = daily.length;
  const { width, height, pad } = layout;
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;

  const allValues = daily.flatMap((day) => [
    day.sales,
    day.refunds,
    day.expenses,
    day.net,
  ]);
  const yMin = Math.min(0, ...allValues);
  let yMax = Math.max(0, ...allValues);
  if (yMax === yMin) {
    yMax = yMin + 1;
  }
  const span = yMax - yMin;

  const x = (i) =>
    n === 1
      ? pad.left + plotWidth / 2
      : pad.left + (i / (n - 1)) * plotWidth;
  const y = (value) => pad.top + ((yMax - value) / span) * plotHeight;

  const series = SERIES.map((item) => {
    const points = daily.map((day, i) => ({
      x: x(i),
      y: y(Number(day[item.key]) || 0),
    }));
    const path = points
      .map(
        (point, i) =>
          `${i === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`,
      )
      .join(" ");
    return { ...item, path, points };
  });

  const tickCount = 4;
  const tickStep = (yMax - yMin) / (tickCount - 1);
  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const value = yMin + tickStep * i;
    return { value, y: y(value), label: formatAxis(value) };
  });

  const labelCount = layout.labelCount;
  const labelIndices =
    n <= labelCount
      ? Array.from({ length: n }, (_, i) => i)
      : Array.from(
          { length: labelCount },
          (_, i) => Math.round((i * (n - 1)) / (labelCount - 1)),
        );

  return {
    n,
    series,
    ticks,
    xLabels: labelIndices.map((index) => ({
      index,
      x: x(index),
      label: formatDateKey(daily[index].date),
    })),
    zeroY: y(0),
    hasNegative: yMin < 0,
  };
}

function Chart({ daily, layout }) {
  const { n, series, ticks, xLabels, zeroY, hasNegative } = buildChart(
    daily,
    layout,
  );
  const { width, height, pad, font, axisGap } = layout;

  return (
    <svg
      role="img"
      aria-label="Financial trend: sales, refunds, expenses and net over the selected period"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className="block"
    >
      <title>Financial trend</title>
      <desc>
        Line chart of daily sales, refunds, expenses and net in BDT for the
        selected period.
      </desc>

      {ticks.map((tick) => (
        <g key={tick.value}>
          <line
            x1={pad.left}
            y1={tick.y}
            x2={width - pad.right}
            y2={tick.y}
            stroke="#e5d8bd"
            strokeWidth="1"
          />
          <text
            x={pad.left - axisGap}
            y={tick.y + 4}
            textAnchor="end"
            fontSize={font}
            fill="#8a7f72"
          >
            {tick.label}
          </text>
        </g>
      ))}

      {hasNegative ? (
        <line
          x1={pad.left}
          y1={zeroY}
          x2={width - pad.right}
          y2={zeroY}
          stroke="#b89b6b"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      ) : null}

      {series.map((item) => (
        <path
          key={item.key}
          d={item.path}
          fill="none"
          stroke={item.color}
          strokeWidth={item.key === "net" ? 2.5 : 2}
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{
            filter:
              item.key === "net"
                ? "drop-shadow(0 2px 3px rgba(43,38,32,0.25))"
                : undefined,
          }}
        />
      ))}

      {n <= 2
        ? series.map((item) =>
            item.points.map((point, i) => (
              <circle
                key={`${item.key}-${i}`}
                cx={point.x}
                cy={point.y}
                r="3.5"
                fill={item.color}
              />
            )),
          )
        : null}

      {xLabels.map(({ index, x, label }) => (
        <text
          key={`${index}-${label}`}
          x={x}
          y={height - 8}
          textAnchor="middle"
          fontSize={font}
          fill="#8a7f72"
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

/** Measures the width of an element so the chart can be sized to fit. */
function useContainerWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return undefined;
    }
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const next = Math.round(entry.contentRect.width);
        if (next > 0) {
          setWidth(next);
        }
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, width];
}

/**
 * Financial trend panel. `daily` is the backend's zero-filled series
 * (possibly empty). A quiet note replaces the empty state and appears under a
 * flat all-zero series.
 */
export function FinancialTrend({ daily }) {
  const [chartWrapRef, width] = useContainerWidth();
  const layout = layoutFor(width ?? FALLBACK_WIDTH);
  const hasActivity = daily.some((day) =>
    [day.sales, day.refunds, day.expenses, day.net].some(
      (value) => Number(value) !== 0,
    ),
  );

  return (
    <Panel aria-label="Financial trend">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <PanelTitle>Financial trend</PanelTitle>
          <p className="mt-1 text-sm text-muted">
            Daily sales (delivered COD + verified payments), refunds, expenses
            and net cash flow.
          </p>
        </div>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {SERIES.map((item) => (
            <li
              key={item.key}
              className="flex items-center gap-1.5 text-xs font-medium text-mocha-deep transition-colors hover:text-ink"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full transition-transform duration-200 hover:scale-125"
                style={{ backgroundColor: item.color }}
              />
              {item.label}
            </li>
          ))}
        </ul>
      </div>

      <div ref={chartWrapRef} className="mt-5 w-full">
        {daily.length === 0 ? (
          <p className="rounded-xl border border-gold-soft/60 bg-sand/60 px-4 py-8 text-center text-sm text-muted">
            No daily data is available for this period.
          </p>
        ) : (
          <>
            <Chart daily={daily} layout={layout} />
            {!hasActivity ? (
              <p className="mt-2 text-center text-xs text-muted">
                No financial activity recorded in this period.
              </p>
            ) : null}
          </>
        )}
      </div>
    </Panel>
  );
}
