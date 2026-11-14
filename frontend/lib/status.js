export const ORDER_STEPS = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

export const ORDER_STATUS_LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_TONE = {
  pending: "sand",
  confirmed: "leaf",
  preparing: "leaf",
  out_for_delivery: "marigold",
  delivered: "forest",
  cancelled: "clay",
};

export const REQUEST_STATUS_LABEL = {
  new: "Request received",
  received: "Request received",
  contacted: "Request received",
  confirmed: "Confirmed",
  cancelled: "Rejected",
  closed: "Rejected",
};

export const REQUEST_STATUS_HINT = {
  new: "We have your request. Our team will call you soon.",
  received: "We have your request. Our team will call you soon.",
  contacted: "We have your request. Our team will call you soon.",
  confirmed: "Your request is confirmed and an order has been created.",
  cancelled: "We could not accept this request.",
  closed: "We could not accept this request.",
};

export const REQUEST_STATUS_TONE = {
  new: "sand",
  received: "sand",
  contacted: "sand",
  confirmed: "leaf",
  cancelled: "clay",
  closed: "clay",
};

export const TONE_CLASS = {
  sand: "bg-sand text-deep",
  leaf: "bg-leaf text-deep",
  marigold: "bg-marigold text-deep",
  forest: "bg-forest text-cream",
  clay: "border border-clay text-clay",
};
