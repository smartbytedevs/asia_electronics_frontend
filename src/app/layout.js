import localFont from "next/font/local";
import Script from "next/script";
import { SITE_URL, SITE_DESCRIPTION, absoluteUrl } from "@/lib/seo";
import { apiClient } from "@/lib/api-client";
import { MetaPixelPageView } from "@/components/meta-pixel-page-view";
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
const DESCRIPTION = SITE_DESCRIPTION;
const GOOGLE_SITE_VERIFICATION = process.env.GOOGLE_SITE_VERIFICATION?.trim();

export const metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: BRAND,
  title: {
    default: "Asia Electronics — Genuine Tech, Better Everyday",
    template: "%s | Asia Electronics",
  },
  description: DESCRIPTION,
  ...(GOOGLE_SITE_VERIFICATION
    ? { verification: { google: GOOGLE_SITE_VERIFICATION } }
    : {}),
  icons: {
    icon: [{ url: "/logo/logo.png", type: "image/png", sizes: "1536x1024" }],
    shortcut: ["/logo/logo.png"],
    apple: [{ url: "/logo/logo.png", type: "image/png" }],
  },
  keywords: [
    "Asia Electronics",
    "electronics shop in Chittagong",
    "electronics shop in Bangladesh",
    "speakers in Bangladesh",
    "sound boxes",
    "rechargeable torch lights",
    "electric fans",
    "trimmers",
    "grooming devices",
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

export default async function RootLayout({ children }) {
  let fbPixelId = "";
  try {
    const payload = await apiClient.get("/settings");
    fbPixelId = payload?.data?.settings?.fbPixelId ?? "";
  } catch {
    fbPixelId = "";
  }

  // JSON.stringify quotes and escapes the value; stripping "<" keeps the
  // inline script safe even if an unexpected value was stored.
  const pixelIdForScript = JSON.stringify(fbPixelId.replace(/</g, ""));

  return (
    <html lang="en" className={`${jost.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-ink">
        {children}
        {fbPixelId ? (
          <>
            <Script
              id="meta-pixel-base"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', ${pixelIdForScript});fbq('track', 'PageView');`,
              }}
            />
            <MetaPixelPageView />
          </>
        ) : null}
      </body>
    </html>
  );
}
