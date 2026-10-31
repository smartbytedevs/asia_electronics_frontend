"use client";

import { cn } from "@/lib/utils";

const PRESETS = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "custom", label: "Custom" },
];

/**
 * Date range controls for the analytics dashboard.
 *
 * - "Last 30 days" (default) sends no date params so the backend uses its own
 *   trailing 30-day default window.
 * - "Today" and "Last 7 days" compute explicit `dateFrom`/`dateTo`.
 * - "Custom" reveals two date inputs plus an Apply button; Apply is disabled
 *   until both dates are set and `dateFrom <= dateTo`.
 */
export function DateRangeControls({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  onApplyCustom,
  rangeLabel,
  disabled,
}) {
  const customValid = customFrom !== "" && customTo !== "" && customFrom <= customTo;

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div
        role="group"
        aria-label="Analytics date range"
        className="flex flex-wrap items-center gap-2"
      >
        {PRESETS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={preset === item.id}
            disabled={disabled}
            onClick={() => onPresetChange(item.id)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all",
              "active:scale-[0.98]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
              "disabled:pointer-events-none disabled:opacity-60",
              preset === item.id
                ? "border-mocha bg-mocha text-white shadow-sm"
                : "border-gold-soft bg-cream text-mocha hover:bg-gold-soft/40 hover:text-mocha-deep",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {preset === "custom" ? (
        <div
          className="flex flex-wrap items-end gap-2"
          aria-label="Custom date range"
        >
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            From
            <input
              type="date"
              value={customFrom}
              onChange={(event) => onCustomFromChange(event.target.value)}
              className="h-9 rounded-lg border border-gold-soft bg-white px-2.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-muted">
            To
            <input
              type="date"
              value={customTo}
              onChange={(event) => onCustomToChange(event.target.value)}
              className="h-9 rounded-lg border border-gold-soft bg-white px-2.5 text-sm text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            />
          </label>
          <button
            type="button"
            onClick={onApplyCustom}
            disabled={!customValid || disabled}
            className={cn(
              "h-9 rounded-lg px-4 text-sm font-semibold transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
              customValid && !disabled
                ? "bg-mocha text-white hover:bg-mocha-deep"
                : "cursor-not-allowed bg-gold-soft/60 text-muted",
            )}
          >
            Apply
          </button>
          {!customValid && customTo !== "" && (
            <p className="text-xs text-[#b0523f]">
              Start date must be on or before the end date.
            </p>
          )}
        </div>
      ) : null}

      {rangeLabel ? (
        <p className="text-xs text-muted lg:shrink-0">{rangeLabel}</p>
      ) : null}
    </div>
  );
}
