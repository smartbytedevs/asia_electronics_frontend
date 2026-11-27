import { absoluteUrl } from "@/lib/seo";
import { SITE_CONTACT, whatsappHref } from "@/lib/site-contact";

const BUSINESS_ADDRESS =
  "95/12 Jahanara Mension, Amtol, Riazuddin Bazar, Chittagong";

export const metadata = {
  title: "Refund policy",
  description:
    "Return and replacement terms for wrong, damaged or defective items bought from Asia Electronics.",
  alternates: {
    canonical: absoluteUrl("/refund-policy"),
  },
};

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:py-16">
      <p className="text-[0.64rem] font-semibold uppercase tracking-[0.26em] text-electric">
        After your order
      </p>
      <h1 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
        Refund policy
      </h1>
      <div className="mt-8 space-y-7 text-sm leading-relaxed text-muted">
        <section>
          <h2 className="font-semibold text-ink">Returns and replacements</h2>
          <p className="mt-2">
            We offer a return or replacement only for items that are wrong,
            damaged or defective.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink">Reporting a problem</h2>
          <p className="mt-2">
            Please report the issue within 3 days of delivery and contact us by
            phone or WhatsApp.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-ink">Warranty</h2>
          <p className="mt-2">Warranty is as per seller policy.</p>
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
            Message us on{" "}
            <a
              href={whatsappHref("Hello Asia Electronics, I have an issue with my order.")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-electric transition-colors hover:text-electric-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
            >
              WhatsApp
            </a>{" "}
            to report a wrong, damaged or defective item.
          </p>
        </section>
      </div>
    </div>
  );
}
