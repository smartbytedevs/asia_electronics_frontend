import { formatMinorUnits } from "@/lib/utils";

/**
 * Price display: effective price, optional strikethrough compare-at, and a
 * percentage badge when the product carries a discount. The backend
 * serializes `discount.type` in lowercase; a percentage is derived from the
 * prices when the discount is fixed so the saving is always visible.
 */
export function Price({ product, className = "" }) {
  const price = product.effectiveSellingPrice ?? product.sellingPrice;
  const compareAt = product.sellingPrice;
  const isDiscounted = compareAt > price;
  const discountType =
    typeof product.discount?.type === "string"
      ? product.discount.type.toLowerCase()
      : "";
  const declaredPct =
    discountType === "percentage" && Number.isFinite(Number(product.discount?.value))
      ? Number(product.discount.value)
      : null;
  const computedPct =
    isDiscounted && compareAt > 0
      ? Math.round(((compareAt - price) / compareAt) * 100)
      : null;
  const pct = declaredPct ?? computedPct;

  return (
    <p className={"flex flex-wrap items-baseline gap-x-2 gap-y-1 text-ink " + className}>
      <span className="font-semibold">{formatMinorUnits(price)}</span>
      {isDiscounted ? (
        <>
          <span className="text-sm text-muted line-through">
            {formatMinorUnits(compareAt)}
          </span>
          {pct ? (
            <span className="rounded-full bg-electric-soft px-2 py-0.5 text-xs font-semibold text-electric-deep">
              −{pct}%
            </span>
          ) : null}
        </>
      ) : null}
    </p>
  );
}
