import { CATEGORIES } from "./categories";
import { PRODUCTS } from "./products";
import type { Category, Product } from "./types";

// Mock API. Replace the bodies with real fetch calls; callers stay the same.

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchProducts(): Promise<Product[]> {
  await delay(700);
  return PRODUCTS;
}

export async function fetchCategories(): Promise<Category[]> {
  return CATEGORIES;
}

export interface CustomRequestInput {
  item: string;
  quantity_kg: number;
  details: string;
  mobile: string;
}

/** Mock submit. Rejects when the browser is offline so the error state is real. */
export async function submitCustomRequest(input: CustomRequestInput): Promise<{ id: string }> {
  await delay(900);
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("offline");
  }
  void input;
  return { id: `REQ-${2000 + Math.floor(Math.random() * 900)}` };
}
