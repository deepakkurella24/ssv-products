import { addressFor, findSeedCustomer, rng, SEED_CUSTOMERS, type SeedCustomer } from "./customers";
import { ApiError, clone, readDb, simulateRequest, writeDb } from "./db";
import { SEED_PRODUCTS } from "./products";
import type { AdminOrder, AdminOrderItem, OrderStatus, PaymentMethod } from "./types";

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;
export const EXPECTED_DELIVERY_DAYS = 4;

// ---------- Status rules ----------

export const ORDER_STEPS: Exclude<OrderStatus, "cancelled">[] = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

/** Valid next steps. Cancelling is only possible while pending. */
export function nextStatuses(status: OrderStatus): OrderStatus[] {
  switch (status) {
    case "pending":
      return ["confirmed", "cancelled"];
    case "confirmed":
      return ["preparing"];
    case "preparing":
      return ["out_for_delivery"];
    case "out_for_delivery":
      return ["delivered"];
    default:
      return [];
  }
}

export function amountDue(o: Pick<AdminOrder, "total" | "amount_paid" | "status">) {
  if (o.status === "cancelled") return 0;
  return Math.max(0, o.total - o.amount_paid);
}

const startOfDay = (t: number) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

/** Past its expected delivery date and still not delivered (or cancelled). */
export function isOverdue(o: Pick<AdminOrder, "status" | "expected_delivery">, now = Date.now()) {
  if (o.status === "delivered" || o.status === "cancelled") return false;
  return startOfDay(new Date(o.expected_delivery).getTime()) < startOfDay(now);
}

export function itemCount(o: Pick<AdminOrder, "items">) {
  return o.items.reduce((sum, i) => sum + i.qty, 0);
}

// ---------- Filtering (pure, shared by list and analytics links) ----------

export interface OrderFilters {
  status?: OrderStatus | "all";
  query?: string;
  overdue?: boolean;
  payment?: "any" | "due" | "paid";
  method?: "any" | PaymentMethod;
}

