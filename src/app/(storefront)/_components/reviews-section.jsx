"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
} from "./icons";
import { formatDate } from "@/lib/utils";

const AUTOPLAY_MS = 3500;
const SWIPE_THRESHOLD = 48;
const EASE = [0.22, 1, 0.36, 1];

/**
 * How many review columns fit per page, tuned to the viewport: one card on
 * phones, two on tablets, three on desktop. Initialized mobile-first and
 * re-measured on resize (deferred via microtask so the mount render never
 * runs a synchronous state update inside the effect).
 */
function useColumnsPerPage() {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const update = () => {
      const next =
        typeof window === "undefined"
          ? 1
          : window.innerWidth < 640
            ? 1
            : window.innerWidth < 1024
              ? 2
              : 3;
      setColumns((current) => (current === next ? current : next));
    };
    queueMicrotask(update);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return columns;
}

/**
 * Five-star rating readout shared by the homepage testimonials. Filled stars
 * follow the electric-blue accent; `rating` is rounded to the nearest whole
 * star for display.
 */
function ReviewStars({ rating }) {
  return (
    <span
      className="inline-flex items-center gap-0.5 text-electric"
      aria-label={`${rating} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((value) => (
        <StarIcon
          key={value}
          className="h-4 w-4"
          filled={value <= Math.round(rating)}
        />
      ))}
    </span>
  );
}

/**
 * A single testimonial card — deliberately sharp-edged (no rounded corners)
 * to match the editorial character of the section. Reads top-down as stars
 * first, then the customer's name, then the review itself.
 */
function ReviewCard({ review }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-ink/[0.08] bg-white p-6 shadow-[0_16px_40px_-30px_rgba(8,20,46,0.4)] transition-shadow hover:shadow-[0_24px_50px_-32px_rgba(8,20,46,0.5)] sm:p-7">
      <ReviewStars rating={review.rating} />
      <p className="mt-3.5 text-sm font-semibold tracking-wide text-ink">
        {review.customerDisplayName || "An Asia Electronics customer"}
      </p>
      {review.comment ? (
        <blockquote className="mt-2.5 flex-1 text-sm leading-relaxed text-mocha-deep">
          “{review.comment}”
        </blockquote>
      ) : null}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-sand pt-3.5">
        {review.productName ? (
          <Link
            href={`/products/${review.productSlug ?? ""}`}
            className="inline-block text-xs text-muted transition-colors hover:text-mocha"
          >
            {review.productName}
          </Link>
        ) : (
          <span />
        )}
        {review.createdAt ? (
          <time className="shrink-0 text-xs text-muted">
            {formatDate(review.createdAt)}
          </time>
        ) : null}
      </div>
    </div>
  );
}

/**
 * Homepage customer testimonials — a client-side carousel so it can
 * auto-advance through pages of side-by-side reviews.
 *
 * Reviews are chunked into pages of up to three columns (three on desktop,
 * two on tablet, one on phone) and slide horizontally on a soft easing curve.
 * The carousel advances itself every 3.5s (restarting only when the tab comes
 * back into view) and also supports the arrows, dots, keyboard and swipe.
 *
 * The section sits on a full-bleed boutique photograph with a cream wash, so
 * it reads like the rest of the editorial home page. When no approved reviews
 * exist yet — reviews are approved in /admin/reviews — a warm empty state
 * invites browsing instead.
 */
export function ReviewsSection({ reviews = [] }) {
  const columns = useColumnsPerPage();

  const pages = [];
  for (let i = 0; i < reviews.length; i += columns) {
    pages.push(reviews.slice(i, i + columns));
  }
  const pageCount = pages.length;

  const [active, setActive] = useState(0);
  const touchStartX = useRef(null);

  const step = useCallback(
    (direction) => {
      setActive((current) => {
        const next = current + direction;
        const wrapped = ((next % pageCount) + pageCount) % pageCount;
        return wrapped;
      });
    },
    [pageCount]
  );

  useEffect(() => {
    if (pageCount < 2) return;
    let id = window.setInterval(() => step(1), AUTOPLAY_MS);
    const stop = () => window.clearInterval(id);
    const restart = () => {
      stop();
      id = window.setInterval(() => step(1), AUTOPLAY_MS);
    };
    const onVisibility = () => (document.hidden ? stop() : restart());
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [step, pageCount]);

  useEffect(() => {
    if (active >= pageCount) {
      queueMicrotask(() => setActive(Math.max(0, pageCount - 1)));
    }
  }, [active, pageCount]);

  const current = Math.min(active, Math.max(0, pageCount - 1));

  const handleKeyDown = (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    }
  };

  const handleTouchStart = (event) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event) => {
    if (touchStartX.current == null) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) > SWIPE_THRESHOLD) step(delta < 0 ? 1 : -1);
  };

  return (
    <section
      aria-label="Customer reviews"
      aria-roledescription="carousel"
      className="relative overflow-hidden"
    >
      {/* Quiet navy-tinted backdrop keeps the section self-contained. */}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-sand via-ivory to-ivory" />
      <div aria-hidden="true" className="hero-grid absolute inset-0 opacity-[0.35] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[0.64rem] font-semibold uppercase tracking-[0.26em] text-electric">
              Customer reviews
            </p>
            <h2 className="mt-2 font-display text-2xl leading-tight text-ink sm:text-3xl">
              Trusted by tech lovers
            </h2>
          </div>

          {pageCount > 1 ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="Previous reviews"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white/90 text-ink shadow-md shadow-ink/5 transition-colors hover:bg-ink hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="Next reviews"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-white/90 text-ink shadow-md shadow-ink/5 transition-colors hover:bg-ink hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
          ) : null}
        </div>

        {reviews.length > 0 ? (
          <div
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="focus-visible:outline-none"
          >
            <div className="relative overflow-hidden">
              <div
                className="flex transition-transform duration-700"
                style={{
                  transform: `translateX(-${current * 100}%)`,
                  transitionTimingFunction: `cubic-bezier(${EASE.join(",")})`,
                }}
              >
                {pages.map((page, index) => (
                  <div
                    key={index}
                    inert={index !== current}
                    className="w-full shrink-0 px-2.5"
                  >
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {page.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {pageCount > 1 ? (
              <div className="mt-8 flex justify-center gap-2.5">
                {pages.map((page, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`Go to reviews page ${index + 1}`}
                    aria-current={index === current}
                    className={
                      "h-1.5 transition-all duration-500 " +
                      (index === current
                        ? "w-8 rounded-full bg-gold"
                        : "w-2.5 rounded-full bg-ink/25 hover:bg-ink/45")
                    }
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-ink/[0.08] bg-white px-6 py-14 text-center shadow-[0_16px_40px_-30px_rgba(8,20,46,0.4)] sm:px-10">
            <StarIcon className="mx-auto h-8 w-8 text-electric" />
            <h3 className="mt-4 font-display text-2xl text-ink">
              Reviews are on the way
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Verified customer reviews will appear here as they come in. Browse
              the catalog and be among the first to share your experience.
            </p>
            <Link
              href="/collection"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-ink px-8 py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/50"
            >
              Browse the catalog
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
