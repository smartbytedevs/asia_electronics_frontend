"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { MailIcon, PhoneIcon, WhatsappIcon } from "./icons";
import {
  SITE_CONTACT,
  gmailComposeHref,
  whatsappHref,
} from "@/lib/site-contact";

const EASE = [0.22, 1, 0.36, 1];

const ACTIONS = [
  {
    key: "call",
    label: "Call now",
    value: SITE_CONTACT.phoneDisplay,
    href: `tel:${SITE_CONTACT.phoneTel}`,
    icon: PhoneIcon,
    external: false,
    accent: "bg-ink text-white",
  },
  {
    key: "whatsapp",
    label: "WhatsApp",
    value: "Chat with us",
    href: whatsappHref("Hello Asia Electronics, I have a question."),
    icon: WhatsappIcon,
    external: true,
    accent: "bg-[#25d366] text-white",
  },
  {
    key: "gmail",
    label: "Gmail",
    value: SITE_CONTACT.email,
    href: gmailComposeHref("Website enquiry — Asia Electronics"),
    icon: MailIcon,
    external: true,
    accent: "bg-electric text-white",
  },
];

function ChatIcon({ className = "h-6 w-6" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l2-3.2A8.5 8.5 0 1 1 21 11.5Z" />
      <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
    </svg>
  );
}

function CloseIcon({ className = "h-6 w-6" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

/**
 * Floating contact launcher shown on every storefront page.
 *
 * Keeps the shop's three contact channels one tap away: a phone call, a
 * WhatsApp chat and a pre-addressed Gmail compose window. The menu closes on
 * Escape or a click outside, and every action is a plain link so it works
 * without JavaScript-only navigation.
 */
export function FloatingContact() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleKey(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    function handlePointer(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKey);
    document.addEventListener("pointerdown", handlePointer);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("pointerdown", handlePointer);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="fixed right-4 bottom-5 z-40 flex flex-col items-end gap-3 print:hidden sm:right-6 sm:bottom-6"
    >
      <AnimatePresence>
        {open ? (
          <motion.div
            id="floating-contact-menu"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="w-[min(19rem,calc(100vw-2rem))] origin-bottom-right overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-2xl shadow-ink/20"
          >
            <div className="border-b border-ink/10 bg-ivory px-4 py-3">
              <p className="text-sm font-semibold text-ink">
                Chat with Asia Electronics
              </p>
              <p className="mt-0.5 text-xs text-muted">
                Call, WhatsApp or email us — we&apos;re happy to help.
              </p>
            </div>
            <ul className="p-2">
              {ACTIONS.map(({ key, label, value, href, icon: Icon, external, accent }) => (
                <li key={key}>
                  <a
                    href={href}
                    {...(external
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${accent}`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">
                        {label}
                      </span>
                      <span className="block truncate text-xs text-muted">
                        {value}
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="floating-contact-menu"
        aria-label={open ? "Close contact options" : "Contact Asia Electronics"}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        transition={{ duration: 0.2, ease: EASE }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-electric text-white shadow-lg shadow-electric/30 transition-colors hover:bg-electric-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/50 focus-visible:ring-offset-2"
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </motion.button>
    </div>
  );
}
