"use client";

import { useMemo } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { useProducts } from "@/lib/hooks";

export function useCartDetails() {
  const { items = [] } = useCart() || {};
  const { products = [] } = useProducts();

  return useMemo(() => {
    const lines = items.flatMap((line) => {
      const { product_id: productId, variant_id: variantId, quantity: qty = 1 } = line;

      const product =
        products.find((p) => p.id === String(productId) || p.slug === productId) || line.product;
      const variant =
        product?.variants?.find((v) => v.id === String(variantId)) || line.variant;
      if (!product || !variant) return [];

      const quantity = Number(qty);
      const price = Number(variant.price);
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(price) || price < 0)
        return [];

      return [
        {
          product,
          variant,
          qty: quantity,
          lineTotal: price * quantity,
          soldOut: !product.available || !variant.available,
        },
      ];
    });

    const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
    return { lines, subtotal, hasSoldOut: lines.some((l) => l.soldOut) };
  }, [items, products]);
}
