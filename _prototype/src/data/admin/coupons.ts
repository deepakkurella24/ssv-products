import { ApiError, clone, readDb, simulateRequest, writeDb } from "./db";

// The coupon backend is not built yet; this is the mock source of truth.

export type CouponType = "PERCENT" | "FLAT";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  /** Cap for percentage coupons. Null for flat coupons or no cap. */
  max_discount: number | null;
  min_order: number;
  /** Null means unlimited. */
  usage_limit: number | null;
  per_user_limit: number;
  used_count: number;
  starts_at: string;
  ends_at: string;
  active: boolean;
}

export type CouponStatus = "active" | "scheduled" | "expired" | "disabled";

const DAY = 86_400_000;
const at = (now: number, days: number, endOfDay = false) => {
  const d = new Date(now + days * DAY);
  if (endOfDay) d.setHours(23, 59, 0, 0);
  else d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export const SEED_COUPONS = (now: number): Coupon[] => [
  {
    id: "cp-ssv10",
    code: "SSV10",
    type: "PERCENT",
    value: 10,
    max_discount: 100,
    min_order: 499,
    usage_limit: 100,
    per_user_limit: 1,
    used_count: 23,
    starts_at: at(now, -20),
    ends_at: at(now, 21, true),
    active: true,
  },
  {
    id: "cp-honey50",
    code: "HONEY50",
    type: "FLAT",
    value: 50,
    max_discount: null,
    min_order: 399,
    usage_limit: null,
    per_user_limit: 2,
    used_count: 41,
    starts_at: at(now, -40),
    ends_at: at(now, 45, true),
    active: true,
  },
  {
    id: "cp-bulk250",
    code: "BULK250",
    type: "FLAT",
    value: 250,
    max_discount: null,
    min_order: 2499,
    usage_limit: 50,
    per_user_limit: 1,
    used_count: 0,
    starts_at: at(now, -10),
    ends_at: at(now, 60, true),
    active: true,
  },
  {
    id: "cp-diwali15",
    code: "DIWALI15",
    type: "PERCENT",
    value: 15,
    max_discount: 200,
    min_order: 999,
    usage_limit: 200,
    per_user_limit: 1,
    used_count: 0,
    starts_at: at(now, 5),
    ends_at: at(now, 20, true),
    active: true,
  },
  {
    id: "cp-monsoon20",
    code: "MONSOON20",
    type: "PERCENT",
    value: 20,
    max_discount: 150,
    min_order: 699,
    usage_limit: 150,
    per_user_limit: 1,
    used_count: 112,
    starts_at: at(now, -90),
    ends_at: at(now, -30, true),
    active: true,
  },
  {
    id: "cp-welcome100",
    code: "WELCOME100",
    type: "FLAT",
    value: 100,
    max_discount: null,
    min_order: 799,
    usage_limit: 500,
    per_user_limit: 1,
    used_count: 64,
    starts_at: at(now, -120),
    ends_at: at(now, 180, true),
    active: false,
  },
];

export function couponStatus(c: Coupon, now = Date.now()): CouponStatus {
  if (!c.active) return "disabled";
  if (now < new Date(c.starts_at).getTime()) return "scheduled";
  if (now > new Date(c.ends_at).getTime()) return "expired";
  if (c.usage_limit !== null && c.used_count >= c.usage_limit) return "expired";
  return "active";
}

export type CouponInput = Omit<Coupon, "id" | "used_count">;

export function isCouponCodeTaken(code: string, ignoreId?: string) {
  const normal = code.trim().toUpperCase();
  return readDb().coupons.some((c) => c.code === normal && c.id !== ignoreId);
}

export function generateCouponCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (;;) {
    let code = "SSV";
    for (let i = 0; i < 5; i++) code += letters[Math.floor(Math.random() * letters.length)];
    if (!isCouponCodeTaken(code)) return code;
  }
}

function validate(input: CouponInput, ignoreId?: string) {
  if (!/^[A-Z0-9]{3,16}$/.test(input.code))
    throw new ApiError("INVALID", "Use 3 to 16 letters or numbers.");
  if (isCouponCodeTaken(input.code, ignoreId))
    throw new ApiError("CODE_TAKEN", "This code is already in use.");
}

export async function getCoupons(): Promise<Coupon[]> {
  await simulateRequest();
  return clone([...readDb().coupons].sort((a, b) => b.starts_at.localeCompare(a.starts_at)));
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  await simulateRequest();
  const c = readDb().coupons.find((x) => x.id === id);
  return c ? clone(c) : null;
}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  await simulateRequest(300);
  validate(input);
  const coupon: Coupon = { ...input, id: `cp-${Date.now().toString(36)}`, used_count: 0 };
  writeDb((d) => d.coupons.push(coupon));
  return clone(coupon);
}

export async function updateCoupon(id: string, input: CouponInput): Promise<Coupon> {
  await simulateRequest(300);
  validate(input, id);
  writeDb((d) => {
    const c = d.coupons.find((x) => x.id === id);
    if (!c) throw new ApiError("NOT_FOUND", "This coupon no longer exists.");
    Object.assign(c, input);
  });
  return clone(readDb().coupons.find((c) => c.id === id)!);
}

export async function toggleCoupon(id: string, active: boolean): Promise<void> {
  await simulateRequest(150);
  writeDb((d) => {
    const c = d.coupons.find((x) => x.id === id);
    if (c) c.active = active;
  });
}

export async function deleteCoupon(id: string): Promise<void> {
  await simulateRequest(300);
  const c = readDb().coupons.find((x) => x.id === id);
  if (!c) throw new ApiError("NOT_FOUND", "This coupon no longer exists.");
  if (c.used_count > 0) {
    throw new ApiError(
      "COUPON_USED",
      "Customers have already used this coupon, so it can't be deleted.",
    );
  }
  writeDb((d) => {
    d.coupons = d.coupons.filter((x) => x.id !== id);
  });
}
