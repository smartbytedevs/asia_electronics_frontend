import { StarIcon } from "./icons";

export function hasProductRating(rating, count) {
  const numericRating = Number(rating);
  const numericCount = Number(count);
  return (
    Number.isFinite(numericRating) &&
    numericRating > 0 &&
    Number.isFinite(numericCount) &&
    numericCount > 0
  );
}

/**
 * Compact five-star rating readout shared by catalog cards and search results.
 * The filled stars are rounded to the nearest whole star while the numeric
 * average keeps its precision, so a 4.5 rating reads clearly without needing
 * half-star icons.
 */
export function ProductRating({ rating, count, className = "" }) {
  if (!hasProductRating(rating, count)) {
    return null;
  }

  const numericRating = Number(rating);
  const numericCount = Number(count);
  const rounded = Math.round(numericRating);
  const label = `Rated ${numericRating.toFixed(1)} out of 5 from ${numericCount} review${
    numericCount === 1 ? "" : "s"
  }`;

  return (
    <div
      role="img"
      aria-label={label}
      className={"flex items-center gap-1.5 " + className}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((value) => (
          <StarIcon
            key={value}
            filled={value <= rounded}
            className={
              "h-3 w-3 sm:h-3.5 sm:w-3.5 " +
              (value <= rounded ? "text-electric" : "text-ink/15")
            }
          />
        ))}
      </span>
      <span
        aria-hidden="true"
        className="text-[0.62rem] font-semibold leading-none text-ink sm:text-xs"
      >
        {numericRating.toFixed(1)}
      </span>
      <span
        aria-hidden="true"
        className="text-[0.58rem] leading-none text-muted sm:text-[0.68rem]"
      >
        ({numericCount})
      </span>
    </div>
  );
}
