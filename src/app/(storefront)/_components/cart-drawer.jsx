"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useCart } from "./cart-context";
import { CloseIcon, MinusIcon, PlusIcon, TrashIcon } from "./icons";
import { formatMinorUnits } from "@/lib/utils";

function LineImage({ src, alt }) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-sand text-[0.6rem] font-extrabold uppercase tracking-[0.3em] text-ink/35">
        AE
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt || "Product"}
      fill
      sizes="88px"
      className="object-cover"
    />
  );
}

/**
 * Slide-over shopping bag. Reads from the CartProvider, which serves either
 * the guest bag (localStorage) or the signed-in customer's backend cart.
 * Guests check out without an account.
 */
export function CartDrawer() {
  const {
    items,
    isOpen,
    toast,
    itemCount,
    subtotalMinorUnits,
    mode,
    ready,
    closeCart,
    updateQuantity,
    removeItem,
  } = useCart();

  const isLoading = mode === "backend" && !ready;

  function availabilityNote(item) {
    if (item.isAvailable === false) {
      return { text: "Currently unavailable", tone: "danger" };
    }
    if (item.availableOnlineQuantity === 0) {
      return { text: "Out of stock", tone: "danger" };
    }
    if (
      typeof item.availableOnlineQuantity === "number" &&
      item.quantity >= item.availableOnlineQuantity
    ) {
      return { text: `Only ${item.availableOnlineQuantity} available`, tone: "muted" };
    }
    return null;
  }

  function quantityAtCap(item) {
    return (
      typeof item.availableOnlineQuantity === "number" &&
      item.quantity >= item.availableOnlineQuantity
    );
  }

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px]"
            aria-hidden="true"
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen ? (
          <motion.aside
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Shopping cart"
          >
            <header className="flex items-center justify-between border-b border-sand px-6 py-5">
              <h2 className="font-display text-xl text-ink">
                Your cart{" "}
                <span className="text-base text-muted">({itemCount} item{itemCount === 1 ? "" : "s"})</span>
              </h2>
              <button
                type="button"
                onClick={closeCart}
                aria-label="Close cart"
                className="rounded-full p-2 text-ink transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                <CloseIcon />
              </button>
            </header>

            {isLoading ? (
              <div className="flex flex-1 items-center justify-center px-6 text-sm text-muted">
                Loading your cart…
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-2xl" aria-hidden="true">
                  ✦
                </p>
                <p className="font-display text-lg text-ink">Your cart is empty</p>
                <p className="text-sm text-muted">
                  Explore the catalog and add a product you love.
                </p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-2 rounded-full border border-mocha/30 px-6 py-2.5 text-sm font-medium text-mocha transition-colors hover:bg-sand"
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-sand overflow-y-auto px-6">
                  {items.map((item) => (
                    <li key={item.key} className="flex gap-4 py-5">
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-sand">
                        <LineImage src={item.imageUrl} alt={item.name} />
                      </div>
                      <div className="flex flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            {item.slug ? (
                              <Link
                                href={`/products/${item.slug}`}
                                onClick={closeCart}
                                className="text-sm font-medium text-ink hover:text-mocha"
                              >
                                {item.name}
                              </Link>
                            ) : (
                              <p className="text-sm font-medium text-ink">{item.name}</p>
                            )}
                            {item.attributesLabel ? (
                              <p className="mt-0.5 text-xs text-muted">{item.attributesLabel}</p>
                            ) : null}
                            {(() => {
                              const note = availabilityNote(item);
                              if (!note) {
                                return null;
                              }
                              return (
                                <p
                                  className={
                                    "mt-1 text-xs " +
                                    (note.tone === "danger"
                                      ? "font-medium text-[#c9604d]"
                                      : "text-muted")
                                  }
                                >
                                  {note.text}
                                </p>
                              );
                            })()}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.key)}
                            aria-label={`Remove ${item.name} from cart`}
                            className="rounded-full p-1 text-muted transition-colors hover:bg-sand hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-3">
                          <div className="inline-flex items-center rounded-full border border-sand">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.key, -1)}
                              aria-label="Decrease quantity"
                              className="rounded-l-full p-2 text-ink transition-colors hover:bg-sand"
                            >
                              <MinusIcon />
                            </button>
                            <span className="w-8 text-center text-sm tabular-nums text-ink">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.key, 1)}
                              aria-label="Increase quantity"
                              disabled={quantityAtCap(item)}
                              className="rounded-r-full p-2 text-ink transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <PlusIcon />
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-ink">
                            {formatMinorUnits((item.unitPriceMinorUnits ?? 0) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <footer className="border-t border-sand px-6 py-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-semibold text-ink">
                      {formatMinorUnits(subtotalMinorUnits)}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Delivery and taxes are calculated at checkout.
                  </p>
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="mt-4 block w-full rounded-full bg-ink px-6 py-3.5 text-center text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
                  >
                    Checkout
                  </Link>
                </footer>
              </>
            )}
          </motion.aside>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-ink px-5 py-2.5 text-sm text-cream shadow-lg"
            role="status"
          >
            {toast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
