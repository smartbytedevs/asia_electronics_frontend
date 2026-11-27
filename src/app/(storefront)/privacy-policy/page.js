import { absoluteUrl } from "@/lib/seo";
import { SITE_CONTACT, whatsappHref } from "@/lib/site-contact";

const BUSINESS_ADDRESS =
  "95/12 Jahanara Mension, Amtol, Riazuddin Bazar, Chittagong";

export const metadata = {
  title: "Privacy policy",
  description:
    "How Asia Electronics collects and uses customer information for order processing and support.",
  alternates: {
    canonical: absoluteUrl("/privacy-policy"),
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-16">
      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.26em] text-electric">
        Customer information
      </p>
      <h1 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
        Privacy policy
      </h1>
      <div className="mt-8 space-y-7 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-semibold text-ink">Information we collect</h2>
          <p className="mt-2">
            When you place an order, we collect your name, phone number,
            delivery address and email address.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink">How we use it</h2>
          <p className="mt-2">
            We use this information only to process your order, arrange
            delivery and provide customer support. We do not sell your
            information.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink">Contact us</h2>
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
            You can also message us on{" "}
            <a
              href={whatsappHref("Hello Asia Electronics, I have a privacy question.")}
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
