import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowRight, Check, Clock, ShoppingCart, Star } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ImageSlot } from "@/components/ImageSlot";
import { ProductGrid } from "@/components/ProductGrid";
import { QuantityStepper } from "@/components/QuantityStepper";
import { ReviewDialog } from "@/components/ReviewDialog";
import { SpiceLevel } from "@/components/SpiceLevel";
import { StarRating } from "@/components/StarRating";
import { categoryHref, findCategory } from "@/data/categories";
import { availableVariants, isSoldOut, lowestVariant, PRODUCTS } from "@/data/products";
import { calculateRatingSummary } from "@/data/reviews";
import type { Product } from "@/data/types";
import { formatDate } from "@/lib/delivery";
import { useProducts } from "@/lib/hooks";
import { buttonStyles } from "@/lib/ui";
import { cn, formatPrice } from "@/lib/utils";
import { useStore } from "@/store/StoreProvider";
import NotFoundPage from "./NotFoundPage";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const product = PRODUCTS.find((p) => p.slug === slug);
  if (!product) return <NotFoundPage />;
  // Keyed so every product starts with its own variant, quantity and gallery state.
  return <ProductDetail key={product.id} product={product} />;
}

function ProductDetail({ product }: { product: Product }) {
  const { requireAuth, addToCart, getReviewsForProduct, orders } = useStore();
  const { products, loading } = useProducts();
  const category = findCategory(product.category_id);
  const soldOut = isSoldOut(product);
  const reviews = getReviewsForProduct(product.id);
  const summary = calculateRatingSummary(reviews);

  const [photo, setPhoto] = useState(0);
  const [variantId, setVariantId] = useState(lowestVariant(product).id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const variant = product.variants.find((v) => v.id === variantId) ?? lowestVariant(product);
  const hasChoice = availableVariants(product).length > 0;

  // Check if current user has a delivered order containing this product
  const deliveredOrderForProduct = orders.find(
    (o) => o.status === "delivered" && o.items.some((it) => it.product_id === product.id),
  );

  const filteredReviews = selectedStarFilter
    ? reviews.filter((r) => r.rating === selectedStarFilter)
    : reviews;
  const sortedReviews = [...filteredReviews].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  );

  const related = useMemo(() => {
    const same = products.filter(
      (p) => p.id !== product.id && p.category_id === product.category_id,
    );
    const others = products.filter(
      (p) => p.id !== product.id && p.category_id !== product.category_id,
    );
    return [...same, ...others].slice(0, 4);
  }, [products, product]);

  const add = () => {
    addToCart(product.id, variant.id, qty);
    setAdded(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setAdded(false), 2500);
  };

  return (
    <div className="shell pt-6 pb-20 lg:pt-8 lg:pb-28">
      <title>{`${product.name} · SSV`}</title>
      <Breadcrumb
        items={[
          { label: "Home", to: "/" },
          { label: "Products", to: "/products" },
          ...(category ? [{ label: category.name, to: categoryHref(category.slug) }] : []),
          { label: product.name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:mt-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
        {/* Gallery */}
        <div>
          <div className="relative aspect-square overflow-hidden rounded-card border border-sand bg-sand">
            <ImageSlot
              src={product.gallery[photo]}
              alt={`${product.name}, photo ${photo + 1} of ${product.gallery.length}`}
              className="bg-sand"
              loading="eager"
            />
            {product.badge && (
              <span className="absolute top-4 left-4 rounded-full bg-marigold px-3 py-1 text-[13px] font-semibold text-deep">
                {product.badge}
              </span>
            )}
          </div>
          <ul className="mt-3 grid grid-cols-3 gap-3" aria-label="Product photos">
            {product.gallery.map((src, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setPhoto(i)}
                  aria-label={`Show photo ${i + 1}`}
                  aria-pressed={i === photo}
                  className={cn(
                    "block aspect-square w-full overflow-hidden rounded-[10px] border-2 transition-colors",
                    i === photo ? "border-forest" : "border-transparent hover:border-deep/30",
                  )}
                >
                  <ImageSlot src={src} alt="" size="compact" className="bg-sand" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Buy box */}
        <div className="lg:pt-2">
          <h1 className="text-[34px] sm:text-[40px] lg:text-[44px]">{product.name}</h1>

          {/* Ratings & reviews quick summary in buy box */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[15px]">
            <StarRating rating={summary.average} size={16} />
            <span className="font-bold tabular-nums text-deep">
              {summary.average > 0 ? summary.average.toFixed(1) : "New"}
            </span>
            <a
              href="#reviews"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-deep/75 underline underline-offset-4 hover:text-forest"
            >
              ({summary.count} {summary.count === 1 ? "review" : "reviews"})
            </a>
            {/* <span className="text-deep/30">·</span>
            <button
              type="button"
              onClick={() => requireAuth(() => setReviewDialogOpen(true))}
              className="font-semibold text-forest underline underline-offset-4 hover:text-forest-dark"
            >
              Write a review
            </button> */}
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className={cn("text-[28px] font-bold tabular-nums", soldOut && "text-deep/60")}>
              {formatPrice(variant.price)}
            </p>
            {!soldOut && variant.badge && (
              <span className="rounded-full bg-marigold/30 px-2.5 py-0.5 text-[13px] font-semibold">
                {variant.badge}
              </span>
            )}
          </div>

          <p className="mt-4 max-w-[560px] text-[17px] text-deep/90">{product.description}</p>

          <dl className="mt-6 grid max-w-[560px] gap-x-8 gap-y-3 border-y border-sand py-5 text-[15px] sm:grid-cols-2">
            <div>
              <dt className="text-deep/70">Shelf life</dt>
              <dd className="mt-0.5 flex items-center gap-2 font-semibold">
                <Clock aria-hidden size={18} className="text-forest" />
                {product.shelf_life_months} months
              </dd>
            </div>
            {product.spice_level && (
              <div>
                <dt className="text-deep/70">Spice level</dt>
                <dd className="mt-0.5 font-semibold">
                  <SpiceLevel level={product.spice_level} />
                </dd>
              </div>
            )}
          </dl>

          <fieldset className="mt-6">
            <legend className="text-[15px] font-semibold">Size</legend>
            <div
              role="radiogroup"
              aria-label={`Size for ${product.name}`}
              className="mt-2.5 flex flex-wrap gap-2.5"
            >
              {product.variants.map((v) => {
                const out = !product.available || !v.available;
                const selected = !soldOut && v.id === variant.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={out}
                    aria-label={
                      out ? `${v.label}, sold out` : `${v.label}, ${formatPrice(v.price)}`
                    }
                    onClick={() => setVariantId(v.id)}
                    className={cn(
                      "relative flex min-w-28 flex-col items-start rounded-[10px] border px-4 py-2.5 text-left transition-colors",
                      out
                        ? "cursor-not-allowed border-sand text-deep/45"
                        : selected
                          ? "border-forest bg-forest text-cream"
                          : "border-deep/40 hover:border-forest",
                    )}
                  >
                    <span className={cn("font-semibold", out && "line-through")}>{v.label}</span>
                    <span
                      className={cn(
                        "text-[14px] tabular-nums",
                        selected ? "text-cream/85" : "text-deep/70",
                      )}
                    >
                      {out ? "Sold out" : formatPrice(v.price)}
                    </span>
                    {!out && v.badge && (
                      <span className="absolute -top-2.5 right-3 rounded-full bg-marigold px-2 py-0.5 text-[11px] font-semibold text-deep">
                        {v.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <QuantityStepper value={qty} onChange={setQty} label={`Quantity of ${product.name}`} />
            <button
              type="button"
              disabled={soldOut || !hasChoice}
              onClick={() => requireAuth(add)}
              className={cn(
                "inline-flex h-12 min-w-[200px] flex-1 items-center justify-center gap-2 rounded-full px-6 text-[16px] font-semibold transition-colors sm:flex-none",
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
                  <Check aria-hidden size={18} /> Added to cart
                </>
              ) : (
                <>
                  <ShoppingCart aria-hidden size={18} /> Add to cart
                </>
              )}
            </button>
          </div>
          <p className="mt-2 text-[14px] text-deep/70">
            You can buy up to 10 of each size in one order.
          </p>
          <p className="sr-only" aria-live="polite">
            {added ? `${qty} × ${product.name}, ${variant.label}, added to cart` : ""}
          </p>
          {added && (
            <Link
              to="/cart"
              className="mt-3 inline-flex items-center gap-1.5 font-semibold text-forest underline underline-offset-4"
            >
              View cart <ArrowRight aria-hidden size={16} />
            </Link>
          )}

          <p className="mt-6 text-[15px]">
            <Link
              to="/custom-order"
              className="text-deep/80 underline underline-offset-4 hover:text-forest"
            >
              Need a bulk or custom order?
            </Link>
          </p>
        </div>
      </div>

      {/* Story + ingredients */}
      <div className="mt-16 grid gap-6 lg:mt-24 lg:grid-cols-[1.4fr_1fr] lg:gap-10">
        <section
          aria-labelledby="story-heading"
          className="rounded-card bg-sand/60 p-6 sm:p-8 lg:p-10"
        >
          <h2 id="story-heading" className="text-[28px] lg:text-[32px]">
            Our story
          </h2>
          <p className="mt-3 max-w-[560px] text-[17px] text-deep/90">{product.story}</p>
        </section>
        <section
          aria-labelledby="ingredients-heading"
          className="rounded-card border border-sand p-6 sm:p-8 lg:p-10"
        >
          <h2 id="ingredients-heading" className="text-[28px] lg:text-[32px]">
            Ingredients
          </h2>
          <ul className="mt-3 space-y-2 text-[17px]">
            {product.ingredients.map((item) => (
              <li key={item} className="flex gap-3">
                <Check aria-hidden size={20} className="mt-1 shrink-0 text-forest" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Customer Ratings & Reviews */}
      <section
        id="reviews"
        aria-labelledby="reviews-heading"
        className="mt-16 border-t border-sand pt-12 lg:mt-24 lg:pt-16"
      >
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="reviews-heading" className="text-[28px] sm:text-[34px]">
              Customer ratings & reviews
            </h2>
            <p className="mt-1 text-deep/75">
              Real feedback from verified families who use SSV products at home.
            </p>
          </div>
          {/* <button
            type="button"
            onClick={() => requireAuth(() => setReviewDialogOpen(true))}
            className={buttonStyles.forest("h-11 px-5 text-[15px]")}
          >
            <Star size={16} className="fill-marigold text-marigold" />
            Write a review
          </button> */}
        </div>

        {/* If user ordered this product in a delivered order */}
        {deliveredOrderForProduct && (
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-card border border-forest/30 bg-leaf/10 p-4 sm:p-5 text-deep">
            <div className="flex items-start gap-3">
              <Check aria-hidden size={22} className="mt-0.5 shrink-0 text-forest" />
              <div>
                <p className="text-[16px] font-semibold">
                  You ordered this item (Order {deliveredOrderForProduct.id})
                </p>
                <p className="mt-0.5 text-[14px] text-deep/80">
                  Delivered on {formatDate(deliveredOrderForProduct.expected_delivery)}. Your review
                  will show the verified purchase badge.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => requireAuth(() => setReviewDialogOpen(true))}
              className={buttonStyles.outline(
                "h-10 px-4 text-[14px] shrink-0 border-forest text-forest hover:bg-forest hover:text-cream",
              )}
            >
              Review your order
            </button>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-14">
          {/* Summary card */}
          <div className="self-start rounded-card border border-sand bg-sand/40 p-6">
            <h3 className="text-[18px] font-semibold text-deep">Rating overview</h3>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="font-display text-[52px] font-bold leading-none tabular-nums text-deep">
                {summary.average > 0 ? summary.average.toFixed(1) : "–"}
              </span>
              <div>
                <StarRating rating={summary.average} size={20} />
                <p className="mt-1 text-[13px] tabular-nums text-deep/70">
                  Based on {summary.count} {summary.count === 1 ? "review" : "reviews"}
                </p>
              </div>
            </div>

            {/* 5-to-1 Star breakdown bars */}
            <div
              className="mt-6 space-y-2 border-t border-sand pt-5"
              role="list"
              aria-label="Rating breakdown"
            >
              {([5, 4, 3, 2, 1] as const).map((stars) => {
                const count = summary.distribution[stars];
                const pct = summary.percentages[stars];
                const isSelected = selectedStarFilter === stars;
                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setSelectedStarFilter(isSelected ? null : stars)}
                    className={cn(
                      "-mx-1.5 flex w-full items-center gap-3 rounded-md px-1.5 py-1 text-left text-[14px] transition-colors hover:bg-sand/70",
                      isSelected && "bg-sand font-semibold ring-1 ring-forest/30",
                    )}
                    aria-label={`Filter by ${stars} stars: ${count} reviews`}
                  >
                    <span className="w-12 shrink-0 tabular-nums text-deep/80">{stars} stars</span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-sand-dark/40">
                      <div
                        className="h-full rounded-full bg-forest transition-[width] duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right text-[13px] tabular-nums text-deep/70">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedStarFilter && (
              <div className="mt-4 flex items-center justify-between border-t border-sand pt-3 text-[13px]">
                <span className="font-medium text-deep/80">
                  Filtering by {selectedStarFilter} stars
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedStarFilter(null)}
                  className="font-semibold text-forest underline underline-offset-4 hover:text-forest-dark"
                >
                  Clear filter
                </button>
              </div>
            )}
          </div>

          {/* Reviews list */}
          <div>
            {/* Star filter chips */}
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedStarFilter(null)}
                className={cn(
                  "h-9 rounded-full px-4 text-[14px] font-medium transition-colors",
                  selectedStarFilter === null
                    ? "bg-forest text-cream"
                    : "border border-sand bg-cream text-deep hover:bg-sand/60",
                )}
              >
                All reviews ({summary.count})
              </button>
              {([5, 4, 3, 2, 1] as const).map((stars) => {
                const count = summary.distribution[stars];
                if (count === 0 && selectedStarFilter !== stars) return null;
                return (
                  <button
                    key={stars}
                    type="button"
                    onClick={() =>
                      setSelectedStarFilter(selectedStarFilter === stars ? null : stars)
                    }
                    className={cn(
                      "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-medium transition-colors",
                      selectedStarFilter === stars
                        ? "bg-forest text-cream"
                        : "border border-sand bg-cream text-deep hover:bg-sand/60",
                    )}
                  >
                    <span>{stars} ★</span>
                    <span className="text-[12px] opacity-80 tabular-nums">({count})</span>
                  </button>
                );
              })}
            </div>

            {sortedReviews.length === 0 ? (
              <div className="rounded-card border border-sand bg-sand/30 p-8 text-center">
                <p className="font-display text-[20px] font-semibold text-deep">
                  {selectedStarFilter
                    ? `No ${selectedStarFilter}-star reviews yet`
                    : "No reviews yet"}
                </p>
                <p className="mx-auto mt-2 max-w-[420px] text-[15px] text-deep/80">
                  {selectedStarFilter
                    ? "Try viewing all reviews to see what other customers think."
                    : "Be the first to share your experience with this natural product."}
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  {selectedStarFilter ? (
                    <button
                      type="button"
                      onClick={() => setSelectedStarFilter(null)}
                      className={buttonStyles.forest("h-11 px-5 text-[15px]")}
                    >
                      View all reviews
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => requireAuth(() => setReviewDialogOpen(true))}
                      className={buttonStyles.forest("h-11 px-5 text-[15px]")}
                    >
                      Write the first review
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <ul className="space-y-4">
                {sortedReviews.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-card border border-sand bg-cream p-5 transition-shadow hover:shadow-xs sm:p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[16px] font-semibold text-deep">{r.user_name}</span>
                        {r.verified_buyer && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-leaf/15 px-2.5 py-0.5 text-[12px] font-semibold text-deep">
                            <Check size={12} className="text-forest" /> Verified buyer
                          </span>
                        )}
                      </div>
                      <span className="text-[13px] tabular-nums text-deep/60">
                        {formatDate(r.created_at)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-center gap-2.5">
                      <StarRating rating={r.rating} size={15} />
                      {r.variant_label && (
                        <span className="rounded-full bg-sand/70 px-2.5 py-0.5 text-[12px] font-medium text-deep/65">
                          Purchased {r.variant_label}
                        </span>
                      )}
                    </div>

                    <h4 className="mt-3 font-display text-[17px] font-semibold leading-snug text-deep sm:text-[18px]">
                      {r.title}
                    </h4>
                    <p className="mt-1.5 text-[15px] leading-relaxed text-deep/85 sm:text-[16px]">
                      {r.comment}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Review Dialog */}
        <ReviewDialog
          open={reviewDialogOpen}
          onClose={() => setReviewDialogOpen(false)}
          product={product}
          variantLabel={variant.label}
          orderId={deliveredOrderForProduct?.id}
        />
      </section>

      {/* Related */}
      <section aria-labelledby="related-heading" className="mt-16 lg:mt-24">
        <div className="mb-8 flex items-end justify-between gap-6">
          <h2 id="related-heading" className="text-[28px] sm:text-[34px]">
            You may also like
          </h2>
          <Link
            to="/products"
            className="inline-flex shrink-0 items-center gap-1.5 pb-1 text-[15px] font-semibold text-forest underline-offset-4 hover:underline"
          >
            All products <ArrowRight aria-hidden size={16} />
          </Link>
        </div>
        <ProductGrid products={related} loading={loading} skeletonCount={4} />
      </section>
    </div>
  );
}