export function filterOrders(orders: AdminOrder[], f: OrderFilters, now = Date.now()) {
  const q = f.query?.replace(/[#\s]/g, "");
  return orders.filter((o) => {
    if (f.status && f.status !== "all" && o.status !== f.status) return false;
    if (q && !o.id.includes(q)) return false;
    if (f.overdue && !isOverdue(o, now)) return false;
    if (f.payment === "due" && amountDue(o) === 0) return false;
    if (f.payment === "paid" && (o.status === "cancelled" || amountDue(o) > 0)) return false;
    if (f.method && f.method !== "any" && o.payment_method !== f.method) return false;
    return true;
  });
}

// ---------- Seed generation (60 days) ----------

interface DraftOrder extends Omit<AdminOrder, "id" | "number"> {}

function pickCustomer(r: () => number): SeedCustomer {
  const total = SEED_CUSTOMERS.reduce((s, c) => s + c.weight, 0);
  let n = r() * total;
  for (const c of SEED_CUSTOMERS) {
    n -= c.weight;
    if (n <= 0) return c;
  }
  return SEED_CUSTOMERS[0];
}

function item(
  productId: string,
  variantLabel: string,
  qty: number,
  key: string,
  priceOverride?: number,
): AdminOrderItem {
  const p = SEED_PRODUCTS.find((x) => x.id === productId)!;
  const v = p.variants.find((x) => x.label === variantLabel) ?? p.variants[0];
  return {
    id: `it-${key}`,
    product_id: p.id,
    name: p.name,
    variant_label: v.label,
    image_url: p.image_url,
    qty,
    price: priceOverride ?? v.price,
  };
}

function history(placed: number, status: OrderStatus, deliveredAt?: number) {
  const events: { status: OrderStatus; at: string }[] = [
    { status: "pending", at: new Date(placed).toISOString() },
  ];
  if (status === "cancelled") {
    events.push({ status: "cancelled", at: new Date(placed + 2 * HOUR).toISOString() });
    return events;
  }
  const steps: [OrderStatus, number][] = [
    ["confirmed", 50 * MIN],
    ["preparing", 20 * HOUR],
    ["out_for_delivery", 40 * HOUR],
  ];
  const reached = ORDER_STEPS.indexOf(status as (typeof ORDER_STEPS)[number]);
  steps.forEach(([s, offset], i) => {
    if (i + 1 <= reached) events.push({ status: s, at: new Date(placed + offset).toISOString() });
  });
  if (status === "delivered" && deliveredAt)
    events.push({ status: "delivered", at: new Date(deliveredAt).toISOString() });
  return events;
}

function draft(
  customer: SeedCustomer,
  placed: number,
  status: OrderStatus,
  items: AdminOrderItem[],
  method: PaymentMethod,
  opts: { paid?: number; expected?: number; deliveredAt?: number; sourceRequestId?: string } = {},
): DraftOrder {
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const deliveredAt = status === "delivered" ? (opts.deliveredAt ?? placed + 3 * DAY) : null;
  const paid =
    opts.paid ??
    (status === "cancelled" ? 0 : status === "delivered" || method === "online" ? total : 0);
  return {
    placed_at: new Date(placed).toISOString(),
    status,
    status_history: history(placed, status, deliveredAt ?? undefined),
    customer: { id: customer.id, name: customer.name, phone: customer.phone },
    address: addressFor(customer),
    items,
    total,
    amount_paid: paid,
    payment_method: method,
    expected_delivery: new Date(
      opts.expected ?? placed + EXPECTED_DELIVERY_DAYS * DAY,
    ).toISOString(),
    delivered_at: deliveredAt ? new Date(deliveredAt).toISOString() : null,
    delivery_zone: customer.zone,
    source_request_id: opts.sourceRequestId ?? null,
  };
}

export function generateSeedOrders(now: number): AdminOrder[] {
  const r = rng(20261109);
  // Read lazily: these modules import each other, so avoid module-level access.
  const ORDERABLE = SEED_PRODUCTS.slice(0, 8);
  const drafts: DraftOrder[] = [];
  const today = startOfDay(now);

  // Historical orders: 3 to 59 days ago, busier on weekends.
  for (let d = 3; d < 60; d++) {
    const day = today - d * DAY;
    const weekend = [0, 6].includes(new Date(day).getDay());
    const count = (weekend ? 5 : 2) + Math.floor(r() * 3);
    for (let n = 0; n < count; n++) {
      const placed = day + (8 + r() * 13) * HOUR;
      const customer = pickCustomer(r);
      const lines = 1 + Math.floor(r() * (r() < 0.3 ? 3 : 2));
      const chosen = [...ORDERABLE].sort(() => r() - 0.5).slice(0, lines);
      const items = chosen.map((p, i) => {
        const v = p.variants[Math.floor(r() * p.variants.length)];
        const qty = r() < 0.7 ? 1 : r() < 0.8 ? 2 : 3;
        // Sesame oil 1 L cost ₹620 before a price change 35 days ago (snapshot pricing).
        const price = p.id === "p-sesame-oil" && v.label === "1 L" && d > 35 ? 620 : undefined;
        return item(p.id, v.label, qty, `${d}-${n}-${i}`, price);
      });
      const cancelled = r() < 0.05;
      const method: PaymentMethod = r() < 0.42 ? "online" : "cod";
      drafts.push(
        draft(customer, placed, cancelled ? "cancelled" : "delivered", items, method, {
          deliveredAt: placed + (2 + Math.floor(r() * 3)) * DAY + 3 * HOUR,
        }),
      );
    }
  }

  // Recent, hand-written examples covering every status.
  const c = findSeedCustomer;
  drafts.push(
    draft(
      c("c01"),
      now - 25 * MIN,
      "pending",
      [item("p-sesame-oil", "1 L", 1, "h1a"), item("p-turmeric-powder", "200 g", 2, "h1b")],
      "cod",
    ),
    draft(
      c("c02"),
      now - 100 * MIN,
      "pending",
      [item("p-forest-honey", "500 g", 1, "h2a")],
      "online",
    ),
    draft(
      c("c03"),
      now - 3 * HOUR,
      "confirmed",
      [item("p-coconut-oil", "500 ml", 2, "h3a"), item("p-black-sesame-oil", "500 ml", 1, "h3b")],
      "cod",
      { paid: 500 },
    ),
    draft(
      c("c04"),
      now - 5 * HOUR,
      "preparing",
      [
        {
          id: "it-h4a",
          product_id: "p-sesame-oil",
          name: "Cold Pressed Sesame Oil",
          variant_label: "Custom order",
          image_url: SEED_PRODUCTS[0].image_url,
          qty: 1,
          price: 5400,
          weight_kg: 15,
          customisation:
            "Packed in 5 cans of 3 L each for a temple kitchen. Deliver before Saturday morning.",
        },
      ],
      "cod",
      { paid: 2000, sourceRequestId: "CR-2004" },
    ),
    draft(
      c("c05"),
      now - 8 * HOUR,
      "out_for_delivery",
      [
        item("p-sesame-oil", "1 L", 1, "h5a"),
        item("p-forest-honey", "250 g", 1, "h5b"),
        item("p-red-chilli-powder", "250 g", 2, "h5c"),
      ],
      "cod",
    ),
    draft(
      c("c06"),
      now - 26 * HOUR,
      "delivered",
      [item("p-forest-honey", "250 g", 2, "h6a"), item("p-dhoop-sticks", "100 g", 2, "h6b")],
      "online",
      { deliveredAt: now - 3 * HOUR },
    ),
    draft(
      c("c07"),
      now - 29 * HOUR,
      "cancelled",
      [item("p-sesame-oil", "500 ml", 1, "h7a"), item("p-dhoop-sticks", "100 g", 1, "h7b")],
      "cod",
    ),
    draft(
      c("c24"),
      now - 51 * HOUR,
      "out_for_delivery",
      [item("p-sesame-oil", "1 L", 2, "h8a"), item("p-forest-honey", "500 g", 1, "h8b")],
      "online",
      { expected: now + DAY },
    ),
    draft(
      c("c08"),
      now - 54 * HOUR,
      "confirmed",
      [
        item("p-turmeric-powder", "200 g", 3, "h9a"),
        item("p-red-chilli-powder", "250 g", 2, "h9b"),
        item("p-black-sesame-oil", "500 ml", 1, "h9c"),
      ],
      "cod",
      { paid: 300 },
    ),
    // Overdue: expected two days ago, still preparing.
    draft(
      c("c21"),
      now - 6 * DAY,
      "preparing",
      [item("p-sesame-oil", "1 L", 1, "h10a"), item("p-forest-honey", "500 g", 1, "h10b")],
      "cod",
      { expected: now - 2 * DAY },
    ),
  );

  // Newest first; order numbers count down from #1050.
  drafts.sort((a, b) => b.placed_at.localeCompare(a.placed_at));
  return drafts.map((o, i) => {
    const number = 1050 - i;
    return { ...o, id: String(number), number };
  });
}

// ---------- API ----------

export async function getOrders(): Promise<AdminOrder[]> {
  await simulateRequest();
  return clone([...readDb().orders].sort((a, b) => b.placed_at.localeCompare(a.placed_at)));
}

export async function getOrderById(id: string): Promise<AdminOrder | null> {
  await simulateRequest();
  const o = readDb().orders.find((x) => x.id === id.replace(/^#/, ""));
  return o ? clone(o) : null;
}

function mutateOrder(id: string, fn: (o: AdminOrder) => void): AdminOrder {
  let result: AdminOrder | undefined;
  writeDb((d) => {
    const o = d.orders.find((x) => x.id === id);
    if (!o) throw new ApiError("NOT_FOUND", "This order no longer exists.");
    fn(o);
    result = o;
  });
  return clone(result!);
}

/** Moves an order to a valid next step. Optionally records cash collected on delivery. */
export async function updateOrderStatus(
  id: string,
  next: OrderStatus,
  opts: { collectAmount?: number } = {},
): Promise<AdminOrder> {
  await simulateRequest();
  const current = readDb().orders.find((x) => x.id === id);
  if (!current) throw new ApiError("NOT_FOUND", "This order no longer exists.");
  if (!nextStatuses(current.status).includes(next)) {
    throw new ApiError("INVALID_TRANSITION", "This order can't move to that step.");
  }
  return mutateOrder(id, (o) => {
    const at = new Date().toISOString();
    o.status = next;
    o.status_history.push({ status: next, at });
    if (next === "delivered") o.delivered_at = at;
    if (opts.collectAmount && opts.collectAmount > 0) {
      o.amount_paid = Math.min(o.total, o.amount_paid + opts.collectAmount);
    }
  });
}

/** Records an advance payment or cash collected on delivery. */
export async function recordOrderPayment(id: string, amount: number): Promise<AdminOrder> {
  await simulateRequest();
  const current = readDb().orders.find((x) => x.id === id);
  if (!current) throw new ApiError("NOT_FOUND", "This order no longer exists.");
  const due = amountDue(current);
  if (!(amount > 0)) throw new ApiError("INVALID", "Enter an amount above ₹0.");
  if (amount > due) throw new ApiError("INVALID", "That is more than the amount due.");
  return mutateOrder(id, (o) => {
    o.amount_paid += amount;
  });
}

/** Tracking and notifications only. Never changes prices or the order total. */
export async function updateExpectedDelivery(id: string, isoDate: string): Promise<AdminOrder> {
  await simulateRequest();
  return mutateOrder(id, (o) => {
    o.expected_delivery = isoDate;
  });
}

export async function getAdminCounts() {
  await simulateRequest(80);
  const { orders, requests } = readDb();
  return {
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    newRequests: requests.filter((r) => r.status === "new").length,
  };
}
