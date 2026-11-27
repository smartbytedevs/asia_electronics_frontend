import { Suspense } from "react";
import Link from "next/link";
import { ProductCard } from "./_components/product-card";
import { ProductImage } from "./_components/product-image";
import { ProductRow } from "./_components/product-row";
import { SectionHeading } from "./_components/section-heading";
import { NewsletterForm } from "./_components/newsletter-form";
import { ReviewsSection } from "./_components/reviews-section";
import { BannerSlider } from "./_components/banner-slider"; // <-- Import slider
import {
  ArrowRightIcon,
  BoltIcon,
  RefreshIcon,
  ShieldIcon,
  SpeakerIcon,
} from "./_components/icons";
import { SITE_URL, absoluteUrl } from "@/lib/seo";
import { SITE_CONTACT } from "@/lib/site-contact";
import {
  fetchCategories,
  fetchHomeNewArrivals,
  fetchProducts,
  fetchRecentReviews,
  hasMoreProducts,
} from "./lib/catalog-data";
import {
  BESTSELLER_TRACKS,
  CURATED_CATEGORIES,
  DEAL_CARDS,
  SERVICE_PROMISES,
  TRUST_ITEMS,
  iconForCategory,
} from "./lib/home-content";

export const dynamic = "force-dynamic";

const HOMEPAGE_TITLE = "Asia Electronics — Quality Electronics, Better Everyday";
const HOMEPAGE_DESCRIPTION =
  "Shop quality speakers, sound boxes, rechargeable torch lights, electric fans, trimmers and grooming devices at Asia Electronics — warranty as per seller policy and delivery across Chittagong and Bangladesh.";

export const metadata = {
  title: { absolute: HOMEPAGE_TITLE },
  description: HOMEPAGE_DESCRIPTION,
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    type: "website",
    url: absoluteUrl("/"),
    siteName: "Asia Electronics",
    locale: "en_BD",
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    images: [
      {
        url: absoluteUrl("/bg.jpg"),
        width: 1376,
        height: 768,
        alt: "Asia Electronics storefront",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOMEPAGE_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    images: [absoluteUrl("/bg.jpg")],
  },
};

async function HomeCategories() {
  const categories = await fetchCategories();
  return categories.length > 0 ? (
    <LiveCategoryGrid categories={categories} />
  ) : (
    <CuratedCategoryGrid />
  );
}

async function FeaturedProductsSection() {
  const featured = await fetchProducts({
    featured: true,
    sort: "featured",
    limit: 8,
    includeRatings: true,
  });
  const products = featured?.products ?? [];
  const hasMore = hasMoreProducts(featured?.pagination, products.length);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:pb-16">
      {products.length > 0 ? (
        <ProductRow
          eyebrow="Best sellers"
          title="Popular right now"
          bottomActionHref={hasMore ? "/collection?sort=featured" : undefined}
          bottomActionLabel="See All"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </ProductRow>
      ) : (
        <>
          <SectionHeading
            eyebrow="Best sellers"
            title="Popular right now"
            actionHref="/collection"
            actionLabel="Shop all"
          />
          <BestsellerTracks />
        </>
      )}
    </section>
  );
}

async function NewArrivalsSection() {
  const newArrivals = await fetchHomeNewArrivals();
  const products = newArrivals?.products ?? [];
  const hasMore = hasMoreProducts(newArrivals?.pagination, products.length);

  if (products.length === 0) {
    return <EditorialPromos />;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:pb-16">
      <ProductRow
        eyebrow="Just landed"
        title="New arrivals"
        bottomActionHref={hasMore ? "/collection" : undefined}
        bottomActionLabel="See All"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </ProductRow>
    </section>
  );
}

async function HomeReviews() {
  const reviews = await fetchRecentReviews({ limit: 6 }).catch(() => []);
  return reviews.length > 0 ? <ReviewsSection reviews={reviews} /> : null;
}

