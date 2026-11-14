"use client";
import { ProductsSection } from "@/components/admin/screens/products";
import { OutletProvider } from "@/components/admin/router-compat";

export default function ProductsLayout({ children }) {
  return (
    <OutletProvider value={children}>
      <ProductsSection />
    </OutletProvider>
  );
}
