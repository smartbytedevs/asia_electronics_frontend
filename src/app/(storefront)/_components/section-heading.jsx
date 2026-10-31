import Link from "next/link";
import { ArrowRightIcon } from "./icons";

/**
 * Section heading with eyebrow + display title and an optional "view all"
 * action link.
 */
export function SectionHeading({ eyebrow, title, actionHref, actionLabel }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div>
        {eyebrow ? (
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.26em] text-electric">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="mt-2 font-display text-2xl leading-tight text-ink sm:text-3xl">
          {title}
        </h2>
      </div>
      {actionHref ? (
        <Link
          href={actionHref}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
        >
          {actionLabel ?? "View all"}
          <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      ) : null}
    </div>
  );
}