function TrustStrip() {
  return (
    <section aria-label="Why shop with Asia Electronics" className="border-b border-ink/[0.07] bg-white">
      <ul className="mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-6 px-4 py-7 sm:px-6 lg:grid-cols-4">
        {TRUST_ITEMS.map((item) => (
          <li key={item.title} className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-electric-soft text-electric">
              <item.icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold leading-tight text-ink">
                {item.title}
              </span>
              <span className="mt-1 block text-xs leading-snug text-muted">
                {item.copy}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CategoryThumb({ image, name, Icon }) {
  if (image) {
    return (
      <div className="relative aspect-square w-full max-w-[68px] overflow-hidden rounded-xl bg-sand">
        <ProductImage
          src={image}
          alt={name}
          sizes="68px"
          imgClassName="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
      </div>
    );
  }

  return (
    <div className="flex aspect-square w-full max-w-[68px] items-center justify-center rounded-xl bg-sand text-electric transition-colors duration-300 group-hover:bg-electric-soft">
      {Icon ? (
        <Icon aria-hidden="true" className="h-6 w-6" />
      ) : (
        <span className="text-[0.62rem] font-extrabold uppercase tracking-[0.24em] text-ink/35">
          AE
        </span>
      )}
    </div>
  );
}

function CategoryGrid({ items }) {
  return (
    <div className="relative">
      <ul className="-mx-4 grid snap-x snap-mandatory grid-flow-col grid-rows-2 gap-2 overflow-x-auto scroll-smooth px-4 pb-2 pt-1 [grid-auto-columns:96px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:gap-3 sm:px-0 sm:pb-0 sm:[grid-auto-columns:112px] sm:[justify-content:safe_center]">
        {items.map((item) => (
          <li key={item.key} className="snap-start">
            <Link
              href={item.href}
              title={item.name}
              className="group flex h-full w-full flex-col items-center gap-2 rounded-2xl border border-ink/[0.07] bg-white p-2 text-center shadow-[0_12px_30px_-28px_rgba(8,20,46,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:border-electric/30 hover:shadow-[0_18px_36px_-26px_rgba(8,20,46,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40 sm:p-2.5"
            >
              <CategoryThumb image={item.image} name={item.name} Icon={item.icon} />
              <span className="block min-h-[2.75em] w-full line-clamp-2 text-xs font-medium leading-snug text-ink transition-colors group-hover:text-electric sm:text-[0.8rem]">
                {item.name}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function LiveCategoryGrid({ categories }) {
  return (
    <CategoryGrid
      items={categories.slice(0, 10).map((category) => ({
        key: category.id,
        href: `/categories/${category.slug}`,
        name: category.name,
        image: category.image,
        icon: iconForCategory(category),
      }))}
    />
  );
}

function CuratedCategoryGrid() {
  return (
    <CategoryGrid
      items={CURATED_CATEGORIES.map((category) => ({
        key: category.key,
        href: "/collection",
        name: category.name,
        icon: category.icon,
      }))}
    />
  );
}

function DealsSection() {
  return (
    <section id="deals" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
      <SectionHeading
        eyebrow="This week"
        title="Deals worth switching on"
        actionHref="/collection"
        actionLabel="Shop all deals"
      />
      <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
        <article className="relative isolate flex min-h-[19rem] flex-col justify-between overflow-hidden rounded-3xl bg-ink p-7 text-white sm:p-9">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_78%_20%,rgba(31,107,255,0.55),transparent_55%)]"
          />
          <div
            aria-hidden="true"
            className="hero-grid absolute inset-0 opacity-60"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-12 -right-4 h-44 w-44 rounded-full border border-white/15"
          />
          <div className="relative">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-white/60">
              This week&apos;s deals
            </p>
            <h3 className="mt-4 max-w-md text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl">
              Good prices on sound, light, fans &amp; accessories.
            </h3>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">
              Quality electronics, warranty as per seller policy and delivery across Bangladesh.
            </p>
          </div>
          <div className="relative mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/collection"
              className="group inline-flex items-center gap-2 rounded-full bg-electric px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_40px_-18px_rgba(31,107,255,0.9)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-electric-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Shop the drop
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-white/60">
              <BoltIcon className="h-3.5 w-3.5 text-electric" />
              While stock lasts
            </span>
          </div>
        </article>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {DEAL_CARDS.map((deal) => (
            <article
              key={deal.key}
              className="group flex flex-col justify-between gap-5 rounded-3xl border border-ink/[0.08] bg-white p-6 transition-all duration-300 hover:border-electric/40 hover:shadow-[0_24px_50px_-34px_rgba(8,20,46,0.5)] sm:p-7"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-electric-soft text-electric">
                  <deal.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-electric">
                    {deal.eyebrow}
                  </p>
                  <h3 className="mt-1.5 text-lg font-bold leading-tight text-ink">
                    {deal.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {deal.copy}
                  </p>
                </div>
              </div>
              <Link
                href={deal.href}
                className="inline-flex items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
              >
                {deal.cta}
                <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BestsellerTracks() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
      {BESTSELLER_TRACKS.map((track) => (
        <Link
          key={track.key}
          href="/collection"
          className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-ink/[0.08] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-electric/40 hover:shadow-[0_24px_48px_-30px_rgba(8,20,46,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/40"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sand text-navy transition-colors duration-300 group-hover:bg-ink group-hover:text-white">
            <track.icon className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="block text-[0.95rem] font-semibold leading-tight text-ink">
              {track.name}
            </span>
            <span className="mt-1.5 block text-xs leading-relaxed text-muted">
              {track.copy}
            </span>
            <span className="mt-3 inline-flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-electric">
              Explore
              <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </span>
        </Link>
      ))}
    </div>
  );
}

function EditorialPromos() {
  return (
    <section aria-label="Shop by moment" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
      <div className="grid gap-4 lg:grid-cols-2">
        <article className="relative isolate overflow-hidden rounded-3xl border border-ink/[0.08] bg-sand p-7 sm:p-9">
          <div
            aria-hidden="true"
            className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/70"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-16 right-6 h-40 w-40 rounded-full border border-ink/10"
          />
          <div className="relative max-w-sm">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-electric">
              Sound
            </p>
            <h3 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-ink sm:text-3xl">
              Sound that fills the room.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Speakers, sound boxes and audio gear picked for clear sound at
              home, at work and on the go.
            </p>
            <Link
              href="/collection"
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-electric focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric/50"
            >
              Shop audio
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div
            aria-hidden="true"
            className="relative mt-8 flex items-end justify-end gap-3 sm:absolute sm:bottom-8 sm:right-8 sm:mt-0"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-ink shadow-[0_18px_36px_-24px_rgba(8,20,46,0.5)]">
              <SpeakerIcon className="h-7 w-7" />
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-white shadow-[0_18px_36px_-24px_rgba(8,20,46,0.7)]">
              <BoltIcon className="h-5 w-5" />
            </span>
          </div>
        </article>

        <article className="relative isolate overflow-hidden rounded-3xl bg-ink p-7 text-white sm:p-9">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(circle_at_82%_78%,rgba(31,107,255,0.5),transparent_55%)]"
          />
          <div
            aria-hidden="true"
            className="absolute -right-14 -top-14 h-56 w-56 rounded-full border border-white/10"
          />
          <div className="relative max-w-sm">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-electric">
              Light &amp; comfort
            </p>
            <h3 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              Light and comfort, anywhere.
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-white/65">
              Rechargeable lights, torches and fans that keep everyday life
              running.
            </p>
            <Link
              href="/collection"
              className="group mt-6 inline-flex items-center gap-2 rounded-full bg-electric px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-electric-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Shop lighting
              <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
          <div
            aria-hidden="true"
            className="relative mt-8 flex items-end justify-end gap-3 sm:absolute sm:bottom-8 sm:right-8 sm:mt-0"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white backdrop-blur-sm">
              <BoltIcon className="h-7 w-7" />
            </span>
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric text-white shadow-[0_18px_36px_-20px_rgba(31,107,255,0.9)]">
              <RefreshIcon className="h-5 w-5" />
            </span>
          </div>
        </article>
      </div>
    </section>
  );
}

function NewsletterBand() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6">
      <div className="relative isolate overflow-hidden rounded-3xl bg-ink px-6 py-10 text-white sm:px-10 sm:py-12">
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(31,107,255,0.4),transparent_50%)]"
        />
        <div
          aria-hidden="true"
          className="hero-grid absolute inset-0 opacity-50"
        />
        <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/55">
              <BoltIcon className="h-4 w-4 text-electric" />
              The Asia Electronics edit
            </p>
            <h2 className="mt-3 max-w-md text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              New drops, honest deals and buying advice. Once a week.
            </h2>
            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-white/55">
              {SERVICE_PROMISES.map((promise) => (
                <li key={promise} className="inline-flex items-center gap-1.5">
                  <ShieldIcon className="h-3.5 w-3.5 text-electric" />
                  {promise}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <NewsletterForm />
            <p className="mt-3 text-xs leading-relaxed text-white/40">
              No spam. Unsubscribe any time.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Asia Electronics",
        url: SITE_URL,
        logo: absoluteUrl("/logo/logo.png"),
        description: HOMEPAGE_DESCRIPTION,
        slogan: "Quality electronics, better everyday",
        telephone: SITE_CONTACT.phoneTel,
        email: SITE_CONTACT.email,
        address: {
          "@type": "PostalAddress",
          streetAddress: `${SITE_CONTACT.address.line1}, ${SITE_CONTACT.address.line2}`,
          addressLocality: SITE_CONTACT.address.city,
          addressCountry: "BD",
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: SITE_CONTACT.phoneTel,
          email: SITE_CONTACT.email,
          contactType: "customer service",
          areaServed: "BD",
          availableLanguage: ["en", "bn"],
        },
        areaServed: [
          { "@type": "Country", name: "Bangladesh" },
          { "@type": "City", name: "Chittagong" },
        ],
        knowsAbout: [
          "Consumer electronics",
          "Speakers and sound boxes",
          "Rechargeable torch lights",
          "Electric fans",
          "Trimmers and grooming devices",
        ],
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Asia Electronics",
        alternateName: "Asia Electronics BD",
        description: HOMEPAGE_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": `${SITE_URL}/#organization` },
      },
    ],
  };

  return (
    <>
      <h1 className="sr-only">Asia Electronics — quality electronics, better everyday</h1>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BannerSlider />
      <TrustStrip />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-16">
        <SectionHeading
          eyebrow="Browse"
          title="Premium Categories"
          actionHref="/collection"
          actionLabel="All products"
        />
        <Suspense fallback={<CuratedCategoryGrid />}>
          <HomeCategories />
        </Suspense>
      </section>

      <Suspense
        fallback={
          <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:pb-16">
            <SectionHeading
              eyebrow="Best sellers"
              title="Popular right now"
              actionHref="/collection"
              actionLabel="Shop all"
            />
            <BestsellerTracks />
          </section>
        }
      >
        <FeaturedProductsSection />
      </Suspense>

      <Suspense fallback={<EditorialPromos />}>
        <NewArrivalsSection />
      </Suspense>

      <Suspense fallback={null}>
        <HomeReviews />
      </Suspense>
    </>
  );
}