import { absoluteUrl } from "@/lib/seo";
import { SITE_CONTACT, whatsappHref } from "@/lib/site-contact";

const BUSINESS_ADDRESS =
  "95/12 Jahanara Mension, Amtol, Riazuddin Bazar, Chittagong";

export const metadata = {
  title: "Terms",
  description:
    "Ordering, pricing, payment methods, cancellation and liability terms for Asia Electronics.",
  alternates: {
    canonical: absoluteUrl("/terms"),
  },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-16">
      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.26em] text-electric">
        Store information
      </p>
      <h1 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
        Terms
      </h1>
      <div className="mt-8 space-y-7 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-semibold text-ink">Ordering</h2>
          <p className="mt-2">
            Orders are placed through this website and confirmed when our team
            contacts you to arrange delivery.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink">Pricing and payment</h2>
          <p className="mt-2">
            All prices are shown in Bangladeshi Taka (BDT). We accept cash on
            delivery, bKash and bank transfer.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink">Order cancellation</h2>
          <p className="mt-2">
            You may cancel an order before it is dispatched by contacting us by
            phone or WhatsApp.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink">Limitation of liability</h2>
          <p className="mt-2">
            Our liability is limited to the value of your order. We are not
            responsible for indirect or consequential losses.
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
            To cancel an order, message us on{" "}
            <a
              href={whatsappHref("Hello Asia Electronics, I would like to cancel an order.")}
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
