import { Banknote, Smartphone } from "lucide-react";
import type { CouponStatus } from "@/data/admin/coupons";
import { amountDue } from "@/data/admin/orders";
import type { AdminOrder, OrderStatus, RequestStatus } from "@/data/admin/types";
import { formatINR } from "@/admin/lib/format";
import {
  COUPON_STATUS_LABEL,
  COUPON_STATUS_STYLE,
  ORDER_STATUS_LABEL,
  ORDER_STATUS_STYLE,
  REQUEST_STATUS_LABEL,
  REQUEST_STATUS_STYLE,
} from "@/admin/lib/status";
import { cn } from "@/lib/utils";

const chip =
  "inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-[12px] font-semibold whitespace-nowrap";

export function StatusChip({ status }: { status: OrderStatus }) {
  return <span className={cn(chip, ORDER_STATUS_STYLE[status])}>{ORDER_STATUS_LABEL[status]}</span>;
}

export function RequestChip({ status }: { status: RequestStatus }) {
  return (
    <span className={cn(chip, REQUEST_STATUS_STYLE[status])}>{REQUEST_STATUS_LABEL[status]}</span>
  );
}

export function CouponChip({ status }: { status: CouponStatus }) {
  return (
    <span className={cn(chip, COUPON_STATUS_STYLE[status])}>{COUPON_STATUS_LABEL[status]}</span>
  );
}

/** COD/Online plus Paid or Due amount. */
export function PaymentChip({
  order,
}: {
  order: Pick<AdminOrder, "payment_method" | "total" | "amount_paid" | "status">;
}) {
  const Icon = order.payment_method === "cod" ? Banknote : Smartphone;
  const method = order.payment_method === "cod" ? "COD" : "Online";
  const due = amountDue(order);
  if (order.status === "cancelled") {
    return (
      <span className={cn(chip, "border border-sand bg-white text-deep/70")}>
        <Icon size={13} /> {method}
      </span>
    );
  }
  return (
    <span className={cn(chip, due > 0 ? "bg-marigold/30 text-deep" : "bg-leaf/20 text-forest")}>
      <Icon size={13} />
      {method} · {due > 0 ? `Due ${formatINR(due)}` : "Paid"}
    </span>
  );
}

export function Tag({
  tone = "neutral",
  children,
}: {
  tone?: "warning" | "neutral" | "badge";
  children: React.ReactNode;
}) {
  const styles = {
    warning: "bg-marigold text-deep",
    neutral: "border border-deep/20 bg-white text-deep/80",
    badge: "bg-marigold/30 text-deep",
  };
  return <span className={cn(chip, styles[tone])}>{children}</span>;
}
