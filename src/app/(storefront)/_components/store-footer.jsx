import Link from "next/link";
import { BrandLogo } from "./brand";
import {
  BoltIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  ShieldIcon,
  WhatsappIcon,
} from "./icons";
import { PAYMENT_METHODS } from "../lib/home-content";
import { SITE_CONTACT, whatsappHref } from "@/lib/site-contact";

const SOCIAL_LINKS = [
  {
    label: "WhatsApp",
    href: whatsappHref("Hello, I'm interested in your products."),
    icon: WhatsappIcon,
  },
];

const CARE_LINKS = [
  { label: "Track your order", href: "/track-order" },
  { label: "My account", href: "/account" },
  { label: "Your cart", href: "/cart" },
  { label: "Sign in", href: "/login" },
];

const POLICY_LINKS = [
  { label: "Privacy policy", href: "/privacy-policy" },
  { label: "Terms", href: "/terms" },
  { label: "Refund policy", href: "/refund-policy" },
  { label: "About us", href: "/about" },
];

const FALLBACK_SHOP_LINKS = [
  { label: "All products", href: "/collection" },
  { label: "New arrivals", href: "/collection?sort=newest" },
  { label: "Best deals", href: "/#deals" },
  { label: "Speakers", href: "/collection" },
  { label: "Torch & lights", href: "/collection" },
  { label: "Accessories", href: "/collection" },
];

/**
 * Storefront footer: navy canvas, brand blurb, shop and care navigation,
 * contact details, payment methods and a quiet legal bar.
 */
export function StoreFooter({ categories }) {
  const shopLinks =
    categories.length > 0
      ? [
          { label: "All products", href: "/collection" },
          ...categories.slice(0, 6).map((category) => ({
            label: category.name,
            href: `/categories/${category.slug}`,
          })),
        ]
      : FALLBACK_SHOP_LINKS;

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.35fr_0.75fr_0.75fr_0.75fr_1.15fr] lg:gap-12">
          <div>
            <BrandLogo tone="light" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/55">
              Quality electronics and honest advice. Asia Electronics brings
              dependable everyday products to Bangladesh — with support that
              continues long after checkout.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-white/60">
                <ShieldIcon className="h-3.5 w-3.5 text-electric" />
                Warranty as per seller policy
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-white/60">
                <BoltIcon className="h-3.5 w-3.5 text-electric" />
                Cash on delivery
              </span>
            </div>
            <div className="mt-6 flex items-center gap-2.5">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/70 transition-colors hover:border-electric/60 hover:bg-electric hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/50"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
              Shop
            </h3>
            <ul className="mt-5 space-y-2.5 text-sm">
              {shopLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
              Customer care
            </h3>
            <ul className="mt-5 space-y-2.5 text-sm">
              {CARE_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
              Policies
            </h3>
            <ul className="mt-5 space-y-2.5 text-sm">
              {POLICY_LINKS.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-white/70 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-white/45">
              Get in touch
            </h3>
            <ul className="mt-5 space-y-3.5 text-sm text-white/70">
              <li className="flex items-start gap-3">
                <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-electric" />
                <span className="leading-relaxed">
                  95/12 Jahanara Mension, Amtol, Riazuddin Bazar, Chittagong
                </span>
              </li>
              <li className="flex items-center gap-3">
                <PhoneIcon className="h-4 w-4 shrink-0 text-electric" />
                <a
                  href={`tel:${SITE_CONTACT.phoneTel}`}
                  className="transition-colors hover:text-white"
                >
                  {SITE_CONTACT.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MailIcon className="h-4 w-4 shrink-0 text-electric" />
                <a
                  href={`mailto:${SITE_CONTACT.email}`}
                  className="break-all transition-colors hover:text-white"
                >
                  {SITE_CONTACT.email}
                </a>
              </li>
            </ul>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {PAYMENT_METHODS.map((method) => (
                <span
                  key={method}
                  className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.08em] text-white/60"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 border-t border-white/10 py-6 text-xs text-white/45 sm:flex-row">
          <p>
            © {new Date().getFullYear()} Asia Electronics. All rights reserved.
          </p>
          <p>Quality electronics, better everyday — made for Bangladesh.</p>
        </div>
      </div>
    </footer>
  );
}
