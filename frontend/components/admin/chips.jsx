"use client";
import { Banknote, Smartphone } from "lucide-react";
import { amountDue } from "@/lib/admin/helpers";
import { formatINR } from "@/lib/admin/format";
import {
  COUPON_STATUS_LABEL,
  COUPON_STATUS_STYLE,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STYLE,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_STYLE
} from "@/lib/admin/status";
import { cn } from "@/lib/utils";
const chip = "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold whitespace-nowrap";
export function StatusChip({ status }) {
  return <span className={cn(chip, ORDER_STATUS_STYLE[status])}>{ORDER_STATUS_LABEL[status]}</span>;
}
export function RequestChip({ status }) {
  return <span className={cn(chip, REQUEST_STATUS_STYLE[status])}>{REQUEST_STATUS_LABEL[status]}</span>;
}
export function CouponChip({ status }) {
  return <span className={cn(chip, COUPON_STATUS_STYLE[status])}>{COUPON_STATUS_LABEL[status]}</span>;
}
export function PaymentChip({
  order
}) {
  const Icon = order.payment_method === "cod" ? Banknote : Smartphone;
  const method = order.payment_method === "cod" ? "COD" : "Online";
  const due = amountDue(order);
  if (order.status === "cancelled") {
    return <span className={cn(chip, "border border-sand bg-white text-deep/70")}>
        <Icon size={13} /> {method}
      </span>;
  }
  return <span className={cn(chip, due > 0 ? "bg-marigold/30 text-deep" : "bg-leaf/20 text-forest")}>
      <Icon size={13} />
      {method} · {due > 0 ? `Due ${formatINR(due)}` : "Paid"}
    </span>;
}
export function Tag({
  tone = "neutral",
  children
}) {
  const styles = {
    warning: "bg-marigold text-deep",
    neutral: "border border-deep/20 bg-white text-deep/80",
    badge: "bg-marigold/30 text-deep"
  };
  return <span className={cn(chip, styles[tone])}>{children}</span>;
}
