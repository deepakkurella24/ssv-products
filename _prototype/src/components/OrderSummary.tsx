import { useState } from "react";
import { Link } from "react-router";
import { Check, Star } from "lucide-react";
import type { Order } from "@/data/types";
import { findProduct } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import { useStore } from "@/store/StoreProvider";
import { ReviewDialog } from "./ReviewDialog";

/** Items, totals and delivery address for a placed order. */
export function OrderSummary({
  order,
  showPayment = true,
}: {
  order: Order;
  showPayment?: boolean;
}) {
  const { getReviewForOrderProduct } = useStore();
  const [reviewingItem, setReviewingItem] = useState<{
    item: Order["items"][number];
    review?: ReturnType<typeof getReviewForOrderProduct>;
  } | null>(null);

  const isDelivered = order.status === "delivered";
  const due = order.status === "cancelled" ? 0 : Math.max(0, order.total - order.amount_paid);

  return (
    <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
      <section
        aria-labelledby={`items-${order.id}`}
        className="rounded-card border border-sand p-5 sm:p-6"
      >
        <h2 id={`items-${order.id}`} className="text-[22px]">
          Items
        </h2>

        {isDelivered && (
          <div className="mt-3 flex items-start gap-2.5 rounded-[10px] bg-sand/50 p-3 text-[14px] text-deep">
            <Check aria-hidden size={18} className="text-forest mt-0.5 shrink-0" />
            <p>
              This order has been delivered. Leave a rating and review to share your experience with
              other customers.
            </p>
          </div>
        )}

        <ul className="mt-3 divide-y divide-sand text-[15px]">
          {order.items.map((item) => {
            const product = findProduct(item.product_id);
            const existing = isDelivered
              ? getReviewForOrderProduct(order.id, item.product_id)
              : undefined;
            return (
              <li key={`${item.product_id}-${item.variant_label}`} className="py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    {product ? (
                      <Link
                        to={`/products/${product.slug}`}
                        className="block font-semibold hover:text-forest hover:underline underline-offset-4"
                      >
                        {item.name}
                      </Link>
                    ) : (
                      <span className="block font-semibold">{item.name}</span>
                    )}
                    <span className="text-deep/75">
                      {item.variant_label} × {item.qty} ·{" "}
                      <span className="tabular-nums">{formatPrice(item.price)}</span> each
                    </span>
                  </div>
                  <span className="font-semibold tabular-nums shrink-0">
                    {formatPrice(item.price * item.qty)}
                  </span>
                </div>

                {isDelivered && product && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-3">
                    {existing ? (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-sand px-3 py-1 text-[13px] font-semibold text-deep">
                          <Star size={13} className="fill-marigold text-marigold" />
                          You rated this {existing.rating}/5
                        </span>
                        <button
                          type="button"
                          onClick={() => setReviewingItem({ item, review: existing })}
                          className="text-[13px] font-semibold text-forest underline underline-offset-4 hover:text-forest-dark"
                        >
                          Edit review
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReviewingItem({ item })}
                        className="inline-flex items-center gap-1.5 rounded-full border border-forest px-3 py-1 text-[13px] font-semibold text-forest transition-colors hover:bg-forest hover:text-cream"
                      >
                        <Star size={13} className="fill-marigold text-marigold" />
                        Rate & review
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <dl className="mt-2 space-y-1.5 border-t border-deep/20 pt-4 text-[15px]">
          <Row label="Subtotal" value={formatPrice(order.subtotal)} />
          <Row
            label="Delivery"
            value={order.delivery_fee === 0 ? "Free" : formatPrice(order.delivery_fee)}
          />
          <Row label="Total" value={formatPrice(order.total)} strong />
          {showPayment && <Row label="Amount paid" value={formatPrice(order.amount_paid)} />}
          {showPayment && <Row label="Amount due" value={formatPrice(due)} strong={due > 0} />}
        </dl>
      </section>

      <section
        aria-labelledby={`addr-${order.id}`}
        className="rounded-card border border-sand p-5 sm:p-6"
      >
        <h2 id={`addr-${order.id}`} className="text-[22px]">
          Delivery address
        </h2>
        <p className="mt-3 text-[15px] text-deep/90">
          <span className="block font-semibold">{order.address.name}</span>
          {order.address.door_no}, {order.address.street}
          <br />
          {order.address.city}, {order.address.state} {order.address.pincode}
          <span className="mt-1 block tabular-nums">+91 {order.address.phone}</span>
        </p>
        <h3 className="mt-5 font-sans text-[13px] font-semibold tracking-[0.1em] text-clay uppercase">
          Payment
        </h3>
        <p className="mt-1 text-[15px]">
          {order.payment_method === "cod" ? "Cash on delivery" : "Online payment"}
        </p>
      </section>

      {reviewingItem &&
        (() => {
          const prod = findProduct(reviewingItem.item.product_id);
          if (!prod) return null;
          return (
            <ReviewDialog
              open={true}
              onClose={() => setReviewingItem(null)}
              product={prod}
              variantLabel={reviewingItem.item.variant_label}
              orderId={order.id}
              initialReview={reviewingItem.review}
            />
          );
        })()}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between text-[17px] font-bold" : "flex justify-between"}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}
