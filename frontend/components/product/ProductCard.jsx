"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ShoppingCart, Star } from "lucide-react";
import { availableVariants, lowestVariant, productMeta } from "@/lib/adapters";
import { calculateRatingSummary } from "@/lib/reviews";
import { useStore } from "@/lib/store";
import { cn, formatPrice } from "@/lib/utils";
import { ImageSlot } from "@/components/ImageSlot";

export function ProductCard({ product }) {
  const { requireAuth, addToCart } = useStore();
  const available = availableVariants(product);
  const soldOut = available.length === 0;
  const lowest = lowestVariant(product);
  const summary = calculateRatingSummary(product.reviews || []);

  const [selectedId, setSelectedId] = useState(lowest.id);
  const [chosen, setChosen] = useState(false);
  const [added, setAdded] = useState(false);
  const timer = useRef(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const selected = product.variants?.find((v) => v.id === selectedId) ?? lowest;
  const showFrom = !chosen && available.length > 1;
  const price = showFrom ? lowest.price : selected.price;
  const variantBadge = !showFrom && !soldOut ? selected.badge : null;
  const href = `/products/${product.slug}`;

  const add = () => {
    addToCart(product.id, selected.id);
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 1500);
  };

  return (
    <article className="group/card flex h-full flex-col overflow-hidden rounded-card border border-sand bg-cream transition-shadow duration-300 hover:shadow-warm">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className="relative block aspect-square overflow-hidden bg-sand"
      >
        <ImageSlot
          src={product.image_url}
          alt=""
          className="transition-transform duration-500 group-hover/card:scale-[1.03]"
          captionClassName="inset-x-3 bottom-3 sm:inset-x-4 sm:bottom-4"
        />
        {product.badge && (
          <span className="absolute top-3 left-3 rounded-full bg-marigold px-2.5 py-0.5 text-[12px] font-semibold text-deep">
            {product.badge}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <h3 className="text-[16px] leading-snug sm:text-[18px]">
          <Link href={href} className="rounded-sm decoration-1 underline-offset-4 hover:underline">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 text-[13px] text-deep/70 sm:text-[14px]">{productMeta(product)}</p>

        {summary.count > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-deep/80">
            <span className="flex items-center gap-0.5 text-deep">
              <Star size={13} strokeWidth={1.75} className="fill-marigold text-marigold" />
              <span className="font-bold tabular-nums">{summary.average.toFixed(1)}</span>
            </span>
            <span className="text-deep/55 tabular-nums">({summary.count})</span>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className={cn("text-[17px] font-bold tabular-nums", soldOut && "text-deep/60")}>
            {showFrom && <span className="font-medium">From </span>}
            {formatPrice(price)}
          </p>
          {variantBadge && (
            <span className="rounded-full bg-marigold/30 px-2 py-0.5 text-[12px] font-semibold text-deep">
              {variantBadge}
            </span>
          )}
        </div>

        <div
          role="radiogroup"
          aria-label={`Size for ${product.name}`}
          className="mt-3 flex flex-wrap gap-1.5"
        >
          {product.variants?.map((variant) => {
            const isSoldOut = !product.available || !variant.available;
            const isSelected = !soldOut && variant.id === selected.id;
            return (
              <button
                key={variant.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={
                  isSoldOut
                    ? `${variant.label}, sold out`
                    : `${variant.label}, ${formatPrice(variant.price)}`
                }
                disabled={isSoldOut}
                onClick={() => {
                  setSelectedId(variant.id);
                  setChosen(true);
                }}
                className={cn(
                  "h-8 rounded-full border px-3 text-[13px] font-medium tabular-nums transition-colors sm:text-[14px]",
                  isSoldOut
                    ? "cursor-not-allowed border-sand text-deep/45 line-through"
                    : isSelected
                      ? "border-forest bg-forest text-cream"
                      : "border-sand text-deep hover:border-forest",
                )}
              >
                {variant.label}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pt-4">
          <button
            type="button"
            disabled={soldOut}
            onClick={() => requireAuth(add)}
            className={cn(
              "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-colors duration-200",
              soldOut
                ? "cursor-not-allowed bg-sand text-deep/65"
                : added
                  ? "bg-leaf text-deep"
                  : "bg-forest text-cream hover:bg-forest-dark",
            )}
          >
            {soldOut ? (
              "Sold out"
            ) : added ? (
              <>
                <Check aria-hidden size={18} strokeWidth={1.75} /> Added
              </>
            ) : (
              <>
                <ShoppingCart aria-hidden size={18} strokeWidth={1.75} /> Add to cart
              </>
            )}
          </button>
          <span className="sr-only" aria-live="polite">
            {added ? `${product.name}, ${selected.label}, added to cart` : ""}
          </span>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col overflow-hidden rounded-card border border-sand bg-cream"
    >
      <div className="aspect-square animate-pulse bg-sand" />
      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="h-5 w-4/5 animate-pulse rounded-full bg-sand" />
        <div className="h-3.5 w-3/5 animate-pulse rounded-full bg-sand" />
        <div className="h-5 w-2/5 animate-pulse rounded-full bg-sand" />
        <div className="flex gap-1.5">
          <div className="h-8 w-16 animate-pulse rounded-full bg-sand" />
          <div className="h-8 w-12 animate-pulse rounded-full bg-sand" />
        </div>
        <div className="mt-auto h-11 animate-pulse rounded-full bg-sand" />
      </div>
    </div>
  );
}

export default ProductCard;
