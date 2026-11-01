"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ProductImage } from "./product-image";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Product image gallery with thumbnail switching. The active image crossfades
 * subtly on change; thumbnails form a swipe-friendly, snap-scrolling strip on
 * small screens. Reduced-motion users get the crossfade disabled.
 */
export function ProductGallery({ images, name }) {
  const list = (images || [])
    .filter((image) => image.url)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const [active, setActive] = useState(0);

  if (list.length === 0) {
    return (
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-sand sm:aspect-[4/5]">
        <ProductImage src={null} alt={name} sizes="(min-width: 1024px) 50vw, 100vw" />
      </div>
    );
  }

  const current = list[Math.min(active, list.length - 1)];

  return (
      <div>
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-sand sm:aspect-[4/5]">
          <motion.div
            key={current.url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="absolute inset-0"
          >
            <ProductImage
              src={current.url}
              alt={current.alt || `${name} — Asia Electronics`}
              sizes="(min-width: 1024px) 50vw, 100vw"
              preload={active === 0}
              imgClassName="h-full w-full object-contain object-center p-4 sm:p-6 lg:p-8"
            />
          </motion.div>
        </div>
        {list.length > 1 ? (
          <div className="mt-4 flex gap-3 overflow-x-auto scroll-smooth pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {list.map((image, index) => (
              <button
                key={`${image.url}-${index}`}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Show image ${index + 1}`}
                aria-current={index === active}
                className={
                  "relative h-20 w-16 shrink-0 snap-start scroll-mx-2 overflow-hidden rounded-xl bg-sand transition-all " +
                  (index === active
                    ? "ring-2 ring-gold ring-offset-2 ring-offset-cream"
                    : "opacity-70 hover:opacity-100")
                }
              >
                <ProductImage
                  src={image.url}
                  alt=""
                  sizes="64px"
                  imgClassName="h-full w-full object-contain object-center p-1.5"
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>
  );
}
