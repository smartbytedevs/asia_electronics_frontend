"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

// Ensure these files exist inside your public/banner/ folder
const BANNER_IMAGES = [
  "/banner/banner-1.jpg",
  "/banner/banner-2.jpg",
  "/banner/banner-3.jpg",
];

export function BannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % BANNER_IMAGES.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section aria-label="Storefront Hero Slider" className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-3xl bg-slate-100 shadow-md sm:aspect-[24/8]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full"
          >
            <Image
              src={BANNER_IMAGES[currentIndex]}
              alt={`Asia Electronics promotional banner ${currentIndex + 1}`}
              fill
              sizes="(min-width: 1280px) 1216px, 100vw"
              preload={currentIndex === 0}
              fetchPriority={currentIndex === 0 ? "high" : undefined}
              className="object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>

        {/* Carousel indicators dots */}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {BANNER_IMAGES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === idx ? "w-6 bg-sky-600" : "w-2 bg-white/60 hover:bg-white"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}