import type { CustomRequestStatus, OrderStatus } from "@/data/types";

export const ORDER_STEPS: { key: Exclude<OrderStatus, "cancelled">; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "preparing", label: "Preparing" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  pending: "sand",
  confirmed: "leaf",
  preparing: "leaf",
  out_for_delivery: "marigold",
  delivered: "forest",
  cancelled: "clay",
};

export const REQUEST_STATUS_LABEL: Record<CustomRequestStatus, string> = {
  received: "Received",
  contacted: "Team contacted you",
  confirmed: "Confirmed",
  closed: "Closed",
};

export const REQUEST_STATUS_HINT: Record<CustomRequestStatus, string> = {
  received: "We have your request. Our team will call you soon.",
  contacted: "Our team has called you about this request.",
  confirmed: "Your request is confirmed.",
  closed: "This request is closed.",
};

export const REQUEST_STATUS_TONE: Record<CustomRequestStatus, Tone> = {
  received: "sand",
  contacted: "marigold",
  confirmed: "leaf",
  closed: "clay",
};

export type Tone = "sand" | "leaf" | "marigold" | "forest" | "clay";

export const TONE_CLASS: Record<Tone, string> = {
  sand: "bg-sand text-deep",
  leaf: "bg-leaf text-deep",
  marigold: "bg-marigold text-deep",
  forest: "bg-forest text-cream",
  clay: "border border-clay text-clay",
};
