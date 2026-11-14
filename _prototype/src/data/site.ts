import { categoryHref } from "./categories";
import { imageUrl, type ImageKey } from "./images";

export const COMPANY_LINKS = [
  { label: "Why SSV", to: "/why-ssv" },
  { label: "Events", to: "/events" },
  { label: "Contact", to: "/contact" },
] as const;

export const ACCOUNT_LINKS = [
  { label: "My orders", to: "/account/orders", section: "orders" },
  { label: "Addresses", to: "/account/addresses", section: "addresses" },
  { label: "Custom requests", to: "/account/custom-requests", section: "custom-requests" },
] as const;

// Placeholders: replace with real details before launch.
export const CONTACT = {
  address: ["[Street address]", "[City, State] [PIN code]"],
  phone: "[+91 XXXXX XXXXX]",
  email: "[hello@your-domain.in]",
  fssai: "XXXXXXXXXXXXXX",
};

// Placeholders: replace with real profile URLs.
export const SOCIAL = [
  { label: "Instagram", href: "#instagram" },
  { label: "Facebook", href: "#facebook" },
  { label: "YouTube", href: "#youtube" },
] as const;

export const FREE_DELIVERY_ABOVE = 999;

export interface HeroSlide {
  id: string;
  theme: "forest" | "honey" | "sand";
  image: string;
  imageAlt: string;
  headline: { before: string; italic: string; after: string };
  text: string;
  cta: { label: string; to: string };
  chips?: { label: string; to: string }[];
  stamp?: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "mission",
    theme: "forest",
    image: imageUrl("hero.mission"),
    imageAlt: "SSV cold pressed oils, forest honey and pooja items on a wooden table at the farm",
    headline: {
      before: "A mission for ",
      italic: "present and future",
      after: " generations’ health",
    },
    text: "Pure, natural and chemical-free products for a healthy life.",
    cta: { label: "Explore Our Products", to: "/products" },
  },
  {
    id: "honey",
    theme: "honey",
    image: imageUrl("hero.honey"),
    imageAlt: "A jar of forest honey with a wooden dipper",
    headline: { before: "Honey from the forest, ", italic: "bottled as it is", after: "" },
    text: "Honey from forest areas, filled into jars with nothing added.",
    cta: { label: "Explore Forest Honey", to: categoryHref("forest-honey") },
  },
  {
    id: "spices",
    theme: "sand",
    image: imageUrl("hero.spices"),
    imageAlt: "Turmeric and red chilli powder in brass bowls",
    headline: { before: "Everyday spices, ", italic: "ground without shortcuts", after: "" },
    text: "Turmeric and red chilli powder for daily cooking, with no colour or filler.",
    cta: { label: "Explore Spices", to: categoryHref("spices") },
  },
];
