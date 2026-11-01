"use client";

import { BrandLogo } from "@/components/brand-logo";

/** Asia Electronics logo — used atop the auth card. */
export function AuthBrand() {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <BrandLogo
        href="/"
        imgClassName="h-16 sm:h-20"
        sizes="240px"
        priority
      />
    </div>
  );
}

/** Title + subtitle pair for the auth card. */
export function AuthCardHeading({ title, subtitle }) {
  return (
    <div className="mt-7 flex flex-col items-center gap-2 text-center">
      <h1 className="font-display text-2xl text-ink">{title}</h1>
      <p className="text-sm leading-relaxed text-muted">{subtitle}</p>
    </div>
  );
}
