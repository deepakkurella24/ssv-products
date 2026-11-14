import { productGallery, productImage, type ProductPhotoKey } from "./images";
import type { Product, ProductBadge, SpiceLevel, Variant } from "./types";

// Placeholder prices and copy. Replace with the products API response.

function v(
  id: string,
  label: string,
  weight_g: number,
  price: number,
  extra: { available?: boolean; badge?: string | null } = {},
): Variant {
  return {
    id,
    label,
    weight_g,
    price,
    available: extra.available ?? true,
    badge: extra.badge ?? null,
  };
}

interface ProductInput {
  id: string;
  name: string;
  slug: string;
  photo: ProductPhotoKey;
  badge?: ProductBadge;
  spice_level?: SpiceLevel;
  shelf_life_months: number;
  available?: boolean;
  category_id: string;
  subcategory_id: string;
  variants: Variant[];
  description: string;
  story: string;
  ingredients: string[];
  popularity: number;
}

function product({
  photo,
  badge = null,
  spice_level = null,
  available = true,
  ...rest
}: ProductInput): Product {
  return {
    ...rest,
    badge,
    spice_level,
    available,
    image_url: productImage(photo),
    gallery: productGallery(photo),
  };
}

const OIL_STORY =
  "We buy the seed from farmers we know and press it cold, without heat or solvents. Nothing is added to the oil and nothing is taken out.";

