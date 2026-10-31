"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useWishlist } from "./wishlist-context";
import { ProductImage } from "./product-image";
import { Price } from "./price";
import { CloseIcon, HeartIcon } from "./icons";

/**
 * Slide-over wishlist. Lists the saved products by fetching each product's
 * public detail through the backend proxy (the same anonymous read the
 * storefront uses), so the drawer never talks to the backend directly.
 * Each line links back to its product page and can be removed with a tap on
 * the heart. The saved ids live in localStorage via WishlistProvider.
 */
export function WishlistDrawer() {
  const { ids, isOpen, closeWishlist, toggle } = useWishlist();
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("idle");

  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function load() {
      if (ids.length === 0) {
        queueMicrotask(() => {
          setProducts([]);
          setStatus("idle");
        });
        return;
      }
      queueMicrotask(() => setStatus("loading"));
      const results = await Promise.all(
        ids.map(async (id) => {
          try {
            const res = await fetch(`/api/backend/products/${encodeURIComponent(id)}`, {
              cache: "no-store",
            });
            if (!res.ok) return null;
            const json = await res.json();
            return json?.data?.product ?? null;
          } catch {
            return null;
          }
        })
      );
      if (cancelled) return;
      const loaded = results.filter(Boolean);
      if (loaded.length > 0) {
        setProducts(loaded);
        setStatus("ready");
      } else {
        setProducts([]);
        setStatus("error");
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, ids]);

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeWishlist}
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
            aria-label="Wishlist"
          >
            <header className="flex items-center justify-between border-b border-sand px-6 py-5">
              <h2 className="font-display text-xl text-ink">
                Saved items{" "}
                <span className="text-base text-muted">({ids.length} item{ids.length === 1 ? "" : "s"})</span>
              </h2>
              <button
                type="button"
                onClick={closeWishlist}
                aria-label="Close wishlist"
                className="rounded-full p-2 text-ink transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                <CloseIcon />
              </button>
            </header>

            {status === "loading" ? (
              <div className="flex flex-1 items-center justify-center px-6 text-sm text-muted">
                Loading your saved items…
              </div>
            ) : status === "error" ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <HeartIcon className="h-8 w-8 text-gold" />
                <p className="font-display text-lg text-ink">
                  Couldn&apos;t load your saved items
                </p>
                <p className="text-sm text-muted">
                  Please try again in a moment.
                </p>
                <button
                  type="button"
                  onClick={closeWishlist}
                  className="mt-2 rounded-full border border-mocha/30 px-6 py-2.5 text-sm font-medium text-mocha transition-colors hover:bg-sand"
                >
                  Close
                </button>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <HeartIcon className="h-8 w-8 text-gold" />
                <p className="font-display text-lg text-ink">
                  Your wishlist is empty
                </p>
                <p className="text-sm text-muted">
                  Tap the heart on a product you love to save it here.
                </p>
                <button
                  type="button"
                  onClick={closeWishlist}
                  className="mt-2 rounded-full border border-mocha/30 px-6 py-2.5 text-sm font-medium text-mocha transition-colors hover:bg-sand"
                >
                  Continue shopping
                </button>
              </div>
            ) : (
              <ul className="flex-1 divide-y divide-sand overflow-y-auto px-6">
                {products.map((product) => (
                  <li key={product.id} className="flex gap-4 py-5">
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={closeWishlist}
                      className="relative block h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-sand"
                    >
                      <ProductImage
                        src={product.images?.[0]?.url}
                        alt={product.images?.[0]?.alt || product.name}
                        sizes="80px"
                      />
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link
                            href={`/products/${product.slug}`}
                            onClick={closeWishlist}
                            className="text-sm font-medium text-ink hover:text-mocha"
                          >
                            {product.name}
                          </Link>
                          <div className="mt-1">
                            <Price product={product} />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggle(product.id)}
                          aria-label={`Remove ${product.name} from wishlist`}
                          className="rounded-full p-1 text-muted transition-colors hover:bg-sand hover:text-ink"
                        >
                          <HeartIcon className="h-4 w-4 fill-current text-mocha-deep" />
                        </button>
                      </div>
                      <div className="mt-auto pt-3">
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={closeWishlist}
                          className="text-xs font-medium text-mocha underline-offset-4 hover:underline"
                        >
                          View product
                        </Link>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
