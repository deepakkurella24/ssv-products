import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { MapPin, Plus, Truck } from "lucide-react";
import { AddressForm } from "@/components/AddressForm";
import { Breadcrumb } from "@/components/Breadcrumb";
import { FREE_DELIVERY_ABOVE } from "@/data/site";
import type { Address, PaymentMethod } from "@/data/types";
import { useCartDetails } from "@/lib/cart";
import { deliveryQuote, EXPECTED_DELIVERY_DAYS, expectedDeliveryDate } from "@/lib/delivery";
import { buttonStyles } from "@/lib/ui";
import { cn, formatPrice } from "@/lib/utils";
import { useStore } from "@/store/StoreProvider";

const card = "rounded-card border border-sand p-5 sm:p-6";

export default function CheckoutPage() {
  const { user, addresses, saveAddress, placeOrder, openSignIn } = useStore();
  const { lines, subtotal, hasSoldOut } = useCartDetails();
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [adding, setAdding] = useState(addresses.length === 0);
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [error, setError] = useState("");
  const [placed, setPlaced] = useState(false);
  const addressRef = useRef<HTMLElement>(null);

  const selected: Address | undefined =
    addresses.find((a) => a.id === selectedId) ??
    addresses.find((a) => a.is_default) ??
    addresses[0];
  const quote = deliveryQuote(selected?.pincode, subtotal);
  const total = subtotal + quote.fee;

  const crumbs = [
    { label: "Home", to: "/" },
    { label: "Cart", to: "/cart" },
    { label: "Checkout" },
  ];

  if (placed) return null;

  if (!user) {
    return (
      <Gate
        crumbs={crumbs}
        title="Sign in to check out"
        text="Sign in to choose a delivery address and place your order."
      >
        <button
          type="button"
          onClick={() => openSignIn()}
          className={buttonStyles.forest("h-12 px-6 text-[16px]")}
        >
          Sign in
        </button>
      </Gate>
    );
  }

  if (lines.length === 0) {
    return (
      <Gate
        crumbs={crumbs}
        title="Your cart is empty"
        text="Add something to your cart before checking out."
      >
        <Link to="/products" className={buttonStyles.forest("h-12 px-6 text-[16px]")}>
          Browse products
        </Link>
      </Gate>
    );
  }

  const place = () => {
    if (hasSoldOut) {
      setError("Remove the sold-out item from your cart to continue.");
      return;
    }
    if (!selected) {
      setError("Choose or add a delivery address.");
      addressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setPlaced(true);
    const order = placeOrder({
      items: lines.map((l) => ({
        product_id: l.product.id,
        name: l.product.name,
        variant_label: l.variant.label,
        price: l.variant.price,
        qty: l.qty,
      })),
      subtotal,
      delivery_fee: quote.fee,
      total,
      payment_method: payment,
      // Online payment is simulated in this preview, so it is marked paid straight away.
      amount_paid: payment === "online" ? total : 0,
      address: selected,
      expected_delivery: expectedDeliveryDate(),
    });
    navigate(`/order-confirmation/${order.id}`, { replace: true });
  };

  return (
    <div className="shell pt-6 pb-20 lg:pt-8 lg:pb-28">
      <title>Checkout · SSV</title>
      <Breadcrumb items={crumbs} />
      <h1 className="mt-6 text-[34px] lg:mt-8 lg:text-[44px]">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px] lg:items-start lg:gap-12">
        <div className="space-y-6">
          <section ref={addressRef} aria-labelledby="address-heading" className={card}>
            <h2 id="address-heading" className="text-[24px]">
              <span className="mr-2 text-clay">1.</span>Delivery address
            </h2>

            {addresses.length > 0 && (
              <div
                role="radiogroup"
                aria-labelledby="address-heading"
                className="mt-4 grid gap-3 sm:grid-cols-2"
              >
                {addresses.map((a) => {
                  const active = a.id === selected?.id;
                  return (
                    <label
                      key={a.id}
                      className={cn(
                        "relative flex cursor-pointer gap-3 rounded-[10px] border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest",
                        active ? "border-forest bg-sand/50" : "border-deep/30 hover:border-deep/60",
                      )}
                    >
                      <input
                        type="radio"
                        name="address"
                        checked={active}
                        onChange={() => {
                          setSelectedId(a.id);
                          setError("");
                        }}
                        className="mt-1 size-4 shrink-0 accent-forest"
                      />
                      <span className="min-w-0 text-[15px]">
                        <span className="flex flex-wrap items-center gap-2 font-semibold">
                          {a.name}
                          {a.is_default && (
                            <span className="rounded-full bg-marigold px-2 py-0.5 text-[11px] font-semibold">
                              Default
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-deep/85">
                          {a.door_no}, {a.street}
                          <br />
                          {a.city}, {a.state} {a.pincode}
                        </span>
                        <span className="mt-1 block tabular-nums text-deep/75">+91 {a.phone}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            )}

            {adding ? (
              <div className="mt-5 border-t border-sand pt-5">
                <h3 className="mb-4 font-display text-[19px] font-semibold">
                  {addresses.length > 0 ? "Add a new address" : "Where should we deliver?"}
                </h3>
                <AddressForm
                  submitLabel="Save and use this address"
                  onSubmit={(value) => {
                    const saved = saveAddress(value);
                    setSelectedId(saved.id);
                    setAdding(false);
                    setError("");
                  }}
                  onCancel={addresses.length > 0 ? () => setAdding(false) : undefined}
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAdding(true)}
                className={buttonStyles.outline("mt-4 h-11 px-5 text-[15px]")}
              >
                <Plus aria-hidden size={18} /> Add a new address
              </button>
            )}
          </section>

          <section aria-labelledby="delivery-heading" className={card}>
            <h2 id="delivery-heading" className="text-[24px]">
              <span className="mr-2 text-clay">2.</span>Delivery
            </h2>
            <div className="mt-4 flex items-start gap-3 rounded-[10px] bg-sand/50 p-4 text-[15px]">
              <Truck aria-hidden size={22} className="mt-0.5 shrink-0 text-forest" />
              <div>
                {selected ? (
                  <p className="font-semibold">
                    {quote.zone} ·{" "}
                    {quote.free ? (
                      <span>Free</span>
                    ) : (
                      <span className="tabular-nums">Delivery fee {formatPrice(quote.fee)}</span>
                    )}
                  </p>
                ) : (
                  <p className="font-semibold">Choose an address to see the delivery fee</p>
                )}
                <p className="mt-1 text-deep/80">
                  Expected delivery in {EXPECTED_DELIVERY_DAYS} days.
                </p>
                {!quote.free && (
                  <p className="mt-1 text-deep/70">
                    Delivery is free on orders above {formatPrice(FREE_DELIVERY_ABOVE)}.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section aria-labelledby="payment-heading" className={card}>
            <h2 id="payment-heading" className="text-[24px]">
              <span className="mr-2 text-clay">3.</span>Payment method
            </h2>
            <div
              role="radiogroup"
              aria-labelledby="payment-heading"
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              {(
                [
                  {
                    value: "cod",
                    label: "Cash on delivery",
                    text: "Pay in cash when your order arrives.",
                  },
                  {
                    value: "online",
                    label: "Online payment",
                    text: "Pay now, before your order is packed.",
                  },
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-[10px] border p-4 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-forest",
                    payment === option.value
                      ? "border-forest bg-sand/50"
                      : "border-deep/30 hover:border-deep/60",
                  )}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={payment === option.value}
                    onChange={() => setPayment(option.value)}
                    className="mt-1 size-4 shrink-0 accent-forest"
                  />
                  <span className="text-[15px]">
                    <span className="block font-semibold">{option.label}</span>
                    <span className="block text-deep/80">{option.text}</span>
                  </span>
                </label>
              ))}
            </div>
            {payment === "online" && (
              <p className="mt-3 text-[14px] text-deep/70">
                Online payment is simulated in this preview.
              </p>
            )}
          </section>
        </div>

        <aside
          aria-labelledby="summary-heading"
          className="rounded-card border border-sand bg-sand/40 p-5 sm:p-6 lg:sticky lg:top-32"
        >
          <h2 id="summary-heading" className="text-[24px]">
            Order summary
          </h2>
          <ul className="mt-4 divide-y divide-sand/80 text-[15px]">
            {lines.map((l) => (
              <li key={l.variant.id} className="flex justify-between gap-4 py-2.5">
                <span className="min-w-0">
                  <span className="block font-semibold">{l.product.name}</span>
                  <span className="text-deep/75">
                    {l.variant.label} × {l.qty}
                  </span>
                </span>
                <span className="font-semibold tabular-nums">{formatPrice(l.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-2 border-t border-deep/20 pt-4 text-[16px]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery{selected ? ` (${quote.zone})` : ""}</dt>
              <dd className="tabular-nums">
                {!selected ? "–" : quote.free ? "Free" : formatPrice(quote.fee)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-deep/20 pt-3 text-[19px] font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(total)}</dd>
            </div>
          </dl>
          <p className="mt-3 flex items-center gap-2 text-[14px] text-deep/80">
            <MapPin aria-hidden size={16} className="shrink-0 text-forest" />
            Expected delivery in {EXPECTED_DELIVERY_DAYS} days
          </p>
          {error && (
            <p role="alert" className="mt-4 text-[15px] font-medium text-clay">
              {error}
            </p>
          )}
          <button type="button" onClick={place} className={buttonStyles.marigold("mt-5 w-full")}>
            Place order · {formatPrice(total)}
          </button>
          <p className="mt-3 text-center text-[13px] text-deep/70">
            {payment === "cod"
              ? `You pay ${formatPrice(total)} in cash on delivery.`
              : "You pay online now."}
          </p>
        </aside>
      </div>
    </div>
  );
}

function Gate({
  crumbs,
  title,
  text,
  children,
}: {
  crumbs: { label: string; to?: string }[];
  title: string;
  text: string;
  children: React.ReactNode;
}) {
  return (
    <div className="shell pt-6 pb-20 lg:pt-8 lg:pb-28">
      <title>{`${title} · SSV`}</title>
      <Breadcrumb items={crumbs} />
      <h1 className="mt-8 text-[34px] lg:text-[42px]">{title}</h1>
      <p className="mt-3 max-w-[480px] text-[17px] text-deep/80">{text}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}