export const PRODUCTS: Product[] = [
  product({
    id: "p-sesame-oil",
    name: "Cold Pressed Sesame Oil",
    slug: "cold-pressed-sesame-oil",
    photo: "sesame-oil",
    badge: "Bestseller",
    shelf_life_months: 12,
    category_id: "cat-oils",
    subcategory_id: "sub-sesame",
    variants: [
      v("v-sesame-500", "500 ml", 460, 340),
      v("v-sesame-1l", "1 L", 920, 640, { badge: "Best Value" }),
    ],
    description:
      "Golden sesame oil with a light, nutty smell. Good for everyday cooking, tempering, pickles and oil pulling.",
    story: OIL_STORY,
    ingredients: ["Sesame seeds (100%)"],
    popularity: 95,
  }),
  product({
    id: "p-black-sesame-oil",
    name: "Black Sesame Oil",
    slug: "black-sesame-oil",
    photo: "black-sesame-oil",
    badge: "New",
    shelf_life_months: 12,
    category_id: "cat-oils",
    subcategory_id: "sub-black-sesame",
    variants: [v("v-black-500", "500 ml", 460, 420)],
    description:
      "A darker, stronger oil pressed from black sesame seeds. Many families use it for cooking and for massage.",
    story: OIL_STORY,
    ingredients: ["Black sesame seeds (100%)"],
    popularity: 60,
  }),
  product({
    id: "p-coconut-oil",
    name: "Coconut Oil",
    slug: "coconut-oil",
    photo: "coconut-oil",
    shelf_life_months: 12,
    category_id: "cat-oils",
    subcategory_id: "sub-coconut",
    variants: [
      v("v-coconut-500", "500 ml", 460, 360),
      v("v-coconut-1l", "1 L", 920, 690, { available: false }),
    ],
    description:
      "Clear coconut oil with a fresh coconut smell. Use it for cooking, for hair, or for the lamp at home.",
    story: OIL_STORY,
    ingredients: ["Dried coconut (100%)"],
    popularity: 80,
  }),
  product({
    id: "p-groundnut-oil",
    name: "Groundnut Oil",
    slug: "groundnut-oil",
    photo: "groundnut-oil",
    shelf_life_months: 6,
    available: false,
    category_id: "cat-oils",
    subcategory_id: "sub-groundnut",
    variants: [v("v-groundnut-1l", "1 L", 920, 520, { available: false })],
    description:
      "Groundnut oil for frying and everyday cooking. It has a mild taste that does not take over the dish.",
    story: OIL_STORY,
    ingredients: ["Groundnuts (100%)"],
    popularity: 75,
  }),
  product({
    id: "p-forest-honey",
    name: "Forest Honey",
    slug: "forest-honey",
    photo: "forest-honey",
    badge: "Bestseller",
    shelf_life_months: 24,
    category_id: "cat-honey",
    subcategory_id: "sub-wild-honey",
    variants: [
      v("v-honey-250", "250 g", 250, 280),
      v("v-honey-500", "500 g", 500, 520, { badge: "Best Value" }),
    ],
    description:
      "Honey collected from forest areas and filled into jars as it is. It may thicken or crystallise in cold weather, which is natural.",
    story:
      "Our honey comes from people who collect it in the forest. We do not heat it, blend it or add sugar syrup.",
    ingredients: ["Forest honey (100%)"],
    popularity: 90,
  }),
  product({
    id: "p-dhoop-sticks",
    name: "Dhoop Sticks",
    slug: "dhoop-sticks",
    photo: "dhoop-sticks",
    shelf_life_months: 24,
    category_id: "cat-dhoop",
    subcategory_id: "sub-herbal",
    variants: [v("v-dhoop-100", "100 g", 100, 90)],
    description: "Herbal dhoop sticks with a soft, woody smell for morning and evening pooja.",
    story: "Made from natural powders and resins, with no synthetic fragrance added.",
    ingredients: ["Wood powder", "Natural resin", "Herbal powders", "Bamboo stick"],
    popularity: 55,
  }),
  product({
    id: "p-turmeric-powder",
    name: "Turmeric Powder",
    slug: "turmeric-powder",
    photo: "turmeric-powder",
    badge: "New",
    shelf_life_months: 12,
    category_id: "cat-spices",
    subcategory_id: "sub-turmeric",
    variants: [v("v-turmeric-200", "200 g", 200, 110)],
    description: "Deep yellow turmeric powder for daily cooking, with no added colour or filler.",
    story: "We dry and grind whole turmeric roots from farms we buy from directly.",
    ingredients: ["Turmeric roots (100%)"],
    popularity: 70,
  }),
  product({
    id: "p-red-chilli-powder",
    name: "Red Chilli Powder",
    slug: "red-chilli-powder",
    photo: "red-chilli-powder",
    spice_level: "hot",
    shelf_life_months: 9,
    category_id: "cat-spices",
    subcategory_id: "sub-chilli",
    variants: [v("v-chilli-250", "250 g", 250, 150)],
    description:
      "Bright red chilli powder with a clean, strong heat. Start with a little and add to taste.",
    story: "Whole dried chillies, cleaned and ground without colour or filler.",
    ingredients: ["Dried red chillies (100%)"],
    popularity: 65,
  }),
  product({
    id: "p-multiflora-honey",
    name: "Multiflora Honey",
    slug: "multiflora-honey",
    photo: "multiflora-honey",
    shelf_life_months: 24,
    category_id: "cat-honey",
    subcategory_id: "sub-multiflora",
    variants: [
      v("v-multi-250", "250 g", 250, 240),
      v("v-multi-500", "500 g", 500, 450, { badge: "Best Value" }),
    ],
    description:
      "Lighter, milder honey from many kinds of flowers. A good everyday honey for tea and breakfast.",
    story: "Collected by beekeepers we buy from directly, and jarred without heating.",
    ingredients: ["Multiflora honey (100%)"],
    popularity: 58,
  }),
  product({
    id: "p-coriander-powder",
    name: "Coriander Powder",
    slug: "coriander-powder",
    photo: "coriander-powder",
    shelf_life_months: 9,
    category_id: "cat-spices",
    subcategory_id: "sub-coriander",
    variants: [v("v-coriander-200", "200 g", 200, 95)],
    description: "Freshly ground coriander seed for sambar, curries and spice blends.",
    story: "Whole coriander seeds, cleaned and ground in small amounts so the smell stays fresh.",
    ingredients: ["Coriander seeds (100%)"],
    popularity: 45,
  }),
  product({
    id: "p-camphor",
    name: "Pure Camphor",
    slug: "pure-camphor",
    photo: "camphor",
    shelf_life_months: 24,
    category_id: "cat-pooja",
    subcategory_id: "sub-camphor",
    variants: [
      v("v-camphor-50", "50 g", 50, 120),
      v("v-camphor-100", "100 g", 100, 220, { badge: "Best Value" }),
    ],
    description:
      "Camphor tablets for aarti and daily pooja. They burn clean and leave no black residue.",
    story: "A pooja basic, packed in small tins so it stays dry.",
    ingredients: ["Camphor (100%)"],
    popularity: 50,
  }),
  product({
    id: "p-cotton-wicks",
    name: "Cotton Wicks",
    slug: "cotton-wicks",
    photo: "cotton-wicks",
    shelf_life_months: 36,
    category_id: "cat-pooja",
    subcategory_id: "sub-wicks",
    variants: [v("v-wicks-100", "100 wicks", 40, 60)],
    description: "Hand-rolled cotton wicks for oil lamps. They light easily and burn steadily.",
    story: "Plain cotton, rolled by hand, with nothing added.",
    ingredients: ["Cotton (100%)"],
    popularity: 40,
  }),
  product({
    id: "p-kumkum",
    name: "Kumkum",
    slug: "kumkum",
    photo: "kumkum",
    shelf_life_months: 24,
    category_id: "cat-pooja",
    subcategory_id: "sub-kumkum",
    variants: [v("v-kumkum-50", "50 g", 50, 70)],
    description: "Smooth red kumkum for pooja and for the daily tilak.",
    story: "Made from turmeric and lime, the traditional way.",
    ingredients: ["Turmeric", "Slaked lime"],
    popularity: 42,
  }),
  product({
    id: "p-cow-dung-dhoop",
    name: "Cow Dung Dhoop Cups",
    slug: "cow-dung-dhoop-cups",
    photo: "cow-dung-dhoop",
    shelf_life_months: 24,
    category_id: "cat-dhoop",
    subcategory_id: "sub-cowdung",
    variants: [v("v-cowdung-12", "Pack of 12", 150, 130)],
    description:
      "Dhoop cups made from cow dung and herbs. Light one on a plate or in a dhoop holder.",
    story: "A simple, traditional dhoop made from natural ingredients only.",
    ingredients: ["Cow dung", "Herbal powders", "Natural resin"],
    popularity: 35,
  }),
];

export function availableVariants(product: Product): Variant[] {
  return product.available ? product.variants.filter((v) => v.available) : [];
}

/** Lowest available variant; falls back to the lowest variant when all are sold out. */
export function lowestVariant(product: Product): Variant {
  const pool = availableVariants(product);
  const list = pool.length > 0 ? pool : product.variants;
  return list.reduce((min, v) => (v.price < min.price ? v : min), list[0]);
}

export function isSoldOut(product: Product) {
  return availableVariants(product).length === 0;
}

const SPICE_LABEL: Record<Exclude<Product["spice_level"], null>, string> = {
  mild: "Mild",
  medium: "Medium spice",
  hot: "Hot",
};

export function productMeta(product: Product): string {
  const shelf = `Shelf life ${product.shelf_life_months} months`;
  return product.spice_level ? `${SPICE_LABEL[product.spice_level]} · ${shelf}` : shelf;
}

export function findProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}
