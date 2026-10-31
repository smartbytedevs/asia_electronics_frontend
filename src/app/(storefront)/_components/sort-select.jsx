"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "priceAsc", label: "Price: low to high" },
  { value: "priceDesc", label: "Price: high to low" },
  { value: "featured", label: "Featured" },
];

/**
 * Sort dropdown — pushes the chosen sort into the URL query string so the
 * server-rendered page re-fetches with the new ordering.
 */
export function SortSelect({ value }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(event) {
    const sort = event.target.value;
    const next = new URLSearchParams(searchParams.toString());
    if (sort && sort !== "newest") {
      next.set("sort", sort);
    } else {
      next.delete("sort");
    }
    const query = next.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <label className="inline-flex items-center gap-2 text-sm text-muted">
      <span className="hidden sm:inline">Sort by</span>
      <select
        value={value || "newest"}
        onChange={handleChange}
        className="rounded-full border border-sand bg-white px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-mocha/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
