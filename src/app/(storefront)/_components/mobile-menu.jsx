"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRightIcon,
  CloseIcon,
  HeartIcon,
  MenuIcon,
  TruckIcon,
  UserIcon,
} from "./icons";
import { BrandLogo } from "./brand";
import { SearchBar } from "./search-bar";
import { useWishlist } from "./wishlist-context";

const EASE = [0.22, 1, 0.36, 1];

const panelVariants = {
  hidden: { opacity: 0, y: -16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 340, damping: 32, mass: 0.9 },
  },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25, ease: "easeIn" } },
};

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const FALLBACK_LINKS = [
  { href: "/collection", label: "All products" },
  { href: "/collection?sort=newest", label: "New arrivals" },
  { href: "/#deals", label: "Today's deals" },
];

/**
 * Mobile navigation drawer. Slides down from the header as a premium sheet
 * with a soft spring, staggered menu items, and gentle hover/tap feedback.
 * Fully touch-friendly, locks body scroll while open, closes on Esc or any
 * link tap.
 */
export function MobileMenu({ categories, accountHref, accountLabel }) {
  const [open, setOpen] = useState(false);
  const { ids, openWishlist } = useWishlist();
  const wishlistCount = ids.length;

  useEffect(() => {
    if (!open) return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const navItems =
    categories.length > 0
      ? [
          { href: "/collection", label: "All products" },
          ...categories.map((category) => ({
            href: `/categories/${category.slug}`,
            label: category.name,
          })),
        ]
      : FALLBACK_LINKS;

  return (
    <div className="flex items-center lg:hidden">
      <motion.button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        whileTap={{ scale: 0.9 }}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-haspopup="menu"
        className="rounded-full p-2 text-ink transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "menu"}
            initial={{ opacity: 0, rotate: -60 }}
            animate={{ opacity: 1, rotate: 0 }}
            exit={{ opacity: 0, rotate: 60 }}
            transition={{ duration: 0.2 }}
            className="flex"
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="mobile-panel"
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="absolute inset-x-0 top-full z-40 overflow-hidden rounded-b-[1.75rem] border-b border-ink/10 bg-white shadow-2xl shadow-ink/20"
          >
            <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain">
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="show"
                className="px-5 py-5 sm:px-8 sm:py-6"
              >
                <motion.div variants={itemVariants}>
                  <SearchBar variant="bar" />
                </motion.div>

                <motion.p
                  variants={itemVariants}
                  className="mt-6 flex items-center gap-3 text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-electric"
                >
                  <span className="h-px w-6 bg-electric/60" />
                  Shop
                </motion.p>

                <ul className="mt-2">
                  {navItems.map((item) => (
                    <motion.li
                      key={item.href + item.label}
                      variants={itemVariants}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="group flex items-center justify-between gap-4 border-b border-ink/[0.06] py-3"
                      >
                        <span className="text-lg font-semibold leading-tight text-ink transition-colors group-hover:text-electric">
                          {item.label}
                        </span>
                        <ArrowRightIcon className="h-4 w-4 shrink-0 -translate-x-1 text-electric opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    </motion.li>
                  ))}
                </ul>

                <motion.div
                  variants={itemVariants}
                  className="mt-5 inline-flex w-full items-center gap-3 rounded-2xl bg-electric-soft px-4 py-3 text-electric"
                >
                  <TruckIcon className="h-5 w-5 shrink-0" />
                  <p className="text-xs font-semibold leading-snug">
                    Cash on delivery
                    <span className="block font-normal text-muted">
                      Pay when your order arrives
                    </span>
                  </p>
                </motion.div>

                <motion.p
                  variants={itemVariants}
                  className="mt-6 flex items-center gap-3 text-[0.64rem] font-semibold uppercase tracking-[0.3em] text-electric"
                >
                  <span className="h-px w-6 bg-electric/60" />
                  Customer care
                </motion.p>

                <motion.ul
                  variants={itemVariants}
                  className="mt-3 grid grid-cols-3 gap-2.5"
                >
                  <motion.li variants={itemVariants} className="h-full">
                    <Link
                      href="/track-order"
                      onClick={() => setOpen(false)}
                      className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-ivory px-2 py-4 text-ink transition-colors hover:border-electric/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
                    >
                      <TruckIcon className="h-5 w-5 text-electric" />
                      <span className="text-xs font-medium">Track order</span>
                    </Link>
                  </motion.li>

                  <motion.li variants={itemVariants} className="h-full">
                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false);
                        openWishlist();
                      }}
                      className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-ivory px-2 py-4 text-ink transition-colors hover:border-electric/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
                    >
                      <span className="relative">
                        <HeartIcon className="h-5 w-5 text-electric" />
                        {wishlistCount > 0 ? (
                          <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-electric px-1 text-[0.55rem] font-bold leading-none text-white">
                            {wishlistCount > 99 ? "99" : wishlistCount}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs font-medium">Wishlist</span>
                    </button>
                  </motion.li>

                  <motion.li variants={itemVariants} className="h-full">
                    <Link
                      href={accountHref}
                      onClick={() => setOpen(false)}
                      className="flex h-full flex-col items-center justify-center gap-2 rounded-2xl border border-ink/10 bg-ivory px-2 py-4 text-ink transition-colors hover:border-electric/40 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
                    >
                      <UserIcon className="h-5 w-5 text-electric" />
                      <span className="text-xs font-medium">{accountLabel}</span>
                    </Link>
                  </motion.li>
                </motion.ul>

                <motion.div
                  variants={itemVariants}
                  className="mt-6 flex items-center justify-between border-t border-ink/10 pt-4"
                >
                  <BrandLogo />
                  <span className="text-[0.58rem] font-semibold uppercase tracking-[0.2em] text-muted">
                    Genuine tech
                  </span>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
