import Link from "next/link";
import { ArrowRightLeft } from "lucide-react";

const TRANSFER_BUTTON =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-gold-soft bg-white px-3 text-xs font-medium text-mocha-deep transition-colors hover:bg-gold-soft/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-1";

/**
 * Desktop Stock Transfers table. Lists every initialized stock subject with
 * its current Online (available) / Offline / Reserved quantities — stock moves
 * between the Online and Offline locations only (no outlets). Rows are
 * enriched by the parent with product/variant names, so no raw IDs are shown.
 */
export function TransferTable({ transfers, onTransfer, className }) {
  return (
    <div className={`overflow-hidden rounded-2xl border border-gold-soft/70 bg-cream ${className ?? ""}`}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-sand/70 text-xs uppercase tracking-wider text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">Item</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Online available</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Offline</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Reserved</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Transfer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-soft/40">
            {transfers.map((item) => {
              const href = item.productVariantId
                ? `/admin/inventory/${encodeURIComponent(item.productVariantId)}`
                : null;
              return (
                <tr key={item.id ?? item.productId} className="hover:bg-gold-soft/20">
                  <td className="px-4 py-3">
                    {href ? (
                      <Link
                        href={href}
                        className="font-medium text-mocha-deep transition-colors hover:text-ink hover:underline"
                      >
                        {item.productNameLabel}
                      </Link>
                    ) : (
                      <span className="font-medium text-ink">
                        {item.productNameLabel}
                      </span>
                    )}
                    {item.variantSku ? (
                      <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center rounded-md border border-gold-soft/70 bg-sand/60 px-1.5 py-0.5 text-[0.7rem] font-medium tabular-nums text-mocha-deep">
                          {item.variantSku}
                        </span>
                        {item.variantOptions.map(([key, value]) => (
                          <span
                            key={key}
                            className="inline-flex items-center rounded-md border border-gold-soft/40 bg-white px-1.5 py-0.5 text-[0.7rem] text-mocha-deep"
                          >
                            {key}: {value}
                          </span>
                        ))}
                      </span>
                    ) : (
                      <span className="mt-0.5 block text-xs text-muted">
                        Simple product
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                    {item.availableOnlineQuantity}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-ink">
                    {item.offlineQuantity}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted">
                    {item.reservedQuantity}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onTransfer(item)}
                      className={TRANSFER_BUTTON}
                    >
                      <ArrowRightLeft aria-hidden="true" className="h-3.5 w-3.5" />
                      Transfer
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
