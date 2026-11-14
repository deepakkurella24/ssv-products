import { Link, useParams } from "react-router";
import { CircleCheck } from "lucide-react";
import { OrderSummary } from "@/components/OrderSummary";
import { formatDate } from "@/lib/delivery";
import { buttonStyles } from "@/lib/ui";
import { formatPrice } from "@/lib/utils";
import { useStore } from "@/store/StoreProvider";
import NotFoundPage from "./NotFoundPage";

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const { orders } = useStore();
  const order = orders.find((o) => o.id === id);
  if (!order) return <NotFoundPage />;

  return (
    <div className="shell pt-10 pb-20 lg:pt-14 lg:pb-28">
      <title>{`Order ${order.id} placed · SSV`}</title>
      <div className="max-w-[640px]">
        <CircleCheck aria-hidden size={44} className="text-forest" />
        <h1 className="mt-4 text-[34px] lg:text-[44px]">Thanks, your order is placed</h1>
        <p className="mt-3 text-[17px] text-deep/85">
          Your order number is <strong className="tabular-nums">{order.id}</strong>. We will deliver
          to {order.address.name} by <strong>{formatDate(order.expected_delivery)}</strong>.
        </p>
        <p className="mt-2 text-[17px] text-deep/85">
          {order.payment_method === "cod" ? (
            <>
              Please keep <strong className="tabular-nums">{formatPrice(order.total)}</strong> ready
              to pay in cash on delivery.
            </>
          ) : (
            <>
              You paid <strong className="tabular-nums">{formatPrice(order.amount_paid)}</strong>{" "}
              online.
            </>
          )}
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to={`/account/orders/${order.id}`}
            className={buttonStyles.forest("h-12 px-6 text-[16px]")}
          >
            Track this order
          </Link>
          <Link to="/products" className={buttonStyles.outline()}>
            Continue shopping
          </Link>
        </div>
      </div>

      <div className="mt-12 max-w-[760px]">
        <OrderSummary order={order} />
      </div>
    </div>
  );
}
