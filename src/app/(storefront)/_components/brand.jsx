import Link from "next/link";
import { BoltIcon } from "./icons";

/**
 * Asia Electronics wordmark. The compact navy tile + bolt is the brand mark;
 * `tone="light"` flips the type for dark surfaces such as the footer and hero.
 */
export function BrandLogo({ href = "/", tone = "dark", className = "" }) {
  const light = tone === "light";

  return (
    <Link
      href={href}
      aria-label="Asia Electronics — home"
      className={"group inline-flex items-center gap-2.5 " + className}
    >
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ink text-white shadow-[0_10px_24px_-14px_rgba(8,20,46,0.9)] transition-transform duration-300 group-hover:-translate-y-0.5 sm:h-11 sm:w-11">
        <BoltIcon className="h-5 w-5 text-white" />
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-electric ring-2 ring-white"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={
            "text-[0.95rem] font-extrabold uppercase leading-none tracking-[0.2em] sm:text-base " +
            (light ? "text-white" : "text-ink")
          }
        >
          Asia
        </span>
        <span
          className={
            "mt-1 text-[0.52rem] font-semibold uppercase leading-none tracking-[0.3em] " +
            (light ? "text-white/55" : "text-muted")
          }
        >
          Electronics
        </span>
      </span>
    </Link>
  );
}
