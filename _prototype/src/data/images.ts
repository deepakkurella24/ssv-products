/**
 * Every image URL used by the storefront lives in this file.
 *
 * To use a real photo, paste its URL into `url` (or into `urls` for products).
 * While a URL is empty the UI renders a labelled image slot with a caption,
 * at the correct ratio.
 */

const base = import.meta.env.BASE_URL;

export const LOGOS = {
  lockupOnDark: `${base}brand/ssv-04-lockup-horizontal-on-dark.svg`,
  lockupOnLight: `${base}brand/ssv-05-lockup-horizontal-on-light.svg`,
  emblemBadgeOnDark: `${base}brand/ssv-03-emblem-badge-on-dark.svg`,
  favicon: `${base}brand/ssv-07-favicon-app-icon.svg`,
} as const;

/** Intrinsic sizes of the logo artwork, used to reserve space and avoid stretching. */
export const LOGO_SIZES = {
  lockup: { width: 583, height: 240 },
  emblemBadge: { width: 917, height: 917 },
} as const;

export interface ImageEntry {
  url: string;
  caption: string;
  ratio: "4:5" | "1:1";
}

export const IMAGES = {
  // Hero slides, shown inside the arch frame at 4:5
  "hero.mission": {
    url: "",
    ratio: "4:5",
    caption: "Photo: SSV oils, honey and pooja items on a wooden table at the farm",
  },
  "hero.honey": {
    url: "",
    ratio: "4:5",
    caption: "Photo: forest honey jar with a wooden dipper, window light",
  },
  "hero.spices": {
    url: "",
    ratio: "4:5",
    caption: "Photo: turmeric and red chilli powder in brass bowls",
  },

  // Categories, 4:5
  "category.cold-pressed-oils": {
    url: "",
    ratio: "4:5",
    caption: "Photo: sesame, coconut and groundnut oil bottles in a row",
  },
  "category.forest-honey": {
    url: "",
    ratio: "4:5",
    caption: "Photo: honey dripping from a wooden dipper into a jar",
  },
  "category.pooja-samagri": {
    url: "",
    ratio: "4:5",
    caption: "Photo: brass diya, kumkum and camphor on a pooja plate",
  },
  "category.dhoop-sticks": {
    url: "",
    ratio: "4:5",
    caption: "Photo: lit dhoop stick in a stand, soft smoke",
  },
  "category.spices": {
    url: "",
    ratio: "4:5",
    caption: "Photo: turmeric and chilli powder heaped in steel bowls",
  },
} satisfies Record<string, ImageEntry>;

export type ImageKey = keyof typeof IMAGES;

/**
 * Products, 1:1. Each product has three shots: the main photo (used on cards)
 * and two more for the detail page gallery. Add real URLs to `urls`, in order.
 */
const PRODUCT_PHOTOS = {
  "sesame-oil": { subject: "cold pressed sesame oil bottle on wooden table", raw: "sesame seeds" },
  "black-sesame-oil": {
    subject: "black sesame oil bottle beside a bowl of black sesame seeds",
    raw: "black sesame seeds",
  },
  "coconut-oil": { subject: "coconut oil bottle with a halved coconut", raw: "dried coconut" },
  "groundnut-oil": { subject: "groundnut oil bottle with shelled groundnuts", raw: "groundnuts" },
  "forest-honey": { subject: "forest honey jar with a wooden dipper", raw: "honeycomb" },
  "multiflora-honey": { subject: "multiflora honey jar beside fresh flowers", raw: "honeycomb" },
  "dhoop-sticks": { subject: "dhoop sticks pack, open, on a cloth", raw: "dhoop sticks" },
  "cow-dung-dhoop": { subject: "cow dung dhoop cups in a brass plate", raw: "dhoop cups" },
  "turmeric-powder": {
    subject: "turmeric powder pouch with dried turmeric roots",
    raw: "dried turmeric roots",
  },
  "red-chilli-powder": {
    subject: "red chilli powder pouch with dried red chillies",
    raw: "dried red chillies",
  },
  "coriander-powder": {
    subject: "coriander powder pouch with whole coriander seeds",
    raw: "coriander seeds",
  },
  camphor: { subject: "camphor tablets in a small brass dish", raw: "camphor tablets" },
  "cotton-wicks": { subject: "cotton wicks beside a lit brass lamp", raw: "cotton wicks" },
  kumkum: { subject: "kumkum in a small steel bowl", raw: "kumkum" },
} as const satisfies Record<string, { subject: string; raw: string; urls?: string[] }>;

export type ProductPhotoKey = keyof typeof PRODUCT_PHOTOS;

const SLOT_PREFIX = "slot:";

function productShot(key: ProductPhotoKey, shot: number): string {
  const entry = PRODUCT_PHOTOS[key] as { urls?: string[] };
  return entry.urls?.[shot] || `${SLOT_PREFIX}product.${key}.${shot}`;
}

/** Main product photo (1:1). */
export const productImage = (key: ProductPhotoKey) => productShot(key, 0);

/** All three detail-page photos, main photo first. */
export const productGallery = (key: ProductPhotoKey) => [0, 1, 2].map((i) => productShot(key, i));

/** Returns the photo URL for a key, or a slot reference while no photo is set. */
export function imageUrl(key: ImageKey): string {
  return IMAGES[key].url || `${SLOT_PREFIX}${key}`;
}

export type ResolvedImage =
  | { kind: "photo"; url: string }
  | { kind: "slot"; caption: string; ratio: string };

function slotEntry(key: string): { caption: string; ratio: string } | undefined {
  const known = (IMAGES as Record<string, ImageEntry>)[key];
  if (known) return known;
  const match = /^product\.(.+)\.(\d)$/.exec(key);
  const photo =
    match && (PRODUCT_PHOTOS as Record<string, { subject: string; raw: string }>)[match[1]];
  if (!photo) return undefined;
  const captions = [
    `Photo: ${photo.subject}`,
    `Photo: ${photo.subject}, close-up of the label`,
    `Photo: ${photo.raw} that go into it, in a bowl`,
  ];
  return { caption: captions[Number(match[2])], ratio: "1:1" };
}

export function resolveImage(src: string): ResolvedImage {
  if (src.startsWith(SLOT_PREFIX)) {
    const entry = slotEntry(src.slice(SLOT_PREFIX.length));
    return { kind: "slot", caption: entry?.caption ?? "Photo", ratio: entry?.ratio ?? "" };
  }
  if (!src) return { kind: "slot", caption: "Photo", ratio: "" };
  return { kind: "photo", url: src };
}
