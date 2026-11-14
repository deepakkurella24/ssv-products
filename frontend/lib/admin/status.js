export const ORDER_STATUS_LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled"
};
export const ORDER_STATUS_STYLE = {
  pending: "bg-marigold/30 text-deep",
  confirmed: "bg-leaf/20 text-forest",
  preparing: "bg-clay/15 text-clay",
  out_for_delivery: "bg-teal/15 text-teal",
  delivered: "bg-forest text-cream",
  cancelled: "bg-brick/12 text-brick"
};
export const ORDER_STATUS_TOKEN = {
  pending: "--color-marigold",
  confirmed: "--color-leaf",
  preparing: "--color-clay",
  out_for_delivery: "--color-teal",
  delivered: "--color-forest",
  cancelled: "--color-brick"
};
export const NEXT_STEP_LABEL = {
  pending: "Confirm order",
  confirmed: "Move to Preparing",
  preparing: "Mark out for delivery",
  out_for_delivery: "Mark delivered"
};
export const REQUEST_STATUS_LABEL = {
  new: "New",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  contacted: "New",
  closed: "Cancelled"
};
export const REQUEST_STATUS_STYLE = {
  new: "bg-leaf/20 text-forest",
  confirmed: "bg-forest text-cream",
  cancelled: "bg-brick/12 text-brick",
  contacted: "bg-leaf/20 text-forest",
  closed: "bg-brick/12 text-brick"
};
export const COUPON_STATUS_LABEL = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  disabled: "Disabled"
};
export const COUPON_STATUS_STYLE = {
  active: "bg-leaf/20 text-forest",
  scheduled: "bg-teal/15 text-teal",
  expired: "bg-clay/15 text-clay",
  disabled: "bg-sand text-deep/80"
};
export function tokenColor(name, fallback) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}
