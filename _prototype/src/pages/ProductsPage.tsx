import { useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ProductGrid } from "@/components/ProductGrid";
import { CATEGORIES, findCategory } from "@/data/categories";
import { lowestVariant, PRODUCTS } from "@/data/products";
import type { Category, Product, Subcategory } from "@/data/types";
import { useModal, useProducts } from "@/lib/hooks";
import { buttonStyles } from "@/lib/ui";
import { cn } from "@/lib/utils";

const SORTS = [
  { value: "best", label: "Best selling" },
  { value: "price-asc", label: "Price low to high" },
  { value: "price-desc", label: "Price high to low" },
  { value: "name", label: "Name A to Z" },
] as const;
type SortValue = (typeof SORTS)[number]["value"];

function sortProducts(list: Product[], sort: SortValue) {
  const copy = [...list];
  switch (sort) {
    case "price-asc":
      return copy.sort((a, b) => lowestVariant(a).price - lowestVariant(b).price);
    case "price-desc":
      return copy.sort((a, b) => lowestVariant(b).price - lowestVariant(a).price);
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return copy.sort((a, b) => b.popularity - a.popularity);
  }
}

export default function ProductsPage() {
  const [params] = useSearchParams();
  const { products, loading } = useProducts();
  const [sheetOpen, setSheetOpen] = useState(false);

  const category = findCategory(params.get("category"));
  const sub = category?.subcategories.find((s) => s.slug === params.get("sub"));
  const sortParam = params.get("sort");
  const sort: SortValue = SORTS.find((s) => s.value === sortParam)?.value ?? "best";

  const href = (next: { category?: string; sub?: string; sort?: string }) => {
    const q = new URLSearchParams();
    if (next.category) q.set("category", next.category);
    if (next.sub) q.set("sub", next.sub);
    if (next.sort && next.sort !== "best") q.set("sort", next.sort);
    const qs = q.toString();
    return qs ? `/products?${qs}` : "/products";
  };

  // Counts come from the catalogue, independent of the current sort.
  const catalogue = loading ? PRODUCTS : products;
  const countFor = (match: (p: Product) => boolean) => catalogue.filter(match).length;

  const visible = useMemo(() => {
    const filtered = products.filter(
      (p) => (!category || p.category_id === category.id) && (!sub || p.subcategory_id === sub.id),
    );
    return sortProducts(filtered, sort);
  }, [products, category, sub, sort]);

  const title = sub?.name ?? category?.name ?? "All products";
  const crumbs = [
    { label: "Home", to: "/" },
    { label: "Products", to: category ? "/products" : undefined },
    ...(category
      ? [{ label: category.name, to: sub ? href({ category: category.slug }) : undefined }]
      : []),
    ...(sub ? [{ label: sub.name }] : []),
  ];

  const filters = (onNavigate?: () => void) => (
    <FilterList
      category={category}
      sub={sub}
      total={catalogue.length}
      countFor={countFor}
      href={(c, s) => href({ category: c, sub: s, sort })}
      onNavigate={onNavigate}
    />
  );

  return (
    <div className="shell pt-6 pb-20 lg:pt-8 lg:pb-28">
      <title>{`${title} · SSV`}</title>
      <Breadcrumb items={crumbs} />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3 lg:mt-8">
        <div>
          <h1 className="text-[34px] sm:text-[42px] lg:text-[48px]">{title}</h1>
          <p className="mt-1 text-deep/75" aria-live="polite">
            {loading
              ? "Loading products…"
              : `${visible.length} ${visible.length === 1 ? "product" : "products"}`}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[250px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-32">{filters()}</div>
        </aside>

        <section aria-label="Products">
          <div className="mb-6 flex items-center justify-between gap-3 border-b border-sand pb-4">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-deep/40 px-4 text-[15px] font-semibold lg:hidden"
            >
              <SlidersHorizontal aria-hidden size={18} />
              Filters
              {category && (
                <span className="grid size-5 place-items-center rounded-full bg-forest text-[12px] text-cream">
                  1
                </span>
              )}
            </button>

            <div className="hidden min-w-0 flex-wrap items-center gap-2 lg:flex">
              {category ? (
                <>
                  <ActiveChip label={category.name} to={href({ sort })} />
                  {sub && (
                    <ActiveChip label={sub.name} to={href({ category: category.slug, sort })} />
                  )}
                </>
              ) : (
                <span className="text-[15px] text-deep/70">Showing every category</span>
              )}
            </div>

            <SortSelect value={sort} category={category?.slug} sub={sub?.slug} />
          </div>

          {!loading && visible.length === 0 ? (
            <div className="rounded-card border border-sand bg-sand/40 px-6 py-14">
              <p className="font-display text-[24px] font-semibold">Nothing here yet</p>
              <p className="mt-2 max-w-[440px] text-deep/80">
                We have no products in this section right now. You can see everything, or tell us
                what you need.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/products" className={buttonStyles.forest("h-12 px-6 text-[16px]")}>
                  All products
                </Link>
                <Link to="/custom-order" className={buttonStyles.outline()}>
                  Request a custom order
                </Link>
              </div>
            </div>
          ) : (
            <ProductGrid
              products={visible}
              loading={loading}
              columnsClass="lg:grid-cols-3"
              skeletonCount={6}
            />
          )}

          <p className="mt-12 text-[15px] text-deep/75">
            Need a bulk order or something not listed?{" "}
            <Link
              to="/custom-order"
              className="font-semibold text-forest underline underline-offset-4"
            >
              Request a custom order
            </Link>
          </p>
        </section>
      </div>

      {sheetOpen && (
        <FilterSheet count={visible.length} onClose={() => setSheetOpen(false)}>
          {filters(() => undefined)}
        </FilterSheet>
      )}
    </div>
  );
}

function ActiveChip({ label, to }: { label: string; to: string }) {
  return (
    <Link
      to={to}
      aria-label={`Remove filter ${label}`}
      className="inline-flex h-9 items-center gap-1.5 rounded-full bg-sand pr-2.5 pl-4 text-[14px] font-semibold hover:bg-sand-dark"
    >
      {label}
      <X aria-hidden size={14} />
    </Link>
  );
}

function SortSelect({
  value,
  category,
  sub,
}: {
  value: SortValue;
  category?: string;
  sub?: string;
}) {
  const [, setParams] = useSearchParams();
  return (
    <label className="relative inline-flex shrink-0 items-center text-[15px]">
      <span className="sr-only sm:not-sr-only sm:mr-2 sm:text-deep/75">Sort by</span>
      <select
        value={value}
        onChange={(e) => {
          const q = new URLSearchParams();
          if (category) q.set("category", category);
          if (sub) q.set("sub", sub);
          if (e.target.value !== "best") q.set("sort", e.target.value);
          setParams(q);
        }}
        className="h-11 appearance-none rounded-full border border-deep/40 bg-cream pr-10 pl-4 font-semibold hover:border-deep/70"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden size={16} className="pointer-events-none absolute right-4" />
    </label>
  );
}

interface FilterListProps {
  category?: Category;
  sub?: Subcategory;
  total: number;
  countFor: (match: (p: Product) => boolean) => number;
  href: (category?: string, sub?: string) => string;
  onNavigate?: () => void;
}

function FilterList({ category, sub, total, countFor, href, onNavigate }: FilterListProps) {
  const row = (active: boolean) =>
    cn(
      "flex min-h-10 items-center justify-between gap-3 rounded-full px-4 py-1.5 text-[15px] transition-colors",
      active ? "bg-sand font-semibold" : "hover:bg-sand/60",
    );
  const count = (n: number) => <span className="text-[14px] text-deep/65 tabular-nums">{n}</span>;

  return (
    <nav aria-label="Filter by category">
      <h2 className="mb-3 font-sans text-[13px] font-semibold tracking-[0.1em] text-clay uppercase">
        Category
      </h2>
      <ul className="space-y-0.5">
        <li>
          <Link
            to={href()}
            onClick={onNavigate}
            aria-current={!category ? "true" : undefined}
            className={row(!category)}
          >
            All products {count(total)}
          </Link>
        </li>
        {CATEGORIES.map((c) => {
          const open = category?.id === c.id;
          return (
            <li key={c.id}>
              <Link
                to={href(c.slug)}
                onClick={onNavigate}
                aria-current={open && !sub ? "true" : undefined}
                className={row(open && !sub)}
              >
                {c.name} {count(countFor((p) => p.category_id === c.id))}
              </Link>
              {open && (
                <ul className="mt-0.5 mb-1.5 ml-5 space-y-0.5 border-l border-sand pl-2">
                  {c.subcategories.map((s) => (
                    <li key={s.id}>
                      <Link
                        to={href(c.slug, s.slug)}
                        onClick={onNavigate}
                        aria-current={sub?.id === s.id ? "true" : undefined}
                        className={row(sub?.id === s.id)}
                      >
                        {s.name} {count(countFor((p) => p.subcategory_id === s.id))}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function FilterSheet({
  count,
  onClose,
  children,
}: {
  count: number;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useModal(true, onClose, ref);
  return (
    <div className="on-light fixed inset-0 z-50 lg:hidden">
      <div aria-hidden className="absolute inset-0 animate-fade-in bg-deep/55" onClick={onClose} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className="absolute inset-x-0 bottom-0 flex max-h-[85svh] animate-sheet-in flex-col rounded-t-card border-t border-sand bg-cream"
      >
        <div className="flex items-center justify-between border-b border-sand px-5 py-3">
          <p className="font-display text-[22px] font-semibold">Filters</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close filters"
            className="grid size-11 place-items-center rounded-full hover:bg-sand/70"
          >
            <X aria-hidden size={22} />
          </button>
        </div>
        <div className="overflow-y-auto px-3 py-5">{children}</div>
        <div className="border-t border-sand p-4">
          <button
            type="button"
            onClick={onClose}
            className={buttonStyles.forest("h-12 w-full text-[16px]")}
          >
            Show {count} {count === 1 ? "product" : "products"}
          </button>
        </div>
      </div>
    </div>
  );
}
