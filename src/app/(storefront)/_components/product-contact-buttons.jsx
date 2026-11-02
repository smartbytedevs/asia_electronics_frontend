"use client";

import { motion } from "motion/react";
import { PhoneIcon, WhatsappIcon } from "./icons";
import { SITE_CONTACT, whatsappHref } from "@/lib/site-contact";

const EASE = [0.22, 1, 0.36, 1];

/**
 * Direct-contact actions for a product detail page: a phone call and a
 * WhatsApp chat pre-filled with the product name. Styled to match the
 * storefront's navy/white purchase controls and shared by every product
 * detail page through the purchase panel.
 *
 * `bare` returns the two links without a wrapper so the parent can place all
 * four purchase/contact actions in one aligned grid.
 */
export function ProductContactButtons({ productName, className = "", bare = false }) {
  const message = `Hello, I'm interested in ${productName}. Please provide more details.`;
  const productWhatsappHref = whatsappHref(message);

  const links = (
    <>
      <motion.a
        href={`tel:${SITE_CONTACT.phoneTel}`}
        aria-label={`Call Asia Electronics about ${productName}`}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-ink px-4 py-3.5 text-sm font-semibold tracking-wide text-white transition-colors hover:bg-navy-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/50 focus-visible:ring-offset-2 sm:px-6"
      >
        <PhoneIcon className="h-4 w-4" />
        Call now
      </motion.a>
      <motion.a
        href={productWhatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Chat on WhatsApp about ${productName}`}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="inline-flex h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-ink/15 bg-white px-4 py-3.5 text-sm font-semibold tracking-wide text-ink transition-colors hover:border-electric/40 hover:bg-electric-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 focus-visible:ring-offset-2 sm:px-6"
      >
        <WhatsappIcon className="h-4 w-4" />
        WhatsApp
      </motion.a>
    </>
  );

  if (bare) {
    return links;
  }

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`.trim()}>
      {links}
    </div>
  );
}
