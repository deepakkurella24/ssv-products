import type { CouponStatus } from "@/data/admin/coupons";
import type { OrderStatus, RequestStatus } from "@/data/admin/types";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Soft tint background with darker text; Delivered is solid. */
export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  pending: "bg-marigold/30 text-deep",
  confirmed: "bg-leaf/20 text-forest",
  preparing: "bg-clay/15 text-clay",
  out_for_delivery: "bg-teal/15 text-teal",
  delivered: "bg-forest text-cream",
  cancelled: "bg-brick/12 text-brick",
};

/** Flat fills for charts and dots, as token names. */
export const ORDER_STATUS_TOKEN: Record<OrderStatus, string> = {
  pending: "--color-marigold",
  confirmed: "--color-leaf",
  preparing: "--color-clay",
  out_for_delivery: "--color-teal",
  delivered: "--color-forest",
  cancelled: "--color-brick",
};

export const NEXT_STEP_LABEL: Partial<Record<OrderStatus, string>> = {
  pending: "Confirm order",
  confirmed: "Move to Preparing",
  preparing: "Mark out for delivery",
  out_for_delivery: "Mark delivered",
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  new: "New",
  contacted: "Contacted",
  confirmed: "Confirmed",
  closed: "Closed",
};

export const REQUEST_STATUS_STYLE: Record<RequestStatus, string> = {
  new: "bg-leaf/20 text-forest",
  contacted: "bg-marigold/30 text-deep",
  confirmed: "bg-forest text-cream",
  closed: "bg-sand text-deep/80",
};

export const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  disabled: "Disabled",
};

export const COUPON_STATUS_STYLE: Record<CouponStatus, string> = {
  active: "bg-leaf/20 text-forest",
  scheduled: "bg-teal/15 text-teal",
  expired: "bg-clay/15 text-clay",
  disabled: "bg-sand text-deep/80",
};

/** Reads a theme colour so SVG charts use the same tokens as the UI. */
export function tokenColor(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
