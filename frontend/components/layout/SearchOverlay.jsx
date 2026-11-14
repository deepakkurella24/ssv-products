"use client";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { useCategories, useModal, useProducts } from "@/lib/hooks";
import { categoryHref, findCategory } from "@/lib/categories";
import { lowestVariant, availableVariants } from "@/lib/adapters";
import { cn, formatPrice } from "@/lib/utils";
import { ImageSlot } from "@/components/ImageSlot";

/** Full-width search that filters the already-loaded products by name (no search API). */
export function SearchOverlay() {
  const { searchOpen, closeSearch } = useStore();
  const { products, loading } = useProducts();
  const { categories = [] } = useCategories();
  const [query, setQuery] = useState("");
  const panelRef = useRef(null);
  const inputId = useId();

  useModal(searchOpen, closeSearch, panelRef);
  useEffect(() => {
    if (!searchOpen) setQuery("");
  }, [searchOpen]);

  const term = query.trim().toLowerCase();
  const results = useMemo(
    () => (term ? products.filter((p) => p.name.toLowerCase().includes(term)) : []),
    [products, term],
  );

  if (!searchOpen) return null;

  return (
    <div className="on-light fixed inset-0 z-50">
      <div
        aria-hidden
        className="absolute inset-0 animate-fade-in bg-deep/60"
        onClick={closeSearch}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Search products"
        className="relative max-h-[100svh] animate-drop-in overflow-y-auto border-b border-sand bg-cream text-deep"
      >
        <div className="shell py-5 lg:py-8">
          <div className="flex items-center gap-3">
            <label htmlFor={inputId} className="sr-only">
              Search products by name
            </label>
            <div className="relative flex-1">
              <Search
                aria-hidden
                size={22}
                strokeWidth={1.75}
                className="absolute top-1/2 left-5 -translate-y-1/2 text-forest"
              />
              <input
                id={inputId}
                data-autofocus
                type="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search oils, honey, spices…"
                className="h-14 w-full rounded-full border border-sand bg-sand/40 pr-5 pl-14 text-[18px] placeholder:text-deep/55 focus:border-forest focus:bg-cream focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
              />
            </div>
            <button
              type="button"
              onClick={closeSearch}
              aria-label="Close search"
              className="grid size-12 shrink-0 place-items-center rounded-full hover:bg-sand/70"
            >
              <X aria-hidden size={24} strokeWidth={1.75} />
            </button>
          </div>

          <div className="mt-6 pb-2" aria-live="polite">
            {loading ? (
              <p className="text-deep/70">Loading products…</p>
            ) : !term ? (
              <div>
                <p className="text-[14px] font-semibold tracking-[0.06em] text-clay uppercase">
                  Browse by category
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <li key={c.id}>
                      <Link
                        href={categoryHref(c.slug)}
                        onClick={closeSearch}
                        className="inline-flex h-10 items-center rounded-full border border-sand px-4 text-[15px] hover:border-forest hover:text-forest"
                      >
                        {c.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : results.length === 0 ? (
              <div>
                <p className="font-semibold">No products match “{query.trim()}”.</p>
                <p className="mt-1 text-deep/75">
                  Try another name, or{" "}
                  <Link
                    href="/custom-order"
                    onClick={closeSearch}
                    className="font-semibold text-forest underline underline-offset-4"
                  >
                    request a custom order
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <>
                <p className="text-[15px] text-deep/70">
                  {results.length} {results.length === 1 ? "product" : "products"} found
                </p>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {results.map((product) => {
                    const soldOut = availableVariants(product).length === 0;
                    return (
                      <li key={product.id}>
                        <Link
                          href={`/products/${product.slug}`}
                          onClick={closeSearch}
                          className="flex items-center gap-4 rounded-card border border-sand p-2 pr-4 transition-colors hover:border-forest"
                        >
                          <span className="size-16 shrink-0 overflow-hidden rounded-[8px]">
                            <ImageSlot src={product.image_url} alt="" size="compact" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-semibold">
                              <Highlight text={product.name} term={term} />
                            </span>
                            <span className="block text-[14px] text-deep/70">
                              {findCategory(product.category_id, categories)?.name} ·{" "}
                              <span className={cn("tabular-nums", soldOut && "line-through")}>
                                {formatPrice(lowestVariant(product).price)}
                              </span>
                              {soldOut && " · Sold out"}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Highlight({ text, term }) {
  const index = text.toLowerCase().indexOf(term);
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-[3px] bg-marigold/40 text-deep">
        {text.slice(index, index + term.length)}
      </mark>
      {text.slice(index + term.length)}
    </>
  );
}
