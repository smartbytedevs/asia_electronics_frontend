export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Formats an integer minor-units (paisa) amount as BDT, e.g. 150000 → ৳1,500.00.
 * The backend never sends money as floats, so values are divided by 100 for
 * display only.
 */
export function formatMinorUnits(minorUnits) {
  const taka = Number(minorUnits) / 100;
  if (!Number.isFinite(taka)) {
    return "—";
  }
  return `৳${taka.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Formats a date (ISO string or Date) as e.g. "10 Aug 2026". */
export function formatDate(value) {
  if (value == null || value === "") {
    return "—";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Formats a date with time (ISO string or Date) as e.g. "10 Aug 2026, 14:05". */
export function formatDateTime(value) {
  if (value == null || value === "") {
    return "—";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
