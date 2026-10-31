"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SectionHeading } from "./section-heading";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/**
 * Horizontal product row — a snap-scrolling swiper of fixed-width product
 * cards. On mobile each card is a dominant ~82vw and the scroller bleeds
 * edge-to-edge so the visible card snaps perfectly centered in the viewport
 * (padding of `(100vw - cardWidth) / 2`, so neighbor cards peek at both
 * edges). Native touch momentum + scroll snap do the swiping; on desktop the
 * row stays inside the page gutter, shows several cards at once and gains
 * prev/next paging arrows. The scroller clips its own overflow, so the page
 * itself never scrolls horizontally.
 *
 * Smooth programmatic scrolling only (desktop arrows); reduced-motion
 * preferences are intentionally ignored, matching the rest of the storefront.
 */
export function ProductRow({ eyebrow, title, actionHref, actionLabel, children }) {
  const scrollerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    // Deferred so the effect body never calls setState synchronously.
    queueMicrotask(updateArrows);
    const onResize = () => updateArrows();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [updateArrows]);

  const pageByCard = useCallback((direction) => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }
    const card = el.querySelector("[data-product-card]");
    const cardWidth = card?.getBoundingClientRect().width ?? 280;
    el.scrollBy({ left: direction * (cardWidth + 12), behavior: "smooth" });
  }, []);

  return (
    <>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        actionHref={actionHref}
        actionLabel={actionLabel}
      />
      <div className="relative">
        <div
          ref={scrollerRef}
          onScroll={updateArrows}
          role="region"
          aria-label={title ? `Products: ${title}` : "Products"}
          // Centered carousel on mobile: horizontal padding is half the
          // leftover viewport width around an 82vw card (capped at 420px), so
          // the first card and every snapped card sit dead-center. Desktop
          // (sm+) resets to the plain gutter-aligned row.
          className={
            "flex snap-x snap-mandatory -mx-4 gap-3 overflow-x-auto overscroll-x-contain pb-4 " +
            "px-[calc((100vw-min(82vw,420px))/2)] scroll-px-[calc((100vw-min(82vw,420px))/2)] " +
            "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden " +
            "sm:mx-0 sm:gap-5 sm:px-0 sm:pb-6 sm:scroll-px-6"
          }
        >
          {children}
        </div>

        {canScrollLeft ? (
          <button
            type="button"
            onClick={() => pageByCard(-1)}
            aria-label={`Scroll ${title ?? "products"} left`}
            className="absolute left-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/90 text-ink shadow-lg shadow-ink/10 backdrop-blur-sm transition-colors hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 md:flex"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
        ) : null}
        {canScrollRight ? (
          <button
            type="button"
            onClick={() => pageByCard(1)}
            aria-label={`Scroll ${title ?? "products"} right`}
            className="absolute right-3 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white/90 text-ink shadow-lg shadow-ink/10 backdrop-blur-sm transition-colors hover:bg-ink hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 md:flex"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    </>
  );
}
