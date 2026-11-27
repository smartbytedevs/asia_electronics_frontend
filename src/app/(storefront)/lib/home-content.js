import {
  BoltIcon,
  BoxIcon,
  HeadphonesIcon,
  HomeIcon,
  RefreshIcon,
  ShieldIcon,
  SpeakerIcon,
  TruckIcon,
  CreditCardIcon,
  HeadsetIcon,
} from "../_components/icons";

/**
 * Curated storefront content used when the live catalog is still empty (or
 * while an editor is building it out). Everything here is presentation only —
 * no prices or stock claims — so the homepage stays complete and honest.
 */

export const TRUST_ITEMS = [
  {
    icon: ShieldIcon,
    title: "Quality electronics",
    copy: "Warranty as per seller policy",
  },
  {
    icon: TruckIcon,
    title: "Fast delivery",
    copy: "Delivery across Bangladesh",
  },
  {
    icon: CreditCardIcon,
    title: "Cash on delivery",
    copy: "Pay when your order arrives",
  },
  {
    icon: HeadsetIcon,
    title: "Expert support",
    copy: "Real advice before and after you buy",
  },
];

export const CURATED_CATEGORIES = [
  {
    key: "speakers",
    name: "Speakers & sound boxes",
    blurb: "Room-filling audio",
    icon: SpeakerIcon,
  },
  {
    key: "lights",
    name: "Torch & rechargeable lights",
    blurb: "Bright, reliable power",
    icon: BoltIcon,
  },
  {
    key: "fans",
    name: "Electric fans",
    blurb: "Comfort in every room",
    icon: RefreshIcon,
  },
  {
    key: "grooming",
    name: "Trimmers & grooming",
    blurb: "Everyday personal care",
    icon: ShieldIcon,
  },
  {
    key: "home",
    name: "Home electronics",
    blurb: "Small appliances for daily life",
    icon: HomeIcon,
  },
  {
    key: "accessories",
    name: "Accessories",
    blurb: "Chargers, cables and spares",
    icon: BoxIcon,
  },
];

export const DEAL_CARDS = [
  {
    key: "sound",
    eyebrow: "Sound",
    title: "Speakers for every room",
    copy: "Sound boxes and audio gear that bring music, news and calls to life.",
    cta: "Shop audio",
    href: "/collection",
    icon: SpeakerIcon,
  },
  {
    key: "lights",
    eyebrow: "Power",
    title: "Rechargeable lighting",
    copy: "Torches and emergency lights that stay ready when the power does not.",
    cta: "Shop lights",
    href: "/collection",
    icon: BoltIcon,
  },
];

export const BESTSELLER_TRACKS = [
  {
    key: "sound-boxes",
    name: "Sound boxes",
    copy: "Portable audio for the home, the shop and the road.",
    icon: SpeakerIcon,
  },
  {
    key: "lights",
    name: "Torches & rechargeable lights",
    copy: "Reliable light for outages, travel and outdoor work.",
    icon: BoltIcon,
  },
  {
    key: "fans",
    name: "Electric fans",
    copy: "Cooling that keeps rooms comfortable through the day.",
    icon: RefreshIcon,
  },
  {
    key: "grooming",
    name: "Trimmers & grooming",
    copy: "Clean, cordless grooming for everyday routines.",
    icon: ShieldIcon,
  },
  {
    key: "home",
    name: "Home electronics",
    copy: "Practical small appliances for daily household tasks.",
    icon: HomeIcon,
  },
  {
    key: "accessories",
    name: "Accessories",
    copy: "Chargers, cables and spares that keep everything running.",
    icon: BoxIcon,
  },
];

export const SERVICE_PROMISES = [
  "Quality electronics",
  "Warranty as per seller policy",
  "7-day replacement",
  "Cash on delivery",
];

export const PAYMENT_METHODS = ["Cash on delivery", "bKash", "Bank transfer"];

export const CATEGORY_ICONS = {
  speaker: SpeakerIcon,
  sound: SpeakerIcon,
  audio: HeadphonesIcon,
  headphone: HeadphonesIcon,
  light: BoltIcon,
  torch: BoltIcon,
  lamp: BoltIcon,
  fan: RefreshIcon,
  cooler: RefreshIcon,
  trimmer: ShieldIcon,
  groomer: ShieldIcon,
  shaver: ShieldIcon,
  home: HomeIcon,
  appliance: HomeIcon,
  accessory: BoxIcon,
  accessories: BoxIcon,
};

/** Picks a reasonable icon for a live category by slug/name. */
export function iconForCategory(category) {
  const haystack = `${category?.slug ?? ""} ${category?.name ?? ""}`.toLowerCase();
  for (const [token, icon] of Object.entries(CATEGORY_ICONS)) {
    if (haystack.includes(token)) return icon;
  }
  return BoxIcon;
}
