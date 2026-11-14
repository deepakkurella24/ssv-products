"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, Plus, Truck } from "lucide-react";
import { AddressForm } from "@/components/AddressForm";
import { Breadcrumb } from "@/components/Breadcrumb";
import { useCartDetails } from "@/lib/cart";
import { buttonStyles } from "@/lib/ui";
import { cn, formatPrice } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useAuth } from "@/components/providers/AuthProvider";
import { getAddresses, addAddress, createOrder } from "@/lib/api/user";

const card = "rounded-card border border-sand p-5 sm:p-6";

export function CheckoutScreen() {
  const { user, openSignIn, resetCart } = useStore();
  const { firebaseUser } = useAuth();
  const { lines, subtotal, hasSoldOut } = useCartDetails();
  const router = useRouter();

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState(undefined);
  const [adding, setAdding] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const addressRef = useRef(null);

  useEffect(() => {
    if (user && firebaseUser) {
      firebaseUser
        .getIdToken()
        .then((token) => getAddresses(token))
        .then((data) => {
          const list = Array.isArray(data) ? data : [];
          setAddresses(list);
          if (list.length === 0) setAdding(true);
        })
        .catch(() => setAddresses([]));
    }
  }, [user, firebaseUser]);

  const saveAddress = async (value) => {
    try {
      const token = await firebaseUser?.getIdToken();
      const saved = await addAddress(value, token);
      setAddresses((prev) => [...prev, saved || value]);
      setSelectedId(saved?.id || value?.id);
      setAdding(false);
    } catch (e) {
      setError(e.message || "Failed to save address");
    }
  };

  const selected =
    addresses.find((a) => a.id === selectedId) ??
    addresses.find((a) => a.is_default) ??
    addresses[0];

  const crumbs = [
    { label: "Home", to: "/" },
    { label: "Cart", to: "/cart" },
    { label: "Checkout" },
  ];

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
        <Link href="/products" className={buttonStyles.forest("h-12 px-6 text-[16px]")}>
          Browse products
        </Link>
      </Gate>
    );
  }

  const place = async () => {
    if (placing) return;
    if (hasSoldOut) {
      setError("Remove the sold-out item from your cart to continue.");
      return;
    }
    if (!selected) {
      setError("Choose or add a delivery address.");
      addressRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setError("");
    setPlacing(true);
    try {
      const token = await firebaseUser?.getIdToken();
      const orderPayload = {
        address_id: selected.id,
        payment_method: "cod",
      };
      if (couponCode.trim()) {
        orderPayload.coupon_code = couponCode.trim();
      }
      const order = await createOrder(orderPayload, token);
      resetCart?.();
      router.replace(`/order-confirmation/${order?.id || "latest"}`);
    } catch (e) {
      setError(e.message || "Failed to place order. Please try again.");
      setPlacing(false);
    }
  };

  return (
    <div className="shell pt-6 pb-20 lg:pt-8 lg:pb-28">
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
                  onSubmit={async (value) => {
                    await saveAddress(value);
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
                <p className="font-semibold">Standard delivery · Free (Included in price)</p>
                <p className="mt-1 text-deep/80">
                  Delivered directly from the farm to your doorstep.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="payment-heading" className={card}>
            <h2 id="payment-heading" className="text-[24px]">
              <span className="mr-2 text-clay">3.</span>Payment method
            </h2>
            <div className="mt-4">
              <div className="flex gap-3 rounded-[10px] border border-forest bg-sand/50 p-4">
                <input
                  type="radio"
                  name="payment"
                  checked
                  readOnly
                  className="mt-1 size-4 shrink-0 accent-forest"
                />
                <span className="text-[15px]">
                  <span className="block font-semibold">Cash on delivery</span>
                  <span className="block text-deep/80">
                    Pay in cash when your order arrives. The admin or delivery agent records payment upon delivery.
                  </span>
                </span>
              </div>
            </div>
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
          <div className="mt-4 border-t border-deep/15 pt-3">
            <label htmlFor="checkout-coupon" className="block text-[13px] font-semibold text-deep/80">
              Coupon code
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="checkout-coupon"
                type="text"
                placeholder="e.g. WELCOME10"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="h-9 flex-1 rounded-[8px] border border-deep/30 bg-cream px-3 font-mono text-[14px] uppercase placeholder:text-deep/40 focus:border-forest focus:outline-none"
              />
            </div>
          </div>
          <dl className="mt-3 space-y-2 border-t border-deep/20 pt-4 text-[16px]">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd className="font-semibold text-forest">Included</dd>
            </div>
            <div className="flex justify-between border-t border-deep/20 pt-3 text-[19px] font-bold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
            </div>
          </dl>
          <p className="mt-3 flex items-center gap-2 text-[14px] text-deep/80">
            <MapPin aria-hidden size={16} className="shrink-0 text-forest" />
            Direct farm delivery to your address
          </p>
          {error && (
            <p role="alert" className="mt-4 text-[15px] font-medium text-clay">
              {error}
            </p>
          )}
          <button type="button" onClick={place} className={buttonStyles.marigold("mt-5 w-full")}>
            Place order · {formatPrice(subtotal)}
          </button>
          <p className="mt-3 text-center text-[13px] text-deep/70">
            You pay {formatPrice(subtotal)} in cash on delivery.
          </p>
        </aside>
      </div>
    </div>
  );
}

function Gate({ crumbs, title, text, children }) {
  return (
    <div className="shell pt-6 pb-20 lg:pt-8 lg:pb-28">
      <Breadcrumb items={crumbs} />
      <h1 className="mt-8 text-[34px] lg:text-[42px]">{title}</h1>
      <p className="mt-3 max-w-[480px] text-[17px] text-deep/80">{text}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export default CheckoutScreen;
