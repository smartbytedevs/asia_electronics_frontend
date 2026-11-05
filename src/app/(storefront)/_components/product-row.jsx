import Link from "next/link";
import { SectionHeading } from "./section-heading";
import { ArrowRightIcon } from "./icons";

/**
 * Responsive product grid — two cards per row on mobile, two or three on
 * tablet and four on desktop. The grid grows downwards with normal page
 * scrolling; there is no horizontal scrolling or carousel behaviour. Cards
 * stretch to equal height within each row and stay inside a balanced,
 * centered content width on large screens.
 *
 * `bottomActionHref` moves the section action from the heading to a single
 * full-width button below the cards. Other catalog pages can keep using the
 * compact heading action by passing `actionHref` instead.
 */
export function ProductRow({
  eyebrow,
  title,
  actionHref,
  actionLabel,
  bottomActionHref,
  bottomActionLabel,
  children,
}) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        actionHref={bottomActionHref ? undefined : actionHref}
        actionLabel={actionLabel}
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
        {children}
      </div>
      {bottomActionHref ? (
        <Link
          href={bottomActionHref}
          className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-electric/40 hover:bg-electric-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 sm:mt-8 sm:py-3.5"
        >
          {bottomActionLabel ?? "See All"}
          <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      ) : null}
    </div>
  );
}
