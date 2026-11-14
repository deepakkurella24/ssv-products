import { imageUrl } from "@/data/images";
import { ApiError, clone, readDb, simulateRequest, writeDb } from "./db";
import type { AdminCategory } from "./types";

export const SEED_CATEGORIES: AdminCategory[] = [
  {
    id: "cat-oils",
    name: "Cold Pressed Oils",
    slug: "cold-pressed-oils",
    description: "Sesame, coconut and groundnut oils pressed without heat or solvents.",
    image_url: imageUrl("category.cold-pressed-oils"),
    display_order: 1,
    parent_id: null,
  },
  {
    id: "sub-sesame",
    name: "Sesame",
    slug: "sesame",
    description: "",
    image_url: "",
    display_order: 1,
    parent_id: "cat-oils",
  },
  {
    id: "sub-coconut",
    name: "Coconut",
    slug: "coconut",
    description: "",
    image_url: "",
    display_order: 2,
    parent_id: "cat-oils",
  },
  {
    id: "sub-groundnut",
    name: "Groundnut",
    slug: "groundnut",
    description: "",
    image_url: "",
    display_order: 3,
    parent_id: "cat-oils",
  },
  {
    id: "cat-honey",
    name: "Forest Honey",
    slug: "forest-honey",
    description: "Raw honey collected from forest areas and jarred as it is.",
    image_url: imageUrl("category.forest-honey"),
    display_order: 2,
    parent_id: null,
  },
  {
    id: "cat-pooja",
    name: "Pooja Samagri",
    slug: "pooja-samagri",
    description: "Camphor, kumkum, wicks and other daily pooja items.",
    image_url: imageUrl("category.pooja-samagri"),
    display_order: 3,
    parent_id: null,
  },
  {
    id: "cat-dhoop",
    name: "Dhoop Sticks",
    slug: "dhoop-sticks",
    description: "Herbal and cow dung dhoop with natural fragrances.",
    image_url: imageUrl("category.dhoop-sticks"),
    display_order: 4,
    parent_id: null,
  },
  {
    id: "cat-spices",
    name: "Spices & More",
    slug: "spices",
    description: "Spice powders and whole spices without colour or filler.",
    image_url: imageUrl("category.spices"),
    display_order: 5,
    parent_id: null,
  },
  {
    id: "sub-powders",
    name: "Powders",
    slug: "powders",
    description: "",
    image_url: "",
    display_order: 1,
    parent_id: "cat-spices",
  },
  {
    id: "sub-whole",
    name: "Whole spices",
    slug: "whole-spices",
    description: "",
    image_url: "",
    display_order: 2,
    parent_id: "cat-spices",
  },
];

export interface CategoryLeaf extends AdminCategory {
  product_count: number;
}

export interface CategoryNode extends CategoryLeaf {
  children: CategoryLeaf[];
}

export interface CategoryInput {
  name: string;
  slug: string;
  description: string;
  image_url: string;
  display_order: number;
  parent_id: string | null;
}

const byOrder = (a: AdminCategory, b: AdminCategory) => a.display_order - b.display_order;

function buildTree(): CategoryNode[] {
  const { categories, products } = readDb();
  const count = (c: AdminCategory) =>
    products.filter((p) => (c.parent_id ? p.subcategory_id === c.id : p.category_id === c.id))
      .length;
  return categories
    .filter((c) => c.parent_id === null)
    .sort(byOrder)
    .map((c) => ({
      ...c,
      product_count: count(c),
      children: categories
        .filter((s) => s.parent_id === c.id)
        .sort(byOrder)
        .map((s) => ({ ...s, product_count: count(s) })),
    }));
}

/** Why a category can't be deleted, or null when it can. */
export function categoryDeleteBlocker(
  c: CategoryLeaf & { children?: CategoryLeaf[] },
): string | null {
  const subs = c.children?.length ?? 0;
  const products = c.product_count;
  if (!products && !subs) return null;
  const parts = [
    products ? `${products} ${products === 1 ? "product" : "products"}` : "",
    subs ? `${subs} ${subs === 1 ? "subcategory" : "subcategories"}` : "",
  ].filter(Boolean);
  return `Move or delete its ${parts.join(" and ")} first.`;
}

/** Puts `id` at 1-based `position` among its siblings and renumbers them. */
function place(all: AdminCategory[], parentId: string | null, id: string, position: number) {
  const siblings = all.filter((c) => c.parent_id === parentId && c.id !== id).sort(byOrder);
  const target = all.find((c) => c.id === id)!;
  const index = Math.max(0, Math.min(siblings.length, Math.round(position) - 1));
  siblings.splice(index, 0, target);
  siblings.forEach((c, i) => (c.display_order = i + 1));
}

function validate(input: CategoryInput, ignoreId?: string) {
  if (!input.name.trim()) throw new ApiError("INVALID", "Enter a name.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug)) {
    throw new ApiError("INVALID_SLUG", "Use lowercase letters, numbers and hyphens only.");
  }
  if (readDb().categories.some((c) => c.slug === input.slug && c.id !== ignoreId)) {
    throw new ApiError("SLUG_TAKEN", "Another category already uses this slug.");
  }
}

export async function getCategories(): Promise<CategoryNode[]> {
  await simulateRequest();
  return clone(buildTree());
}

export async function createCategory(input: CategoryInput): Promise<AdminCategory> {
  await simulateRequest();
  validate(input);
  const created: AdminCategory = {
    ...input,
    name: input.name.trim(),
    id: `cat-${Date.now().toString(36)}`,
  };
  writeDb((d) => {
    d.categories.push(created);
    place(d.categories, input.parent_id, created.id, input.display_order);
  });
  return clone(created);
}

export async function updateCategory(id: string, input: CategoryInput): Promise<AdminCategory> {
  await simulateRequest();
  validate(input, id);
  writeDb((d) => {
    const c = d.categories.find((x) => x.id === id);
    if (!c) throw new ApiError("NOT_FOUND", "This category no longer exists.");
    Object.assign(c, { ...input, name: input.name.trim(), parent_id: c.parent_id });
    place(d.categories, c.parent_id, id, input.display_order);
  });
  return clone(readDb().categories.find((c) => c.id === id)!);
}

export async function reorderCategories(
  parentId: string | null,
  orderedIds: string[],
): Promise<void> {
  await simulateRequest(120);
  writeDb((d) => {
    orderedIds.forEach((cid, i) => {
      const c = d.categories.find((x) => x.id === cid && x.parent_id === parentId);
      if (c) c.display_order = i + 1;
    });
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await simulateRequest();
  const node = buildTree()
    .flatMap((c) => [c, ...c.children.map((s) => ({ ...s, children: [] as CategoryLeaf[] }))])
    .find((c) => c.id === id);
  if (!node) throw new ApiError("NOT_FOUND", "This category no longer exists.");
  const blocker = categoryDeleteBlocker(node);
  if (blocker) throw new ApiError("CATEGORY_NOT_EMPTY", blocker);
  writeDb((d) => {
    d.categories = d.categories.filter((c) => c.id !== id);
    const siblings = d.categories.filter((c) => c.parent_id === node.parent_id).sort(byOrder);
    siblings.forEach((c, i) => (c.display_order = i + 1));
  });
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
