/**
 * Every image URL used by the storefront lives in this file.
 */

export const LOGOS = {
  lockupOnDark: "/brand/ssv-04-lockup-horizontal-on-dark.svg",
  lockupOnLight: "/brand/ssv-05-lockup-horizontal-on-light.svg",
  emblemBadgeOnDark: "/brand/ssv-03-emblem-badge-on-dark.svg",
  favicon: "/brand/ssv-07-favicon-app-icon.svg",
};

/** Intrinsic sizes of the logo artwork, used to reserve space and avoid stretching. */
export const LOGO_SIZES = {
  lockup: { width: 583, height: 240 },
  emblemBadge: { width: 917, height: 917 },
};

export const IMAGES = {
  // Hero slides, shown inside the arch frame at 4:5
  "hero.mission": {
    url: "/images/ssv_door_shape_hero_image.png",
    ratio: "4:5",
    caption: "Photo: SSV oils, honey and pooja items on a wooden table at the farm",
  },
  "hero.honey": {
    url: "/images/img2.png",
    ratio: "4:5",
    caption: "Photo: forest honey jar with a wooden dipper, window light",
  },
  "hero.spices": {
    url: "/images/img3.png",
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
};

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
};

const SLOT_PREFIX = "slot:";

function productShot(key, shot) {
  const entry = PRODUCT_PHOTOS[key];
  return entry?.urls?.[shot] || `${SLOT_PREFIX}product.${key}.${shot}`;
}

export const productImage = (key) => productShot(key, 0);
export const productGallery = (key) => [0, 1, 2].map((i) => productShot(key, i));

export function imageUrl(key) {
  if (!key) return "";
  if (key.startsWith("http://") || key.startsWith("https://") || key.startsWith("/")) return key;
  return IMAGES[key]?.url || `${SLOT_PREFIX}${key}`;
}

function slotEntry(key) {
  const known = IMAGES[key];
  if (known) return known;
  const match = /^product\.(.+)\.(\d)$/.exec(key);
  const photo = match && PRODUCT_PHOTOS[match[1]];
  if (!photo) return undefined;
  const captions = [
    `Photo: ${photo.subject}`,
    `Photo: ${photo.subject}, close-up of the label`,
    `Photo: ${photo.raw} that go into it, in a bowl`,
  ];
  return { caption: captions[Number(match[2])], ratio: "1:1" };
}

export function resolveImage(src) {
  if (!src) return { kind: "slot", caption: "Photo", ratio: "" };
  if (src.startsWith(SLOT_PREFIX)) {
    const entry = slotEntry(src.slice(SLOT_PREFIX.length));
    return { kind: "slot", caption: entry?.caption ?? "Photo", ratio: entry?.ratio ?? "" };
  }
  return { kind: "photo", url: src };
}
