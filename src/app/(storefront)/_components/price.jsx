import { formatMinorUnits } from "@/lib/utils";

/**
 * Price display: effective price, optional strikethrough compare-at, and a
 * percentage badge when the product carries a discount.
 */
export function Price({ product, className = "" }) {
  const price = product.effectiveSellingPrice ?? product.sellingPrice;
  const compareAt = product.sellingPrice;
  const isDiscounted = compareAt > price;
  const pct = product.discount?.type === "PERCENTAGE" ? product.discount.value : null;

  return (
    <p className={"flex flex-wrap items-baseline gap-x-2 gap-y-1 text-ink " + className}>
      <span className="font-semibold">{formatMinorUnits(price)}</span>
      {isDiscounted ? (
        <>
          <span className="text-sm text-muted line-through">
            {formatMinorUnits(compareAt)}
          </span>
          {pct ? (
            <span className="rounded-full bg-gold-soft/60 px-2 py-0.5 text-xs font-semibold text-mocha-deep">
              −{pct}%
            </span>
          ) : null}
        </>
      ) : null}
    </p>
  );
}
