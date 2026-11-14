export const ORDER_STEPS = [
  "pending",
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export function nextStatuses(status) {
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

export function amountDue(order) {
  if (!order || order.status === "cancelled") return 0;
  return Math.max(0, (order.total || 0) - (order.amount_paid || 0));
}

const startOfDay = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function isOverdue(order, now = Date.now()) {
  if (!order || order.status === "delivered" || order.status === "cancelled") return false;
  if (!order.expected_delivery) return false;
  return startOfDay(new Date(order.expected_delivery).getTime()) < startOfDay(now);
}

export function itemCount(order) {
  if (!order || !Array.isArray(order.items)) return 0;
  return order.items.reduce((sum, item) => sum + (item.qty || item.quantity || 1), 0);
}

export function filterOrders(orders, filter = {}, now = Date.now()) {
  if (!Array.isArray(orders)) return [];
  const q = filter.query?.replace(/[#\s]/g, "").toLowerCase();
  return orders.filter((o) => {
    if (filter.status && filter.status !== "all" && o.status !== filter.status) return false;
    if (q && !String(o.id).toLowerCase().includes(q)) return false;
    if (filter.overdue && !isOverdue(o, now)) return false;
    if (filter.payment === "due" && amountDue(o) === 0) return false;
    if (filter.payment === "paid" && (o.status === "cancelled" || amountDue(o) > 0)) return false;
    if (filter.method && filter.method !== "any" && o.payment_method !== filter.method) return false;
    return true;
  });
}

export function nextRequestStatuses(status) {
  return status === "new" || status === "contacted" ? ["cancelled"] : [];
}

export function lowestPrice(product) {
  if (!product || !Array.isArray(product.variants)) return null;
  const pool = product.variants.filter((v) => v.available);
  const list = pool.length ? pool : product.variants;
  const prices = list.map((v) => v.price).filter((n) => typeof n === "number" && n > 0);
  return prices.length ? Math.min(...prices) : null;
}

export function newVariantId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function slugify(value) {
  if (!value) return "";
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function previewSlug(name) {
  return slugify(name) || "product";
}

export function categoryDeleteBlocker(category) {
  if (!category) return null;
  const subs = category.children?.length ?? 0;
  const products = category.product_count ?? 0;
  if (!products && !subs) return null;
  const parts = [
    products ? `${products} ${products === 1 ? "product" : "products"}` : "",
    subs ? `${subs} ${subs === 1 ? "subcategory" : "subcategories"}` : "",
  ].filter(Boolean);
  return `This category still has ${parts.join(" and ")}. Delete or move them first.`;
}

export function couponStatus(c, now = Date.now()) {
  if (!c) return "disabled";
  if (!c.active) return "disabled";
  if (c.starts_at && now < new Date(c.starts_at).getTime()) return "scheduled";
  if (c.ends_at && now > new Date(c.ends_at).getTime()) return "expired";
  if (c.usage_limit != null && (c.used_count || 0) >= c.usage_limit) return "expired";
  return "active";
}

export function isCouponCodeTaken(code, coupons = [], ignoreId) {
  if (typeof coupons === "string") {
    ignoreId = coupons;
    coupons = [];
  }
  const normal = code.trim().toUpperCase();
  return (coupons || []).some((c) => c.code?.toUpperCase() === normal && c.id !== ignoreId);
}

export function generateCouponCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "SSV";
  for (let i = 0; i < 5; i++) {
    code += letters[Math.floor(Math.random() * letters.length)];
  }
  return code;
}

export const RANGE_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "month", label: "This month" },
];

