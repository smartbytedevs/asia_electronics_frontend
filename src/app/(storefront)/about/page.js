import { absoluteUrl } from "@/lib/seo";
import { SITE_CONTACT, whatsappHref } from "@/lib/site-contact";

const BUSINESS_ADDRESS =
  "95/12 Jahanara Mension, Amtol, Riazuddin Bazar, Chittagong";

export const metadata = {
  title: "About us",
  description:
    "Asia Electronics is a Chattogram shop selling speakers, torch lights, fans, trimmers and small electronics.",
  alternates: {
    canonical: absoluteUrl("/about"),
  },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-16">
      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.26em] text-electric">
        Our shop
      </p>
      <h1 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
        About Asia Electronics
      </h1>
      <div className="mt-8 space-y-7 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-semibold text-ink">Who we are</h2>
          <p className="mt-2">
            Asia Electronics is an electronics shop in Chattogram, Bangladesh.
            We sell speakers, torch lights, fans, trimmers and other small
            electronics for everyday use.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink">Visit or contact us</h2>
          <p className="mt-2">
            Asia Electronics
            <br />
            {BUSINESS_ADDRESS}
            <br />
            Phone / WhatsApp:{" "}
            <a
              href={`tel:${SITE_CONTACT.phoneTel}`}
              className="text-electric transition-colors hover:text-electric-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
            >
              {SITE_CONTACT.phoneDisplay}
            </a>
            <br />
            Email:{" "}
            <a
              href={`mailto:${SITE_CONTACT.email}`}
              className="text-electric transition-colors hover:text-electric-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
            >
              {SITE_CONTACT.email}
            </a>
          </p>
          <p className="mt-2">
            Prefer to chat? Message us on{" "}
            <a
              href={whatsappHref("Hello Asia Electronics, I have a question.")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-electric transition-colors hover:text-electric-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
            >
              WhatsApp
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
