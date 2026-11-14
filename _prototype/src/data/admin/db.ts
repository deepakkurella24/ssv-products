// In-memory mock database shared by every admin screen. Mutations notify
// subscribers so all screens re-read the same data. Persisted to localStorage
// so changes survive a reload in the preview.
import { SEED_CATEGORIES } from "./categories";
import { SEED_COUPONS } from "./coupons";
import { generateSeedOrders } from "./orders";
import { SEED_PRODUCTS } from "./products";
import { generateSeedRequests } from "./requests";
import type { Coupon } from "./coupons";
import type { AdminCategory, AdminCustomRequest, AdminOrder, AdminProduct } from "./types";

export interface AdminDb {
  orders: AdminOrder[];
  requests: AdminCustomRequest[];
  products: AdminProduct[];
  categories: AdminCategory[];
  coupons: Coupon[];
}

const STORAGE_KEY = "ssv.admin.db.v1";

let db: AdminDb | null = null;
let version = 0;
const listeners = new Set<() => void>();

function seed(): AdminDb {
  const now = Date.now();
  const orders = generateSeedOrders(now);
  const requests = generateSeedRequests(now);
  // Link requests to the orders created from them.
  for (const o of orders) {
    const req = o.source_request_id && requests.find((r) => r.id === o.source_request_id);
    if (req) req.order_id = o.id;
  }
  return {
    products: structuredClone(SEED_PRODUCTS),
    categories: structuredClone(SEED_CATEGORIES),
    coupons: SEED_COUPONS(now),
    requests,
    orders,
  };
}

function load(): AdminDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as AdminDb;
  } catch {
    // Fall through to a fresh seed.
  }
  return seed();
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // Storage may be full or unavailable; data still lives in memory.
  }
}

/** Read-only access to the current data. Call inside API functions only. */
export function readDb(): AdminDb {
  db ??= load();
  return db;
}

/** Apply a mutation and notify every subscribed screen. */
export function writeDb(mutate: (data: AdminDb) => void) {
  mutate(readDb());
  version += 1;
  persist();
  listeners.forEach((fn) => fn());
}

export function subscribeDb(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getDbVersion() {
  return version;
}

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

/** Simulates network latency and the offline case, like a real API call. */
export async function simulateRequest(ms = 220) {
  await new Promise((resolve) => setTimeout(resolve, ms));
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    throw new ApiError("OFFLINE", "You're offline. Check your connection and try again.");
  }
}

export const clone = <T>(value: T): T => structuredClone(value);
