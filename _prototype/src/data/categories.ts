import { imageUrl } from "./images";
import { PRODUCTS } from "./products";
import type { Category } from "./types";

const countIn = (categoryId: string) => PRODUCTS.filter((p) => p.category_id === categoryId).length;

export const CATEGORIES: Category[] = [
  {
    id: "cat-oils",
    name: "Cold Pressed Oils",
    slug: "cold-pressed-oils",
    image_url: imageUrl("category.cold-pressed-oils"),
    product_count: countIn("cat-oils"),
    subcategories: [
      { id: "sub-sesame", name: "Sesame Oil", slug: "sesame-oil" },
      { id: "sub-black-sesame", name: "Black Sesame Oil", slug: "black-sesame-oil" },
      { id: "sub-coconut", name: "Coconut Oil", slug: "coconut-oil" },
      { id: "sub-groundnut", name: "Groundnut Oil", slug: "groundnut-oil" },
    ],
  },
  {
    id: "cat-honey",
    name: "Forest Honey",
    slug: "forest-honey",
    image_url: imageUrl("category.forest-honey"),
    product_count: countIn("cat-honey"),
    subcategories: [
      { id: "sub-wild-honey", name: "Wild Forest Honey", slug: "wild-forest-honey" },
      { id: "sub-multiflora", name: "Multiflora Honey", slug: "multiflora-honey" },
    ],
  },
  {
    id: "cat-pooja",
    name: "Pooja Samagri",
    slug: "pooja-samagri",
    image_url: imageUrl("category.pooja-samagri"),
    product_count: countIn("cat-pooja"),
    subcategories: [
      { id: "sub-kumkum", name: "Kumkum & Haldi", slug: "kumkum-haldi" },
      { id: "sub-camphor", name: "Camphor", slug: "camphor" },
      { id: "sub-wicks", name: "Cotton Wicks", slug: "cotton-wicks" },
      { id: "sub-deepam", name: "Deepam Oil", slug: "deepam-oil" },
      { id: "sub-kits", name: "Pooja Kits", slug: "pooja-kits" },
    ],
  },
  {
    id: "cat-dhoop",
    name: "Dhoop Sticks",
    slug: "dhoop-sticks",
    image_url: imageUrl("category.dhoop-sticks"),
    product_count: countIn("cat-dhoop"),
    subcategories: [
      { id: "sub-cowdung", name: "Cow Dung Dhoop", slug: "cow-dung-dhoop" },
      { id: "sub-herbal", name: "Herbal Dhoop", slug: "herbal-dhoop" },
      { id: "sub-sambrani", name: "Sambrani Cups", slug: "sambrani-cups" },
    ],
  },
  {
    id: "cat-spices",
    name: "Spices & More",
    slug: "spices",
    image_url: imageUrl("category.spices"),
    product_count: countIn("cat-spices"),
    subcategories: [
      { id: "sub-turmeric", name: "Turmeric Powder", slug: "turmeric-powder" },
      { id: "sub-chilli", name: "Chilli Powder", slug: "chilli-powder" },
      { id: "sub-coriander", name: "Coriander Powder", slug: "coriander-powder" },
      { id: "sub-masala", name: "Masala Blends", slug: "masala-blends" },
    ],
  },
];

export function categoryHref(slug: string, subSlug?: string) {
  const params = new URLSearchParams({ category: slug });
  if (subSlug) params.set("sub", subSlug);
  return `/products?${params.toString()}`;
}

export function findCategory(idOrSlug: string | null | undefined) {
  if (!idOrSlug) return undefined;
  return CATEGORIES.find((c) => c.id === idOrSlug || c.slug === idOrSlug);
}
