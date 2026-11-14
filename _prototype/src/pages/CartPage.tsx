import { Link, useNavigate } from "react-router";
import { ShoppingBasket, Trash2 } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { DeliveryProgress } from "@/components/DeliveryProgress";
import { ImageSlot } from "@/components/ImageSlot";
import { QuantityStepper } from "@/components/QuantityStepper";
import { FREE_DELIVERY_ABOVE } from "@/data/site";
import { useCartDetails } from "@/lib/cart";
import { buttonStyles } from "@/lib/ui";
import { cn, formatPrice } from "@/lib/utils";
import { useStore } from "@/store/StoreProvider";

export default function CartPage() {
  const { setCartQty, removeFromCart, requireAuth } = useStore();
  const { lines, subtotal, hasSoldOut } = useCartDetails();
  const navigate = useNavigate();

  const crumbs = [{ label: "Home", to: "/" }, { label: "Cart" }];

  if (lines.length === 0) {
    return (
      <div className="shell pt-6 pb-20 lg:pt-8 lg:pb-28">
        <title>Your cart · SSV</title>
        <Breadcrumb items={crumbs} />
        <div className="mt-10 max-w-[560px]">
          <ShoppingBasket aria-hidden size={40} className="text-forest" />
          <h1 className="mt-5 text-[34px] lg:text-[42px]">Your cart is empty</h1>
          <p className="mt-3 text-[17px] text-deep/80">
            Add oils, honey, spices or pooja items and they will show up here.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/products" className={buttonStyles.forest("h-12 px-6 text-[16px]")}>
              Browse products
            </Link>
            <Link to="/custom-order" className={buttonStyles.outline()}>
              Request a custom order
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shell pt-6 pb-20 lg:pt-8 lg:pb-28">
      <title>Your cart · SSV</title>
      <Breadcrumb items={crumbs} />
      <h1 className="mt-6 text-[34px] lg:mt-8 lg:text-[44px]">Your cart</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start lg:gap-12">
        <div>
          <DeliveryProgress subtotal={subtotal} />

          <ul className="mt-6 divide-y divide-sand border-y border-sand">
            {lines.map((line) => (
              <li
                key={line.variant.id}
                className="grid grid-cols-[84px_1fr] gap-4 py-5 sm:grid-cols-[104px_1fr] sm:gap-6"
              >
                <Link
                  to={`/products/${line.product.slug}`}
                  tabIndex={-1}
                  aria-hidden
                  className="block aspect-square overflow-hidden rounded-[10px] bg-sand"
                >
                  <ImageSlot
                    src={line.product.image_url}
                    alt=""
                    size="compact"
                    className="bg-sand"
                  />
                </Link>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                    <div className="min-w-0">
                      <h2 className="font-display text-[18px] leading-snug font-semibold sm:text-[20px]">
                        <Link
                          to={`/products/${line.product.slug}`}
                          className="rounded-sm underline-offset-4 hover:underline"
                        >
                          {line.product.name}
                        </Link>
                      </h2>
                      <p className="mt-0.5 text-[15px] text-deep/75">
                        {line.variant.label} ·{" "}
                        <span className="tabular-nums">{formatPrice(line.variant.price)}</span> each
                      </p>
                    </div>
                    <p
                      className={cn(
                        "text-[17px] font-bold tabular-nums",
                        line.soldOut && "text-deep/50 line-through",
                      )}
                    >
                      {formatPrice(line.lineTotal)}
                    </p>
                  </div>
                  {line.soldOut && (
                    <p role="alert" className="mt-2 text-[14px] font-medium text-clay">
                      This size is sold out right now. Remove it to continue.
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <QuantityStepper
                      value={line.qty}
                      onChange={(q) => setCartQty(line.product.id, line.variant.id, q)}
                      label={`Quantity of ${line.product.name}, ${line.variant.label}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeFromCart(line.product.id, line.variant.id)}
                      className="inline-flex h-11 items-center gap-1.5 rounded-full px-3 text-[15px] font-medium text-deep/80 hover:bg-sand/70 hover:text-deep"
                    >
                      <Trash2 aria-hidden size={18} />
                      Remove
                      <span className="sr-only">
                        {line.product.name}, {line.variant.label}
                      </span>
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[14px] text-deep/70">
            You can buy up to 10 of each size in one order.
          </p>
        </div>

        <aside
          aria-labelledby="summary-heading"
          className="rounded-card border border-sand bg-sand/40 p-5 sm:p-6 lg:sticky lg:top-32"
        >
          <h2 id="summary-heading" className="text-[24px]">
            Order summary
          </h2>
          <dl className="mt-4 space-y-2 text-[16px]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="font-semibold tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-deep/75">
              <dt>Delivery</dt>
              <dd>{subtotal >= FREE_DELIVERY_ABOVE ? "Free" : "Shown at checkout"}</dd>
            </div>
          </dl>
          <button
            type="button"
            disabled={hasSoldOut}
            onClick={() => requireAuth(() => navigate("/checkout"))}
            className={buttonStyles.forest("mt-6 h-12 w-full text-[16px]")}
          >
            Proceed to checkout
          </button>
          <Link
            to="/products"
            className="mt-4 block text-center text-[15px] font-semibold text-forest underline underline-offset-4"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
