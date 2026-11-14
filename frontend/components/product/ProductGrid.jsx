import { ProductCard, ProductCardSkeleton } from "./ProductCard";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products = [],
  loading = false,
  skeletonCount = 8,
  columnsClass = "lg:grid-cols-4",
}) {
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

export default ProductGrid;
