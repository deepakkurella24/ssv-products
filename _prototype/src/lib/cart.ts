import { useMemo } from "react";
import { findProduct } from "@/data/products";
import type { Product, Variant } from "@/data/types";
import { useStore } from "@/store/StoreProvider";

export interface DetailedLine {
  product: Product;
  variant: Variant;
  qty: number;
  lineTotal: number;
  soldOut: boolean;
}

export function useCartDetails() {
  const { cart } = useStore();
  return useMemo(() => {
    const lines: DetailedLine[] = cart.flatMap((line) => {
      const product = findProduct(line.productId);
      const variant = product?.variants.find((v) => v.id === line.variantId);
      if (!product || !variant) return [];
      return [
        {
          product,
          variant,
          qty: line.qty,
          lineTotal: variant.price * line.qty,
          soldOut: !product.available || !variant.available,
        },
      ];
    });
    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    return { lines, subtotal, hasSoldOut: lines.some((l) => l.soldOut) };
  }, [cart]);
}
