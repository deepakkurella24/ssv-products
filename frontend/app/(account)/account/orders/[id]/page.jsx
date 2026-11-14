"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CircleX, Truck } from "lucide-react";
import { OrderSummary } from "@/components/OrderSummary";
import { OrderTracker } from "@/components/OrderTracker";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDate } from "@/lib/delivery";
import { ORDER_STATUS_LABEL, ORDER_STATUS_TONE } from "@/lib/status";
import { buttonStyles } from "@/lib/ui";
import { formatPrice } from "@/lib/utils";
import { getOrder, cancelOrder as apiCancelOrder } from "@/lib/api/user";
import { useAuth } from "@/components/providers/AuthProvider";

export default function OrderDetailPage() {
  const { firebaseUser, loading: authLoading } = useAuth();
  const params = useParams();
  const id = params?.id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [mutationError, setMutationError] = useState("");

  useEffect(() => {
    if (!id || authLoading) return;
    if (!firebaseUser) {
      setLoading(false);
      return;
    }

    let active = true;
    firebaseUser
      .getIdToken()
      .then((token) => getOrder(id, token))
      .then((data) => {
        if (active) setOrder(data);
      })
      .catch(() => {
        if (active) setOrder(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id, firebaseUser, authLoading]);

  const cancelOrder = async (orderId) => {
    setCancelling(true);
    setMutationError("");
    try {
      const token = await firebaseUser?.getIdToken();
      const updated = await apiCancelOrder(orderId, token);
      setOrder((prev) => (prev ? { ...prev, ...updated, status: updated?.status || "cancelled" } : null));
      setConfirming(false);
    } catch (e) {
      setMutationError(e.message || "Couldn't cancel the order. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="py-12 text-center text-[16px] text-deep/70">
        Loading order details…
      </div>
    );
  }

  if (!order) {
    return (
      <section>
        <h2 className="text-[28px]">We could not find that order</h2>
        <Link
          href="/account/orders"
          className="mt-4 inline-flex items-center gap-1.5 font-semibold text-forest underline underline-offset-4"
        >
          <ArrowLeft aria-hidden size={16} /> Back to my orders
        </Link>
      </section>
    );
  }

  const cancelled = order.status === "cancelled";
  const due = cancelled ? 0 : Math.max(0, order.total - (order.amount_paid || 0));

  return (
    <article aria-labelledby="order-heading">
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-forest underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden size={16} /> My orders
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="order-heading" className="text-[28px] tabular-nums lg:text-[32px]">
            Order {order.id}
          </h2>
          <p className="text-[15px] text-deep/75">Placed on {formatDate(order.placed_at)}</p>
        </div>
        <StatusBadge
          label={ORDER_STATUS_LABEL[order.status] || order.status}
          tone={ORDER_STATUS_TONE[order.status] || "sand"}
        />
      </div>

      <section
        aria-label="Order status"
        className="mt-6 rounded-card border border-sand p-5 sm:p-6"
      >
        {order.status === "cancelled" ? (
          <div className="flex items-start gap-3">
            <CircleX aria-hidden size={26} className="mt-0.5 shrink-0 text-clay" />
            <div>
              <p className="font-display text-[22px] font-semibold text-clay">
                This order was cancelled
              </p>
              <p className="mt-1 text-[15px] text-deep/80">
                It will not be delivered. You can place a new order any time.
              </p>
            </div>
          </div>
        ) : (
          <>
            <OrderTracker status={order.status} />
            {order.status !== "delivered" && (
              <p className="mt-6 flex items-center gap-2 border-t border-sand pt-4 text-[15px]">
                <Truck aria-hidden size={18} className="text-forest" />
                Expected delivery by <strong>{formatDate(order.expected_delivery)}</strong>
              </p>
            )}
          </>
        )}

        <dl className="mt-6 grid gap-4 border-t border-sand pt-5 sm:grid-cols-3">
          <div>
            <dt className="text-[14px] text-deep/70">Order total</dt>
            <dd className="text-[20px] font-bold tabular-nums">{formatPrice(order.total)}</dd>
          </div>
          <div>
            <dt className="text-[14px] text-deep/70">Amount paid</dt>
            <dd className="text-[20px] font-bold tabular-nums">{formatPrice(order.amount_paid)}</dd>
          </div>
          <div>
            <dt className="text-[14px] text-deep/70">Amount due</dt>
            <dd className="text-[20px] font-bold tabular-nums">{formatPrice(due)}</dd>
          </div>
        </dl>

        {order.status === "pending" && (
          <div className="mt-6 border-t border-sand pt-5">
            {confirming ? (
              <div role="alertdialog" aria-label="Confirm cancellation">
                <p className="font-semibold">Cancel this order?</p>
                <p className="mt-1 text-[15px] text-deep/80">
                  You can only cancel while the order is pending.
                </p>
                {mutationError && <p role="alert" className="mt-2 text-[14px] text-clay">{mutationError}</p>}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={cancelling}
                    onClick={() => cancelOrder(order.id)}
                    className={buttonStyles.forest("h-11 px-5 text-[15px]")}
                  >
                    {cancelling ? "Cancelling…" : "Yes, cancel order"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(false)}
                    className={buttonStyles.outline("h-11 px-5 text-[15px]")}
                  >
                    Keep order
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className={buttonStyles.outline("h-11 px-5 text-[15px]")}
              >
                Cancel order
              </button>
            )}
          </div>
        )}
      </section>

      <div className="mt-6">
        <OrderSummary order={order} showPayment={false} />
      </div>
    </article>
  );
}
