import localFont from "next/font/local";
import { SITE_URL, absoluteUrl } from "@/lib/seo";
import "./globals.css";

// Self-hosted variable font (woff2 committed under src/app/fonts/). No
// build-time fetch from fonts.googleapis.com, so the production build stays
// independent of third-party font availability.
const jost = localFont({
  src: "./fonts/jost-latin.woff2",
  variable: "--font-jost",
  display: "swap",
});

const BRAND = "Asia Electronics";
const DESCRIPTION =
  "Shop genuine speakers, sound boxes, torch lights, fans, trimmers and home electronics at Asia Electronics — official warranty, honest prices and expert support across Bangladesh.";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || SITE_URL),
  applicationName: BRAND,
  title: {
    default: "Asia Electronics — Genuine Tech, Better Everyday",
    template: "%s | Asia Electronics",
  },
  description: DESCRIPTION,
  keywords: [
    "Asia Electronics",
    "electronics Bangladesh",
    "speakers",
    "sound boxes",
    "torch lights",
    "electric fans",
    "trimmers",
    "official warranty",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: BRAND,
    locale: "en_BD",
    url: absoluteUrl("/"),
    title: "Asia Electronics — Genuine Tech, Better Everyday",
    description: DESCRIPTION,
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
    title: "Asia Electronics — Genuine Tech, Better Everyday",
    description: DESCRIPTION,
    images: [absoluteUrl("/bg.jpg")],
  },
};

export const viewport = {
  themeColor: "#08142e",
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${jost.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-ink">
        {children}
      </body>
    </html>
  );
}
