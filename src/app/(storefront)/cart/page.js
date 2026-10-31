"use client";

import Image from "next/image";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { EmptyState } from "../_components/empty-state";
import { QuantityStepper } from "../_components/add-to-cart";
import { useCart } from "../_components/cart-context";
import { CloseIcon } from "../_components/icons";
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
      sizes="120px"
      className="object-cover"
    />
  );
}

function CartSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <div className="h-8 w-40 rounded bg-sand" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-sand/70" />
          ))}
        </div>
        <div className="h-56 animate-pulse rounded-2xl bg-sand/70" />
      </div>
    </div>
  );
}

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

/**
 * Public bag page. Guests see the local browser bag; signed-in customers see
 * their real backend cart (loaded through the CartProvider). Either way,
 * checking out works without an account — guests check out as their guest
 * identity (X-Guest-Id).
 */
export default function CartPage() {
  const {
    items,
    ready,
    subtotalMinorUnits,
    setQuantity,
    removeItem,
    clearCart,
  } = useCart();
  const { data: session } = authClient.useSession();
  const isSignedIn = Boolean(session?.user);

  if (!ready) {
    return <CartSkeleton />;
  }

  const checkoutHref = "/checkout";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
      <header>
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-electric">
          Your cart
        </p>
        <h1 className="mt-3 font-display text-4xl leading-tight text-ink">
          Shopping cart
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted">
          Review your items before heading to checkout. Prices are indicative —
          the final total is confirmed when your order is placed.
        </p>
      </header>

      {items.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            title="Your cart is empty"
            description="Explore the catalog and add a product you love."
            actionHref="/collection"
            actionLabel="Browse the catalog"
          />
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_340px]">
          <ul className="divide-y divide-sand">
            {items.map((item) => (
              <li key={item.key} className="flex gap-5 py-6">
                <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-sand">
                  <LineImage src={item.imageUrl} alt={item.name} />
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      {item.slug ? (
                        <Link
                          href={`/products/${item.slug}`}
                          className="font-display text-lg text-ink hover:text-mocha"
                        >
                          {item.name}
                        </Link>
                      ) : (
                        <p className="font-display text-lg text-ink">{item.name}</p>
                      )}
                      {item.attributesLabel ? (
                        <p className="mt-0.5 text-sm text-muted">{item.attributesLabel}</p>
                      ) : null}
                      {(() => {
                        const note = availabilityNote(item);
                        if (!note) {
                          return null;
                        }
                        return (
                          <p
                            className={
                              "mt-1 text-sm " +
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
                      aria-label={`Remove ${item.name}`}
                      className="rounded-full p-2 text-muted transition-colors hover:bg-sand hover:text-ink"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(next) => setQuantity(item.key, next)}
                      max={
                        typeof item.availableOnlineQuantity === "number"
                          ? item.availableOnlineQuantity
                          : undefined
                      }
                    />
                    <p className="text-base font-semibold text-ink">
                      {formatMinorUnits((item.unitPriceMinorUnits ?? 0) * item.quantity)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="lg:sticky lg:top-32 lg:self-start">
            <div className="rounded-2xl border border-sand bg-white p-6">
              <h2 className="font-display text-lg text-ink">Order summary</h2>
              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd className="font-semibold text-ink">
                    {formatMinorUnits(subtotalMinorUnits)}
                  </dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-muted">
                Delivery and taxes are calculated when your order is confirmed.
              </p>
              <Link
                href={checkoutHref}
                className="mt-5 block w-full rounded-full bg-ink px-6 py-3.5 text-center text-sm font-semibold tracking-wide text-cream transition-colors hover:bg-mocha-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60"
              >
                Proceed to checkout
              </Link>
              {!isSignedIn ? (
                <p className="mt-3 text-xs leading-relaxed text-muted">
                  You&apos;re shopping as a guest — checkout is available
                  without an account.{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-mocha underline-offset-4 hover:underline"
                  >
                    Sign in
                  </Link>{" "}
                  to keep your cart and track orders next time.
                </p>
              ) : null}
              <button
                type="button"
                onClick={clearCart}
                className="mt-4 w-full rounded-full border border-mocha/30 px-6 py-2.5 text-sm font-medium text-mocha transition-colors hover:bg-sand"
              >
                Clear cart
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
