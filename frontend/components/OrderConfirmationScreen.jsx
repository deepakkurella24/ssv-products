"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CircleCheck } from "lucide-react";
import { OrderSummary } from "@/components/OrderSummary";
import { formatDate } from "@/lib/delivery";
import { buttonStyles } from "@/lib/ui";
import { formatPrice } from "@/lib/utils";
import { getOrder } from "@/lib/api/user";

export function OrderConfirmationScreen() {
  const params = useParams();
  const id = params?.id;
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (id && id !== "latest") {
      getOrder(id)
        .then(setOrder)
        .catch(() => null);
    }
  }, [id]);

  const displayOrder = order || {
    id: id || "SSV-ORDER",
    status: "pending",
    placed_at: new Date().toISOString(),
    expected_delivery: null,
    items: [],
    subtotal: 0,
    total: 0,
    payment_method: "cod",
    amount_paid: 0,
    address: {
      name: "Customer",
      door_no: "",
      street: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
    },
  };

  return (
    <div className="shell pt-10 pb-20 lg:pt-14 lg:pb-28">
      <div className="max-w-[640px]">
        <CircleCheck aria-hidden size={44} className="text-forest" />
        <h1 className="mt-4 text-[34px] lg:text-[44px]">Thanks, your order is placed</h1>
        <p className="mt-3 text-[17px] text-deep/85">
          Your order number is <strong className="tabular-nums">{displayOrder.id}</strong>. We will deliver
          to {displayOrder.address?.name || "you"}{displayOrder.expected_delivery ? <> by <strong>{formatDate(displayOrder.expected_delivery)}</strong></> : ""}.
        </p>
        <p className="mt-2 text-[17px] text-deep/85">
          {displayOrder.payment_method === "cod" ? (
            <>
              Please keep <strong className="tabular-nums">{formatPrice(displayOrder.total)}</strong> ready
              to pay in cash on delivery.
            </>
          ) : (
            <>
              You paid <strong className="tabular-nums">{formatPrice(displayOrder.amount_paid)}</strong>{" "}
              online.
            </>
          )}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href={`/account/orders/${displayOrder.id}`}
            className={buttonStyles.forest("h-12 px-6 text-[16px]")}
          >
            Track this order
          </Link>
          <Link href="/products" className={buttonStyles.outline()}>
            Continue shopping
          </Link>
        </div>
      </div>

      {displayOrder.items?.length > 0 && (
        <div className="mt-12 max-w-[760px]">
          <OrderSummary order={displayOrder} />
        </div>
      )}
    </div>
  );
}

export default OrderConfirmationScreen;
