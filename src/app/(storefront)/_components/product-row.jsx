import { SectionHeading } from "./section-heading";

/**
 * Responsive product grid — two cards per row on mobile, two or three on
 * tablet and four on desktop. The grid grows downwards with normal page
 * scrolling; there is no horizontal scrolling or carousel behaviour. Cards
 * stretch to equal height within each row and stay inside a balanced,
 * centered content width on large screens.
 */
export function ProductRow({ eyebrow, title, actionHref, actionLabel, children }) {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        actionHref={actionHref}
        actionLabel={actionLabel}
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-5">
        {children}
      </div>
    </div>
  );
}
