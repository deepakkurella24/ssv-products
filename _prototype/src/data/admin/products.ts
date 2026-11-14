import { PRODUCTS as STOREFRONT_PRODUCTS } from "@/data/products";
import { slugify } from "./categories";
import { ApiError, clone, readDb, simulateRequest, writeDb } from "./db";
import type { AdminProduct, AdminVariant } from "./types";

// The 8 storefront products, mapped into the admin model (storefront data is not modified),
// plus 3 products that are currently unavailable.

const STOREFRONT_SUBCATEGORY: Record<string, string | null> = {
  "p-sesame-oil": "sub-sesame",
  "p-black-sesame-oil": "sub-sesame",
  "p-coconut-oil": "sub-coconut",
  "p-groundnut-oil": "sub-groundnut",
  "p-forest-honey": null,
  "p-dhoop-sticks": null,
  "p-turmeric-powder": "sub-powders",
  "p-red-chilli-powder": "sub-powders",
};

const fromStorefront: AdminProduct[] = STOREFRONT_PRODUCTS.slice(0, 8).map((p, i) => ({
  id: p.id,
  name: p.name,
  slug: p.slug,
  description: p.description,
  story: p.story,
  image_url: p.image_url,
  category_id: p.category_id,
  subcategory_id: STOREFRONT_SUBCATEGORY[p.id] ?? null,
  badge: p.badge,
  spice_level: p.spice_level ?? "none",
  shelf_life_months: p.shelf_life_months,
  ingredients: [...p.ingredients],
  available: p.available,
  variants: p.variants.map((v) => ({ ...v })),
  created_at: new Date(Date.UTC(2026, 5, 2 + i * 3)).toISOString(),
}));

export const SEED_PRODUCTS: AdminProduct[] = [
  ...fromStorefront,
  {
    id: "p-jamun-honey",
    name: "Jamun Honey",
    slug: "jamun-honey",
    description: "Dark honey from jamun flowers, with a slightly tangy finish. Seasonal.",
    story: "Collected only during the short jamun flowering season.",
    image_url: "",
    category_id: "cat-honey",
    subcategory_id: null,
    badge: null,
    spice_level: "none",
    shelf_life_months: 24,
    ingredients: ["Jamun honey"],
    available: false,
    variants: [
      {
        id: "v-jamun-250",
        label: "250 g",
        weight_g: 250,
        price: 320,
        badge: null,
        available: false,
      },
    ],
    created_at: new Date(Date.UTC(2026, 7, 14)).toISOString(),
  },
  {
    id: "p-black-pepper",
    name: "Black Pepper (Whole)",
    slug: "black-pepper-whole",
    description: "Bold whole peppercorns. Grind fresh for the best smell.",
    story: "",
    image_url: "",
    category_id: "cat-spices",
    subcategory_id: "sub-whole",
    badge: null,
    spice_level: "medium",
    shelf_life_months: 18,
    ingredients: ["Black pepper"],
    available: false,
    variants: [
      {
        id: "v-pepper-100",
        label: "100 g",
        weight_g: 100,
        price: 180,
        badge: null,
        available: false,
      },
      {
        id: "v-pepper-250",
        label: "250 g",
        weight_g: 250,
        price: 420,
        badge: "Best Value",
        available: false,
      },
    ],
    created_at: new Date(Date.UTC(2026, 8, 3)).toISOString(),
  },
  {
    id: "p-sambrani-cups",
    name: "Sambrani Cups",
    slug: "sambrani-cups",
    description: "Slow-burning sambrani cups for evening pooja.",
    story: "",
    image_url: "",
    category_id: "cat-dhoop",
    subcategory_id: null,
    badge: null,
    spice_level: "none",
    shelf_life_months: 24,
    ingredients: ["Sambrani resin", "Cow dung", "Herbal powders"],
    available: false,
    variants: [
      {
        id: "v-sambrani-12",
        label: "Pack of 12",
        weight_g: 180,
        price: 120,
        badge: null,
        available: false,
      },
    ],
    created_at: new Date(Date.UTC(2026, 8, 20)).toISOString(),
  },
];

export type ProductInput = Omit<AdminProduct, "id" | "created_at" | "slug">;

/** Lowest price among available sizes, or among all sizes if none are available. */
export function lowestPrice(p: Pick<AdminProduct, "variants">): number | null {
  const pool = p.variants.filter((v) => v.available);
  const list = pool.length ? pool : p.variants;
  const prices = list.map((v) => v.price).filter((n) => n > 0);
  return prices.length ? Math.min(...prices) : null;
}

export function newVariantId() {
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function uniqueSlug(name: string, ignoreId?: string) {
  const base = slugify(name) || "product";
  const taken = new Set(
    readDb()
      .products.filter((p) => p.id !== ignoreId)
      .map((p) => p.slug),
  );
  let slug = base;
  for (let i = 2; taken.has(slug); i++) slug = `${base}-${i}`;
  return slug;
}

function validate(input: ProductInput) {
  if (!input.name.trim()) throw new ApiError("INVALID", "Enter a product name.");
  if (!input.variants.length) throw new ApiError("INVALID", "Add at least one size.");
}

export function previewSlug(name: string, ignoreId?: string) {
  return uniqueSlug(name, ignoreId);
}

export function isProductInPastOrders(id: string) {
  return readDb().orders.some((o) => o.items.some((i) => i.product_id === id));
}

export async function getProducts(): Promise<AdminProduct[]> {
  await simulateRequest();
  return clone([...readDb().products].sort((a, b) => a.name.localeCompare(b.name)));
}

export async function getProductById(id: string): Promise<AdminProduct | null> {
  await simulateRequest();
  const p = readDb().products.find((x) => x.id === id);
  return p ? clone(p) : null;
}

export async function createProduct(input: ProductInput): Promise<AdminProduct> {
  await simulateRequest(350);
  validate(input);
  const product: AdminProduct = {
    ...clone(input),
    name: input.name.trim(),
    id: `p-${Date.now().toString(36)}`,
    slug: uniqueSlug(input.name),
    created_at: new Date().toISOString(),
  };
  writeDb((d) => d.products.push(product));
  return clone(product);
}

/** Saving replaces the product's full list of sizes. */
export async function updateProduct(id: string, input: ProductInput): Promise<AdminProduct> {
  await simulateRequest(350);
  validate(input);
  let saved: AdminProduct | undefined;
  writeDb((d) => {
    const p = d.products.find((x) => x.id === id);
    if (!p) throw new ApiError("NOT_FOUND", "This product no longer exists.");
    Object.assign(p, clone(input), { name: input.name.trim(), slug: uniqueSlug(input.name, id) });
    saved = p;
  });
  return clone(saved!);
}

export async function updateProductAvailability(id: string, available: boolean): Promise<void> {
  await simulateRequest(150);
  writeDb((d) => {
    const p = d.products.find((x) => x.id === id);
    if (p) p.available = available;
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await simulateRequest(300);
  if (isProductInPastOrders(id)) {
    throw new ApiError(
      "IN_PAST_ORDERS",
      "This product is part of past orders and can't be deleted",
    );
  }
  writeDb((d) => {
    d.products = d.products.filter((p) => p.id !== id);
  });
}

export type { AdminVariant };
