import type { Product } from "@/data/types";
import { cn } from "@/lib/utils";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  skeletonCount?: number;
  /** Column classes from the `lg` breakpoint up. */
  columnsClass?: string;
}

export function ProductGrid({
  products,
  loading,
  skeletonCount = 8,
  columnsClass = "lg:grid-cols-4",
}: ProductGridProps) {
  return (
    <div aria-busy={loading}>
      {loading && (
        <span className="sr-only" role="status">
          Loading products…
        </span>
      )}
      <ul className={cn("grid grid-cols-2 gap-3 sm:gap-6", columnsClass)}>
        {loading
          ? Array.from({ length: skeletonCount }, (_, i) => (
              <li key={i}>
                <ProductCardSkeleton />
              </li>
            ))
          : products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
      </ul>
    </div>
  );
}
